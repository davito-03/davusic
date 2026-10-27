// Davusic — punto de entrada de escritorio. La lógica vive en lib.rs para
// compartirla con las compilaciones móviles de Tauri.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    davusic_lib::run();
}
