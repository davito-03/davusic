// Importación de playlists desde ZIP, CSV, JSON, M3U, Spotify y YouTube Music.
use std::collections::{HashMap, HashSet};
use std::fs;
use std::io::{Read, Write};
use std::path::Path;
use std::process::Command;

use serde::Deserialize;
use serde_json::Value;

use crate::models::{ImportBundle, ImportedPlaylist, ImportedTrack};
use crate::paths;

/// Formato mínimo que comparte la interfaz con el exportador. Exportify usa
/// estos mismos nombres de columna, así que el CSV resultante se puede volver
/// a abrir aquí o en cualquier hoja de cálculo.
#[derive(Clone, Debug, Deserialize, Default)]
pub struct ExportPlaylist {
    pub name: String,
    #[serde(default)]
    pub tracks: Vec<ExportTrack>,
}

#[derive(Clone, Debug, Deserialize, Default)]
pub struct ExportTrack {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub artist: String,
    #[serde(default)]
    pub album: String,
    #[serde(default)]
    pub duration: f64,
    #[serde(default)]
    pub uri: String,
}

const EXPORT_HEADER: [&str; 6] = [
    "Track Name",
    "Artist Name(s)",
    "Album Name",
    "Duration (ms)",
    "Track URI",
    "Playlist Name",
];

fn exportify_csv_bytes(playlist: &ExportPlaylist) -> Result<Vec<u8>, String> {
    let mut writer = csv::WriterBuilder::new().from_writer(Vec::new());
    writer
        .write_record(EXPORT_HEADER)
        .map_err(|error| format!("No se pudo preparar el CSV: {error}"))?;
    for track in &playlist.tracks {
        let title = track.title.trim();
        if title.is_empty() {
            continue;
        }
        let duration_ms = (track.duration.max(0.0) * 1000.0).round() as i64;
        writer
            .write_record([
                title,
                track.artist.trim(),
                track.album.trim(),
                &duration_ms.to_string(),
                track.uri.trim(),
                playlist.name.trim(),
            ])
            .map_err(|error| format!("No se pudo escribir el CSV: {error}"))?;
    }
    writer
        .into_inner()
        .map_err(|error| format!("No se pudo cerrar el CSV: {error}"))
}

fn safe_export_name(name: &str, index: usize) -> String {
    let mut out = String::new();
    for ch in name.trim().chars().take(90) {
        if ch.is_control() || matches!(ch, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') {
            out.push('-');
        } else {
            out.push(ch);
        }
    }
    let out = out.trim_matches(|ch: char| ch.is_whitespace() || ch == '.');
    if out.is_empty() {
        format!("Playlist {}", index + 1)
    } else {
        out.to_string()
    }
}

fn write_exportify_zip(path: &Path, playlists: &[ExportPlaylist]) -> Result<(), String> {
    let file = fs::File::create(path)
        .map_err(|error| format!("No se pudo crear el ZIP de exportación: {error}"))?;
    let mut archive = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);
    let mut used = HashSet::new();
    for (index, playlist) in playlists.iter().enumerate() {
        let base = safe_export_name(&playlist.name, index);
        let mut filename = format!("{base}.csv");
        let mut counter = 2;
        while !used.insert(filename.to_lowercase()) {
            filename = format!("{base} {counter}.csv");
            counter += 1;
        }
        let bytes = exportify_csv_bytes(playlist)?;
        archive
            .start_file(filename, options)
            .map_err(|error| format!("No se pudo añadir el CSV al ZIP: {error}"))?;
        archive
            .write_all(&bytes)
            .map_err(|error| format!("No se pudo escribir el ZIP: {error}"))?;
    }
    archive
        .finish()
        .map(|_| ())
        .map_err(|error| format!("No se pudo cerrar el ZIP: {error}"))
}

fn write_exportify_csv(path: &Path, playlist: &ExportPlaylist) -> Result<(), String> {
    let bytes = exportify_csv_bytes(playlist)?;
    fs::write(path, bytes).map_err(|error| format!("No se pudo guardar el CSV: {error}"))
}

pub fn save_exportify_zip(path: &Path, playlists: &[ExportPlaylist]) -> Result<(), String> {
    if playlists.is_empty() {
        return Err("No hay playlists para exportar.".into());
    }
    write_exportify_zip(path, playlists)
}

pub fn save_exportify_csv(path: &Path, playlist: &ExportPlaylist) -> Result<(), String> {
    if playlist.tracks.is_empty() {
        return Err("La playlist no tiene canciones para exportar.".into());
    }
    write_exportify_csv(path, playlist)
}


pub fn parse_file(path: &Path) -> Result<ImportBundle, String> {
    if !path.is_file() {
        return Err(format!("No existe el archivo: {}", path.display()));
    }
    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    let name = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Playlist importada")
        .to_string();
    let mut bundle = if extension == "zip" {
        parse_zip(path)?
    } else {
        let bytes = fs::read(path).map_err(|error| format!("No se pudo leer el archivo: {error}"))?;
        let content = String::from_utf8_lossy(&bytes);
        let playlists = match extension.as_str() {
            "json" => parse_json(&content, &name, &name),
            "csv" => parse_csv(&content, &name, &name),
            _ => parse_text(&content, &name),
        };
        ImportBundle {
            playlists,
            warnings: Vec::new(),
            origin: path.to_string_lossy().to_string(),
        }
    };
    bundle.origin = path.to_string_lossy().to_string();
    finish(bundle)
}

fn parse_zip(path: &Path) -> Result<ImportBundle, String> {
    let file = fs::File::open(path).map_err(|error| format!("No se pudo abrir el ZIP: {error}"))?;
    let mut archive =
        zip::ZipArchive::new(file).map_err(|error| format!("ZIP no válido: {error}"))?;
    let mut bundle = ImportBundle {
        origin: path.to_string_lossy().to_string(),
        ..Default::default()
    };
    for index in 0..archive.len() {
        let entry = match archive.by_index(index) {
            Ok(entry) => entry,
            Err(_) => continue,
        };
        if entry.is_dir() {
            continue;
        }
        let entry_name = entry.name().to_string();
        if entry_name.contains("__MACOSX") || entry_name.starts_with('.') {
            continue;
        }
        let ext = Path::new(&entry_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if !matches!(ext.as_str(), "csv" | "json" | "txt" | "m3u" | "m3u8" | "tsv") {
            continue;
        }
        if entry.size() > 64 * 1024 * 1024 {
            bundle
                .warnings
                .push(format!("Se omitió {entry_name}: es demasiado grande."));
            continue;
        }
        let mut bytes = Vec::with_capacity(entry.size() as usize);
        if entry.take(64 * 1024 * 1024).read_to_end(&mut bytes).is_err() {
            continue;
        }
        let content = String::from_utf8_lossy(&bytes);
        let default_name = Path::new(&entry_name)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Playlist")
            .replace('_', " ");
        let mut parsed = match ext.as_str() {
            "json" => parse_json(&content, &default_name, &entry_name),
            "csv" | "tsv" => parse_csv(&content, &default_name, &entry_name),
            _ => parse_text(&content, &default_name),
        };
        if parsed.is_empty() {
            continue;
        }
        for playlist in &mut parsed {
            if playlist.source == "import" {
                playlist.source = detect_source(&content, &entry_name);
            }
        }
        bundle.playlists.append(&mut parsed);
    }
    if bundle.playlists.is_empty() {
        return Err(
            "El ZIP no contiene playlists reconocibles. Busca archivos CSV, JSON o M3U de Exportify, Spotify o YouTube Music."
                .into(),
        );
    }
    Ok(bundle)
}

pub(crate) fn finish(mut bundle: ImportBundle) -> Result<ImportBundle, String> {
    let mut seen_playlists: HashSet<String> = HashSet::new();
    let mut out: Vec<ImportedPlaylist> = Vec::new();
    for mut playlist in bundle.playlists.drain(..) {
        let mut seen_tracks: HashSet<String> = HashSet::new();
        let mut tracks: Vec<ImportedTrack> = Vec::new();
        for mut track in playlist.tracks.drain(..) {
            track.title = track.title.trim().chars().take(240).collect();
            track.artist = track.artist.trim().chars().take(200).collect();
            track.album = track.album.trim().chars().take(200).collect();
            track.uri = crate::youtube::canonical_watch_url(&track.uri)
                .unwrap_or_else(|| track.uri.trim().to_string());
            if track.title.is_empty() {
                if let Some(id) = crate::youtube::video_id(&track.uri) {
                    track.title = format!("Vídeo {id}");
                } else {
                    continue;
                }
            }
            let key = format!(
                "{}|{}",
                track.title.to_lowercase(),
                track.artist.to_lowercase()
            );
            if !seen_tracks.insert(key) {
                continue;
            }
            track.id = format!(
                "import-{:016x}",
                paths::stable_hash(&format!(
                    "{}|{}|{}|{}",
                    playlist.name, track.title, track.artist, track.uri
                ))
            );
            tracks.push(track);
        }
        if tracks.is_empty() {
            continue;
        }
        playlist.name = playlist.name.trim().chars().take(80).collect();
        if playlist.name.is_empty() {
            playlist.name = "Playlist importada".into();
        }
        let mut unique_name = playlist.name.clone();
        let mut counter = 2;
        while !seen_playlists.insert(unique_name.to_lowercase()) {
            unique_name = format!("{} · {}", playlist.name, counter);
            counter += 1;
        }
        playlist.name = unique_name;
        playlist.id = format!(
            "imported-{:016x}",
            paths::stable_hash(&format!("{}|{}", playlist.source, playlist.name))
        );
        playlist.tracks = tracks;
        out.push(playlist);
    }
    if out.is_empty() {
        return Err("La importación no contenía canciones con título.".into());
    }
    bundle.playlists = out;
    Ok(bundle)
}

fn detect_source(content: &str, filename: &str) -> String {
    let sample: String = content.chars().take(4000).collect();
    let lower = format!("{} {}", filename.to_lowercase(), sample.to_lowercase());
    if lower.contains("track uri") || lower.contains("spotify") || lower.contains("open.spotify") {
        "spotify".into()
    } else if lower.contains("youtube") || lower.contains("video id") || lower.contains("music.youtube") {
        "youtube".into()
    } else {
        "import".into()
    }
}

fn fold_header(value: &str) -> String {
    let value = value.trim_start_matches('\u{feff}');
    let mut out = String::new();
    let mut last_space = false;
    for ch in value.chars() {
        let folded = match ch {
            'á' | 'à' | 'ä' | 'â' => 'a',
            'é' | 'è' | 'ë' | 'ê' => 'e',
            'í' | 'ì' | 'ï' | 'î' => 'i',
            'ó' | 'ò' | 'ö' | 'ô' => 'o',
            'ú' | 'ù' | 'ü' | 'û' => 'u',
            'ñ' => 'n',
            'ç' => 'c',
            other => other,
        };
        if folded.is_ascii_alphanumeric() {
            out.push(folded.to_ascii_lowercase());
            last_space = false;
        } else if folded.is_whitespace() && !last_space {
            out.push(' ');
            last_space = true;
        }
    }
    out.trim().to_string()
}

fn find_column(headers: &[String], aliases: &[&str]) -> Option<usize> {
    find_column_excluding(headers, aliases, &[])
}

fn find_column_excluding(
    headers: &[String],
    aliases: &[&str],
    skip: &[Option<usize>],
) -> Option<usize> {
    let normalized: Vec<String> = headers.iter().map(|h| fold_header(h)).collect();
    let blocked: Vec<usize> = skip.iter().copied().flatten().collect();
    let allowed = |index: usize| !blocked.contains(&index);
    for alias in aliases {
        if let Some(index) = normalized.iter().position(|h| h == *alias) {
            if allowed(index) {
                return Some(index);
            }
        }
    }
    for alias in aliases {
        if alias.len() < 5 {
            continue;
        }
        if let Some(index) = normalized.iter().position(|h| h.contains(alias)) {
            if allowed(index) {
                return Some(index);
            }
        }
    }
    None
}

fn parse_csv(content: &str, default_name: &str, filename: &str) -> Vec<ImportedPlaylist> {
    let clean = content.trim_start_matches('\u{feff}');
    let delimiter = if clean.lines().next().unwrap_or("").matches('\t').count()
        > clean.lines().next().unwrap_or("").matches(',').count()
    {
        b'\t'
    } else {
        b','
    };
    let mut reader = csv::ReaderBuilder::new()
        .flexible(true)
        .has_headers(false)
        .delimiter(delimiter)
        .from_reader(clean.as_bytes());
    let records: Vec<Vec<String>> = reader
        .records()
        .filter_map(Result::ok)
        .map(|record| record.iter().map(|s| s.trim().to_string()).collect())
        .filter(|fields: &Vec<String>| fields.iter().any(|f| !f.is_empty()))
        .collect();
    if records.is_empty() {
        return Vec::new();
    }

    let title_aliases = [
        "track name", "song title", "video title", "title", "titulo", "nombre de la cancion",
        "track", "song", "cancion", "name", "titre",
    ];
    let artist_aliases = [
        "artist name(s)", "artist name", "artist names", "artists", "artist", "artista",
        "artistas", "artist(s)", "artista(s)", "artists names", "album artist",
        "channel", "channel name", "uploader",
    ];
    let album_aliases = ["album name", "album", "album title", "album names"];
    let duration_aliases = [
        "duration (ms)", "duration ms", "duration_ms", "duration", "duracion",
        "duration (seconds)", "length", "time",
    ];
    let playlist_aliases = [
        "playlist name", "playlist", "lista de reproduccion", "nombre de la lista de reproduccion",
        "playlist title", "nombre de la lista", "playlist names",
    ];
    let uri_aliases = [
        "track uri", "spotify track uri", "uri", "url", "video id", "video_id", "videoid",
        "id", "song uri",
    ];

    let first = &records[0];
    let playlist_idx = find_column(first, &playlist_aliases);
    let uri_idx = find_column(first, &uri_aliases);
    let title_idx = find_column_excluding(first, &title_aliases, &[playlist_idx, uri_idx]);
    let artist_idx = find_column_excluding(first, &artist_aliases, &[playlist_idx, title_idx]);
    let album_idx = find_column_excluding(first, &album_aliases, &[playlist_idx, title_idx]);
    let duration_idx = find_column(first, &duration_aliases);
    let has_header = title_idx.is_some() || (artist_idx.is_some() && album_idx.is_some()) || uri_idx.is_some();
    let title_idx = title_idx.or(if has_header { None } else { Some(0) });
    let ms_header = first
        .get(duration_idx.unwrap_or(usize::MAX))
        .map(|h| fold_header(h).contains("ms"))
        .unwrap_or(false);
    let data_start = if has_header { 1 } else { 0 };

    let source = detect_source(content, filename);
    let mut groups: Vec<(String, Vec<ImportedTrack>)> = Vec::new();
    let mut group_index: HashMap<String, usize> = HashMap::new();
    for fields in records.iter().skip(data_start) {
        let mut title = title_idx
            .and_then(|idx| fields.get(idx))
            .cloned()
            .unwrap_or_default();
        if fold_header(&title) == "track name" || fold_header(&title) == "title" {
            continue;
        }
        let artist = artist_idx
            .and_then(|idx| fields.get(idx))
            .cloned()
            .unwrap_or_default()
            .replace("; ", ", ");
        let album = album_idx
            .and_then(|idx| fields.get(idx))
            .cloned()
            .unwrap_or_default();
        let duration = duration_idx
            .and_then(|idx| fields.get(idx))
            .and_then(|value| parse_duration(value, ms_header))
            .unwrap_or(0.0);
        let mut uri = uri_idx
            .and_then(|idx| fields.get(idx))
            .cloned()
            .unwrap_or_default();
        if let Some(url) = crate::youtube::canonical_watch_url(&uri) {
            uri = url;
        }
        if title.is_empty() {
            if let Some(id) = crate::youtube::video_id(&uri) {
                title = format!("Vídeo {id}");
            } else {
                continue;
            }
        }
        let group_name = playlist_idx
            .and_then(|idx| fields.get(idx))
            .filter(|name| !name.trim().is_empty())
            .cloned()
            .unwrap_or_else(|| default_name.to_string());
        let track = ImportedTrack {
            id: String::new(),
            title,
            artist,
            album,
            duration,
            uri,
        };
        match group_index.get(&group_name) {
            Some(index) => groups[*index].1.push(track),
            None => {
                group_index.insert(group_name.clone(), groups.len());
                groups.push((group_name, vec![track]));
            }
        }
    }

    groups
        .into_iter()
        .map(|(name, tracks)| ImportedPlaylist {
            id: String::new(),
            name,
            description: String::new(),
            source: source.clone(),
            tracks,
        })
        .filter(|playlist| !playlist.tracks.is_empty())
        .collect()
}

fn parse_duration(value: &str, ms_header: bool) -> Option<f64> {
    let raw = value
        .trim()
        .trim_end_matches(" ms")
        .trim_end_matches("ms")
        .trim();
    if raw.is_empty() {
        return None;
    }
    if raw.contains(':') {
        let mut total = 0.0;
        for (index, part) in raw.split(':').rev().enumerate() {
            let number: f64 = part.trim().parse().ok()?;
            total += number * 60f64.powi(index as i32);
        }
        return Some(total);
    }
    let number: f64 = raw.replace(',', ".").parse().ok()?;
    if ms_header || number > 10_000.0 {
        Some(number / 1000.0)
    } else {
        Some(number)
    }
}

fn parse_text(content: &str, default_name: &str) -> Vec<ImportedPlaylist> {
    let mut groups: Vec<(String, Vec<ImportedTrack>)> = Vec::new();
    let mut group_index: HashMap<String, usize> = HashMap::new();
    let mut current_name = default_name.to_string();
    let mut pending_duration = 0.0;
    let mut pending_title: Option<String> = None;

    let push = |groups: &mut Vec<(String, Vec<ImportedTrack>)>,
                group_index: &mut HashMap<String, usize>,
                name: &str,
                track: ImportedTrack| {
        match group_index.get(name) {
            Some(index) => groups[*index].1.push(track),
            None => {
                group_index.insert(name.to_string(), groups.len());
                groups.push((name.to_string(), vec![track]));
            }
        }
    };

    for raw_line in content.lines() {
        let line = raw_line.trim().trim_start_matches('\u{feff}');
        if line.is_empty() {
            continue;
        }
        let lower = line.to_lowercase();
        if lower.starts_with("#extinf:") {
            let rest = line["#EXTINF:".len()..].to_string();
            let (duration_text, title) = rest.split_once(',').unwrap_or(("0", &rest));
            pending_duration = duration_text.trim().parse().unwrap_or(0.0);
            pending_title = Some(title.trim().to_string());
            continue;
        }
        if lower.starts_with("#extm3u") {
            continue;
        }
        if let Some(rest) = line.strip_prefix("## ") {
            current_name = rest.trim().to_string();
            continue;
        }
        if let Some(rest) = line.strip_prefix("# Playlist:") {
            current_name = rest.trim().to_string();
            continue;
        }
        if let Some(rest) = line.strip_prefix("#PL:") {
            current_name = rest.trim().to_string();
            continue;
        }
        if line.starts_with('#') || line.starts_with("//") {
            continue;
        }
        if line.starts_with("http://") || line.starts_with("https://") {
            // Una URL suelta suele ser la ruta de una pista M3U ya descrita por #EXTINF.
            if let Some(title) = pending_title.take() {
                let (artist, clean_title) = split_artist_title(&title);
                push(
                    &mut groups,
                    &mut group_index,
                    &current_name,
                    ImportedTrack {
                        id: String::new(),
                        title: clean_title,
                        artist,
                        duration: pending_duration,
                        uri: line.to_string(),
                        ..Default::default()
                    },
                );
                pending_duration = 0.0;
            }
            continue;
        }

        if let Some(title) = pending_title.take() {
            let (artist, clean_title) = split_artist_title(&title);
            push(
                &mut groups,
                &mut group_index,
                &current_name,
                ImportedTrack {
                    id: String::new(),
                    title: clean_title,
                    artist,
                    duration: pending_duration,
                    ..Default::default()
                },
            );
            pending_duration = 0.0;
            continue;
        }

        let cleaned = strip_track_number(line);
        let (title, artist, album) = split_imported_line(cleaned);
        if title.trim().is_empty() {
            pending_duration = 0.0;
            continue;
        }
        push(
            &mut groups,
            &mut group_index,
            &current_name,
            ImportedTrack {
                id: String::new(),
                title: title.trim().to_string(),
                artist: artist.trim().to_string(),
                album: album.trim().to_string(),
                duration: pending_duration.max(0.0),
                uri: String::new(),
            },
        );
        pending_duration = 0.0;
    }
    let source = detect_source(content, default_name);
    groups
        .into_iter()
        .map(|(name, tracks)| ImportedPlaylist {
            id: String::new(),
            name,
            description: String::new(),
            source: source.clone(),
            tracks,
        })
        .filter(|playlist| !playlist.tracks.is_empty())
        .collect()
}

fn strip_track_number(value: &str) -> &str {
    let trimmed = value.trim_start();
    let mut chars = trimmed.char_indices();
    let mut digits = 0usize;
    let mut end = 0usize;
    for (index, ch) in chars.by_ref() {
        if ch.is_ascii_digit() && digits < 4 {
            digits += 1;
            end = index + ch.len_utf8();
        } else {
            break;
        }
    }
    if digits == 0 {
        return trimmed;
    }
    let rest = trimmed[end..].trim_start();
    if let Some(after) = rest.strip_prefix('.').or_else(|| rest.strip_prefix(')')) {
        if after.chars().next().is_some_and(char::is_whitespace) {
            return after.trim_start();
        }
    }
    trimmed
}

/// Acepta las formas que sugiere el importador:
/// «Artista - Título», «Título · Artista» y columnas separadas por tabulaciones.
fn split_imported_line(value: &str) -> (String, String, String) {
    let line = value.trim();
    for separator in [" · ", " • ", " | "] {
        if let Some((left, right)) = line.split_once(separator) {
            return (left.trim().to_string(), right.trim().to_string(), String::new());
        }
    }
    for separator in [" – ", " — ", " - "] {
        if let Some((left, right)) = line.split_once(separator) {
            return (right.trim().to_string(), left.trim().to_string(), String::new());
        }
    }
    if line.contains('\t') {
        let parts: Vec<&str> = line
            .split('\t')
            .map(str::trim)
            .filter(|part| !part.is_empty())
            .collect();
        if parts.len() >= 2 {
            return (
                parts[0].to_string(),
                parts[1].to_string(),
                parts.get(2).copied().unwrap_or_default().to_string(),
            );
        }
    }
    (line.to_string(), String::new(), String::new())
}

fn split_artist_title(value: &str) -> (String, String) {
    if let Some((artist, title)) = value.split_once(" - ") {
        (artist.trim().to_string(), title.trim().to_string())
    } else {
        (String::new(), value.trim().to_string())
    }
}

fn parse_json(content: &str, default_name: &str, filename: &str) -> Vec<ImportedPlaylist> {
    let Ok(value) = serde_json::from_str::<Value>(content) else {
        return parse_text(content, default_name);
    };
    let mut playlists = Vec::new();
    collect_json_playlists(&value, default_name, &mut playlists);
    if playlists.is_empty() {
        if let Some(tracks) = json_track_list(&value) {
            playlists.push(ImportedPlaylist {
                id: String::new(),
                name: default_name.to_string(),
                description: String::new(),
                source: detect_source(content, filename),
                tracks,
            });
        }
    }
    playlists
}

fn collect_json_playlists(value: &Value, default_name: &str, out: &mut Vec<ImportedPlaylist>) {
    match value {
        Value::Array(items) => {
            if items.iter().any(|item| playlist_object_name(item).is_some()) {
                for item in items {
                    if let Some(playlist) = parse_json_playlist(item, default_name) {
                        out.push(playlist);
                    }
                }
            } else if let Some(tracks) = json_track_list(value) {
                if !tracks.is_empty() {
                    out.push(ImportedPlaylist {
                        id: String::new(),
                        name: default_name.to_string(),
                        description: String::new(),
                        source: "import".into(),
                        tracks,
                    });
                }
            }
        }
        Value::Object(map) => {
            for key in ["playlists", "Playlists", "playlist"] {
                if let Some(child) = map.get(key) {
                    collect_json_playlists(child, default_name, out);
                }
            }
            if out.is_empty() {
                if let Some(playlist) = parse_json_playlist(value, default_name) {
                    out.push(playlist);
                } else if let Some(tracks) = json_track_list(value) {
                    if !tracks.is_empty() {
                        out.push(ImportedPlaylist {
                            id: String::new(),
                            name: default_name.to_string(),
                            description: String::new(),
                            source: "import".into(),
                            tracks,
                        });
                    }
                }
            }
        }
        _ => {}
    }
}

fn playlist_object_name(value: &Value) -> Option<String> {
    let object = value.as_object()?;
    if object.contains_key("tracks") || object.contains_key("items") || object.contains_key("songs")
    {
        for key in ["name", "title", "playlistName", "playlist_name"] {
            if let Some(name) = object.get(key).and_then(Value::as_str) {
                return Some(name.to_string());
            }
        }
    }
    None
}

fn parse_json_playlist(value: &Value, default_name: &str) -> Option<ImportedPlaylist> {
    let object = value.as_object()?;
    let tracks_value = ["tracks", "items", "songs"]
        .iter()
        .find_map(|key| object.get(*key))?;
    let name = ["name", "title", "playlistName", "playlist_name"]
        .iter()
        .find_map(|key| object.get(*key).and_then(Value::as_str))
        .unwrap_or(default_name)
        .to_string();
    let description = ["description", "desc", "subtitle"]
        .iter()
        .find_map(|key| object.get(*key).and_then(Value::as_str))
        .unwrap_or("")
        .to_string();
    let tracks = json_track_list(tracks_value)?;
    if tracks.is_empty() {
        return None;
    }
    Some(ImportedPlaylist {
        id: String::new(),
        name,
        description,
        source: "import".into(),
        tracks,
    })
}

fn json_track_list(value: &Value) -> Option<Vec<ImportedTrack>> {
    let items = value.as_array()?;
    let mut tracks = Vec::new();
    for item in items {
        let object = item.get("track").unwrap_or(item);
        if object.is_null() {
            continue;
        }
        let title = json_string(
            object,
            &["trackName", "track_name", "title", "name", "songTitle", "song", "label"],
        );
        let Some(title) = title else {
            continue;
        };
        if title.trim().is_empty() {
            continue;
        }
        let artist = json_artist(object);
        let album = json_string(
            object,
            &["albumName", "album_name", "album", "albumTitle", "release_name"],
        )
        .unwrap_or_default();
        let duration_raw = json_number(
            object,
            &[
                "duration_ms",
                "durationMs",
                "duration",
                "length",
                "lengthMs",
                "trackDuration",
            ],
        )
        .unwrap_or(0.0);
        let duration = if duration_raw > 10_000.0 {
            duration_raw / 1000.0
        } else {
            duration_raw
        };
        let uri = json_string(
            object,
            &[
                "trackUri",
                "track_uri",
                "uri",
                "url",
                "webpage_url",
                "videoId",
                "id",
            ],
        )
        .unwrap_or_default();
        tracks.push(ImportedTrack {
            id: String::new(),
            title,
            artist,
            album,
            duration,
            uri,
        });
    }
    Some(tracks)
}

fn json_string(value: &Value, keys: &[&str]) -> Option<String> {
    let object = value.as_object()?;
    for key in keys {
        if let Some(text) = object.get(*key).and_then(Value::as_str) {
            if !text.trim().is_empty() {
                return Some(text.trim().to_string());
            }
        }
        if let Some(number) = object.get(*key).and_then(Value::as_f64) {
            return Some(number.to_string());
        }
    }
    None
}

fn json_number(value: &Value, keys: &[&str]) -> Option<f64> {
    let object = value.as_object()?;
    for key in keys {
        if let Some(number) = object.get(*key).and_then(Value::as_f64) {
            return Some(number);
        }
        if let Some(text) = object.get(*key).and_then(Value::as_str) {
            if let Some(number) = parse_duration(text, false) {
                return Some(number);
            }
        }
    }
    None
}

fn json_artist(value: &Value) -> String {
    let object = match value.as_object() {
        Some(object) => object,
        None => return String::new(),
    };
    for key in ["artistName", "artist_name", "artist", "artists", "subtitle", "albumArtist"] {
        let Some(artist) = object.get(key) else {
            continue;
        };
        if let Some(text) = artist.as_str() {
            if !text.trim().is_empty() {
                return text.trim().to_string();
            }
        }
        if let Some(array) = artist.as_array() {
            let names: Vec<String> = array
                .iter()
                .filter_map(|item| {
                    item.as_str()
                        .map(str::to_string)
                        .or_else(|| item.get("name").and_then(Value::as_str).map(str::to_string))
                })
                .filter(|name| !name.trim().is_empty())
                .collect();
            if !names.is_empty() {
                return names.join(", ");
            }
        }
    }
    String::new()
}

// ---------- Spotify (enlace público) ----------

pub fn spotify_from_url(url: &str) -> Result<ImportBundle, String> {
    let id = extract_spotify_playlist_id(url)
        .ok_or_else(|| "No reconozco ese enlace de playlist de Spotify.".to_string())?;
    let embed = format!("https://open.spotify.com/embed/playlist/{id}");
    let output = Command::new("curl")
        .args([
            "-sL",
            "--max-time",
            "30",
            "-A",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
            &embed,
        ])
        .output()
        .map_err(|error| format!("No se pudo consultar Spotify: {error}"))?;
    if !output.status.success() {
        return Err("Spotify no respondió. Comprueba el enlace o usa un ZIP de Exportify.".into());
    }
    let html = String::from_utf8_lossy(&output.stdout);
    if html.len() < 1000 {
        return Err("Spotify devolvió una página vacía. Prueba con un ZIP exportado.".into());
    }
    let marker = "id=\"__NEXT_DATA__\" type=\"application/json\">";
    let start = html
        .find(marker)
        .map(|index| index + marker.len())
        .ok_or_else(|| "Spotify no devolvió datos legibles para esta playlist.".to_string())?;
    let end = html[start..]
        .find("</script>")
        .map(|index| start + index)
        .ok_or_else(|| "La respuesta de Spotify está incompleta.".to_string())?;
    let data: Value = serde_json::from_str(&html[start..end])
        .map_err(|_| "No se pudo interpretar la playlist pública de Spotify.".to_string())?;

    let entity = find_key(&data, "entity").unwrap_or(&data);
    let name = ["name", "title"]
        .iter()
        .find_map(|key| entity.get(*key).and_then(Value::as_str))
        .unwrap_or("Playlist de Spotify")
        .to_string();
    let track_list = find_key(entity, "trackList")
        .and_then(Value::as_array)
        .ok_or_else(|| {
            "Spotify no muestra las pistas de esta playlist. Exporta el ZIP con Exportify."
                .to_string()
        })?;
    let mut tracks = Vec::new();
    for item in track_list {
        let title = item
            .get("title")
            .and_then(Value::as_str)
            .unwrap_or("")
            .trim()
            .to_string();
        if title.is_empty() {
            continue;
        }
        let artist = item
            .get("subtitle")
            .and_then(Value::as_str)
            .unwrap_or("")
            .trim()
            .to_string();
        let duration_ms = item
            .get("duration")
            .and_then(Value::as_f64)
            .unwrap_or(0.0);
        let uri = item
            .get("uri")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        tracks.push(ImportedTrack {
            id: String::new(),
            title,
            artist,
            album: String::new(),
            duration: duration_ms / 1000.0,
            uri,
        });
    }
    if tracks.is_empty() {
        return Err(
            "Spotify no ofrece las pistas de esta playlist sin iniciar sesión. Usa Exportify o el ZIP de tus datos."
                .into(),
        );
    }
    let visible = tracks.len();
    let bundle = ImportBundle {
        playlists: vec![ImportedPlaylist {
            id: String::new(),
            name,
            description: "Importada desde un enlace público de Spotify.".into(),
            source: "spotify".into(),
            tracks,
        }],
        warnings: vec![format!(
            "Spotify muestra {visible} pistas en su reproductor público. Para una playlist completa, importa su ZIP de Exportify."
        )],
        origin: embed,
    };
    finish(bundle)
}

pub(crate) fn extract_spotify_playlist_id(url: &str) -> Option<String> {
    if let Some(rest) = url.trim().strip_prefix("spotify:playlist:") {
        let id: String = rest
            .chars()
            .take_while(|ch| ch.is_ascii_alphanumeric())
            .collect();
        if id.len() >= 10 {
            return Some(id);
        }
    }
    let marker = "/playlist/";
    let index = url.find(marker)? + marker.len();
    let id: String = url[index..]
        .chars()
        .take_while(|ch| ch.is_ascii_alphanumeric())
        .collect();
    if id.len() >= 10 {
        Some(id)
    } else {
        None
    }
}

fn find_key<'a>(value: &'a Value, key: &str) -> Option<&'a Value> {
    if let Some(found) = value.get(key) {
        return Some(found);
    }
    match value {
        Value::Object(map) => map.values().find_map(|child| find_key(child, key)),
        Value::Array(items) => items.iter().find_map(|child| find_key(child, key)),
        _ => None,
    }
}

/// Importa una playlist de YouTube / YouTube Music sin descargar nada todavía.
pub fn youtube_from_url(url: &str) -> Result<ImportBundle, String> {
    let (name, tracks) = crate::youtube::fetch_flat_playlist(url)?;
    let bundle = ImportBundle {
        playlists: vec![ImportedPlaylist {
            id: String::new(),
            name,
            description: "Importada desde YouTube Music. Las coincidencias ya son directas.".into(),
            source: "youtube".into(),
            tracks,
        }],
        warnings: vec![
            "Las pistas de YouTube se descargan del vídeo original que indica la playlist.".into(),
        ],
        origin: url.to_string(),
    };
    finish(bundle)
}

pub fn parse_text_pasted(text: &str, name: &str) -> Result<ImportBundle, String> {
    let bundle = ImportBundle {
        playlists: parse_text(text, name),
        warnings: Vec::new(),
        origin: "Texto pegado".into(),
    };
    finish(bundle)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pasted_lists_accept_artist_title_and_title_dot_artist() {
        let bundle = parse_text_pasted(
            "Lúa - Bajamar\n1. Sal y miel · Lúa\n# comentario\n03) Vera Nox — Cromo\n",
            "Lista de prueba",
        )
        .expect("la lista debería ser válida");
        assert_eq!(bundle.playlists.len(), 1);
        let tracks = &bundle.playlists[0].tracks;
        assert_eq!(tracks.len(), 3);
        assert_eq!((tracks[0].artist.as_str(), tracks[0].title.as_str()), ("Lúa", "Bajamar"));
        assert_eq!((tracks[1].artist.as_str(), tracks[1].title.as_str()), ("Lúa", "Sal y miel"));
        assert_eq!((tracks[2].artist.as_str(), tracks[2].title.as_str()), ("Vera Nox", "Cromo"));
    }

    #[test]
    fn m3u_extinf_uses_artist_first_and_keeps_duration() {
        let bundle = parse_text_pasted(
            "#EXTM3U\n#EXTINF:88,Lúa - Bajamar\nhttps://example.test/bajamar.mp3\n",
            "M3U",
        )
        .expect("el M3U debería ser válido");
        let track = &bundle.playlists[0].tracks[0];
        assert_eq!(track.title, "Bajamar");
        assert_eq!(track.artist, "Lúa");
        assert_eq!(track.duration, 88.0);
        assert_eq!(track.uri, "https://example.test/bajamar.mp3");
    }

    #[test]
    fn csv_groups_youtube_takeout_playlists() {
        let content = "Playlist Name,Track Name,Artist Name,Album Name,Track Duration (ms),Video ID\n\
Noche,Vía 88,Nocturno 88,Autopista,78000,dQw4w9WgXcQ\n\
Noche,Cromo,Vera Nox,Neón,64000,aaaaaaaaaaa\n\
Día,Bajamar,Lúa,Mareas,88000,bbbbbbbbbbb\n";
        let playlists = parse_csv(content, "Takeout", "playlist.csv");
        assert_eq!(playlists.len(), 2);
        let night = playlists.iter().find(|playlist| playlist.name == "Noche").unwrap();
        assert_eq!(night.tracks.len(), 2);
        assert_eq!(night.tracks[0].duration, 78.0);
        assert_eq!(night.source, "youtube");
        assert_eq!(
            night.tracks[0].uri,
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        );
    }

    #[test]
    fn takeout_video_id_without_title_still_imports() {
        let content = "Playlist Title,Video ID,Channel\n\
Noche,dQw4w9WgXcQ,Nocturno 88\n";
        let playlists = parse_csv(content, "Takeout", "watch-later.csv");
        assert_eq!(playlists.len(), 1);
        assert_eq!(playlists[0].name, "Noche");
        assert_eq!(playlists[0].tracks[0].artist, "Nocturno 88");
        assert!(playlists[0].tracks[0].uri.contains("dQw4w9WgXcQ"));
    }

    #[test]
    fn zip_bundles_multiple_exportify_files() {
        use std::io::Write;
        use zip::write::SimpleFileOptions;

        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let root = std::env::temp_dir().join(format!(
            "davusic-zip-test-{}-{stamp}",
            std::process::id()
        ));
        std::fs::create_dir_all(&root).unwrap();
        let path = root.join("exportify.zip");
        let file = std::fs::File::create(&path).unwrap();
        let mut zip = zip::ZipWriter::new(file);
        let options = SimpleFileOptions::default();
        zip.start_file("Exportify/Noche.csv", options).unwrap();
        zip.write_all(
            b"Track Name,Artist Name(s),Album Name,Track URI\n\
Via 88,Nocturno 88,Autopista,spotify:track:via\n\
Cromo,Vera Nox,Neon,spotify:track:cromo\n",
        )
        .unwrap();
        zip.start_file("Exportify/Dia.csv", options).unwrap();
        zip.write_all(
            b"Track Name,Artist Name(s),Album Name\n\
Bajamar,Lua,Mareas\n",
        )
        .unwrap();
        zip.finish().unwrap();

        let bundle = parse_file(&path).expect("el ZIP debería leerse");
        assert_eq!(bundle.playlists.len(), 2);
        let night = bundle
            .playlists
            .iter()
            .find(|playlist| playlist.name == "Noche")
            .unwrap();
        assert_eq!(night.tracks.len(), 2);
        assert_eq!(night.source, "spotify");
        assert_eq!(night.tracks[0].title, "Via 88");
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn exportify_csv_reads_spotify_fields() {
        let content = "Track Name,Artist Name(s),Album Name,Track URI\n\
Bajamar,Lúa,Mareas,spotify:track:abc\n\
Sal y miel,\"Lúa, Berta\",Mareas,spotify:track:def\n";
        let playlists = parse_csv(content, "Exportify", "Exportify.csv");
        assert_eq!(playlists.len(), 1);
        assert_eq!(playlists[0].tracks.len(), 2);
        assert_eq!(playlists[0].tracks[1].artist, "Lúa, Berta");
        assert_eq!(playlists[0].source, "spotify");
    }

    #[test]
    fn exported_exportify_zip_can_be_imported_again() {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let root = std::env::temp_dir().join(format!(
            "davusic-export-test-{}-{stamp}",
            std::process::id()
        ));
        std::fs::create_dir_all(&root).unwrap();
        let path = root.join("davusic-exportify.zip");
        let playlist = ExportPlaylist {
            name: "Noche".into(),
            tracks: vec![
                ExportTrack {
                    title: "Vía 88".into(),
                    artist: "Nocturno 88".into(),
                    album: "Autopista".into(),
                    duration: 78.0,
                    uri: "spotify:track:via".into(),
                },
                ExportTrack {
                    title: "Sal y miel".into(),
                    artist: "Lúa, Berta".into(),
                    album: "Mareas".into(),
                    duration: 64.5,
                    uri: "spotify:track:miel".into(),
                },
            ],
        };
        save_exportify_zip(&path, &[playlist]).expect("el ZIP debería escribirse");

        let bundle = parse_file(&path).expect("el ZIP debería importarse");
        assert_eq!(bundle.playlists.len(), 1);
        assert_eq!(bundle.playlists[0].name, "Noche");
        assert_eq!(bundle.playlists[0].tracks.len(), 2);
        assert_eq!(bundle.playlists[0].tracks[0].title, "Vía 88");
        assert_eq!(bundle.playlists[0].tracks[1].artist, "Lúa, Berta");
        assert_eq!(bundle.playlists[0].tracks[1].duration, 64.5);
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn exported_exportify_csv_can_be_imported_again() {
        let stamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        let root = std::env::temp_dir().join(format!(
            "davusic-csv-export-test-{}-{stamp}",
            std::process::id()
        ));
        std::fs::create_dir_all(&root).unwrap();
        let path = root.join("Noche.csv");
        let playlist = ExportPlaylist {
            name: "Noche".into(),
            tracks: vec![ExportTrack {
                title: "Via 88".into(),
                artist: "Nocturno 88".into(),
                album: "Autopista".into(),
                duration: 78.0,
                uri: "https://www.youtube.com/watch?v=dQw4w9WgXcQ".into(),
            }],
        };
        save_exportify_csv(&path, &playlist).expect("el CSV debería escribirse");

        let text = std::fs::read_to_string(&path).unwrap();
        assert!(text.starts_with("Track Name,Artist Name(s),Album Name"));
        assert!(text.contains("Noche"));
        assert!(text.contains("78000"));

        let bundle = parse_file(&path).expect("el CSV debería importarse");
        assert_eq!(bundle.playlists.len(), 1);
        assert_eq!(bundle.playlists[0].name, "Noche");
        assert_eq!(bundle.playlists[0].tracks[0].title, "Via 88");
        assert_eq!(bundle.playlists[0].tracks[0].duration, 78.0);
        let _ = std::fs::remove_dir_all(&root);
    }
}
