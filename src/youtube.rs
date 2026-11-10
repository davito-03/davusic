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

pub fn search_with_limit(
    paths: &Paths,
    query: &str,
    limit: usize,
) -> Result<Vec<MatchCandidate>, String> {
    let query = query.trim();
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let count = limit.clamp(1, 20);
    flat_search(paths, &format!("ytsearch{count}:{query}"), count)
}

/// Filtro «Canciones» de YouTube Music: devuelve la pista de audio oficial en
/// lugar de videoclips, directos o vídeos con letra.
const MUSIC_SONGS_FILTER: &str = "EgWKAQIIAWoKEAoQAxAEEAkQBQ%3D%3D";

/// Busca en el catálogo de canciones de YouTube Music. El listado plano solo
/// trae título e identificador, así que quien llama debe puntuar con cuidado.
pub fn search_music(
    paths: &Paths,
    query: &str,
    limit: usize,
) -> Result<Vec<MatchCandidate>, String> {
    let query = query.trim();
    if query.is_empty() {
        return Ok(Vec::new());
    }
    let count = limit.clamp(1, 20);
    let target = format!(
        "https://music.youtube.com/search?q={}&sp={MUSIC_SONGS_FILTER}",
        crate::spotify::url_encode(query)
    );
    let mut found = flat_search(paths, &target, count)?;
    found.retain(|candidate| !candidate.video_id.is_empty());
    for candidate in &mut found {
        candidate.url = format!("https://www.youtube.com/watch?v={}", candidate.video_id);
    }
    Ok(found)
}

fn flat_search(paths: &Paths, target: &str, count: usize) -> Result<Vec<MatchCandidate>, String> {
    let bin = ytdlp(paths)?;
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
            "--playlist-end",
        ])
        .arg(count.to_string())
        .arg("--dump-single-json")
        .arg(target)
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
    Ok(entries.iter().filter_map(candidate_from_entry).collect())
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

/// Primer artista de una lista «A, B; C». Es el que suele dar nombre al canal.
pub fn primary_artist(artist: &str) -> &str {
    artist.split([',', ';']).next().unwrap_or("").trim()
}

/// Spotify escribe las ediciones como «Título - Remastered 2011». Ese sufijo
/// casi nunca aparece igual en YouTube, así que se compara el título base.
fn core_title(title: &str) -> &str {
    const EDITION_WORDS: [&str; 22] = [
        "remaster",
        "version",
        "versión",
        "edit",
        "mix",
        "mono",
        "stereo",
        "deluxe",
        "bonus",
        "single",
        "live",
        "directo",
        "acoustic",
        "acústic",
        "feat",
        "from ",
        "original",
        "anniversary",
        "demo",
        "explicit",
        "instrumental",
        "soundtrack",
    ];
    if let Some((head, rest)) = title.split_once(" - ") {
        let rest = rest.to_lowercase();
        if !head.trim().is_empty() && EDITION_WORDS.iter().any(|word| rest.contains(word)) {
            return head.trim();
        }
    }
    title
}

/// Palabras en minúsculas separadas y rodeadas por un espacio, para buscar
/// términos completos («live» no debe coincidir con «Alive»).
fn padded_words(value: &str) -> String {
    let mut out = String::with_capacity(value.len() + 2);
    out.push(' ');
    let mut last_space = true;
    for ch in value.chars() {
        if ch.is_alphanumeric() {
            out.extend(ch.to_lowercase());
            last_space = false;
        } else if !last_space {
            out.push(' ');
            last_space = true;
        }
    }
    if !last_space {
        out.push(' ');
    }
    out
}

pub fn score_candidate(
    candidate: &MatchCandidate,
    title: &str,
    artist: &str,
    duration: f64,
) -> i64 {
    let q_title = normalize(core_title(title));
    let q_artist = normalize(artist);
    let q_main = normalize(primary_artist(artist));
    let c_title = normalize(&candidate.title);
    let c_channel = normalize(&candidate.channel);
    let mut score: i64 = 0;

    if !q_title.is_empty() {
        if c_title == q_title {
            score += 42;
        } else if c_title.contains(&q_title) {
            score += 32;
        } else if c_title.len() >= 4 && q_title.contains(&c_title) {
            score += 24;
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
        let channel_matches = !c_channel.is_empty()
            && (c_channel.contains(&q_artist)
                || q_artist.contains(&c_channel)
                || (!q_main.is_empty() && c_channel.contains(&q_main)));
        if channel_matches {
            score += 26;
        }
        if c_title.contains(&q_artist) || (!q_main.is_empty() && c_title.contains(&q_main)) {
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
    let wanted_words = padded_words(&format!("{title} {artist}"));
    let found_words = padded_words(&candidate.title);
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
        let needle = format!(" {bad} ");
        if found_words.contains(&needle) && !wanted_words.contains(&needle) {
            score -= 22;
        }
    }
    for bad in ["live", "remix", "acoustic", "version", "en vivo", "directo"] {
        let needle = format!(" {bad} ");
        if found_words.contains(&needle) && !wanted_words.contains(&needle) {
            score -= 9;
        }
    }
    if has_unexpected_edition(&candidate.title, &wanted_words) {
        score -= 14;
    }
    if candidate.url.contains("list=") {
        score -= 4;
    }
    score
}

/// Indica si el título trae entre paréntesis algo que no se pidió y que no es
/// relleno habitual («Official Video», «Remastered 2011»): suele delatar otra
/// grabación, como «(From the BBC)» o «(Made Famous by…)».
fn has_unexpected_edition(candidate_title: &str, wanted_words: &str) -> bool {
    const FILLER: [&str; 40] = [
        "official",
        "oficial",
        "video",
        "vídeo",
        "videoclip",
        "audio",
        "lyric",
        "lyrics",
        "letra",
        "remaster",
        "remastered",
        "remasterizado",
        "hd",
        "hq",
        "4k",
        "visualizer",
        "music",
        "clip",
        "feat",
        "ft",
        "with",
        "con",
        "explicit",
        "clean",
        "the",
        "a",
        "de",
        "y",
        "and",
        "original",
        "album",
        "single",
        "mv",
        "stereo",
        "mono",
        "version",
        "versión",
        "prod",
        "by",
        "from",
    ];
    let mut inside = String::new();
    let mut depth = 0u32;
    for ch in candidate_title.chars() {
        match ch {
            '(' | '[' => depth += 1,
            ')' | ']' => {
                depth = depth.saturating_sub(1);
                inside.push(' ');
            }
            _ if depth > 0 => inside.push(ch),
            _ => {}
        }
    }
    let words = padded_words(&inside);
    let mut unexpected = words.split_whitespace().filter(|word| {
        !FILLER.contains(word)
            && !word.chars().all(|ch| ch.is_ascii_digit())
            && !wanted_words.contains(&format!(" {word} "))
    });
    unexpected.next().is_some()
}

/// Puntuación mínima para dar una coincidencia por buena sin preguntar.
pub const CONFIDENT_SCORE: i64 = 40;

/// Busca una canción por sus metadatos y devuelve candidatos ordenados.
///
/// Se consultan a la vez el catálogo de canciones de YouTube Music (la pista
/// de audio oficial, pero sin canal ni duración que comprobar) y la búsqueda
/// general de YouTube (videoclips, pero con canal y duración). Un vídeo cuya
/// duración y canal cuadran gana; si no, se prefiere la canción de YouTube Music.
pub fn resolve_candidates(
    paths: &Paths,
    title: &str,
    artist: &str,
    duration: f64,
) -> Result<Vec<MatchCandidate>, String> {
    let title = title.trim();
    let main = primary_artist(artist);
    let query = match (main.is_empty(), title.is_empty()) {
        (true, true) => return Ok(Vec::new()),
        (true, false) => title.to_string(),
        (false, true) => main.to_string(),
        (false, false) => format!("{main} {title}"),
    };

    let (music, general) = std::thread::scope(|scope| {
        let music = scope.spawn(|| search_music(paths, &query, 4));
        let general = search_with_limit(paths, &query, 5);
        let music = music
            .join()
            .unwrap_or_else(|_| Err("La búsqueda en YouTube Music se interrumpió.".into()));
        (music, general)
    });

    let mut out: Vec<MatchCandidate> = Vec::new();
    if let Ok(found) = &general {
        for candidate in found {
            let mut candidate = candidate.clone();
            candidate.score = score_candidate(&candidate, title, artist, duration);
            out.push(candidate);
        }
    }
    if let Ok(found) = music {
        for (index, mut candidate) in found.into_iter().enumerate() {
            let base = score_candidate(&candidate, title, "", 0.0);
            // Solo se premia cuando el título cuadra: no hay más datos que verificar.
            candidate.score = if base >= 24 {
                base + 34 - (index as i64 * 3)
            } else {
                base
            };
            candidate.channel = "YouTube Music".into();
            if let Some(existing) = out
                .iter_mut()
                .find(|other| other.video_id == candidate.video_id)
            {
                // Ya está puntuado con canal y duración reales: eso manda.
                // Estar además en el catálogo de canciones solo suma un poco.
                existing.score += 6;
            } else {
                out.push(candidate);
            }
        }
    } else if let Err(error) = general {
        return Err(error);
    }
    out.sort_by(|a, b| b.score.cmp(&a.score));
    out.truncate(6);
    Ok(out)
}

fn normalize(value: &str) -> String {
    let mut out = String::new();
    let mut depth = 0i32;
    let mut last_space = true;
    for ch in value.chars().flat_map(char::to_lowercase) {
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
        let cover = if is_video_id(&video_id) {
            thumbnail_url(&video_id)
        } else {
            String::new()
        };
        tracks.push(ImportedTrack {
            id: String::new(),
            title,
            artist,
            album: String::new(),
            duration,
            uri,
            cover,
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

/// Enlaces que solo sirven como metadatos: Spotify protege su audio con DRM,
/// así que la canción hay que buscarla por título y artista.
pub fn is_metadata_only(uri: &str) -> bool {
    let lower = uri.trim().to_ascii_lowercase();
    lower.starts_with("spotify:")
        || lower.contains("open.spotify.com")
        || lower.contains("spotify.link")
}

pub fn prepare_playback(
    paths: &Paths,
    hint: &str,
    title: &str,
    artist: &str,
    duration: f64,
) -> Result<PreparedStream, String> {
    let hint = hint.trim();
    let url = if let Some(url) = canonical_watch_url(hint) {
        url
    } else if (hint.starts_with("http://") || hint.starts_with("https://"))
        && !is_metadata_only(hint)
    {
        hint.to_string()
    } else {
        resolve_url(paths, title, artist, duration)?
    };
    fetch_audio(paths, &url)
}

/// Resuelve una canción a su enlace de YouTube, recordando el resultado para
/// no repetir la búsqueda la próxima vez.
fn resolve_url(paths: &Paths, title: &str, artist: &str, duration: f64) -> Result<String, String> {
    // La interfaz rellena así las pistas sin artista; no debe entrar en la búsqueda.
    let artist = if artist.trim() == "Artista desconocido" {
        ""
    } else {
        artist
    };
    if title.trim().is_empty() && artist.trim().is_empty() {
        return Err("No hay título ni enlace para reproducir esta pista.".into());
    }
    if let Some(id) = cached_match(paths, title, artist) {
        return Ok(format!("https://www.youtube.com/watch?v={id}"));
    }
    let found = resolve_candidates(paths, title, artist, duration)?;
    let best = found
        .first()
        .ok_or_else(|| "No encontré esa canción para reproducirla.".to_string())?;
    if best.score >= CONFIDENT_SCORE && !best.video_id.is_empty() {
        remember_match(paths, title, artist, &best.video_id);
    }
    Ok(best.url.clone())
}

// ---------- caché de coincidencias ----------

type MatchMap = std::collections::HashMap<String, String>;

static MATCHES: parking_lot::Mutex<Option<MatchMap>> = parking_lot::Mutex::new(None);
const MAX_MATCHES: usize = 20_000;

fn matches_file(paths: &Paths) -> PathBuf {
    paths.cache_dir.join("matches.json")
}

fn match_key(title: &str, artist: &str) -> String {
    format!(
        "{}|{}",
        normalize(primary_artist(artist)),
        normalize(core_title(title))
    )
}

fn with_matches<T>(paths: &Paths, action: impl FnOnce(&mut MatchMap) -> T) -> T {
    let mut guard = MATCHES.lock();
    let map = guard.get_or_insert_with(|| {
        fs::read(matches_file(paths))
            .ok()
            .and_then(|raw| serde_json::from_slice::<MatchMap>(&raw).ok())
            .unwrap_or_default()
    });
    action(map)
}

pub fn cached_match(paths: &Paths, title: &str, artist: &str) -> Option<String> {
    let key = match_key(title, artist);
    if key.len() < 3 {
        return None;
    }
    with_matches(paths, |map| map.get(&key).cloned()).filter(|id| is_video_id(id))
}

pub fn remember_match(paths: &Paths, title: &str, artist: &str, video_id: &str) {
    let key = match_key(title, artist);
    if key.len() < 3 || !is_video_id(video_id) {
        return;
    }
    with_matches(paths, |map| {
        if map.get(&key).map(String::as_str) == Some(video_id) {
            return;
        }
        if map.len() >= MAX_MATCHES {
            map.clear();
        }
        map.insert(key, video_id.to_string());
        if let Ok(raw) = serde_json::to_vec(map) {
            let file = matches_file(paths);
            let tmp = file.with_extension("json.tmp");
            if fs::write(&tmp, raw).is_ok() {
                let _ = fs::rename(&tmp, &file);
            }
        }
    });
}

/// Olvida las coincidencias en memoria (restablecimiento de fábrica).
pub fn forget_matches() {
    *MATCHES.lock() = None;
}

// ---------- descarga a la caché de streaming ----------

type DownloadLocks = std::collections::HashMap<String, std::sync::Arc<parking_lot::Mutex<()>>>;

/// Un cerrojo por vídeo: la precarga y el «play» pueden pedir la misma pista a
/// la vez y dos yt-dlp no deben escribir el mismo archivo.
static DOWNLOADS: parking_lot::Mutex<Option<DownloadLocks>> = parking_lot::Mutex::new(None);

fn download_lock(id: &str) -> std::sync::Arc<parking_lot::Mutex<()>> {
    DOWNLOADS
        .lock()
        .get_or_insert_with(Default::default)
        .entry(id.to_string())
        .or_default()
        .clone()
}

fn fetch_audio(paths: &Paths, url: &str) -> Result<PreparedStream, String> {
    let id = video_id(url).unwrap_or_else(|| format!("{:016x}", paths::stable_hash(url)));
    let cover = if video_id(url).is_some() {
        thumbnail_url(&id)
    } else {
        String::new()
    };
    let lock = download_lock(&id);
    let _downloading = lock.lock();
    if let Some(existing) = find_cached(paths, &id) {
        // Marca el archivo como recién usado para que la poda respete lo que se escucha.
        if let Ok(file) = fs::File::options().append(true).open(&existing) {
            let _ = file.set_modified(std::time::SystemTime::now());
        }
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
        let partial = path
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| matches!(ext, "part" | "ytdl"));
        if partial {
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

    fn candidate(title: &str, channel: &str, duration: f64) -> MatchCandidate {
        MatchCandidate {
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ".into(),
            title: title.into(),
            channel: channel.into(),
            duration,
            score: 0,
            video_id: "dQw4w9WgXcQ".into(),
            thumbnail: String::new(),
        }
    }

    #[test]
    fn spotify_links_are_metadata_not_audio() {
        assert!(is_metadata_only(
            "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh"
        ));
        assert!(is_metadata_only("spotify:track:4iV5W9uYEdYUVa79Axb7Rh"));
        assert!(!is_metadata_only(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        ));
        assert!(!is_metadata_only("https://example.test/bajamar.mp3"));
    }

    #[test]
    fn spotify_edition_suffix_does_not_break_title_match() {
        let official = candidate("Heroes (2017 Remaster)", "David Bowie", 371.0);
        let score = score_candidate(&official, "Heroes - 2017 Remaster", "David Bowie", 371.0);
        assert!(score >= 80, "puntuación inesperada: {score}");
    }

    #[test]
    fn penalties_match_whole_words_only() {
        let alive = candidate("Alive", "Pearl Jam", 341.0);
        let live = candidate("Alive (Live at Wembley)", "Pearl Jam", 341.0);
        let studio = score_candidate(&alive, "Alive", "Pearl Jam", 341.0);
        let concert = score_candidate(&live, "Alive", "Pearl Jam", 341.0);
        assert!(studio > concert);
        assert_eq!(studio, 42 + 26 + 20);
    }

    #[test]
    fn verified_video_beats_wrong_length_video() {
        let right = candidate("ROSALÍA - MALAMENTE", "ROSALÍA", 150.0);
        let skit = candidate("ROSALÍA - MALAMENTE (Cap.1: Augurio)", "ROSALÍA", 169.0);
        let a = score_candidate(&right, "MALAMENTE - Cap.1: Augurio", "ROSALÍA", 150.0);
        let b = score_candidate(&skit, "MALAMENTE - Cap.1: Augurio", "ROSALÍA", 150.0);
        assert!(a > b);
    }

    #[test]
    fn collaborations_match_the_first_artist_channel() {
        assert_eq!(primary_artist("Lúa, Berta; Otro"), "Lúa");
        let song = candidate("Sal y miel", "Lúa", 0.0);
        assert!(score_candidate(&song, "Sal y miel", "Lúa, Berta", 0.0) >= 42 + 26);
    }

    #[test]
    fn unrequested_recordings_lose_to_the_plain_song() {
        let bbc = candidate("Pearl Jam - Alive (From the BBC)", "Pearl Jam", 339.0);
        let video = candidate("Pearl Jam - Alive (Official Video)", "Pearl Jam", 339.0);
        let a = score_candidate(&bbc, "Alive", "Pearl Jam", 341.0);
        let b = score_candidate(&video, "Alive", "Pearl Jam", 341.0);
        assert_eq!(b - a, 14);
        let remaster = candidate("Bohemian Rhapsody (Remastered 2011)", "Queen", 355.0);
        assert!(!has_unexpected_edition(
            &remaster.title,
            &padded_words("Bohemian Rhapsody - Remastered 2011 Queen")
        ));
    }

    #[test]
    fn match_keys_ignore_edition_and_extra_artists() {
        assert_eq!(
            match_key("Heroes - 2017 Remaster", "David Bowie, Queen"),
            match_key("Heroes", "David Bowie")
        );
    }
}
