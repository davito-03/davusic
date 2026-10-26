// Rutas de Davusic: configuración, caché, carátulas, temas y herramientas.
use std::path::{Path, PathBuf};

/// Nombre de la carpeta de configuración de la primera versión. Se conserva
/// únicamente para migrar los datos una vez; Davusic nunca escribe en ella.
const LEGACY_CONFIG_DIR: &str = "auralis";

#[derive(Clone, Debug)]
pub struct Paths {
    pub config_dir: PathBuf,
    pub cache_dir: PathBuf,
    pub data_dir: PathBuf,
    pub webview_data_dir: PathBuf,
    pub config_file: PathBuf,
    pub library_cache: PathBuf,
    pub spotify_file: PathBuf,
    pub covers: PathBuf,
    pub themes: PathBuf,
    pub tools: PathBuf,
    pub demo_audio: PathBuf,
    pub streams: PathBuf,
    pub lyrics: PathBuf,
    pub catalog_streams: PathBuf,
    pub catalog_playlists: PathBuf,
    pub catalog_fonts: PathBuf,
    pub session_file: PathBuf,
}

fn migrate_legacy_config(target: &Path) {
    let old = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(LEGACY_CONFIG_DIR);
    if !old.is_dir() {
        return;
    }
    let _ = std::fs::create_dir_all(target);
    for name in [
        "config.json",
        "library-cache.json",
        "spotify.json",
        "streams.json",
        "playlists.json",
        "fonts.json",
        "session.json",
    ] {
        let src = old.join(name);
        let dest = target.join(name);
        if src.is_file() && !dest.exists() {
            let _ = std::fs::copy(&src, dest);
        }
    }
}

impl Paths {
    pub fn new() -> Self {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("davusic");
        let cache_dir = dirs::cache_dir()
            .unwrap_or_else(|| std::env::temp_dir())
            .join("davusic");
        let data_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("davusic");
        let webview_data_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("io.github.davo.davusic");
        migrate_legacy_config(&config_dir);
        let paths = Self {
            config_file: config_dir.join("config.json"),
            library_cache: config_dir.join("library-cache.json"),
            spotify_file: config_dir.join("spotify.json"),
            catalog_streams: config_dir.join("streams.json"),
            catalog_playlists: config_dir.join("playlists.json"),
            catalog_fonts: config_dir.join("fonts.json"),
            session_file: config_dir.join("session.json"),
            covers: cache_dir.join("covers"),
            themes: cache_dir.join("themes"),
            tools: data_dir.join("bin"),
            demo_audio: cache_dir.join("demo-audio"),
            streams: cache_dir.join("streams"),
            lyrics: cache_dir.join("lyrics"),
            config_dir,
            cache_dir,
            data_dir,
            webview_data_dir,
        };
        paths.ensure_layout();
        paths
    }

    /// Crea el esqueleto de carpetas sin tocar los archivos que ya existan.
    pub fn ensure_layout(&self) {
        for path in [
            &self.config_dir,
            &self.covers,
            &self.themes,
            &self.tools,
            &self.demo_audio,
            &self.streams,
            &self.lyrics,
        ] {
            let _ = std::fs::create_dir_all(path);
        }
    }

    /// Rutas de la primera versión. Se incluyen en el restablecimiento para que
    /// una migración posterior no vuelva a introducir datos antiguos.
    pub fn legacy_dirs(&self) -> Vec<PathBuf> {
        let mut out = Vec::new();
        for root in [&self.config_dir, &self.cache_dir, &self.data_dir, &self.webview_data_dir] {
            if let Some(parent) = root.parent() {
                let name = root
                    .file_name()
                    .map(|value| value.to_string_lossy().to_string())
                    .unwrap_or_default();
                let legacy_name = match name.as_str() {
                    "davusic" => "auralis".to_string(),
                    "io.github.davo.davusic" => "io.github.davo.auralis".to_string(),
                    _ => continue,
                };
                out.push(parent.join(legacy_name));
            }
        }
        out
    }

    pub fn cover_url(&self, file: &str) -> String {
        format!("cover://localhost/{file}")
    }

    pub fn wallpaper_url(&self, file: &str) -> String {
        format!("wallpaper://localhost/{file}")
    }

    pub fn is_cover_file(&self, name: &str) -> Option<PathBuf> {
        safe_join(&self.covers, name)
    }

    pub fn is_theme_file(&self, name: &str) -> Option<PathBuf> {
        safe_join(&self.themes, name)
    }
}

fn safe_join(root: &Path, name: &str) -> Option<PathBuf> {
    let decoded = percent_decode(name).replace('\\', "/");
    if decoded.is_empty()
        || decoded.contains('/')
        || decoded.contains("..")
        || decoded.starts_with('.')
    {
        return None;
    }
    let path = root.join(decoded);
    if path.is_file() {
        Some(path)
    } else {
        None
    }
}

pub fn percent_decode(value: &str) -> String {
    let bytes = value.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            let hi = (bytes[i + 1] as char).to_digit(16);
            let lo = (bytes[i + 2] as char).to_digit(16);
            if let (Some(hi), Some(lo)) = (hi, lo) {
                out.push((hi * 16 + lo) as u8);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// FNV-1a estable para ids y nombres de caché.
pub fn stable_hash(value: &str) -> u64 {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for byte in value.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
    }
    hash
}

pub fn stable_id(prefix: &str, key: &str) -> String {
    format!("local-{prefix}-{:016x}", stable_hash(key))
}

pub fn audio_extension(path: &Path) -> bool {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    matches!(
        ext.as_str(),
        "mp3" | "flac" | "ogg" | "oga" | "opus" | "m4a" | "mp4" | "aac" | "wav" | "aiff"
            | "aif" | "wv" | "ape" | "mpc" | "spx" | "mka"
    )
}

pub fn format_label(path: &Path) -> String {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "mp3" => "MP3".into(),
        "flac" => "FLAC · sin pérdida".into(),
        "ogg" | "oga" => "OGG Vorbis".into(),
        "opus" => "Opus".into(),
        "m4a" | "mp4" | "mka" => "AAC / M4A".into(),
        "wav" => "WAV · PCM".into(),
        "aiff" | "aif" => "AIFF".into(),
        "wv" => "WavPack".into(),
        "ape" => "APE".into(),
        "mpc" => "Musepack".into(),
        "spx" => "Speex".into(),
        other if !other.is_empty() => other.to_ascii_uppercase(),
        _ => "Audio local".into(),
    }
}
