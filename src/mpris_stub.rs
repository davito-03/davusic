// Integración MPRIS desactivada fuera de Linux. La API es la misma que la
// implementación real para que el resto del backend no necesite cfg.
use tauri::AppHandle;

use crate::audio::AudioHandle;

#[derive(Clone)]
pub struct MprisHandle;

impl MprisHandle {
    pub fn spawn(_app: AppHandle, _audio: AudioHandle) -> Self {
        Self
    }

    pub fn update_track(
        &self,
        _id: &str,
        _title: &str,
        _artist: &str,
        _album: &str,
        _duration: f64,
        _art_url: Option<String>,
    ) {
    }

    pub fn set_playing(&self, _playing: bool) {}

    pub fn set_position(&self, _seconds: f64) {}

    pub fn set_volume(&self, _value: f64) {}

    pub fn clear(&self) {}
}
