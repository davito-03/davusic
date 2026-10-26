// Modelos compartidos entre el backend y la interfaz.
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct Track {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub album_artist: String,
    #[serde(default)]
    pub year: Option<u32>,
    #[serde(default)]
    pub genre: String,
    #[serde(default)]
    pub duration: f64,
    #[serde(default)]
    pub path: String,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub accent: String,
    #[serde(default)]
    pub accent2: String,
    #[serde(default)]
    pub track_number: Option<u32>,
    #[serde(default)]
    pub disc_number: Option<u32>,
    #[serde(default)]
    pub format: String,
    #[serde(default)]
    pub sample_rate: u32,
    #[serde(default)]
    pub bit_depth: u32,
    #[serde(default)]
    pub album_id: String,
    #[serde(default)]
    pub artist_id: String,
    #[serde(default)]
    pub added_at: u64,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub uri: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct Album {
    pub id: String,
    pub title: String,
    pub artist: String,
    #[serde(default)]
    pub artist_id: String,
    #[serde(default)]
    pub year: Option<u32>,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub accent: String,
    #[serde(default)]
    pub accent2: String,
    #[serde(default)]
    pub genre: String,
    #[serde(default)]
    pub track_ids: Vec<String>,
    #[serde(default)]
    pub added_at: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct Artist {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub accent: String,
    #[serde(default)]
    pub accent2: String,
    #[serde(default)]
    pub genres: Vec<String>,
    #[serde(default)]
    pub track_ids: Vec<String>,
    #[serde(default)]
    pub album_count: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct FolderInfo {
    pub path: String,
    pub name: String,
    pub track_count: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct LibrarySnapshot {
    #[serde(default)]
    pub tracks: Vec<Track>,
    #[serde(default)]
    pub albums: Vec<Album>,
    #[serde(default)]
    pub artists: Vec<Artist>,
    #[serde(default)]
    pub folders: Vec<FolderInfo>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LibraryScanResult {
    pub library: LibrarySnapshot,
    pub added_tracks: usize,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct Config {
    #[serde(default)]
    pub folders: Vec<String>,
    #[serde(default)]
    pub wallpaper_dir: Option<String>,
    #[serde(default)]
    pub download_dir: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct UserCatalog {
    #[serde(default)]
    pub streams: Vec<serde_json::Value>,
    #[serde(default)]
    pub playlists: Vec<serde_json::Value>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PlaybackRequest {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub artist: String,
    #[serde(default)]
    pub album: String,
    #[serde(default)]
    pub duration: f64,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub path: String,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub accent: String,
    #[serde(default)]
    pub accent2: String,
    #[serde(default)]
    pub uri: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct PlayerSnapshot {
    #[serde(default)]
    pub playing: bool,
    #[serde(default)]
    pub position: f64,
    #[serde(default)]
    pub duration: f64,
    #[serde(default)]
    pub ended: bool,
    #[serde(default)]
    pub track_id: String,
    #[serde(default)]
    pub volume: f64,
    #[serde(default)]
    pub error: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct Palette {
    pub bg: String,
    pub bg_deep: String,
    pub bg_elev: String,
    pub text: String,
    pub text_soft: String,
    pub muted: String,
    pub faint: String,
    pub accent: String,
    pub accent2: String,
    pub wallpaper: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct WallpaperTheme {
    pub id: String,
    pub name: String,
    pub path: String,
    pub wallpaper: String,
    pub palette: Palette,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct WallpaperDiscovery {
    pub themes: Vec<WallpaperTheme>,
    pub folder: String,
    pub scanned: usize,
    pub message: String,
}

// ---------- Importación de playlists ----------

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct ImportedTrack {
    pub id: String,
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

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct ImportedPlaylist {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub tracks: Vec<ImportedTrack>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct ImportBundle {
    pub playlists: Vec<ImportedPlaylist>,
    #[serde(default)]
    pub warnings: Vec<String>,
    #[serde(default)]
    pub origin: String,
}

// ---------- Cuenta de Spotify ----------

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SpotifyStatus {
    #[serde(default)]
    pub configured: bool,
    #[serde(default)]
    pub connected: bool,
    #[serde(default)]
    pub client_id: String,
    #[serde(default)]
    pub display_name: String,
    #[serde(default)]
    pub account_id: String,
    #[serde(default)]
    pub image: String,
    #[serde(default)]
    pub product: String,
    #[serde(default)]
    pub redirect_uri: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SpotifyPlaylistSummary {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub owner: String,
    #[serde(default)]
    pub image: String,
    #[serde(default)]
    pub track_count: u32,
    #[serde(default)]
    pub importable: bool,
    #[serde(default)]
    pub collaborative: bool,
    #[serde(default)]
    pub public: bool,
    #[serde(default)]
    pub url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SpotifyPlaylistPage {
    #[serde(default)]
    pub items: Vec<SpotifyPlaylistSummary>,
    #[serde(default)]
    pub total: u32,
    #[serde(default)]
    pub next_offset: Option<u32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MatchCandidate {
    pub url: String,
    pub title: String,
    pub channel: String,
    pub duration: f64,
    pub score: i64,
    #[serde(default)]
    pub video_id: String,
    #[serde(default)]
    pub thumbnail: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct LyricsLine {
    pub t: f64,
    pub text: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct LyricsResult {
    #[serde(default)]
    pub found: bool,
    #[serde(default)]
    pub synced: bool,
    #[serde(default)]
    pub instrumental: bool,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub lines: Vec<LyricsLine>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct OnlineTrack {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub artist: String,
    #[serde(default)]
    pub album: String,
    #[serde(default)]
    pub duration: f64,
    #[serde(default)]
    pub uri: String,
    #[serde(default)]
    pub cover: String,
    #[serde(default)]
    pub source: String,
    #[serde(default)]
    pub format: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImportMatch {
    pub track_id: String,
    #[serde(default)]
    pub best: Option<MatchCandidate>,
    #[serde(default)]
    pub candidates: Vec<MatchCandidate>,
    #[serde(default)]
    pub error: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DownloadRequest {
    pub key: String,
    pub url: String,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub artist: String,
    #[serde(default)]
    pub playlist: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct DownloadedFile {
    pub key: String,
    pub path: String,
    pub title: String,
    pub artist: String,
    pub playlist: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DownloadResult {
    pub library: LibrarySnapshot,
    pub downloaded: Vec<DownloadedFile>,
    pub errors: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct YoutubeToolsStatus {
    pub ytdlp: bool,
    pub ytdlp_path: String,
    pub ffmpeg: bool,
    pub ffmpeg_path: String,
    pub download_dir: String,
    pub can_install: bool,
    pub message: String,
}
