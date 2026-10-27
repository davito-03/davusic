// Diálogos nativos de archivos. En Android no hay selector de carpetas en el
// plugin de Tauri y el almacenamiento se gestiona con SAF, así que de momento
// estas funciones devuelven None en esa plataforma.
use std::path::PathBuf;

pub type Filter = (&'static str, &'static [&'static str]);

#[cfg(not(target_os = "android"))]
pub fn pick_folder(title: &str) -> Option<PathBuf> {
    rfd::FileDialog::new().set_title(title).pick_folder()
}

#[cfg(target_os = "android")]
pub fn pick_folder(_title: &str) -> Option<PathBuf> {
    None
}

#[cfg(not(target_os = "android"))]
pub fn pick_file(title: &str, filters: &[Filter]) -> Option<PathBuf> {
    let mut dialog = rfd::FileDialog::new().set_title(title);
    for (label, extensions) in filters {
        dialog = dialog.add_filter(*label, extensions);
    }
    dialog.pick_file()
}

#[cfg(target_os = "android")]
pub fn pick_file(_title: &str, _filters: &[Filter]) -> Option<PathBuf> {
    None
}

#[cfg(not(target_os = "android"))]
pub fn save_file(title: &str, suggested: &str, filters: &[Filter]) -> Option<PathBuf> {
    let mut dialog = rfd::FileDialog::new()
        .set_title(title)
        .set_file_name(suggested);
    for (label, extensions) in filters {
        dialog = dialog.add_filter(*label, extensions);
    }
    dialog.save_file()
}

#[cfg(target_os = "android")]
pub fn save_file(_title: &str, _suggested: &str, _filters: &[Filter]) -> Option<PathBuf> {
    None
}
