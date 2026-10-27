// Integración con yt-dlp: búsqueda de coincidencias, descarga y playlists de YouTube.
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde_json::Value;

use crate::models::{
    DownloadRequest, ImportedTrack, MatchCandidate, OnlineTrack, PlaybackRequest,
    YoutubeToolsStatus,
};
use crate::paths::{self, Paths};

pub fn download_dir(config: &crate::models::Config) -> PathBuf {
    if let Some(raw) = config.download_dir.as_ref() {
        let path = PathBuf::from(raw);
        if !path.as_os_str().is_empty() {
            return path;
        }
    }
    dirs::audio_dir()
        .or_else(|| dirs::home_dir().map(|home| home.join("Music")))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("Davusic")
}

fn executable_name(name: &str) -> String {
    if cfg!(target_os = "windows") {
        format!("{name}.exe")
    } else {
        name.to_string()
    }
}

pub fn find_tool(paths: &Paths, name: &str) -> Option<PathBuf> {
    if cfg!(target_os = "android") {
        return None;
    }
    let env_name = format!("DAVUSIC_{}", name.to_uppercase().replace('-', "_"));
    if let Ok(override_path) = std::env::var(env_name) {
        let path = PathBuf::from(override_path);
        if path.is_file() {
            return Some(path);
        }
    }
    let executable = executable_name(name);
    if name == "yt-dlp" {
        let bundled = paths.tools.join(&executable);
        if bundled.is_file() {
            return Some(bundled);
        }
        #[cfg(target_os = "linux")]
        if let Some(home) = dirs::home_dir() {
            let candidate = home.join(".local/bin/yt-dlp");
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    if let Some(tool) = which(&executable) {
        return Some(tool);
    }
    None
}

fn which(name: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path) {
        let candidate = dir.join(name);
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

fn which_executable(name: &str) -> Option<PathBuf> {
    which(&executable_name(name))
}

pub fn status(paths: &Paths, config: &crate::models::Config) -> YoutubeToolsStatus {
    let ytdlp = find_tool(paths, "yt-dlp");
    let ffmpeg = find_tool(paths, "ffmpeg");
    let can_install = !cfg!(target_os = "android")
        && (which_executable("curl").is_some() || which_executable("wget").is_some());
    let message = if cfg!(target_os = "android") {
        "En Android, esta versión funciona sin streaming externo. yt-dlp no se puede ejecutar como binario."
    } else if ytdlp.is_none() {
        "yt-dlp no está instalado. Puedes instalarlo desde aquí, sin permisos de administrador."
    } else if ffmpeg.is_none() {
        "yt-dlp está listo. ffmpeg es opcional; solo hace falta si quieres convertir descargas."
    } else {
        "Listo para buscar en línea y reproducir en streaming."
    }
    .to_string();
    YoutubeToolsStatus {
        ytdlp: ytdlp.is_some(),
        ytdlp_path: ytdlp
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        ffmpeg: ffmpeg.is_some(),
        ffmpeg_path: ffmpeg
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        download_dir: download_dir(config).to_string_lossy().to_string(),
        can_install,
        message,
    }
}

pub fn install_ytdlp(paths: &Paths) -> Result<String, String> {
    if cfg!(target_os = "android") {
        return Err(
            "En Android no se pueden ejecutar binarios externos como yt-dlp. Esta versión funciona sin streaming."
                .into(),
        );
    }
    fs::create_dir_all(&paths.tools)
        .map_err(|error| format!("No se pudo crear la carpeta de herramientas: {error}"))?;
    let target = paths.tools.join(executable_name("yt-dlp"));
    if target.is_file() {
        return Ok(target.to_string_lossy().to_string());
    }
    let tmp = paths.tools.join("yt-dlp.download");
    let url = if cfg!(target_os = "windows") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    } else {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
    };
    if which_executable("curl").is_some() {
        let output = Command::new("curl")
            .args([
                "-L",
                "--fail",
                "--connect-timeout",
                "20",
                "--max-time",
                "180",
                "--silent",
                "--show-error",
                "-o",
            ])
            .arg(&tmp)
            .arg(url)
            .output()
            .map_err(|error| format!("No se pudo ejecutar curl: {error}"))?;
        if !output.status.success() {
            let _ = fs::remove_file(&tmp);
            return Err(format!(
                "La descarga de yt-dlp falló: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            ));
        }
    } else if which_executable("wget").is_some() {
        let output = Command::new("wget")
            .args(["-q", "-O"])
            .arg(&tmp)
            .arg(url)
            .output()
            .map_err(|error| format!("No se pudo ejecutar wget: {error}"))?;
        if !output.status.success() {
            let _ = fs::remove_file(&tmp);
            return Err("La descarga de yt-dlp falló. Revisa tu conexión.".into());
        }
    } else {
        return Err("Necesitas curl o wget para instalar yt-dlp.".into());
    }

    let size = fs::metadata(&tmp).map(|m| m.len()).unwrap_or(0);
    if size < 1_000_000 {
        let _ = fs::remove_file(&tmp);
        return Err("El archivo descargado de yt-dlp no parece válido.".into());
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&tmp, fs::Permissions::from_mode(0o755));
    }
    fs::rename(&tmp, &target).map_err(|error| format!("No se pudo activar yt-dlp: {error}"))?;
    Ok(target.to_string_lossy().to_string())
}

fn ytdlp(paths: &Paths) -> Result<PathBuf, String> {
    find_tool(paths, "yt-dlp").ok_or_else(|| {
        "yt-dlp no está instalado. Abre la importación y pulsa «Instalar herramientas».".to_string()
    })
}

pub fn search(paths: &Paths, query: &str) -> Result<Vec<MatchCandidate>, String> {
    search_with_limit(paths, query, 6)
}

pub fn search_with_limit(
    paths: &Paths,
    query: &str,
    limit: usize,
) -> Result<Vec<MatchCandidate>, String> {
    let bin = ytdlp(paths)?;
    let query = query.trim();
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let count = limit.clamp(1, 20);
    let output = Command::new(bin)
        .args([
            "--ignore-config",
            "--no-warnings",
            "--ignore-errors",
            "--skip-download",
            "--flat-playlist",
            "--socket-timeout",
            "15",
            "--retries",
            "1",
            "--dump-single-json",
        ])
        .arg(format!("ytsearch{count}:{query}"))
        .output()
        .map_err(|error| format!("No se pudo ejecutar yt-dlp: {error}"))?;
    if !output.status.success() && output.stdout.is_empty() {
        return Err(format!(
            "La búsqueda en YouTube falló: {}",
            tail(&String::from_utf8_lossy(&output.stderr), 3)
        ));
    }
    let data: Value = serde_json::from_slice(&output.stdout)
        .map_err(|_| "YouTube devolvió una respuesta que no se pudo leer.".to_string())?;
    let entries = data
        .get("entries")
        .and_then(Value::as_array)
        .cloned()
        .or_else(|| data.as_array().cloned())
        .unwrap_or_default();
    let mut candidates = Vec::new();
    for entry in entries {
        if let Some(candidate) = candidate_from_entry(&entry) {
            candidates.push(candidate);
        }
    }
    Ok(candidates)
}

fn candidate_from_entry(entry: &Value) -> Option<MatchCandidate> {
    let title = entry
        .get("title")
        .and_then(Value::as_str)
        .unwrap_or("")
        .trim();
    if title.is_empty() {
        return None;
    }
    let raw_id = entry.get("id").and_then(Value::as_str).unwrap_or("");
    let video_id = video_id(raw_id)
        .or_else(|| {
            entry
                .get("webpage_url")
                .and_then(Value::as_str)
                .and_then(video_id)
        })
        .or_else(|| entry.get("url").and_then(Value::as_str).and_then(video_id))
        .unwrap_or_default();
    let url = entry
        .get("webpage_url")
        .and_then(Value::as_str)
        .map(str::to_string)
        .or_else(|| {
            let raw = entry.get("url").and_then(Value::as_str).unwrap_or("");
            if raw.starts_with("http") {
                Some(raw.to_string())
            } else if !video_id.is_empty() {
                Some(format!("https://www.youtube.com/watch?v={video_id}"))
            } else if is_video_id(raw) {
                Some(format!("https://www.youtube.com/watch?v={raw}"))
            } else {
                None
            }
        })?;
    let channel = entry
        .get("channel")
        .and_then(Value::as_str)
        .or_else(|| entry.get("uploader").and_then(Value::as_str))
        .or_else(|| entry.get("creator").and_then(Value::as_str))
        .unwrap_or("")
        .to_string();
    let duration = entry.get("duration").and_then(Value::as_f64).unwrap_or(0.0);
    let thumbnail = if video_id.is_empty() {
        String::new()
    } else {
        thumbnail_url(&video_id)
    };
    Some(MatchCandidate {
        url,
        title: title.to_string(),
        channel,
        duration,
        score: 0,
        video_id,
        thumbnail,
    })
}

pub fn search_catalog(paths: &Paths, query: &str) -> Result<Vec<OnlineTrack>, String> {
    let candidates = search_with_limit(paths, query, 12)?;
    Ok(candidates.into_iter().map(online_from_candidate).collect())
}

fn online_from_candidate(candidate: MatchCandidate) -> OnlineTrack {
    let video_id = if candidate.video_id.is_empty() {
        video_id(&candidate.url).unwrap_or_default()
    } else {
        candidate.video_id.clone()
    };
    let (title, artist) = split_title_artist(&candidate.title, &candidate.channel);
    let id = if video_id.is_empty() {
        format!("stream-{:016x}", paths::stable_hash(&candidate.url))
    } else {
        format!("stream-{video_id}")
    };
    OnlineTrack {
        id,
        title,
        artist,
        album: "Streaming".into(),
        duration: candidate.duration,
        uri: candidate.url,
        cover: if video_id.is_empty() {
            candidate.thumbnail
        } else {
            thumbnail_url(&video_id)
        },
        source: "stream".into(),
        format: "Streaming".into(),
    }
}

fn split_title_artist(title: &str, channel: &str) -> (String, String) {
    let artist = channel
        .trim_end_matches(" - Topic")
        .trim_end_matches("VEVO")
        .trim();
    if !artist.is_empty() {
        let prefix = format!("{artist} - ");
        if let Some(rest) = title.strip_prefix(&prefix) {
            return (rest.trim().to_string(), artist.to_string());
        }
        return (title.to_string(), artist.to_string());
    }
    if let Some((left, right)) = title.split_once(" - ") {
        return (right.trim().to_string(), left.trim().to_string());
    }
    (title.to_string(), String::new())
}

pub fn score_candidate(
    candidate: &MatchCandidate,
    title: &str,
    artist: &str,
    duration: f64,
) -> i64 {
    let q_title = normalize(title);
    let q_artist = normalize(artist);
    let c_title = normalize(&candidate.title);
    let c_channel = normalize(&candidate.channel);
    let mut score: i64 = 0;

    if !q_title.is_empty() {
        if c_title == q_title {
            score += 42;
        } else if c_title.contains(&q_title) {
            score += 32;
        } else {
            let wanted: Vec<&str> = q_title.split_whitespace().collect();
            let found = wanted
                .iter()
                .filter(|token| token.len() > 1 && c_title.contains(**token))
                .count();
            if !wanted.is_empty() {
                score += ((found as f64 / wanted.len() as f64) * 24.0) as i64;
            }
        }
    }
    if !q_artist.is_empty() {
        if !c_channel.is_empty() && (c_channel.contains(&q_artist) || q_artist.contains(&c_channel))
        {
            score += 26;
        }
        if c_title.contains(&q_artist) {
            score += 10;
        }
    }
    if candidate.channel.ends_with(" - Topic") {
        score += 8;
    }
    if duration > 0.0 && candidate.duration > 0.0 {
        let diff = (duration - candidate.duration).abs();
        score += if diff <= 3.0 {
            20
        } else if diff <= 8.0 {
            13
        } else if diff <= 20.0 {
            4
        } else if diff <= 45.0 {
            -4
        } else {
            -16
        };
    }
    let query_hint = format!("{} {}", title, artist).to_lowercase();
    let c_lower = candidate.title.to_lowercase();
    for bad in [
        "cover",
        "karaoke",
        "instrumental",
        "nightcore",
        "sped up",
        "slowed",
        "reaction",
        "tutorial",
        "8d audio",
        "bass boosted",
    ] {
        if c_lower.contains(bad) && !query_hint.contains(bad) {
            score -= 22;
        }
    }
    for bad in ["live", "remix", "acoustic", "version"] {
        if c_lower.contains(bad) && !query_hint.contains(bad) {
            score -= 9;
        }
    }
    if candidate.url.contains("list=") {
        score -= 4;
    }
    score
}

fn normalize(value: &str) -> String {
    let mut out = String::new();
    let mut depth = 0i32;
    let mut last_space = true;
    for ch in value.chars() {
        match ch {
            '(' | '[' => {
                depth += 1;
                continue;
            }
            ')' | ']' => {
                depth -= 1;
                if depth < 0 {
                    depth = 0;
                }
                continue;
            }
            _ => {}
        }
        if depth > 0 {
            continue;
        }
        let folded = match ch {
            'á' | 'à' | 'ä' | 'â' => 'a',
            'é' | 'è' | 'ë' | 'ê' => 'e',
            'í' | 'ì' | 'ï' | 'î' => 'i',
            'ó' | 'ò' | 'ö' | 'ô' => 'o',
            'ú' | 'ù' | 'ü' | 'û' => 'u',
            'ñ' => 'n',
            'ç' => 'c',
            '&' => ' ',
            other => other,
        };
        if folded.is_alphanumeric() {
            for lower in folded.to_lowercase() {
                out.push(lower);
            }
            last_space = false;
        } else if !last_space {
            out.push(' ');
            last_space = true;
        }
    }
    let mut cleaned = out.trim().to_string();
    for word in [
        "feat", "ft", "official", "video", "audio", "lyrics", "lyric", "hd", "hq",
    ] {
        cleaned = cleaned.replace(&format!(" {word} "), " ");
        if cleaned.starts_with(&format!("{word} ")) {
            cleaned = cleaned[word.len() + 1..].to_string();
        }
        if cleaned.ends_with(&format!(" {word}")) {
            cleaned.truncate(cleaned.len() - word.len() - 1);
        }
    }
    cleaned.split_whitespace().collect::<Vec<_>>().join(" ")
}

pub fn fetch_flat_playlist(url: &str) -> Result<(String, Vec<ImportedTrack>), String> {
    let paths = Paths::new();
    let bin = ytdlp(&paths)?;
    let output = Command::new(bin)
        .args([
            "--ignore-config",
            "--no-warnings",
            "--ignore-errors",
            "--skip-download",
            "--flat-playlist",
            "--socket-timeout",
            "20",
            "--retries",
            "1",
            "--dump-single-json",
        ])
        .arg(url)
        .output()
        .map_err(|error| format!("No se pudo ejecutar yt-dlp: {error}"))?;
    if !output.status.success() && output.stdout.is_empty() {
        return Err(format!(
            "No se pudo leer la playlist de YouTube: {}",
            tail(&String::from_utf8_lossy(&output.stderr), 3)
        ));
    }
    let data: Value = serde_json::from_slice(&output.stdout)
        .map_err(|_| "YouTube devolvió una lista que no se pudo interpretar.".to_string())?;
    let name = data
        .get("title")
        .and_then(Value::as_str)
        .filter(|title| !title.trim().is_empty() && *title != "NA")
        .unwrap_or("Playlist de YouTube")
        .to_string();
    let entries = data
        .get("entries")
        .and_then(Value::as_array)
        .cloned()
        .or_else(|| data.as_array().cloned())
        .unwrap_or_else(|| vec![data.clone()]);
    let mut tracks = Vec::new();
    for entry in entries.into_iter().take(500) {
        let title = entry
            .get("title")
            .and_then(Value::as_str)
            .unwrap_or("")
            .trim()
            .to_string();
        if title.is_empty() || title == "[Private video]" || title == "[Deleted video]" {
            continue;
        }
        let video_id = entry
            .get("id")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        let uri = entry
            .get("webpage_url")
            .and_then(Value::as_str)
            .map(str::to_string)
            .or_else(|| {
                let raw = entry.get("url").and_then(Value::as_str).unwrap_or("");
                if raw.starts_with("http") {
                    Some(raw.to_string())
                } else if !video_id.is_empty() {
                    Some(format!("https://www.youtube.com/watch?v={video_id}"))
                } else if raw.len() <= 14 && !raw.is_empty() {
                    Some(format!("https://www.youtube.com/watch?v={raw}"))
                } else {
                    None
                }
            })
            .unwrap_or_default();
        let channel = entry
            .get("channel")
            .and_then(Value::as_str)
            .or_else(|| entry.get("uploader").and_then(Value::as_str))
            .or_else(|| entry.get("creator").and_then(Value::as_str))
            .unwrap_or("")
            .to_string();
        let artist = channel
            .trim_end_matches(" - Topic")
            .trim_end_matches("VEVO")
            .trim()
            .to_string();
        let duration = entry.get("duration").and_then(Value::as_f64).unwrap_or(0.0);
        let (title, artist) = if artist.is_empty() {
            if let Some((artist, title)) = title.split_once(" - ") {
                (title.trim().to_string(), artist.trim().to_string())
            } else {
                (title, artist)
            }
        } else {
            (title, artist)
        };
        tracks.push(ImportedTrack {
            id: String::new(),
            title,
            artist,
            album: String::new(),
            duration,
            uri,
        });
    }
    if tracks.is_empty() {
        return Err("La playlist de YouTube no contiene pistas visibles.".into());
    }
    Ok((name, tracks))
}

pub fn download_one(
    paths: &Paths,
    request: &DownloadRequest,
    dir: &Path,
) -> Result<PathBuf, String> {
    fs::create_dir_all(dir)
        .map_err(|error| format!("No se pudo crear la carpeta de descargas: {error}"))?;
    let bin = ytdlp(paths)?;
    let ffmpeg = find_tool(paths, "ffmpeg");
    let template = dir.join("%(title)s [%(id)s].%(ext)s");
    let mut command = Command::new(bin);
    command.args([
        "--ignore-config",
        "--no-warnings",
        "--no-playlist",
        "--extract-audio",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
        "--embed-thumbnail",
        "--convert-thumbnails",
        "jpg",
        "--add-metadata",
        "--no-mtime",
        "--print",
        "after_move:filepath",
        "--newline",
        "-o",
    ]);
    command.arg(&template);
    if let Some(ffmpeg) = ffmpeg {
        command.arg("--ffmpeg-location").arg(ffmpeg);
    }
    command.arg(&request.url);
    let output = command
        .output()
        .map_err(|error| format!("No se pudo ejecutar yt-dlp: {error}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut downloaded: Option<PathBuf> = None;
    for line in stdout.lines().rev() {
        let candidate = line.trim();
        if candidate.is_empty() || candidate.starts_with('[') {
            continue;
        }
        let path = PathBuf::from(candidate);
        if path.is_absolute() && path.is_file() {
            downloaded = Some(path);
            break;
        }
    }
    if downloaded.is_none() {
        // Respaldo: el archivo más reciente de la carpeta creado durante esta descarga.
        if let Ok(entries) = fs::read_dir(dir) {
            let mut newest: Option<(std::time::SystemTime, PathBuf)> = None;
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                let ext = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_ascii_lowercase();
                if !matches!(
                    ext.as_str(),
                    "mp3" | "m4a" | "opus" | "ogg" | "flac" | "webm"
                ) {
                    continue;
                }
                let Ok(meta) = entry.metadata() else { continue };
                let Ok(modified) = meta.modified() else {
                    continue;
                };
                if newest
                    .as_ref()
                    .is_none_or(|(current, _)| modified > *current)
                {
                    newest = Some((modified, path));
                }
            }
            downloaded = newest.map(|(_, path)| path);
        }
    }
    if !output.status.success() && downloaded.is_none() {
        let error = tail(&String::from_utf8_lossy(&output.stderr), 4);
        return Err(if error.is_empty() {
            "yt-dlp no pudo descargar esta pista.".into()
        } else {
            format!("No se pudo descargar: {error}")
        });
    }
    downloaded.ok_or_else(|| {
        "La descarga terminó, pero no se encontró el archivo resultante.".to_string()
    })
}

fn tail(text: &str, lines: usize) -> String {
    let all: Vec<&str> = text
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect();
    let start = all.len().saturating_sub(lines);
    all[start..].join(" · ")
}

/// Convierte un enlace directo de YouTube en una coincidencia sin volver a buscar.
pub fn direct_candidate(uri: &str) -> Option<MatchCandidate> {
    let id = video_id(uri)?;
    Some(MatchCandidate {
        url: format!("https://www.youtube.com/watch?v={id}"),
        title: "Coincidencia directa de YouTube".into(),
        channel: String::new(),
        duration: 0.0,
        score: 100,
        video_id: id.clone(),
        thumbnail: thumbnail_url(&id),
    })
}

pub fn is_video_id(value: &str) -> bool {
    let value = value.trim();
    value.len() == 11
        && value
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_')
}

pub fn video_id(uri: &str) -> Option<String> {
    let raw = uri.trim();
    if raw.is_empty() {
        return None;
    }
    if is_video_id(raw) {
        return Some(raw.to_string());
    }
    let lower = raw.to_ascii_lowercase();
    let extract_after = |marker: &str| -> Option<String> {
        let start = lower.find(marker)? + marker.len();
        let slice = raw.get(start..)?;
        let id: String = slice
            .chars()
            .take_while(|ch| ch.is_ascii_alphanumeric() || *ch == '-' || *ch == '_')
            .collect();
        if is_video_id(&id) {
            Some(id)
        } else {
            None
        }
    };
    if let Some(id) = extract_after("v=") {
        return Some(id);
    }
    if let Some(id) = extract_after("youtu.be/") {
        return Some(id);
    }
    if let Some(id) = extract_after("/shorts/") {
        return Some(id);
    }
    if let Some(id) = extract_after("/embed/") {
        return Some(id);
    }
    None
}

pub fn canonical_watch_url(uri: &str) -> Option<String> {
    video_id(uri).map(|id| format!("https://www.youtube.com/watch?v={id}"))
}

pub fn thumbnail_url(video_id: &str) -> String {
    format!("https://i.ytimg.com/vi/{video_id}/hqdefault.jpg")
}

pub fn needs_prepare(request: &PlaybackRequest) -> bool {
    if request.source == "demo" {
        return false;
    }
    let path = request.path.trim();
    let uri = request.uri.trim();
    if !path.is_empty() {
        let file = PathBuf::from(path);
        if file.is_file() {
            return false;
        }
    }
    request.source == "stream"
        || path.starts_with("http://")
        || path.starts_with("https://")
        || uri.starts_with("http://")
        || uri.starts_with("https://")
        || is_video_id(path)
        || is_video_id(uri)
        || video_id(path).is_some()
        || video_id(uri).is_some()
}

#[derive(Clone, Debug)]
pub struct PreparedStream {
    pub path: PathBuf,
    pub duration: f64,
    pub video_id: String,
    pub url: String,
    pub cover: String,
}

pub fn prepare_playback(
    paths: &Paths,
    hint: &str,
    title: &str,
    artist: &str,
) -> Result<PreparedStream, String> {
    let url = if let Some(url) = canonical_watch_url(hint) {
        url
    } else if hint.starts_with("http://") || hint.starts_with("https://") {
        hint.trim().to_string()
    } else {
        let query = if artist.trim().is_empty() {
            title.trim().to_string()
        } else if title.trim().is_empty() {
            artist.trim().to_string()
        } else {
            format!("{} {}", artist.trim(), title.trim())
        };
        if query.is_empty() {
            return Err("No hay título ni enlace para reproducir esta pista.".into());
        }
        let mut found = search(paths, &query)?;
        for candidate in &mut found {
            candidate.score = score_candidate(candidate, title, artist, 0.0);
        }
        found.sort_by(|a, b| b.score.cmp(&a.score));
        found
            .first()
            .map(|candidate| candidate.url.clone())
            .ok_or_else(|| "No encontré esa canción para reproducirla.".to_string())?
    };
    fetch_audio(paths, &url)
}

fn fetch_audio(paths: &Paths, url: &str) -> Result<PreparedStream, String> {
    let id = video_id(url).unwrap_or_else(|| format!("{:016x}", paths::stable_hash(url)));
    let cover = if video_id(url).is_some() {
        thumbnail_url(&id)
    } else {
        String::new()
    };
    if let Some(existing) = find_cached(paths, &id) {
        return Ok(PreparedStream {
            path: existing,
            duration: 0.0,
            video_id: id,
            url: url.to_string(),
            cover,
        });
    }
    prune_stream_cache(paths);
    let bin = ytdlp(paths)?;
    let _ = fs::create_dir_all(&paths.streams);
    let template = paths.streams.join("%(id)s.%(ext)s");
    let output = Command::new(bin)
        .args([
            "--ignore-config",
            "--no-warnings",
            "--no-playlist",
            "--no-mtime",
            "--newline",
            "--socket-timeout",
            "20",
            "--retries",
            "2",
            "-f",
            "bestaudio[ext=m4a]/bestaudio[acodec^=opus]/bestaudio[ext=webm]/bestaudio/best",
            "--print",
            "after_move:filepath",
            "--print",
            "filepath",
            "-o",
        ])
        .arg(&template)
        .arg(url)
        .output()
        .map_err(|error| format!("No se pudo preparar el audio: {error}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut downloaded: Option<PathBuf> = None;
    for line in stdout.lines().rev() {
        let candidate = line.trim();
        if candidate.is_empty() || candidate.starts_with('[') {
            continue;
        }
        let path = PathBuf::from(candidate);
        if path.is_file() {
            downloaded = Some(path);
            break;
        }
    }
    if downloaded.is_none() {
        downloaded = find_cached(paths, &id);
    }
    if !output.status.success() && downloaded.is_none() {
        let error = tail(&String::from_utf8_lossy(&output.stderr), 4);
        return Err(if error.is_empty() {
            "No se pudo abrir esta canción para streamearla.".into()
        } else {
            format!("No se pudo abrir el audio: {error}")
        });
    }
    let path = downloaded.ok_or_else(|| {
        "La canción se resolvió, pero no quedó un archivo de audio reproducible.".to_string()
    })?;
    Ok(PreparedStream {
        path,
        duration: 0.0,
        video_id: id,
        url: url.to_string(),
        cover,
    })
}

fn find_cached(paths: &Paths, id: &str) -> Option<PathBuf> {
    let entries = fs::read_dir(&paths.streams).ok()?;
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let stem = path.file_stem()?.to_str()?;
        if stem != id {
            continue;
        }
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if !matches!(
            ext.as_str(),
            "m4a" | "webm" | "opus" | "ogg" | "mp3" | "mka" | "mp4" | "wav" | "flac" | "aac"
        ) {
            continue;
        }
        if fs::metadata(&path).ok()?.len() > 1024 {
            return Some(path);
        }
    }
    None
}

fn prune_stream_cache(paths: &Paths) {
    let Ok(entries) = fs::read_dir(&paths.streams) else {
        return;
    };
    let mut files: Vec<(std::time::SystemTime, PathBuf, u64)> = Vec::new();
    for entry in entries.filter_map(Result::ok) {
        let path = entry.path();
        let Ok(meta) = entry.metadata() else { continue };
        if !meta.is_file() {
            continue;
        }
        let modified = meta.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH);
        files.push((modified, path, meta.len()));
    }
    files.sort_by(|a, b| b.0.cmp(&a.0));
    const MAX_FILES: usize = 80;
    const MAX_BYTES: u64 = 2 * 1024 * 1024 * 1024;
    let mut kept_bytes = 0u64;
    for (index, (_, path, size)) in files.iter().enumerate() {
        if index < MAX_FILES && kept_bytes.saturating_add(*size) <= MAX_BYTES {
            kept_bytes += *size;
        } else {
            let _ = fs::remove_file(path);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_youtube_ids_from_common_urls() {
        assert_eq!(video_id("dQw4w9WgXcQ").as_deref(), Some("dQw4w9WgXcQ"));
        assert_eq!(
            video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=abc").as_deref(),
            Some("dQw4w9WgXcQ")
        );
        assert_eq!(
            video_id("https://youtu.be/dQw4w9WgXcQ").as_deref(),
            Some("dQw4w9WgXcQ")
        );
        assert_eq!(
            video_id("https://music.youtube.com/watch?v=dQw4w9WgXcQ").as_deref(),
            Some("dQw4w9WgXcQ")
        );
        assert_eq!(
            video_id("https://www.youtube.com/shorts/dQw4w9WgXcQ").as_deref(),
            Some("dQw4w9WgXcQ")
        );
        assert!(video_id("spotify:track:4iV5W9uYEdYUVa79Axb7Rh").is_none());
        assert_eq!(
            canonical_watch_url("dQw4w9WgXcQ").as_deref(),
            Some("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        );
    }
}
