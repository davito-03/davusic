// Temas generados a partir de la carpeta de wallpapers del usuario.
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use image::GenericImageView;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use walkdir::WalkDir;

use crate::models::{Config, Palette, WallpaperDiscovery, WallpaperTheme};
use crate::palette;
use crate::paths::{self, Paths};

const MAX_THEMES: usize = 24;

#[derive(Serialize, Deserialize, Default)]
struct WallpaperCache {
    #[serde(default)]
    folder: String,
    #[serde(default)]
    entries: HashMap<String, CacheEntry>,
}

#[derive(Serialize, Deserialize, Clone)]
struct CacheEntry {
    mtime: u64,
    size: u64,
    theme: WallpaperTheme,
}

pub fn detect_folder(config: &Config) -> Option<PathBuf> {
    if let Some(raw) = config.wallpaper_dir.as_ref() {
        let path = PathBuf::from(raw);
        if path.is_dir() {
            return Some(path);
        }
    }
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(home) = dirs::home_dir() {
        candidates.push(home.join("Imágenes/Wallpapers"));
        candidates.push(home.join("Pictures/Wallpapers"));
        candidates.push(home.join("Wallpapers"));
        candidates.push(home.join(".local/share/wallpapers"));
        candidates.push(home.join("Imágenes"));
        candidates.push(home.join("Pictures"));
    }
    for candidate in candidates {
        if !candidate.is_dir() {
            continue;
        }
        let has_images = fs::read_dir(&candidate)
            .ok()
            .map(|entries| {
                entries
                    .filter_map(Result::ok)
                    .take(12)
                    .any(|entry| is_image(&entry.path()))
            })
            .unwrap_or(false);
        if has_images {
            return Some(fs::canonicalize(&candidate).unwrap_or(candidate));
        }
    }
    None
}

fn is_image(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase()
            .as_str(),
        "jpg" | "jpeg" | "png" | "webp" | "avif" | "bmp"
    )
}

fn collect_images(root: &Path) -> Vec<PathBuf> {
    let mut images: Vec<PathBuf> = WalkDir::new(root)
        .max_depth(3)
        .follow_links(true)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_file() && is_image(entry.path()))
        .filter(|entry| {
            fs::metadata(entry.path())
                .map(|m| m.len() > 8 * 1024 && m.len() < 80 * 1024 * 1024)
                .unwrap_or(false)
        })
        .map(|entry| entry.into_path())
        .collect();
    images.sort_by(|a, b| {
        a.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_lowercase()
            .cmp(&b.file_name().unwrap_or_default().to_string_lossy().to_lowercase())
    });
    images
}

fn pick_spread(images: &[PathBuf], limit: usize) -> Vec<PathBuf> {
    if images.len() <= limit {
        return images.to_vec();
    }
    let mut out = Vec::with_capacity(limit);
    let step = images.len() as f64 / limit as f64;
    for i in 0..limit {
        let idx = (i as f64 * step).floor() as usize;
        if let Some(path) = images.get(idx.min(images.len() - 1)) {
            if !out.contains(path) {
                out.push(path.clone());
            }
        }
    }
    out
}

pub fn discover(
    paths: &Paths,
    config: &Config,
    folder_override: Option<PathBuf>,
    force: bool,
    app: Option<&AppHandle>,
) -> WallpaperDiscovery {
    let folder = folder_override.or_else(|| detect_folder(config));
    let Some(folder) = folder else {
        return WallpaperDiscovery {
            themes: Vec::new(),
            folder: String::new(),
            scanned: 0,
            message: "No encontré una carpeta de wallpapers. Elige una para crear temas."
                .into(),
        };
    };

    let images = collect_images(&folder);
    if images.is_empty() {
        return WallpaperDiscovery {
            themes: Vec::new(),
            folder: folder.to_string_lossy().to_string(),
            scanned: 0,
            message: "Esa carpeta no contiene imágenes compatibles.".into(),
        };
    }

    let selected = pick_spread(&images, MAX_THEMES);
    let cache_path = paths.config_dir.join("wallpaper-cache.json");
    let mut cache: WallpaperCache = fs::read_to_string(&cache_path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    if force || cache.folder != folder.to_string_lossy() {
        cache.entries.clear();
        cache.folder = folder.to_string_lossy().to_string();
    }

    let total = selected.len();
    let mut themes: Vec<WallpaperTheme> = Vec::new();
    for (index, path) in selected.iter().enumerate() {
        let key = path.to_string_lossy().to_string();
        let meta = fs::metadata(path).ok();
        let mtime = meta
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|m| m.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
        if !force {
            if let Some(entry) = cache.entries.get(&key) {
                if entry.mtime == mtime && entry.size == size && preview_exists(paths, &entry.theme) {
                    themes.push(entry.theme.clone());
                    emit_progress(app, index + 1, total, path);
                    continue;
                }
            }
        }

        if let Some(theme) = analyze(paths, path, mtime) {
            cache.entries.insert(
                key,
                CacheEntry {
                    mtime,
                    size,
                    theme: theme.clone(),
                },
            );
            themes.push(theme);
        }
        emit_progress(app, index + 1, total, path);
    }

    themes.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    if let Ok(raw) = serde_json::to_string(&cache) {
        let _ = fs::write(&cache_path, raw);
    }
    if let Some(app) = app {
        let _ = app.emit(
            "wallpaper-progress",
            serde_json::json!({ "stage": "done", "done": total, "total": total }),
        );
    }
    let scanned = themes.len();
    WallpaperDiscovery {
        themes,
        folder: folder.to_string_lossy().to_string(),
        scanned,
        message: if scanned > 0 {
            format!("{scanned} temas creados a partir de tus wallpapers.")
        } else {
            "No se pudo analizar ninguna imagen.".into()
        },
    }
}

fn preview_exists(paths: &Paths, theme: &WallpaperTheme) -> bool {
    theme
        .wallpaper
        .rsplit('/')
        .next()
        .and_then(|name| paths.is_theme_file(name))
        .is_some()
}

fn emit_progress(app: Option<&AppHandle>, done: usize, total: usize, path: &Path) {
    if let Some(app) = app {
        let _ = app.emit(
            "wallpaper-progress",
            serde_json::json!({
                "stage": "scan",
                "done": done,
                "total": total,
                "current": path.file_name().and_then(|n| n.to_str()).unwrap_or("")
            }),
        );
    }
}

fn analyze(paths: &Paths, path: &Path, mtime: u64) -> Option<WallpaperTheme> {
    let bytes = fs::read(path).ok()?;
    let image = image::load_from_memory(&bytes).ok()?;
    let (w, h) = image.dimensions();
    if w < 64 || h < 64 {
        return None;
    }
    let palette: Palette = palette::wallpaper_palette(&image);
    let key = format!("{}:{}:{}", path.to_string_lossy(), mtime, bytes.len());
    let hash = paths::stable_hash(&key);
    let preview_name = format!("wall-{hash:016x}.jpg");
    let preview_path = paths.themes.join(&preview_name);
    if !preview_path.is_file() {
        let preview = image.resize(900, 900, image::imageops::FilterType::Lanczos3);
        let _ = preview
            .to_rgb8()
            .save_with_format(&preview_path, image::ImageFormat::Jpeg);
    }
    let mut palette = palette;
    palette.wallpaper = paths.wallpaper_url(&preview_name);
    let theme = WallpaperTheme {
        id: format!("wall-{hash:016x}"),
        name: theme_name(path),
        path: path.to_string_lossy().to_string(),
        wallpaper: palette.wallpaper.clone(),
        palette,
    };
    Some(theme)
}

fn theme_name(path: &Path) -> String {
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Wallpaper");
    let mut name = stem.replace('_', " ").replace('-', " ");
    // Quitar prefijos de descarga y números de serie.
    let lower = name.to_lowercase();
    if let Some(pos) = lower.find("konachan com") {
        name = name[(pos + "konachan com".len())..].to_string();
    }
    name = name
        .split_whitespace()
        .filter(|word| {
            let w = word.to_lowercase();
            !w.chars().all(|c| c.is_ascii_digit())
                && !matches!(
                    w.as_str(),
                    "konachan" | "com" | "rating" | "questionable" | "safe" | "landscape"
                        | "wallpaper" | "random" | "image" | "img" | "www"
                )
        })
        .take(4)
        .map(|word| {
            let mut chars = word.chars();
            chars
                .next()
                .map(|first| first.to_uppercase().collect::<String>() + chars.as_str())
                .unwrap_or_default()
        })
        .collect::<Vec<_>>()
        .join(" ");
    if name.trim().is_empty() {
        "Fondo de Davusic".into()
    } else {
        name.trim().chars().take(42).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{Rgb, RgbImage};

    fn temp_root(label: &str) -> PathBuf {
        let stamp = std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir().join(format!("davusic-{label}-{}-{stamp}", std::process::id()))
    }

    #[test]
    fn discovers_and_previews_a_generated_wallpaper() {
        let root = temp_root("theme-test");
        let images = root.join("images");
        let config_dir = root.join("config");
        let themes = root.join("themes");
        let covers = root.join("covers");
        fs::create_dir_all(&images).unwrap();
        fs::create_dir_all(&config_dir).unwrap();
        fs::create_dir_all(&themes).unwrap();
        fs::create_dir_all(&covers).unwrap();

        let mut image = RgbImage::new(640, 360);
        for (x, y, pixel) in image.enumerate_pixels_mut() {
            *pixel = Rgb([
                (x % 256) as u8,
                (y % 256) as u8,
                ((x * 3 + y * 5) % 256) as u8,
            ]);
        }
        let wallpaper_path = images.join("Aurora Nocturna.jpg");
        image.save(&wallpaper_path).unwrap();

        let paths = Paths {
            config_dir: config_dir.clone(),
            cache_dir: root.join("cache"),
            data_dir: root.join("data"),
            webview_data_dir: root.join("webview"),
            config_file: config_dir.join("config.json"),
            library_cache: config_dir.join("library-cache.json"),
            spotify_file: config_dir.join("spotify.json"),
            covers,
            themes: themes.clone(),
            tools: root.join("bin"),
            demo_audio: root.join("demo"),
            streams: root.join("streams"),
            lyrics: root.join("lyrics"),
            catalog_streams: config_dir.join("streams.json"),
            catalog_playlists: config_dir.join("playlists.json"),
            catalog_fonts: config_dir.join("fonts.json"),
            session_file: config_dir.join("session.json"),
        };
        let config = Config {
            folders: Vec::new(),
            wallpaper_dir: Some(images.to_string_lossy().to_string()),
            download_dir: None,
        };
        let discovery = discover(&paths, &config, None, true, None);
        assert_eq!(discovery.themes.len(), 1);
        let theme = &discovery.themes[0];
        assert!(theme.name.contains("Aurora"));
        assert!(theme.palette.accent.starts_with('#'));
        assert!(theme.id.starts_with("wall-"));
        let preview = theme.wallpaper.rsplit('/').next().unwrap();
        assert!(themes.join(preview).is_file());

        let _ = fs::remove_dir_all(&root);
    }
}
