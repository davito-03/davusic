// Davusic — native, local-first music player.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod library;
mod lyrics;
mod models;
mod mpris;
mod palette;
mod paths;
mod playlist_import;
mod spotify;
mod theme;
mod youtube;

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::sync::Arc;
use std::sync::Mutex as StdMutex;

use parking_lot::Mutex;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use audio::AudioHandle;
use models::{
    Config, DownloadRequest, DownloadedFile, DownloadResult, ImportBundle, ImportMatch,
    ImportedTrack, LibraryScanResult, LibrarySnapshot, LyricsResult, OnlineTrack, PlaybackRequest,
    PlayerSnapshot, SpotifyPlaylistPage, SpotifyStatus, UserCatalog, WallpaperDiscovery,
    YoutubeToolsStatus,
};
use mpris::MprisHandle;
use paths::Paths;
use playlist_import::ExportPlaylist;

struct AppState {
    paths: Arc<Paths>,
    config: Mutex<Config>,
    library: Mutex<LibrarySnapshot>,
    audio: AudioHandle,
    mpris: MprisHandle,
    spotify_cancel: Arc<AtomicBool>,
    play_generation: AtomicU64,
    data_epoch: AtomicU64,
}

fn read_config(paths: &Paths) -> Config {
    std::fs::read_to_string(&paths.config_file)
        .ok()
        .and_then(|raw| serde_json::from_str::<Config>(&raw).ok())
        .unwrap_or_default()
}

fn write_config(paths: &Paths, config: &Config) {
    if let Ok(raw) = serde_json::to_string_pretty(config) {
        let _ = std::fs::create_dir_all(&paths.config_dir);
        let _ = std::fs::write(&paths.config_file, raw);
    }
}

#[derive(Serialize, Default)]
#[serde(rename_all = "camelCase")]
struct FactoryResetReport {
    removed: Vec<String>,
    warnings: Vec<String>,
    kept: Vec<String>,
}

fn remove_for_reset(path: &Path, report: &mut FactoryResetReport) {
    if !path.exists() {
        return;
    }
    let result = if path.is_dir() {
        std::fs::remove_dir_all(path)
    } else {
        std::fs::remove_file(path)
    };
    match result {
        Ok(()) => report.removed.push(path.display().to_string()),
        Err(error) => report
            .warnings
            .push(format!("No se pudo borrar {}: {error}", path.display())),
    }
}

fn reset_storage(paths: &Paths) -> FactoryResetReport {
    let mut report = FactoryResetReport::default();

    // La configuración, la caché y sus copias antiguas se eliminan completas.
    remove_for_reset(&paths.config_dir, &mut report);
    remove_for_reset(&paths.cache_dir, &mut report);
    for legacy in paths.legacy_dirs() {
        remove_for_reset(&legacy, &mut report);
    }

    // ~/.local/share/davusic contiene la caché persistente y bin/yt-dlp. Solo
    // borramos los datos de Davusic; las herramientas instaladas se conservan.
    if let Ok(entries) = std::fs::read_dir(&paths.data_dir) {
        for entry in entries.flatten() {
            if entry.file_name() == "bin" {
                continue;
            }
            remove_for_reset(&entry.path(), &mut report);
        }
    }

    paths.ensure_layout();
    if paths.tools.is_dir() {
        report
            .kept
            .push("yt-dlp y las herramientas locales de bin/".into());
    }
    report
}


fn add_unique_folder(config: &mut Config, path: &Path) -> bool {
    let canonical = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    if !canonical.is_dir() {
        return false;
    }
    let value = canonical.to_string_lossy().to_string();
    if config.folders.iter().any(|folder| {
        let existing = PathBuf::from(folder);
        std::fs::canonicalize(&existing).unwrap_or(existing) == canonical
    }) {
        return true;
    }
    config.folders.push(value);
    true
}

fn save_scan(app: &AppHandle, state: &AppState, snapshot: LibrarySnapshot, previous: usize) -> LibraryScanResult {
    library::save_cache(&state.paths, &snapshot);
    *state.library.lock() = snapshot.clone();
    let _ = app.emit("library-updated", snapshot.clone());
    LibraryScanResult {
        added_tracks: snapshot.tracks.len().saturating_sub(previous),
        library: snapshot,
    }
}

async fn scan_in_background(
    app: AppHandle,
    paths: Arc<Paths>,
    config: Config,
    previous: usize,
) -> Result<LibraryScanResult, String> {
    let epoch = app.state::<AppState>().data_epoch.load(Ordering::SeqCst);
    let handle = app.clone();
    let snapshot = tauri::async_runtime::spawn_blocking(move || {
        library::scan(&paths, &config, Some(&handle))
    })
    .await
    .map_err(|error| format!("El escaneo se interrumpió: {error}"))?;
    let state = app.state::<AppState>();
    if state.data_epoch.load(Ordering::SeqCst) != epoch {
        return Err("El restablecimiento de fábrica canceló el escaneo.".into());
    }
    Ok(save_scan(&app, &state, snapshot, previous))
}

// ---------- biblioteca ----------

#[tauri::command]
fn get_local_library(state: tauri::State<'_, AppState>) -> LibrarySnapshot {
    state.library.lock().clone()
}

#[tauri::command]
async fn rescan_library(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<LibraryScanResult, String> {
    let config = state.config.lock().clone();
    let previous = state.library.lock().tracks.len();
    scan_in_background(app, state.paths.clone(), config, previous).await
}

#[tauri::command]
async fn add_music_folder(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Option<LibraryScanResult>, String> {
    let Some(folder) = rfd::FileDialog::new()
        .set_title("Añadir música a Davusic")
        .pick_folder()
    else {
        return Ok(None);
    };
    add_and_scan_folder(app, state, folder.to_string_lossy().to_string()).await.map(Some)
}

#[tauri::command]
async fn add_folder_path(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<LibraryScanResult, String> {
    add_and_scan_folder(app, state, path).await
}

async fn add_and_scan_folder(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    raw: String,
) -> Result<LibraryScanResult, String> {
    let path = PathBuf::from(&raw);
    if !path.is_dir() {
        return Err(format!("La carpeta no existe o no es accesible: {raw}"));
    }
    let mut config = state.config.lock().clone();
    if !add_unique_folder(&mut config, &path) {
        return Err("No se pudo añadir esa carpeta.".into());
    }
    write_config(&state.paths, &config);
    *state.config.lock() = config.clone();
    let previous = state.library.lock().tracks.len();
    scan_in_background(app, state.paths.clone(), config, previous).await
}

#[tauri::command]
async fn remove_music_folder(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    path: String,
) -> Result<LibraryScanResult, String> {
    let mut config = state.config.lock().clone();
    let canonical = std::fs::canonicalize(&path).unwrap_or_else(|_| PathBuf::from(&path));
    config.folders.retain(|folder| {
        let existing = PathBuf::from(folder);
        let resolved = std::fs::canonicalize(&existing).unwrap_or(existing);
        resolved != canonical && *folder != path
    });
    write_config(&state.paths, &config);
    *state.config.lock() = config.clone();
    let previous = state.library.lock().tracks.len();
    scan_in_background(app, state.paths.clone(), config, previous).await
}

#[tauri::command]
fn show_in_folder(path: String) -> Result<(), String> {
    let target = PathBuf::from(&path);
    let folder = if target.is_dir() {
        target
    } else {
        target
            .parent()
            .map(Path::to_path_buf)
            .ok_or_else(|| "No se encontró la ubicación del archivo.".to_string())?
    };
    std::process::Command::new("xdg-open")
        .arg(folder)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("No se pudo abrir la carpeta: {error}"))
}

// ---------- reproducción ----------

#[tauri::command]
async fn play_track(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    request: PlaybackRequest,
) -> Result<serde_json::Value, String> {
    let gen = state.play_generation.fetch_add(1, Ordering::SeqCst) + 1;
    let mut request = request;
    if request.path.trim().is_empty() && !request.uri.trim().is_empty() {
        request.path = request.uri.clone();
    }
    let mut resolved_uri = request.uri.clone();
    let mut resolved_cover = request.cover.clone();
    let mut resolved_video_id = String::new();

    if youtube::needs_prepare(&request) {
        let _ = app.emit(
            "playback-status",
            serde_json::json!({
                "stage": "resolve",
                "message": "Conectando con la canción…",
                "track_id": request.id,
            }),
        );
        let paths = state.paths.clone();
        let hint = if request.path.trim().is_empty() {
            request.uri.clone()
        } else {
            request.path.clone()
        };
        let title = request.title.clone();
        let artist = request.artist.clone();
        let prepared = tauri::async_runtime::spawn_blocking(move || {
            youtube::prepare_playback(&paths, &hint, &title, &artist)
        })
        .await
        .map_err(|error| format!("La preparación se interrumpió: {error}"))??;
        if state.play_generation.load(Ordering::SeqCst) != gen {
            return Ok(serde_json::json!({ "cancelled": true, "playing": false }));
        }
        request.path = prepared.path.to_string_lossy().to_string();
        if prepared.duration > 0.0 {
            request.duration = prepared.duration;
        }
        if request.cover.is_empty() && !prepared.cover.is_empty() {
            request.cover = prepared.cover.clone();
        }
        resolved_uri = prepared.url;
        resolved_cover = request.cover.clone();
        resolved_video_id = prepared.video_id;
        let _ = app.emit(
            "playback-status",
            serde_json::json!({
                "stage": "play",
                "message": "Reproduciendo",
                "track_id": request.id,
            }),
        );
    }

    let duration = state.audio.play(request.clone())?;
    let art_url = request
        .cover
        .strip_prefix("cover://localhost/")
        .and_then(|name| state.paths.is_cover_file(name))
        .map(|path| format!("file://{}", path.display()))
        .or_else(|| {
            if request.cover.starts_with("https://") || request.cover.starts_with("http://") {
                Some(request.cover.clone())
            } else {
                None
            }
        });
    state.mpris.update_track(
        &request.id,
        &request.title,
        &request.artist,
        &request.album,
        duration,
        art_url,
    );
    state.mpris.set_playing(true);
    let snapshot = state.audio.snapshot();
    state.mpris.set_volume(snapshot.volume.min(1.0));
    Ok(serde_json::json!({
        "duration": duration,
        "playing": true,
        "uri": resolved_uri,
        "cover": resolved_cover,
        "video_id": resolved_video_id,
    }))
}

#[tauri::command]
async fn search_online(
    state: tauri::State<'_, AppState>,
    query: String,
) -> Result<Vec<OnlineTrack>, String> {
    let paths = state.paths.clone();
    tauri::async_runtime::spawn_blocking(move || youtube::search_catalog(&paths, &query))
        .await
        .map_err(|error| format!("La búsqueda se interrumpió: {error}"))?
}

#[tauri::command]
fn pause_playback(state: tauri::State<'_, AppState>) -> Result<serde_json::Value, String> {
    state.audio.pause()?;
    state.mpris.set_playing(false);
    Ok(serde_json::json!({ "playing": false }))
}

#[tauri::command]
fn resume_playback(state: tauri::State<'_, AppState>) -> Result<serde_json::Value, String> {
    state.audio.resume()?;
    state.mpris.set_playing(true);
    Ok(serde_json::json!({ "playing": true }))
}

#[tauri::command]
fn stop_playback(state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.audio.stop()?;
    state.mpris.clear();
    Ok(())
}

#[tauri::command]
fn seek_playback(state: tauri::State<'_, AppState>, position: f64) -> Result<(), String> {
    state.audio.seek(position)
}

#[tauri::command]
fn set_playback_volume(
    state: tauri::State<'_, AppState>,
    volume: f64,
) -> Result<serde_json::Value, String> {
    let value = volume.clamp(0.0, 1.0);
    state.audio.volume(value as f32)?;
    state.mpris.set_volume(value);
    Ok(serde_json::json!({ "volume": value }))
}

#[tauri::command]
fn get_player_state(state: tauri::State<'_, AppState>) -> PlayerSnapshot {
    let snapshot = state.audio.snapshot();
    state.mpris.set_position(snapshot.position);
    snapshot
}

// ---------- temas de wallpapers ----------

#[tauri::command]
async fn discover_wallpapers(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    force: Option<bool>,
    folder: Option<String>,
) -> Result<WallpaperDiscovery, String> {
    let mut config = state.config.lock().clone();
    if let Some(folder) = folder {
        let path = PathBuf::from(&folder);
        if !path.is_dir() {
            return Err(format!("La carpeta de wallpapers no existe: {folder}"));
        }
        let canonical = std::fs::canonicalize(&path).unwrap_or(path);
        config.wallpaper_dir = Some(canonical.to_string_lossy().to_string());
        write_config(&state.paths, &config);
        *state.config.lock() = config.clone();
    }
    let paths = state.paths.clone();
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        theme::discover(
            &paths,
            &config,
            None,
            force.unwrap_or(false),
            Some(&handle),
        )
    })
    .await
    .map_err(|error| format!("El análisis de wallpapers se interrumpió: {error}"))
}

#[tauri::command]
async fn choose_wallpaper_folder(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<Option<WallpaperDiscovery>, String> {
    let Some(folder) = rfd::FileDialog::new()
        .set_title("Elegir carpeta de wallpapers")
        .pick_folder()
    else {
        return Ok(None);
    };
    let path = std::fs::canonicalize(&folder).unwrap_or(folder);
    let mut config = state.config.lock().clone();
    config.wallpaper_dir = Some(path.to_string_lossy().to_string());
    write_config(&state.paths, &config);
    *state.config.lock() = config.clone();
    let paths = state.paths.clone();
    let handle = app.clone();
    let discovery = tauri::async_runtime::spawn_blocking(move || {
        theme::discover(&paths, &config, None, false, Some(&handle))
    })
    .await
    .map_err(|error| format!("El análisis de wallpapers se interrumpió: {error}"))?;
    Ok(Some(discovery))
}

// ---------- importación de playlists ----------

#[tauri::command]
fn import_playlist_file() -> Result<Option<ImportBundle>, String> {
    let Some(path) = rfd::FileDialog::new()
        .set_title("Importar playlist")
        .add_filter(
            "Playlists (ZIP, CSV, JSON, M3U)",
            &["zip", "csv", "json", "m3u", "m3u8", "txt", "tsv"],
        )
        .add_filter("Todos los archivos", &["*"])
        .pick_file()
    else {
        return Ok(None);
    };
    playlist_import::parse_file(&path).map(Some)
}

#[tauri::command]
fn import_exportify_file() -> Result<Option<ImportBundle>, String> {
    let Some(path) = rfd::FileDialog::new()
        .set_title("Importar desde Exportify")
        .add_filter("Exportify (ZIP o CSV)", &["zip", "csv"])
        .add_filter("Todos los archivos", &["*"])
        .pick_file()
    else {
        return Ok(None);
    };
    playlist_import::parse_file(&path).map(Some)
}

#[tauri::command]
fn export_exportify_zip(playlists: Vec<ExportPlaylist>) -> Result<Option<String>, String> {
    let Some(mut path) = rfd::FileDialog::new()
        .set_title("Exportar playlists para Exportify")
        .set_file_name("davusic-exportify.zip")
        .add_filter("Archivo ZIP", &["zip"])
        .save_file()
    else {
        return Ok(None);
    };
    if path.extension().is_none() {
        path.set_extension("zip");
    }
    playlist_import::save_exportify_zip(&path, &playlists)?;
    Ok(Some(path.to_string_lossy().to_string()))
}

#[tauri::command]
fn export_exportify_csv(playlist: ExportPlaylist) -> Result<Option<String>, String> {
    let suggested = format!(
        "{}.csv",
        playlist
            .name
            .trim()
            .chars()
            .take(70)
            .collect::<String>()
            .replace(['/', '\\', ':'], "-")
    );
    let Some(mut path) = rfd::FileDialog::new()
        .set_title("Exportar playlist para Exportify")
        .set_file_name(&suggested)
        .add_filter("Archivo CSV", &["csv"])
        .save_file()
    else {
        return Ok(None);
    };
    if path.extension().is_none() {
        path.set_extension("csv");
    }
    playlist_import::save_exportify_csv(&path, &playlist)?;
    Ok(Some(path.to_string_lossy().to_string()))
}

#[tauri::command]
fn parse_playlist_path(path: String) -> Result<ImportBundle, String> {
    playlist_import::parse_file(Path::new(&path))
}

#[tauri::command]
fn parse_playlist_text(text: String, name: Option<String>) -> Result<ImportBundle, String> {
    playlist_import::parse_text_pasted(
        &text,
        name.as_deref().unwrap_or("Playlist pegada"),
    )
}

#[tauri::command]
async fn import_playlist_url(
    state: tauri::State<'_, AppState>,
    url: String,
) -> Result<ImportBundle, String> {
    let paths = state.paths.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let lower = url.to_lowercase();
        if lower.contains("spotify.com") || lower.starts_with("spotify:") {
            if spotify::is_connected(&paths) {
                if let Ok(bundle) = spotify::import_url(&paths, &url) {
                    return Ok(bundle);
                }
            }
            playlist_import::spotify_from_url(&url)
        } else if lower.contains("youtube.com") || lower.contains("youtu.be") {
            playlist_import::youtube_from_url(&url)
        } else {
            Err("Pega un enlace de Spotify, YouTube o YouTube Music.".into())
        }
    })
    .await
    .map_err(|error| format!("La importación se interrumpió: {error}"))?
}

// ---------- cuenta de Spotify ----------

#[tauri::command]
fn spotify_status(state: tauri::State<'_, AppState>) -> SpotifyStatus {
    spotify::status(&state.paths)
}

#[tauri::command]
fn spotify_save_client_id(
    state: tauri::State<'_, AppState>,
    client_id: String,
) -> Result<SpotifyStatus, String> {
    spotify::save_client_id(&state.paths, &client_id)
}

#[tauri::command]
fn spotify_logout(state: tauri::State<'_, AppState>) -> Result<SpotifyStatus, String> {
    state.spotify_cancel.store(true, Ordering::SeqCst);
    spotify::logout(&state.paths)
}

#[tauri::command]
async fn spotify_login(state: tauri::State<'_, AppState>) -> Result<SpotifyStatus, String> {
    let paths = state.paths.clone();
    let cancel = state.spotify_cancel.clone();
    tauri::async_runtime::spawn_blocking(move || spotify::login(&paths, &cancel))
        .await
        .map_err(|error| format!("El inicio de sesión de Spotify se interrumpió: {error}"))?
}

#[tauri::command]
fn spotify_login_cancel(state: tauri::State<'_, AppState>) {
    state.spotify_cancel.store(true, Ordering::SeqCst);
}

#[tauri::command]
async fn spotify_playlists(
    state: tauri::State<'_, AppState>,
    offset: Option<u32>,
) -> Result<SpotifyPlaylistPage, String> {
    let paths = state.paths.clone();
    tauri::async_runtime::spawn_blocking(move || spotify::playlists(&paths, offset.unwrap_or(0)))
        .await
        .map_err(|error| format!("La consulta de playlists se interrumpió: {error}"))?
}

#[tauri::command]
async fn spotify_import_playlist(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    playlist_id: String,
) -> Result<ImportBundle, String> {
    let paths = state.paths.clone();
    let handle = app.clone();
    let event_id = playlist_id.clone();
    tauri::async_runtime::spawn_blocking(move || {
        spotify::import_playlist(&paths, &playlist_id, |done, total| {
            let _ = handle.emit(
                "spotify-import-progress",
                serde_json::json!({
                    "kind": "playlist",
                    "playlistId": event_id,
                    "done": done,
                    "total": total,
                }),
            );
        })
    })
    .await
    .map_err(|error| format!("La importación de Spotify se interrumpió: {error}"))?
}

#[tauri::command]
async fn spotify_import_library(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<ImportBundle, String> {
    let paths = state.paths.clone();
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        spotify::import_library(&paths, |done, total, name| {
            let _ = handle.emit(
                "spotify-import-progress",
                serde_json::json!({
                    "kind": "library",
                    "done": done,
                    "total": total,
                    "name": name,
                }),
            );
        })
    })
    .await
    .map_err(|error| format!("La importación de Spotify se interrumpió: {error}"))?
}

#[tauri::command]
async fn spotify_import_saved(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<ImportBundle, String> {
    let paths = state.paths.clone();
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        spotify::import_saved(&paths, |done, total| {
            let _ = handle.emit(
                "spotify-import-progress",
                serde_json::json!({
                    "kind": "saved",
                    "done": done,
                    "total": total,
                }),
            );
        })
    })
    .await
    .map_err(|error| format!("La importación de Me gusta se interrumpió: {error}"))?
}

#[tauri::command]
fn load_user_catalog(state: tauri::State<'_, AppState>) -> UserCatalog {
    let streams = std::fs::read_to_string(&state.paths.catalog_streams)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    let playlists = std::fs::read_to_string(&state.paths.catalog_playlists)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    UserCatalog { streams, playlists }
}

#[tauri::command]
fn save_user_catalog(
    state: tauri::State<'_, AppState>,
    streams: Vec<serde_json::Value>,
    playlists: Vec<serde_json::Value>,
) -> Result<(), String> {
    write_json_atomic(&state.paths.catalog_streams, &streams)?;
    write_json_atomic(&state.paths.catalog_playlists, &playlists)?;
    Ok(())
}

#[tauri::command]
fn load_user_fonts(state: tauri::State<'_, AppState>) -> serde_json::Value {
    std::fs::read_to_string(&state.paths.catalog_fonts)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_else(|| serde_json::json!({}))
}

#[tauri::command]
fn save_user_fonts(
    state: tauri::State<'_, AppState>,
    fonts: serde_json::Value,
) -> Result<(), String> {
    write_json_atomic(&state.paths.catalog_fonts, &fonts)
}

#[tauri::command]
fn load_playback_session(state: tauri::State<'_, AppState>) -> serde_json::Value {
    std::fs::read_to_string(&state.paths.session_file)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or(serde_json::Value::Null)
}

#[tauri::command]
fn save_playback_session(
    state: tauri::State<'_, AppState>,
    session: serde_json::Value,
) -> Result<(), String> {
    write_json_atomic(&state.paths.session_file, &session)
}

fn write_json_atomic(path: &Path, value: &impl serde::Serialize) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|error| format!("No se pudo crear la carpeta del catálogo: {error}"))?;
    }
    let raw = serde_json::to_vec(value)
        .map_err(|error| format!("No se pudo serializar el catálogo: {error}"))?;
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, &raw)
        .map_err(|error| format!("No se pudo escribir el catálogo: {error}"))?;
    std::fs::rename(&tmp, path)
        .map_err(|error| format!("No se pudo activar el catálogo: {error}"))?;
    Ok(())
}

#[tauri::command]
async fn fetch_lyrics(
    state: tauri::State<'_, AppState>,
    title: String,
    artist: String,
    album: Option<String>,
    duration: Option<f64>,
) -> Result<LyricsResult, String> {
    let paths = state.paths.clone();
    tauri::async_runtime::spawn_blocking(move || {
        lyrics::fetch(
            &paths,
            &title,
            &artist,
            album.as_deref().unwrap_or(""),
            duration.unwrap_or(0.0),
        )
    })
    .await
    .map_err(|error| format!("La búsqueda de letra se interrumpió: {error}"))?
}

#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    let trimmed = url.trim();
    let lower = trimmed.to_lowercase();
    if !(lower.starts_with("https://") || lower.starts_with("http://")) {
        return Err("Solo se pueden abrir enlaces web.".into());
    }
    std::process::Command::new("xdg-open")
        .arg(trimmed)
        .spawn()
        .map(|_| ())
        .map_err(|error| format!("No se pudo abrir el navegador: {error}"))
}

#[tauri::command]
async fn factory_reset(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<FactoryResetReport, String> {
    state.spotify_cancel.store(true, Ordering::SeqCst);
    let _ = state.audio.stop();
    state.mpris.clear();
    *state.config.lock() = Config::default();
    *state.library.lock() = LibrarySnapshot::default();
    state.play_generation.fetch_add(1, Ordering::SeqCst);
    state.data_epoch.fetch_add(1, Ordering::SeqCst);

    let paths = state.paths.clone();
    let mut report = tauri::async_runtime::spawn_blocking(move || reset_storage(&paths))
        .await
        .map_err(|error| format!("El restablecimiento se interrumpió: {error}"))?;

    // WebKit guarda localStorage, cookies y caché fuera de las rutas anteriores.
    // La llamada es asíncrona en WebKitGTK; el frontend limpia también su
    // almacenamiento y recarga la vista desde cero.
    if let Some(window) = app.get_webview_window("main") {
        if let Err(error) = window.clear_all_browsing_data() {
            report
                .warnings
                .push(format!("No se pudo limpiar la caché del WebView: {error}"));
        }
    }
    Ok(report)
}

#[tauri::command]
async fn match_import_tracks(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    tracks: Vec<ImportedTrack>,
) -> Result<Vec<ImportMatch>, String> {
    if tracks.is_empty() {
        return Ok(Vec::new());
    }
    let paths = state.paths.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let total = tracks.len();
        let workers = total.min(4).max(1);
        let tracks = Arc::new(tracks);
        let results: Arc<StdMutex<Vec<Option<ImportMatch>>>> =
            Arc::new(StdMutex::new((0..total).map(|_| None).collect()));
        let next = Arc::new(AtomicUsize::new(0));
        let done = Arc::new(AtomicUsize::new(0));
        let search_budget = Arc::new(AtomicUsize::new(80));

        std::thread::scope(|scope| {
            for _ in 0..workers {
                let paths = paths.clone();
                let app = app.clone();
                let tracks = tracks.clone();
                let results = results.clone();
                let next = next.clone();
                let done = done.clone();
                let search_budget = search_budget.clone();
                scope.spawn(move || loop {
                    let index = next.fetch_add(1, Ordering::SeqCst);
                    if index >= total {
                        break;
                    }
                    let track = &tracks[index];
                    let mut candidates = Vec::new();
                    let mut error = None;
                    if let Some(direct) = youtube::direct_candidate(&track.uri) {
                        candidates.push(direct);
                    } else if search_budget
                        .try_update(Ordering::SeqCst, Ordering::SeqCst, |n| n.checked_sub(1))
                        .is_ok()
                    {
                        let query = if track.artist.trim().is_empty() {
                            track.title.clone()
                        } else {
                            format!("{} {}", track.artist.trim(), track.title.trim())
                        };
                        match youtube::search_with_limit(&paths, &query, 3) {
                            Ok(mut found) => {
                                for candidate in &mut found {
                                    candidate.score = youtube::score_candidate(
                                        candidate,
                                        &track.title,
                                        &track.artist,
                                        track.duration,
                                    );
                                }
                                found.sort_by(|a, b| b.score.cmp(&a.score));
                                found.truncate(5);
                                candidates = found;
                            }
                            Err(message) => error = Some(message),
                        }
                    } else {
                        error = Some(
                            "Se resolverá al pulsar play. No hace falta coincidencia previa."
                                .into(),
                        );
                    }
                    let best = candidates
                        .first()
                        .filter(|candidate| candidate.score >= 20)
                        .cloned();
                    let result = ImportMatch {
                        track_id: track.id.clone(),
                        best,
                        candidates,
                        error,
                    };
                    if let Ok(mut guard) = results.lock() {
                        guard[index] = Some(result);
                    }
                    let finished = done.fetch_add(1, Ordering::SeqCst) + 1;
                    let _ = app.emit(
                        "import-match-progress",
                        serde_json::json!({
                            "done": finished,
                            "total": total,
                            "track_id": track.id,
                            "title": track.title,
                            "artist": track.artist,
                            "best": guard_best(&results, index),
                        }),
                    );
                });
            }
        });

        let guard = results.lock().map_err(|_| "La búsqueda se bloqueó.".to_string())?;
        Ok(guard.iter().map(|item| item.clone().unwrap_or(ImportMatch {
            track_id: String::new(),
            best: None,
            candidates: Vec::new(),
            error: Some("No se pudo buscar esta pista.".into()),
        })).collect())
    })
    .await
    .map_err(|error| format!("La búsqueda se interrumpió: {error}"))?
}

fn guard_best(results: &StdMutex<Vec<Option<ImportMatch>>>, index: usize) -> Option<models::MatchCandidate> {
    results
        .lock()
        .ok()
        .and_then(|guard| guard.get(index).cloned().flatten())
        .and_then(|item| item.best)
}

#[tauri::command]
async fn download_import_tracks(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    items: Vec<DownloadRequest>,
) -> Result<DownloadResult, String> {
    if items.is_empty() {
        return Err("No hay coincidencias seleccionadas para descargar.".into());
    }
    let total_items = items.len();
    let epoch = state.data_epoch.load(Ordering::SeqCst);
    let mut config = state.config.lock().clone();
    let dir = youtube::download_dir(&config);
    std::fs::create_dir_all(&dir)
        .map_err(|error| format!("No se pudo crear la carpeta de descargas: {error}"))?;
    let canonical = std::fs::canonicalize(&dir).unwrap_or_else(|_| dir.clone());
    if add_unique_folder(&mut config, &canonical) {
        write_config(&state.paths, &config);
        *state.config.lock() = config.clone();
    }
    let paths = state.paths.clone();
    let handle = app.clone();
    let (downloaded, errors, snapshot) = tauri::async_runtime::spawn_blocking(move || {
        let total = items.len();
        let mut downloaded: Vec<DownloadedFile> = Vec::new();
        let mut errors: Vec<String> = Vec::new();
        for (index, item) in items.iter().enumerate() {
            let _ = handle.emit(
                "import-download-progress",
                serde_json::json!({
                    "stage": "download",
                    "done": index,
                    "total": total,
                    "key": item.key,
                    "title": item.title,
                    "artist": item.artist,
                    "playlist": item.playlist,
                }),
            );
            match youtube::download_one(&paths, item, &dir) {
                Ok(path) => {
                    let value = path.to_string_lossy().to_string();
                    downloaded.push(DownloadedFile {
                        key: item.key.clone(),
                        path: value.clone(),
                        title: item.title.clone(),
                        artist: item.artist.clone(),
                        playlist: item.playlist.clone(),
                    });
                    let _ = handle.emit(
                        "import-download-progress",
                        serde_json::json!({
                            "stage": "file",
                            "done": index + 1,
                            "total": total,
                            "key": item.key,
                            "title": item.title,
                            "path": value,
                        }),
                    );
                }
                Err(message) => {
                    errors.push(format!("{}: {message}", item.title));
                    let _ = handle.emit(
                        "import-download-progress",
                        serde_json::json!({
                            "stage": "error",
                            "done": index + 1,
                            "total": total,
                            "key": item.key,
                            "title": item.title,
                            "message": message,
                        }),
                    );
                }
            }
        }
        let library = library::scan(&paths, &config, Some(&handle));
        (downloaded, errors, library)
    })
    .await
    .map_err(|error| format!("La descarga se interrumpió: {error}"))?;

    if state.data_epoch.load(Ordering::SeqCst) != epoch {
        return Err("El restablecimiento de fábrica canceló la importación.".into());
    }
    library::save_cache(&state.paths, &snapshot);
    *state.library.lock() = snapshot.clone();
    let _ = app.emit("library-updated", snapshot.clone());
    let _ = app.emit(
        "import-download-progress",
        serde_json::json!({
            "stage": "done",
            "done": total_items,
            "total": total_items,
            "downloaded": downloaded.len(),
            "errors": errors.len(),
        }),
    );
    Ok(DownloadResult {
        library: snapshot,
        downloaded,
        errors,
    })
}

// ---------- herramientas de YouTube ----------

#[tauri::command]
fn youtube_tools_status(state: tauri::State<'_, AppState>) -> YoutubeToolsStatus {
    let config = state.config.lock().clone();
    youtube::status(&state.paths, &config)
}

#[tauri::command]
async fn install_ytdlp(
    state: tauri::State<'_, AppState>,
) -> Result<YoutubeToolsStatus, String> {
    let paths = state.paths.clone();
    tauri::async_runtime::spawn_blocking(move || youtube::install_ytdlp(&paths))
        .await
        .map_err(|error| format!("La instalación se interrumpió: {error}"))??;
    let config = state.config.lock().clone();
    Ok(youtube::status(&state.paths, &config))
}

// ---------- protocolos locales ----------

fn serve_file(path: Option<PathBuf>, content_type: &str) -> tauri::http::Response<Vec<u8>> {
    match path.and_then(|path| std::fs::read(path).ok()) {
        Some(bytes) => tauri::http::Response::builder()
            .status(200)
            .header("Content-Type", content_type)
            .header("Cache-Control", "public, max-age=31536000, immutable")
            .header("Access-Control-Allow-Origin", "*")
            .body(bytes)
            .unwrap_or_else(|_| tauri::http::Response::new(Vec::new())),
        None => tauri::http::Response::builder()
            .status(404)
            .header("Content-Type", "text/plain")
            .body(b"Not found".to_vec())
            .unwrap_or_else(|_| tauri::http::Response::new(Vec::new())),
    }
}

fn mime_for(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "webp" => "image/webp",
        "avif" => "image/avif",
        _ => "image/jpeg",
    }
}

fn main() {
    let paths = Paths::new();
    let cover_paths = paths.clone();
    let wallpaper_paths = paths.clone();
    let setup_paths = paths.clone();

    tauri::Builder::default()
        .register_uri_scheme_protocol("cover", move |_app, request| {
            let raw = request.uri().path().trim_start_matches('/');
            let name = paths::percent_decode(raw);
            let file = cover_paths.is_cover_file(&name);
            let mime = file.as_deref().map(mime_for).unwrap_or("image/jpeg");
            serve_file(file, mime)
        })
        .register_uri_scheme_protocol("wallpaper", move |_app, request| {
            let raw = request.uri().path().trim_start_matches('/');
            let name = paths::percent_decode(raw);
            let file = wallpaper_paths.is_theme_file(&name);
            serve_file(file, "image/jpeg")
        })
        .setup(move |app| {
            let handle = app.handle().clone();
            let config = read_config(&setup_paths);
            let snapshot = library::load_cache(&setup_paths);
            let audio = AudioHandle::spawn(handle.clone(), setup_paths.clone());
            let mpris = MprisHandle::spawn(handle.clone(), audio.clone());
            let state = AppState {
                paths: Arc::new(setup_paths.clone()),
                config: Mutex::new(config.clone()),
                library: Mutex::new(snapshot),
                audio,
                mpris,
                spotify_cancel: Arc::new(AtomicBool::new(false)),
                play_generation: AtomicU64::new(0),
                data_epoch: AtomicU64::new(0),
            };
            app.manage(state);

            if !config.folders.is_empty() {
                let app_handle = handle.clone();
                std::thread::Builder::new()
                    .name("davusic-startup-scan".into())
                    .spawn(move || {
                        let state = app_handle.state::<AppState>();
                        let config = state.config.lock().clone();
                        let snapshot = library::scan(&state.paths, &config, Some(&app_handle));
                        library::save_cache(&state.paths, &snapshot);
                        *state.library.lock() = snapshot.clone();
                        let _ = app_handle.emit("library-updated", snapshot);
                    })
                    .ok();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_local_library,
            add_music_folder,
            add_folder_path,
            remove_music_folder,
            rescan_library,
            show_in_folder,
            play_track,
            pause_playback,
            resume_playback,
            stop_playback,
            seek_playback,
            set_playback_volume,
            get_player_state,
            discover_wallpapers,
            choose_wallpaper_folder,
            import_playlist_file,
            import_exportify_file,
            export_exportify_zip,
            export_exportify_csv,
            parse_playlist_path,
            parse_playlist_text,
            import_playlist_url,
            match_import_tracks,
            download_import_tracks,
            youtube_tools_status,
            install_ytdlp,
            search_online,
            fetch_lyrics,
            load_user_catalog,
            save_user_catalog,
            load_user_fonts,
            save_user_fonts,
            load_playback_session,
            save_playback_session,
            spotify_status,
            spotify_save_client_id,
            spotify_logout,
            spotify_login,
            spotify_login_cancel,
            spotify_playlists,
            spotify_import_playlist,
            spotify_import_saved,
            spotify_import_library,
            open_external,
            factory_reset
        ])
        .run(tauri::generate_context!())
        .expect("error while running Davusic");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn factory_reset_removes_app_data_and_keeps_tools() {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let root = std::env::temp_dir().join(format!(
            "davusic-reset-test-{}-{stamp}",
            std::process::id()
        ));
        let config_dir = root.join("config").join("davusic");
        let cache_dir = root.join("cache").join("davusic");
        let data_dir = root.join("data").join("davusic");
        let webview_data_dir = root.join("data").join("io.github.davo.davusic");
        std::fs::create_dir_all(&config_dir).unwrap();
        std::fs::create_dir_all(cache_dir.join("streams")).unwrap();
        std::fs::create_dir_all(data_dir.join("bin")).unwrap();
        std::fs::create_dir_all(&webview_data_dir).unwrap();
        std::fs::create_dir_all(root.join("config").join("auralis")).unwrap();
        std::fs::create_dir_all(root.join("cache").join("auralis")).unwrap();
        std::fs::create_dir_all(root.join("data").join("auralis")).unwrap();
        std::fs::create_dir_all(root.join("data").join("io.github.davo.auralis")).unwrap();
        std::fs::write(config_dir.join("streams.json"), b"{}").unwrap();
        std::fs::write(cache_dir.join("streams").join("demo.ogg"), b"audio").unwrap();
        std::fs::write(data_dir.join("legacy.json"), b"{}").unwrap();
        std::fs::write(data_dir.join("bin").join("yt-dlp"), b"tool").unwrap();
        std::fs::write(root.join("config").join("auralis").join("config.json"), b"{}").unwrap();
        std::fs::write(root.join("cache").join("auralis").join("audio.ogg"), b"audio").unwrap();
        std::fs::write(root.join("data").join("auralis").join("store.json"), b"{}").unwrap();
        std::fs::write(root.join("data").join("io.github.davo.auralis").join("cache"), b"cache")
            .unwrap();

        let paths = Paths {
            config_dir: config_dir.clone(),
            cache_dir: cache_dir.clone(),
            data_dir: data_dir.clone(),
            webview_data_dir,
            config_file: config_dir.join("config.json"),
            library_cache: config_dir.join("library-cache.json"),
            spotify_file: config_dir.join("spotify.json"),
            covers: cache_dir.join("covers"),
            themes: cache_dir.join("themes"),
            tools: data_dir.join("bin"),
            demo_audio: cache_dir.join("demo-audio"),
            streams: cache_dir.join("streams"),
            lyrics: cache_dir.join("lyrics"),
            catalog_streams: config_dir.join("streams.json"),
            catalog_playlists: config_dir.join("playlists.json"),
            catalog_fonts: config_dir.join("fonts.json"),
            session_file: config_dir.join("session.json"),
        };

        let report = reset_storage(&paths);
        assert!(report.warnings.is_empty(), "{:?}", report.warnings);
        assert!(!config_dir.join("streams.json").exists());
        assert!(!cache_dir.join("streams").join("demo.ogg").exists());
        assert!(!data_dir.join("legacy.json").exists());
        assert!(!root.join("config").join("auralis").exists());
        assert!(!root.join("cache").join("auralis").exists());
        assert!(!root.join("data").join("auralis").exists());
        assert!(!root.join("data").join("io.github.davo.auralis").exists());
        assert!(data_dir.join("bin").join("yt-dlp").is_file());
        assert!(paths.config_dir.is_dir());
        assert!(paths.tools.is_dir());
        let _ = std::fs::remove_dir_all(&root);
    }
}
