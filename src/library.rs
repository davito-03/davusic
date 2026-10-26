// Escaneo de la biblioteca local y extracción de carátulas.
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use lofty::file::{AudioFile, TaggedFileExt};
use lofty::prelude::Accessor;
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

use crate::models::{Album, Artist, Config, FolderInfo, LibrarySnapshot, Track};
use crate::palette;
use crate::paths::{self, Paths};

#[derive(Clone, Debug, Default)]
struct CoverInfo {
    url: String,
    accent: String,
    accent2: String,
}

struct AlbumAgg {
    album: Album,
    tracks: Vec<(u32, u32, String)>,
}

struct ArtistAgg {
    artist: Artist,
    albums: HashSet<String>,
}

pub fn load_cache(paths: &Paths) -> LibrarySnapshot {
    fs::read_to_string(&paths.library_cache)
        .ok()
        .and_then(|raw| serde_json::from_str::<LibrarySnapshot>(&raw).ok())
        .unwrap_or_default()
}

pub fn save_cache(paths: &Paths, library: &LibrarySnapshot) {
    if let Ok(raw) = serde_json::to_string(library) {
        let _ = fs::write(&paths.library_cache, raw);
    }
}

fn emit_progress(app: Option<&AppHandle>, done: usize, total: usize, current: &str) {
    if let Some(app) = app {
        let _ = app.emit(
            "library-scan-progress",
            serde_json::json!({
                "stage": "scan",
                "done": done,
                "total": total,
                "processed": done,
                "current": current
            }),
        );
    }
}

pub fn scan(paths: &Paths, config: &Config, app: Option<&AppHandle>) -> LibrarySnapshot {
    let mut files: Vec<PathBuf> = Vec::new();
    let mut seen: HashSet<PathBuf> = HashSet::new();
    let mut folder_counts: HashMap<String, u64> = HashMap::new();

    for raw in &config.folders {
        let root = PathBuf::from(raw);
        if !root.is_dir() {
            continue;
        }
        let mut count = 0u64;
        for entry in WalkDir::new(&root)
            .follow_links(true)
            .max_depth(14)
            .into_iter()
            .filter_map(Result::ok)
        {
            if !entry.file_type().is_file() {
                continue;
            }
            let path = entry.into_path();
            if !paths::audio_extension(&path) {
                continue;
            }
            let canonical = fs::canonicalize(&path).unwrap_or_else(|_| path.clone());
            if seen.insert(canonical.clone()) {
                files.push(canonical);
                count += 1;
            }
        }
        folder_counts.insert(raw.clone(), count);
    }

    let total = files.len();
    emit_progress(app, 0, total, "");

    let mut tracks: Vec<Track> = Vec::with_capacity(total);
    let mut cover_store: HashMap<PathBuf, Option<CoverInfo>> = HashMap::new();

    for (index, path) in files.iter().enumerate() {
        if let Some(track) = read_track(paths, path, &mut cover_store) {
            tracks.push(track);
        }
        emit_progress(
            app,
            index + 1,
            total,
            path.file_name().and_then(|n| n.to_str()).unwrap_or(""),
        );
    }

    tracks.sort_by(|a, b| {
        a.artist
            .to_lowercase()
            .cmp(&b.artist.to_lowercase())
            .then(a.album.to_lowercase().cmp(&b.album.to_lowercase()))
            .then(a.disc_number.unwrap_or(1).cmp(&b.disc_number.unwrap_or(1)))
            .then(a.track_number.unwrap_or(0).cmp(&b.track_number.unwrap_or(0)))
            .then(a.title.to_lowercase().cmp(&b.title.to_lowercase()))
    });

    let mut albums: HashMap<String, AlbumAgg> = HashMap::new();
    let mut artists: HashMap<String, ArtistAgg> = HashMap::new();

    for track in &tracks {
        let album_entry = albums.entry(track.album_id.clone()).or_insert_with(|| AlbumAgg {
            album: Album {
                id: track.album_id.clone(),
                title: track.album.clone(),
                artist: track.album_artist.clone(),
                artist_id: track.artist_id.clone(),
                year: track.year,
                cover: track.cover.clone(),
                accent: track.accent.clone(),
                accent2: track.accent2.clone(),
                genre: track.genre.clone(),
                track_ids: Vec::new(),
                added_at: track.added_at,
            },
            tracks: Vec::new(),
        });
        if album_entry.album.cover.is_empty() && !track.cover.is_empty() {
            album_entry.album.cover = track.cover.clone();
            album_entry.album.accent = track.accent.clone();
            album_entry.album.accent2 = track.accent2.clone();
        }
        if album_entry.album.year.is_none() {
            album_entry.album.year = track.year;
        }
        album_entry.tracks.push((
            track.disc_number.unwrap_or(1),
            track.track_number.unwrap_or(0),
            track.id.clone(),
        ));

        let artist_entry = artists.entry(track.artist_id.clone()).or_insert_with(|| ArtistAgg {
            artist: Artist {
                id: track.artist_id.clone(),
                name: track.artist.clone(),
                cover: track.cover.clone(),
                accent: track.accent.clone(),
                accent2: track.accent2.clone(),
                genres: Vec::new(),
                track_ids: Vec::new(),
                album_count: 0,
            },
            albums: HashSet::new(),
        });
        if artist_entry.artist.cover.is_empty() && !track.cover.is_empty() {
            artist_entry.artist.cover = track.cover.clone();
            artist_entry.artist.accent = track.accent.clone();
            artist_entry.artist.accent2 = track.accent2.clone();
        }
        if !track.genre.is_empty() && !artist_entry.artist.genres.contains(&track.genre) {
            artist_entry.artist.genres.push(track.genre.clone());
        }
        artist_entry.artist.track_ids.push(track.id.clone());
        artist_entry.albums.insert(track.album_id.clone());
    }

    let mut album_list: Vec<Album> = albums
        .into_values()
        .map(|mut agg| {
            agg.tracks.sort();
            agg.album.track_ids = agg.tracks.into_iter().map(|(_, _, id)| id).collect();
            agg.album
        })
        .collect();
    album_list.sort_by(|a, b| {
        a.artist
            .to_lowercase()
            .cmp(&b.artist.to_lowercase())
            .then(a.title.to_lowercase().cmp(&b.title.to_lowercase()))
    });

    let mut artist_list: Vec<Artist> = artists
        .into_values()
        .map(|mut agg| {
            agg.artist.album_count = agg.albums.len() as u32;
            agg.artist.track_ids.sort();
            agg.artist
        })
        .collect();
    artist_list.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    let folders = config
        .folders
        .iter()
        .map(|raw| FolderInfo {
            path: raw.clone(),
            name: Path::new(raw)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(raw)
                .to_string(),
            track_count: *folder_counts.get(raw).unwrap_or(&0),
        })
        .collect();

    if let Some(app) = app {
        let _ = app.emit(
            "library-scan-progress",
            serde_json::json!({ "stage": "done", "done": total, "total": total }),
        );
        let _ = app.emit("library-scan-finished", serde_json::json!({ "tracks": tracks.len() }));
    }

    LibrarySnapshot {
        tracks,
        albums: album_list,
        artists: artist_list,
        folders,
    }
}

fn read_track(
    paths: &Paths,
    path: &Path,
    cover_store: &mut HashMap<PathBuf, Option<CoverInfo>>,
) -> Option<Track> {
    let tagged = lofty::read_from_path(path).ok();
    let (tag_title, tag_artist, tag_album, tag_album_artist, tag_genre, tag_year, tag_track, tag_disc) =
        if let Some(file) = tagged.as_ref() {
            let tag = file.primary_tag().or_else(|| file.first_tag());
            match tag {
                Some(tag) => {
                    let title = tag.title().map(|v| v.trim().to_string()).unwrap_or_default();
                    let artist = tag.artist().map(|v| v.trim().to_string()).unwrap_or_default();
                    let album = tag.album().map(|v| v.trim().to_string()).unwrap_or_default();
                    let album_artist = tag
                        .get_string(lofty::tag::ItemKey::AlbumArtist)
                        .map(str::trim)
                        .filter(|v| !v.is_empty())
                        .unwrap_or(&artist)
                        .to_string();
                    let genre = tag.genre().map(|v| v.trim().to_string()).unwrap_or_default();
                    let year = tag.date().map(|date| u32::from(date.year)).filter(|v| *v > 0);
                    (title, artist, album, album_artist, genre, year, tag.track(), tag.disk())
                }
                None => Default::default(),
            }
        } else {
            (String::new(), String::new(), String::new(), String::new(), String::new(), None, None, None)
        };

    let fallback_title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Sin título")
        .to_string();
    let title = if tag_title.is_empty() { fallback_title } else { tag_title };
    let artist = if tag_artist.is_empty() {
        "Artista desconocido".to_string()
    } else {
        tag_artist
    };
    let album = if tag_album.is_empty() { "Sin álbum".to_string() } else { tag_album };
    let album_artist = if tag_album_artist.is_empty() {
        artist.clone()
    } else {
        tag_album_artist
    };

    let properties = tagged.as_ref().map(|file| file.properties());
    let duration = properties
        .map(|p| p.duration().as_secs_f64())
        .unwrap_or(0.0);
    let sample_rate = properties.and_then(|p| p.sample_rate()).unwrap_or(0);
    let bit_depth = properties.and_then(|p| p.bit_depth()).unwrap_or(0) as u32;
    let format = properties
        .and_then(|p| p.audio_bitrate())
        .map(|bitrate| format!("{} · {} kbps", paths::format_label(path), bitrate / 1000))
        .unwrap_or_else(|| paths::format_label(path));

    let cover = cover_for(paths, path, tagged.as_ref(), cover_store);
    let path_string = path.to_string_lossy().to_string();
    let id = paths::stable_id("track", &path_string);
    let album_artist_key = fold(&album_artist);
    let album_id = paths::stable_id("album", &format!("{album_artist_key}\u{1f}{}", fold(&album)));
    let artist_id = paths::stable_id("artist", &fold(&artist));
    let added_at = fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|m| m.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or_else(|| {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(0)
        });

    let (cover_url, accent, accent2) = cover
        .map(|c| (c.url, c.accent, c.accent2))
        .unwrap_or_else(|| {
            (
                String::new(),
                "#ffa094".to_string(),
                "#80e5d2".to_string(),
            )
        });

    Some(Track {
        id,
        title,
        artist,
        album,
        album_artist,
        year: tag_year,
        genre: tag_genre,
        duration,
        path: path_string,
        cover: cover_url,
        accent,
        accent2,
        track_number: tag_track,
        disc_number: tag_disc,
        format,
        sample_rate,
        bit_depth,
        album_id,
        artist_id,
        added_at,
        source: "local".into(),
        uri: String::new(),
    })
}

fn cover_for(
    paths: &Paths,
    audio_path: &Path,
    tagged: Option<&lofty::file::TaggedFile>,
    cache: &mut HashMap<PathBuf, Option<CoverInfo>>,
) -> Option<CoverInfo> {
    if let Some(tagged) = tagged {
        if let Some(tag) = tagged.primary_tag().or_else(|| tagged.first_tag()) {
            if let Some(picture) = tag.pictures().first() {
                if let Some(info) = store_image(paths, picture.data()) {
                    return Some(info);
                }
            }
        }
    }

    let folder = audio_path.parent()?;
    if let Some(cached) = cache.get(folder) {
        return cached.clone();
    }

    let mut result = None;
    let names = [
        "cover", "folder", "front", "album", "artwork", "portada", "caratula", "carátula",
    ];
    let extensions = ["jpg", "jpeg", "png", "webp", "avif"];
    'outer: for name in names {
        for ext in extensions {
            let candidate = folder.join(format!("{name}.{ext}"));
            if candidate.is_file() {
                if let Ok(bytes) = fs::read(&candidate) {
                    if let Some(info) = store_image(paths, &bytes) {
                        result = Some(info);
                        break 'outer;
                    }
                }
            }
        }
    }
    cache.insert(folder.to_path_buf(), result.clone());
    result
}

fn store_image(paths: &Paths, bytes: &[u8]) -> Option<CoverInfo> {
    if bytes.len() < 32 {
        return None;
    }
    let image = image::load_from_memory(bytes).ok()?;
    let (accent, accent2) = palette::cover_colors(&image);
    let hash = paths::stable_hash(&format!("{}:{}", bytes.len(), {
        // Un hash barato del contenido evita reescribir la misma carátula.
        let step = (bytes.len() / 4096).max(1);
        let mut h = 0u64;
        let mut i = 0;
        while i < bytes.len() {
            h = h.wrapping_mul(31).wrapping_add(u64::from(bytes[i]));
            i += step;
        }
        h
    }));
    let name = format!("cover-{hash:016x}.jpg");
    let target = paths.covers.join(&name);
    if !target.is_file() {
        let max = 900u32;
        let resized = if image.width() > max || image.height() > max {
            image.resize(max, max, image::imageops::FilterType::Lanczos3)
        } else {
            image
        };
        let rgb = resized.to_rgb8();
        let _ = rgb.save_with_format(&target, image::ImageFormat::Jpeg);
    }
    Some(CoverInfo {
        url: paths.cover_url(&name),
        accent,
        accent2,
    })
}

fn fold(value: &str) -> String {
    value
        .trim()
        .to_lowercase()
        .replace('á', "a")
        .replace('é', "e")
        .replace('í', "i")
        .replace('ó', "o")
        .replace('ú', "u")
        .replace('ü', "u")
        .replace('ñ', "n")
}
