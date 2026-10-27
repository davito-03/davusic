// Cuenta de Spotify mediante OAuth 2.0 + PKCE y la Web API oficial.
// Davusic nunca lee cookies, tokens ni credenciales de la sesión del navegador.
use std::collections::HashMap;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};

use crate::models::{
    ImportBundle, ImportedPlaylist, ImportedTrack, SpotifyPlaylistPage, SpotifyPlaylistSummary,
    SpotifyStatus,
};
use crate::paths::{self, Paths};

pub const REDIRECT_URI: &str = "http://127.0.0.1:43827/callback";
const CALLBACK_PORT: u16 = 43827;
const AUTHORIZE_URL: &str = "https://accounts.spotify.com/authorize";
const TOKEN_URL: &str = "https://accounts.spotify.com/api/token";
const API_URL: &str = "https://api.spotify.com/v1";
const SCOPES: &str =
    "playlist-read-private playlist-read-collaborative user-library-read user-read-private";
const LOGIN_TIMEOUT: Duration = Duration::from_secs(240);
const PAGE_SIZE: u32 = 50;

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
struct Store {
    #[serde(default)]
    client_id: String,
    #[serde(default)]
    access_token: String,
    #[serde(default)]
    refresh_token: String,
    #[serde(default)]
    expires_at: i64,
    #[serde(default)]
    scope: String,
    #[serde(default)]
    account_id: String,
    #[serde(default)]
    display_name: String,
    #[serde(default)]
    image: String,
    #[serde(default)]
    product: String,
}

#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    #[serde(default)]
    refresh_token: Option<String>,
    #[serde(default)]
    expires_in: i64,
    #[serde(default)]
    scope: String,
}

#[derive(Debug, Deserialize)]
struct ProfileResponse {
    id: String,
    #[serde(default)]
    display_name: Option<String>,
    #[serde(default)]
    product: Option<String>,
    #[serde(default)]
    images: Vec<ImageResponse>,
}

#[derive(Debug, Deserialize)]
struct ImageResponse {
    #[serde(default)]
    url: String,
}

struct Callback {
    code: String,
    stream: TcpStream,
}

// ---------- estado local ----------

pub fn status(paths: &Paths) -> SpotifyStatus {
    status_from_store(&read_store(&paths.spotify_file))
}

pub fn is_connected(paths: &Paths) -> bool {
    let store = read_store(&paths.spotify_file);
    !store.refresh_token.is_empty()
}

pub fn save_client_id(paths: &Paths, raw: &str) -> Result<SpotifyStatus, String> {
    let client_id = raw.trim();
    if client_id.is_empty() {
        return Err("Pega el Client ID de tu app de Spotify.".into());
    }
    if client_id.len() < 8
        || client_id.len() > 256
        || !client_id
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_')
    {
        return Err(
            "Ese Client ID no parece válido. Copia solo el Client ID de Spotify Developer.".into(),
        );
    }
    let mut store = read_store(&paths.spotify_file);
    if store.client_id != client_id {
        store.client_id = client_id.to_string();
        clear_session(&mut store);
    }
    write_store(&paths.spotify_file, &store)?;
    Ok(status_from_store(&store))
}

pub fn logout(paths: &Paths) -> Result<SpotifyStatus, String> {
    let mut store = read_store(&paths.spotify_file);
    clear_session(&mut store);
    write_store(&paths.spotify_file, &store)?;
    Ok(status_from_store(&store))
}

fn clear_session(store: &mut Store) {
    store.access_token.clear();
    store.refresh_token.clear();
    store.expires_at = 0;
    store.scope.clear();
    store.account_id.clear();
    store.display_name.clear();
    store.image.clear();
    store.product.clear();
}

fn status_from_store(store: &Store) -> SpotifyStatus {
    SpotifyStatus {
        configured: !store.client_id.is_empty(),
        connected: !store.refresh_token.is_empty(),
        client_id: store.client_id.clone(),
        display_name: store.display_name.clone(),
        account_id: store.account_id.clone(),
        image: store.image.clone(),
        product: store.product.clone(),
        redirect_uri: REDIRECT_URI.to_string(),
    }
}

fn read_store(path: &Path) -> Store {
    fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str::<Store>(&raw).ok())
        .unwrap_or_default()
}

fn write_store(path: &Path, store: &Store) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("No se pudo crear la carpeta de configuración: {error}"))?;
    }
    let raw = serde_json::to_vec_pretty(store)
        .map_err(|error| format!("No se pudo preparar la sesión de Spotify: {error}"))?;
    let tmp = path.with_extension("json.tmp");
    let mut options = OpenOptions::new();
    options.write(true).create(true).truncate(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(&tmp)
        .map_err(|error| format!("No se pudo guardar la sesión de Spotify: {error}"))?;
    file.write_all(&raw)
        .map_err(|error| format!("No se pudo escribir la sesión de Spotify: {error}"))?;
    file.sync_all().ok();
    drop(file);
    fs::rename(&tmp, path)
        .map_err(|error| format!("No se pudo cerrar la sesión de Spotify: {error}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(path, fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

// ---------- inicio de sesión ----------

pub fn login(paths: &Paths, cancel: &AtomicBool) -> Result<SpotifyStatus, String> {
    let mut store = read_store(&paths.spotify_file);
    if store.client_id.is_empty() {
        return Err("Primero configura el Client ID de tu app de Spotify.".into());
    }
    cancel.store(false, Ordering::SeqCst);

    // Escuchamos solo en loopback. El puerto debe coincidir exactamente con el
    // Redirect URI registrado en Spotify Developer.
    let listener = TcpListener::bind(("127.0.0.1", CALLBACK_PORT)).map_err(|error| {
        format!(
            "No se pudo abrir el puerto local {CALLBACK_PORT} para recibir a Spotify: {error}. \
             Cierra otra instancia de Davusic e inténtalo de nuevo."
        )
    })?;
    listener
        .set_nonblocking(true)
        .map_err(|error| format!("No se pudo preparar la espera de Spotify: {error}"))?;

    let verifier = random_token(64)?;
    let challenge = pkce_challenge(&verifier);
    let state = random_token(32)?;
    let authorize_url = format!(
        "{AUTHORIZE_URL}?response_type=code&client_id={}&redirect_uri={}&scope={}&state={}&code_challenge_method=S256&code_challenge={}",
        url_encode(&store.client_id),
        url_encode(REDIRECT_URI),
        url_encode(SCOPES),
        url_encode(&state),
        url_encode(&challenge),
    );

    open_browser(&authorize_url)?;
    let mut callback = wait_for_callback(&listener, &state, cancel)?;

    let result: Result<SpotifyStatus, String> = (|| {
        let client = http_client()?;
        let token = exchange_code(&client, &store.client_id, &callback.code, &verifier)?;
        let profile = fetch_profile(&client, &token.access_token)?;
        store.access_token = token.access_token;
        let refresh_token = token
            .refresh_token
            .clone()
            .or_else(|| {
                if store.refresh_token.is_empty() {
                    None
                } else {
                    Some(store.refresh_token.clone())
                }
            })
            .ok_or_else(|| {
                "Spotify no devolvió un token de actualización. Vuelve a intentar la conexión."
                    .to_string()
            })?;
        store.refresh_token = refresh_token;
        store.expires_at = token_expiry(token.expires_in);
        store.scope = token.scope;
        store.account_id = profile.id;
        store.display_name = profile
            .display_name
            .filter(|name| !name.trim().is_empty())
            .unwrap_or_else(|| store.account_id.clone());
        store.image = profile
            .images
            .first()
            .map(|image| image.url.clone())
            .unwrap_or_default();
        store.product = profile.product.unwrap_or_default();
        write_store(&paths.spotify_file, &store)?;
        Ok(status_from_store(&store))
    })();

    match &result {
        Ok(_) => respond(
            &mut callback.stream,
            200,
            "Spotify conectado",
            "La autorización se ha guardado en Davusic. Puedes cerrar esta pestaña y volver a la aplicación.",
        ),
        Err(message) => respond(
            &mut callback.stream,
            400,
            "No se pudo conectar Spotify",
            message,
        ),
    }
    result
}

fn wait_for_callback(
    listener: &TcpListener,
    expected_state: &str,
    cancel: &AtomicBool,
) -> Result<Callback, String> {
    let deadline = Instant::now() + LOGIN_TIMEOUT;
    loop {
        if cancel.load(Ordering::SeqCst) {
            return Err("Inicio de sesión de Spotify cancelado.".into());
        }
        if Instant::now() >= deadline {
            return Err("Spotify no respondió a tiempo. Inténtalo de nuevo.".into());
        }
        match listener.accept() {
            Ok((mut stream, _)) => {
                let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
                let mut buffer = [0u8; 8192];
                let read = stream.read(&mut buffer).unwrap_or(0);
                let request = String::from_utf8_lossy(&buffer[..read]);
                let target = request
                    .lines()
                    .next()
                    .and_then(|line| line.split_whitespace().nth(1))
                    .unwrap_or("");
                if !target.starts_with("/callback") {
                    respond(
                        &mut stream,
                        404,
                        "Ruta no encontrada",
                        "Davusic solo escucha el callback local de Spotify.",
                    );
                    continue;
                }
                let params = query_params(target);
                if let Some(error) = params.get("error") {
                    let description = params
                        .get("error_description")
                        .map(String::as_str)
                        .unwrap_or(error.as_str());
                    let message = if error == "access_denied" {
                        "Has cancelado la autorización de Spotify.".to_string()
                    } else {
                        format!("Spotify rechazó la autorización: {description}")
                    };
                    respond(&mut stream, 400, "Autorización cancelada", &message);
                    return Err(message);
                }
                let Some(code) = params.get("code") else {
                    let message = "Spotify no devolvió un código de autorización.".to_string();
                    respond(&mut stream, 400, "Respuesta incompleta", &message);
                    return Err(message);
                };
                if params.get("state").map(String::as_str) != Some(expected_state) {
                    let message =
                        "La respuesta de Spotify no coincide con esta solicitud. Inténtalo de nuevo."
                            .to_string();
                    respond(&mut stream, 400, "Solicitud no válida", &message);
                    return Err(message);
                }
                return Ok(Callback {
                    code: code.clone(),
                    stream,
                });
            }
            Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(80));
            }
            Err(error) => {
                return Err(format!(
                    "No se pudo recibir la respuesta de Spotify: {error}"
                ));
            }
        }
    }
}

fn exchange_code(
    client: &reqwest::blocking::Client,
    client_id: &str,
    code: &str,
    verifier: &str,
) -> Result<TokenResponse, String> {
    let response = client
        .post(TOKEN_URL)
        .form(&[
            ("grant_type", "authorization_code"),
            ("code", code),
            ("redirect_uri", REDIRECT_URI),
            ("client_id", client_id),
            ("code_verifier", verifier),
        ])
        .send()
        .map_err(|error| format!("No se pudo contactar con Spotify: {error}"))?;
    let status = response.status();
    let body = response
        .text()
        .map_err(|error| format!("Spotify devolvió una respuesta ilegible: {error}"))?;
    if !status.is_success() {
        return Err(format!(
            "Spotify rechazó la autorización: {}",
            spotify_error(&body, status)
        ));
    }
    serde_json::from_str::<TokenResponse>(&body)
        .map_err(|_| "Spotify devolvió una sesión que Davusic no pudo interpretar.".to_string())
}

fn fetch_profile(
    client: &reqwest::blocking::Client,
    access_token: &str,
) -> Result<ProfileResponse, String> {
    let response = client
        .get(format!("{API_URL}/me"))
        .bearer_auth(access_token)
        .send()
        .map_err(|error| format!("No se pudo consultar tu perfil de Spotify: {error}"))?;
    let status = response.status();
    let body = response
        .text()
        .map_err(|error| format!("El perfil de Spotify llegó incompleto: {error}"))?;
    if !status.is_success() {
        return Err(format!(
            "Spotify no permitió leer tu perfil: {}",
            spotify_error(&body, status)
        ));
    }
    serde_json::from_str::<ProfileResponse>(&body)
        .map_err(|_| "No se pudo interpretar tu perfil de Spotify.".to_string())
}

// ---------- playlists y Me gusta ----------

pub fn playlists(paths: &Paths, offset: u32) -> Result<SpotifyPlaylistPage, String> {
    let mut store = connected_store(paths)?;
    let client = http_client()?;
    let path = format!("/me/playlists?limit={PAGE_SIZE}&offset={offset}");
    let data = api_get(paths, &client, &mut store, &path)?;
    let raw_items = data
        .get("items")
        .and_then(Value::as_array)
        .ok_or_else(|| "Spotify no devolvió tus playlists.".to_string())?;
    let total = data
        .get("total")
        .and_then(Value::as_u64)
        .unwrap_or(raw_items.len() as u64)
        .min(u32::MAX as u64) as u32;
    let account_id = store.account_id.clone();
    let mut items = Vec::with_capacity(raw_items.len());
    for raw in raw_items {
        let Some(id) = raw.get("id").and_then(Value::as_str) else {
            continue;
        };
        if id.is_empty() {
            continue;
        }
        let owner_id = raw
            .pointer("/owner/id")
            .and_then(Value::as_str)
            .unwrap_or("");
        let owner = raw
            .pointer("/owner/display_name")
            .and_then(Value::as_str)
            .or_else(|| raw.pointer("/owner/id").and_then(Value::as_str))
            .unwrap_or("Spotify");
        let collaborative = raw
            .get("collaborative")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        let importable = true;
        let _ = (account_id.as_str(), owner_id);
        let track_count = raw
            .pointer("/tracks/total")
            .or_else(|| raw.pointer("/items/total"))
            .and_then(Value::as_u64)
            .unwrap_or(0)
            .min(u32::MAX as u64) as u32;
        let image = raw
            .pointer("/images/0/url")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        let public = raw.get("public").and_then(Value::as_bool).unwrap_or(false);
        let url = raw
            .pointer("/external_urls/spotify")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        items.push(SpotifyPlaylistSummary {
            id: id.to_string(),
            name: raw
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or("Playlist de Spotify")
                .to_string(),
            description: raw
                .get("description")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string(),
            owner: owner.to_string(),
            image,
            track_count,
            importable,
            collaborative,
            public,
            url,
        });
    }
    let loaded = offset.saturating_add(items.len() as u32);
    let next_offset = if !items.is_empty() && loaded < total {
        Some(loaded)
    } else {
        None
    };
    Ok(SpotifyPlaylistPage {
        items,
        total,
        next_offset,
    })
}

pub fn import_playlist<F>(
    paths: &Paths,
    playlist_id: &str,
    mut progress: F,
) -> Result<ImportBundle, String>
where
    F: FnMut(u32, u32),
{
    if playlist_id.is_empty()
        || playlist_id.len() > 100
        || !playlist_id.chars().all(|ch| ch.is_ascii_alphanumeric())
    {
        return Err("El identificador de la playlist de Spotify no es válido.".into());
    }
    let mut store = connected_store(paths)?;
    let client = http_client()?;
    let detail = api_get(
        paths,
        &client,
        &mut store,
        &format!("/playlists/{playlist_id}"),
    )?;
    let name = detail
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or("Playlist de Spotify")
        .to_string();
    let description = detail
        .get("description")
        .and_then(Value::as_str)
        .unwrap_or("Importada desde tu cuenta de Spotify.")
        .to_string();
    let total = detail
        .pointer("/tracks/total")
        .or_else(|| detail.pointer("/items/total"))
        .and_then(Value::as_u64)
        .unwrap_or(0)
        .min(u32::MAX as u64) as u32;

    let (tracks, skipped) = playlist_tracks(
        paths,
        &client,
        &mut store,
        playlist_id,
        total,
        &mut progress,
    )?;
    if tracks.is_empty() {
        return Err(
            "Spotify no devolvió canciones para esta playlist. Puede ser una lista editorial vacía o retirada."
                .into(),
        );
    }

    let mut warnings = Vec::new();
    if skipped > 0 {
        warnings.push(format!(
            "Se omitieron {skipped} elementos que no eran canciones (episodios, pistas retiradas o no disponibles)."
        ));
    }
    warnings.push(
        "Davusic solo ha leído metadatos de Spotify. Al pulsar play, las canciones se streamean en este equipo."
            .into(),
    );
    let bundle = ImportBundle {
        playlists: vec![ImportedPlaylist {
            id: String::new(),
            name,
            description: format!("{description} · Cuenta de Spotify."),
            source: "spotify".into(),
            tracks,
        }],
        warnings,
        origin: "Spotify · Mi cuenta".into(),
    };
    crate::playlist_import::finish(bundle)
}

pub fn import_saved<F>(paths: &Paths, mut progress: F) -> Result<ImportBundle, String>
where
    F: FnMut(u32, u32),
{
    let mut store = connected_store(paths)?;
    let client = http_client()?;
    let mut tracks = Vec::new();
    let mut offset = 0u32;
    let mut total = 0u32;
    let mut skipped = 0usize;
    loop {
        let path = format!("/me/tracks?limit={PAGE_SIZE}&offset={offset}");
        let page = api_get(paths, &client, &mut store, &path)?;
        if let Some(value) = page.get("total").and_then(Value::as_u64) {
            total = value.min(u32::MAX as u64) as u32;
        }
        let items = page
            .get("items")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        if items.is_empty() {
            break;
        }
        for item in &items {
            match imported_track_from_container(item) {
                Some(track) => tracks.push(track),
                None => skipped += 1,
            }
        }
        let page_len = items.len() as u32;
        offset = offset.saturating_add(page_len);
        progress(offset.min(total.max(offset)), total.max(offset));
        if offset >= total || page_len == 0 {
            break;
        }
    }
    if tracks.is_empty() {
        return Err(
            "Tu biblioteca de Spotify no tiene canciones guardadas o no se pudo leer. Comprueba que marcaste canciones con Me gusta."
                .into(),
        );
    }
    let mut warnings = vec![
        "Davusic solo ha leído metadatos de Spotify. Al pulsar play, las canciones se streamean en este equipo.".into(),
    ];
    if skipped > 0 {
        warnings.push(format!(
            "Se omitieron {skipped} elementos que no eran canciones."
        ));
    }
    let bundle = ImportBundle {
        playlists: vec![ImportedPlaylist {
            id: String::new(),
            name: "Me gusta · Spotify".into(),
            description: "Canciones guardadas en tu biblioteca de Spotify.".into(),
            source: "spotify".into(),
            tracks,
        }],
        warnings,
        origin: "Spotify · Me gusta".into(),
    };
    crate::playlist_import::finish(bundle)
}

pub fn import_url(paths: &Paths, url: &str) -> Result<ImportBundle, String> {
    let id = crate::playlist_import::extract_spotify_playlist_id(url)
        .ok_or_else(|| "No reconozco ese enlace de playlist de Spotify.".to_string())?;
    import_playlist(paths, &id, |_, _| {})
}

pub fn import_library<F>(paths: &Paths, mut progress: F) -> Result<ImportBundle, String>
where
    F: FnMut(u32, u32, &str),
{
    let mut imported = Vec::new();
    let mut warnings = Vec::new();
    let mut offset = 0u32;
    let mut listed = Vec::new();
    loop {
        let page = playlists(paths, offset)?;
        listed.extend(page.items);
        match page.next_offset {
            Some(next) => offset = next,
            None => break,
        }
        if listed.len() > 2000 {
            warnings.push("Se recortó el listado a 2000 playlists.".into());
            break;
        }
    }

    progress(0, listed.len() as u32 + 1, "Me gusta");
    match import_saved(paths, |done, total| {
        progress(done, total, "Me gusta");
    }) {
        Ok(mut saved) => imported.append(&mut saved.playlists),
        Err(error) => warnings.push(format!("Me gusta: {error}")),
    }

    let total = listed.len() as u32;
    for (index, summary) in listed.into_iter().enumerate() {
        let label = if summary.name.is_empty() {
            "Playlist de Spotify"
        } else {
            summary.name.as_str()
        };
        progress(index as u32 + 1, total.saturating_add(1), label);
        match import_playlist(paths, &summary.id, |_, _| {}) {
            Ok(mut bundle) => imported.append(&mut bundle.playlists),
            Err(error) => warnings.push(format!("{}: {error}", summary.name)),
        }
    }

    if imported.is_empty() {
        return Err("No se pudieron leer playlists ni Me gusta de esta cuenta de Spotify.".into());
    }
    warnings.push(
        "Davusic ha leído las playlists como lo haría Exportify: metadatos oficiales, sin descargar audio.".into(),
    );
    let bundle = ImportBundle {
        playlists: imported,
        warnings,
        origin: "Spotify · Exportar todas".into(),
    };
    crate::playlist_import::finish(bundle)
}

fn playlist_tracks<F>(
    paths: &Paths,
    client: &reqwest::blocking::Client,
    store: &mut Store,
    playlist_id: &str,
    total_hint: u32,
    progress: &mut F,
) -> Result<(Vec<ImportedTrack>, usize), String>
where
    F: FnMut(u32, u32),
{
    let mut tracks = Vec::new();
    let mut skipped = 0usize;
    let mut offset = 0u32;
    let mut observed_total = total_hint;
    // /items es el endpoint actual, pero Spotify lo restringe a playlists
    // propias o colaborativas. /tracks sigue siendo necesario para listas
    // seguidas; el máximo documentado por página es 50. Si /tracks falla en
    // la primera página, se reintenta el listado completo con /items.
    const TRACK_PAGE: u32 = 50;
    let mut endpoint = "tracks";
    loop {
        let path = format!(
            "/playlists/{playlist_id}/{endpoint}?limit={TRACK_PAGE}&offset={offset}&additional_types=track"
        );
        let page = match api_get(paths, client, store, &path) {
            Ok(page) => page,
            Err(_error) if offset == 0 && endpoint == "tracks" => {
                endpoint = "items";
                continue;
            }
            Err(error) => return Err(error),
        };
        if let Some(page_total) = page.get("total").and_then(Value::as_u64) {
            observed_total = page_total.min(u32::MAX as u64) as u32;
        }
        let items = page
            .get("items")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        if items.is_empty() {
            break;
        }
        for item in &items {
            match imported_track_from_container(item) {
                Some(track) => tracks.push(track),
                None => skipped += 1,
            }
        }
        let page_len = items.len() as u32;
        offset = offset.saturating_add(page_len);
        progress(
            offset.min(observed_total.max(offset)),
            observed_total.max(offset),
        );
        if offset >= observed_total || page_len == 0 {
            break;
        }
    }
    Ok((tracks, skipped))
}

fn connected_store(paths: &Paths) -> Result<Store, String> {
    let store = read_store(&paths.spotify_file);
    if store.refresh_token.is_empty() {
        return Err("Conecta tu cuenta de Spotify desde Ajustes o desde el importador.".into());
    }
    if store.client_id.is_empty() {
        return Err("Falta el Client ID de Spotify. Vuelve a configurarlo en Ajustes.".into());
    }
    Ok(store)
}

fn imported_track_from_container(container: &Value) -> Option<ImportedTrack> {
    let track = container
        .get("item")
        .or_else(|| container.get("track"))
        .filter(|value| !value.is_null())
        .unwrap_or(container);
    if track.get("type").and_then(Value::as_str) == Some("episode") {
        return None;
    }
    let title = track
        .get("name")
        .and_then(Value::as_str)
        .unwrap_or("")
        .trim();
    if title.is_empty() {
        return None;
    }
    let artists = track
        .get("artists")
        .and_then(Value::as_array)
        .map(|artists| {
            artists
                .iter()
                .filter_map(|artist| artist.get("name").and_then(Value::as_str))
                .filter(|name| !name.trim().is_empty())
                .collect::<Vec<_>>()
                .join(", ")
        })
        .unwrap_or_default();
    let album = track
        .pointer("/album/name")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let duration = track
        .get("duration_ms")
        .and_then(Value::as_f64)
        .unwrap_or(0.0)
        / 1000.0;
    let uri = track
        .pointer("/external_urls/spotify")
        .and_then(Value::as_str)
        .or_else(|| track.get("uri").and_then(Value::as_str))
        .unwrap_or("")
        .to_string();
    Some(ImportedTrack {
        id: String::new(),
        title: title.to_string(),
        artist: artists,
        album,
        duration,
        uri,
    })
}

// ---------- Web API ----------

fn http_client() -> Result<reqwest::blocking::Client, String> {
    crate::net::blocking_client_builder()
        .timeout(Duration::from_secs(30))
        .connect_timeout(Duration::from_secs(12))
        .user_agent(format!(
            "Davusic/{} ({}; local-first music player)",
            env!("CARGO_PKG_VERSION"),
            crate::platform::os_name()
        ))
        .build()
        .map_err(|error| format!("No se pudo preparar la conexión con Spotify: {error}"))
}

fn api_get(
    paths: &Paths,
    client: &reqwest::blocking::Client,
    store: &mut Store,
    path: &str,
) -> Result<Value, String> {
    let url = format!("{API_URL}{path}");
    let mut last_error = String::new();
    for attempt in 0..5 {
        let token = ensure_access_token(paths, client, store)?;
        let response = match client.get(&url).bearer_auth(token).send() {
            Ok(response) => response,
            Err(error) => {
                return Err(format!("No se pudo contactar con Spotify: {error}"));
            }
        };
        let status = response.status();
        if status == reqwest::StatusCode::UNAUTHORIZED && attempt == 0 {
            store.expires_at = 0;
            last_error = "La sesión de Spotify ha caducado. Vuelve a conectar tu cuenta.".into();
            continue;
        }
        if status == reqwest::StatusCode::TOO_MANY_REQUESTS && attempt < 4 {
            let seconds = response
                .headers()
                .get("retry-after")
                .and_then(|value| value.to_str().ok())
                .and_then(|value| value.parse::<u64>().ok())
                .unwrap_or(2)
                .min(20);
            std::thread::sleep(Duration::from_secs(seconds.max(1)));
            last_error =
                "Spotify ha limitado las peticiones. Espera un momento e inténtalo de nuevo."
                    .into();
            continue;
        }
        let body = response
            .text()
            .map_err(|error| format!("Spotify devolvió una respuesta ilegible: {error}"))?;
        if !status.is_success() {
            return Err(spotify_error(&body, status));
        }
        return serde_json::from_str::<Value>(&body)
            .map_err(|_| "Spotify devolvió datos que Davusic no pudo interpretar.".into());
    }
    Err(if last_error.is_empty() {
        "No se pudo consultar Spotify.".into()
    } else {
        last_error
    })
}

fn ensure_access_token(
    paths: &Paths,
    client: &reqwest::blocking::Client,
    store: &mut Store,
) -> Result<String, String> {
    let now = unix_now();
    if !store.access_token.is_empty() && store.expires_at > now + 30 {
        return Ok(store.access_token.clone());
    }
    if store.refresh_token.is_empty() {
        return Err("No hay una sesión de Spotify activa. Conecta tu cuenta de nuevo.".into());
    }
    let response = client
        .post(TOKEN_URL)
        .form(&[
            ("grant_type", "refresh_token"),
            ("refresh_token", &store.refresh_token),
            ("client_id", &store.client_id),
        ])
        .send()
        .map_err(|error| format!("No se pudo renovar la sesión de Spotify: {error}"))?;
    let status = response.status();
    let body = response
        .text()
        .map_err(|error| format!("Spotify devolvió una respuesta ilegible: {error}"))?;
    if !status.is_success() {
        return Err(format!(
            "La autorización de Spotify ya no es válida. Vuelve a conectar tu cuenta. ({})",
            spotify_error(&body, status)
        ));
    }
    let token: TokenResponse = serde_json::from_str(&body)
        .map_err(|_| "Spotify devolvió una sesión que Davusic no pudo interpretar.".to_string())?;
    store.access_token = token.access_token;
    if let Some(refresh_token) = token.refresh_token {
        if !refresh_token.is_empty() {
            store.refresh_token = refresh_token;
        }
    }
    if !token.scope.is_empty() {
        store.scope = token.scope;
    }
    store.expires_at = token_expiry(token.expires_in);
    write_store(&paths.spotify_file, store)?;
    Ok(store.access_token.clone())
}

fn spotify_error(body: &str, status: reqwest::StatusCode) -> String {
    if status == reqwest::StatusCode::FORBIDDEN {
        return "Spotify no permite leer esta playlist. Algunas listas editoriales o «Made for You» ya no exponen sus pistas a apps de terceros."
            .into();
    }
    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return "Spotify ha limitado las peticiones; espera un momento e inténtalo de nuevo."
            .into();
    }
    if let Ok(value) = serde_json::from_str::<Value>(body) {
        for pointer in ["/error_description", "/error/message", "/error"] {
            if let Some(message) = value.pointer(pointer).and_then(Value::as_str) {
                if !message.trim().is_empty() {
                    return message.trim().to_string();
                }
            }
        }
    }
    match status.as_u16() {
        401 => "la sesión no es válida o ha caducado".into(),
        404 => "no se encontró el recurso en Spotify".into(),
        code => format!("Spotify respondió con el código {code}"),
    }
}

fn token_expiry(expires_in: i64) -> i64 {
    unix_now() + expires_in.clamp(60, 86_400) - 30
}

// ---------- PKCE, azar y URLs ----------

fn random_token(bytes: usize) -> Result<String, String> {
    let mut buffer = vec![0u8; bytes];
    File::open("/dev/urandom")
        .and_then(|mut file| file.read_exact(&mut buffer))
        .map_err(|error| format!("No se pudo generar un secreto seguro: {error}"))?;
    Ok(base64_url(&buffer))
}

fn pkce_challenge(verifier: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(verifier.as_bytes());
    base64_url(&hasher.finalize())
}

fn base64_url(data: &[u8]) -> String {
    const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = chunk.get(1).copied().unwrap_or(0);
        let b2 = chunk.get(2).copied().unwrap_or(0);
        out.push(ALPHABET[(b0 >> 2) as usize] as char);
        out.push(ALPHABET[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            out.push(ALPHABET[(((b1 & 0x0f) << 2) | (b2 >> 6)) as usize] as char);
        }
        if chunk.len() > 2 {
            out.push(ALPHABET[(b2 & 0x3f) as usize] as char);
        }
    }
    out
}

fn url_encode(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b'~') {
            out.push(byte as char);
        } else {
            out.push_str(&format!("%{byte:02X}"));
        }
    }
    out
}

fn query_params(target: &str) -> HashMap<String, String> {
    let mut params = HashMap::new();
    let Some((_, query)) = target.split_once('?') else {
        return params;
    };
    for pair in query.split('&') {
        if pair.is_empty() {
            continue;
        }
        let (key, value) = pair.split_once('=').unwrap_or((pair, ""));
        let key = paths::percent_decode(key).replace('+', " ");
        let value = paths::percent_decode(value).replace('+', " ");
        params.insert(key, value);
    }
    params
}

fn open_browser(url: &str) -> Result<(), String> {
    crate::platform::open_url(url)
        .map_err(|error| format!("No se pudo abrir el navegador para conectar Spotify: {error}"))
}

fn unix_now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs() as i64)
        .unwrap_or(0)
}

fn respond(stream: &mut TcpStream, status: u16, title: &str, message: &str) {
    let reason = match status {
        200 => "OK",
        400 => "Bad Request",
        404 => "Not Found",
        _ => "Error",
    };
    let body = format!(
        "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\">\
        <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\
        <title>{title}</title><style>\
        :root{{color-scheme:dark}}*{{box-sizing:border-box}}\
        body{{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;\
        background:#0b0a0e;color:#f4eee6;font:15px/1.6 system-ui,sans-serif}}\
        main{{max-width:540px;padding:34px;border:1px solid #ffffff1a;border-radius:20px;\
        background:linear-gradient(145deg,#ffffff0b,#ffffff03)}}\
        h1{{font-size:28px;line-height:1.15;margin:0 0 12px}}\
        p{{margin:0;color:#cfc7bf}}small{{display:block;margin-top:20px;color:#8e867f}}\
        </style></head><body><main><h1>{}</h1><p>{}</p>\
        <small>Davusic · local-first</small></main></body></html>",
        escape_html(title),
        escape_html(message)
    );
    let header = format!(
        "HTTP/1.1 {status} {reason}\r\nContent-Type: text/html; charset=utf-8\r\n\
         Content-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n",
        body.as_bytes().len()
    );
    let _ = stream.write_all(header.as_bytes());
    let _ = stream.write_all(body.as_bytes());
    let _ = stream.flush();
}

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base64url_matches_known_values() {
        assert_eq!(base64_url(b""), "");
        assert_eq!(base64_url(b"f"), "Zg");
        assert_eq!(base64_url(b"fo"), "Zm8");
        assert_eq!(base64_url(b"foo"), "Zm9v");
        assert_eq!(base64_url(b"hello"), "aGVsbG8");
    }

    #[test]
    fn pkce_matches_rfc_7636_example() {
        assert_eq!(
            pkce_challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
            "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        );
    }

    #[test]
    fn url_encoding_keeps_oauth_characters_safe() {
        assert_eq!(url_encode("a b/c?d=e"), "a%20b%2Fc%3Fd%3De");
    }

    #[test]
    fn callback_parameters_are_decoded() {
        let params =
            query_params("/callback?code=AQD%2Fabc&state=xyz&error_description=Hola+mundo");
        assert_eq!(params.get("code").map(String::as_str), Some("AQD/abc"));
        assert_eq!(params.get("state").map(String::as_str), Some("xyz"));
        assert_eq!(
            params.get("error_description").map(String::as_str),
            Some("Hola mundo")
        );
    }

    #[test]
    fn playlist_items_accept_new_and_old_shapes() {
        let new_shape = serde_json::json!({
            "item": {
                "type": "track",
                "name": "Bajamar",
                "duration_ms": 88000,
                "artists": [{"name": "Lúa"}],
                "album": {"name": "Mareas"},
                "external_urls": {"spotify": "https://open.spotify.com/track/abc"}
            }
        });
        let old_shape = serde_json::json!({
            "track": {
                "type": "track",
                "name": "Cromo",
                "duration_ms": 64000,
                "artists": [{"name": "Vera Nox"}],
                "album": {"name": "Neón"}
            }
        });
        let first = imported_track_from_container(&new_shape).expect("pista nueva");
        let second = imported_track_from_container(&old_shape).expect("pista antigua");
        assert_eq!(
            (first.title.as_str(), first.artist.as_str()),
            ("Bajamar", "Lúa")
        );
        assert_eq!(first.duration, 88.0);
        assert_eq!(
            (second.title.as_str(), second.artist.as_str()),
            ("Cromo", "Vera Nox")
        );
    }

    #[test]
    fn podcast_episodes_are_not_imported() {
        let episode = serde_json::json!({
            "item": {"type": "episode", "name": "Un episodio", "show": {"name": "Podcast"}}
        });
        assert!(imported_track_from_container(&episode).is_none());
    }
}
