// Operaciones que dependen del sistema operativo.
use std::path::Path;

pub const IS_ANDROID: bool = cfg!(target_os = "android");
pub const IS_WINDOWS: bool = cfg!(target_os = "windows");
pub const IS_LINUX: bool = cfg!(target_os = "linux");

pub fn os_name() -> &'static str {
    if IS_WINDOWS {
        "windows"
    } else if IS_ANDROID {
        "android"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

pub fn open_url(url: &str) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        let _ = url;
        return Err("Abrir enlaces externos no está disponible en esta versión de Android.".into());
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", url])
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("No se pudo abrir el navegador: {error}"))
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("No se pudo abrir el navegador: {error}"))
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("No se pudo abrir el navegador: {error}"))
    }
}

pub fn reveal_in_folder(path: &Path) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        let _ = path;
        return Err("Abrir carpetas no está disponible en esta versión de Android.".into());
    }
    #[cfg(target_os = "windows")]
    {
        let mut command = std::process::Command::new("explorer.exe");
        if path.is_dir() {
            command.arg(path);
        } else {
            command.arg(format!("/select,{}", path.to_string_lossy()));
        }
        command
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("No se pudo abrir la carpeta: {error}"))
    }
    #[cfg(target_os = "macos")]
    {
        let mut command = std::process::Command::new("open");
        if file_is_dir(path) {
            command.arg(path);
        } else {
            command.args(["-R"]).arg(path);
        }
        command
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("No se pudo abrir la carpeta: {error}"))
    }
    #[cfg(target_os = "linux")]
    {
        let folder = if path.is_dir() {
            path.to_path_buf()
        } else {
            path.parent()
                .map(Path::to_path_buf)
                .ok_or_else(|| "No se encontró la ubicación del archivo.".to_string())?
        };
        std::process::Command::new("xdg-open")
            .arg(folder)
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("No se pudo abrir la carpeta: {error}"))
    }
}

#[cfg(target_os = "macos")]
fn file_is_dir(path: &Path) -> bool {
    path.is_dir()
}
