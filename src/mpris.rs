// Servidor MPRIS en un hilo local (Rc/LocalServer no son Send).
use std::future;
use std::hash::{Hash, Hasher};
use std::rc::Rc;

use async_std::channel::{unbounded, Receiver, Sender};
use mpris_server::{LoopStatus, Metadata, PlaybackStatus, Player, Time, TrackId};
use tauri::{AppHandle, Emitter};

use crate::audio::AudioHandle;

#[derive(Clone)]
pub struct MprisHandle {
    tx: Sender<MprisCmd>,
    enabled: bool,
}

enum MprisCmd {
    Metadata {
        track_id: String,
        title: String,
        artist: String,
        album: String,
        duration: f64,
        art_url: Option<String>,
    },
    Status(bool),
    Position(f64),
    Volume(f64),
    Clear,
}

impl MprisHandle {
    pub fn spawn(app: AppHandle, audio: AudioHandle) -> Self {
        let (tx, rx) = unbounded();
        let thread_tx = tx.clone();
        let enabled = std::thread::Builder::new()
            .name("davusic-mpris".into())
            .spawn(move || {
                async_std::task::block_on(async move {
                    let player = match Player::builder("io.github.davo.davusic")
                        .identity("Davusic")
                        .desktop_entry("davusic")
                        .can_play(true)
                        .can_pause(true)
                        .can_go_next(true)
                        .can_go_previous(true)
                        .can_seek(true)
                        .can_control(true)
                        .build()
                        .await
                    {
                        Ok(player) => player,
                        Err(_) => return,
                    };

                    {
                        let app = app.clone();
                        player.connect_play(move |_| emit_action(&app, "play"));
                    }
                    {
                        let app = app.clone();
                        player.connect_pause(move |_| emit_action(&app, "pause"));
                    }
                    {
                        let app = app.clone();
                        player.connect_play_pause(move |_| emit_action(&app, "playpause"));
                    }
                    {
                        let app = app.clone();
                        player.connect_next(move |_| emit_action(&app, "next"));
                    }
                    {
                        let app = app.clone();
                        player.connect_previous(move |_| emit_action(&app, "previous"));
                    }
                    {
                        let app = app.clone();
                        player.connect_stop(move |_| emit_action(&app, "stop"));
                    }
                    {
                        let app = app.clone();
                        player.connect_set_position(
                            move |_: &Player, _track: &mpris_server::TrackId, position: Time| {
                                let seconds = position.as_micros() as f64 / 1_000_000.0;
                                let _ = app.emit(
                                    "mpris-action",
                                    serde_json::json!({ "action": "seek", "position": seconds }),
                                );
                            },
                        );
                    }
                    {
                        let audio = audio.clone();
                        let app = app.clone();
                        player.connect_set_volume(move |_: &Player, volume: f64| {
                            let _ = audio.volume(volume.clamp(0.0, 1.0) as f32);
                            let _ = app.emit(
                                "mpris-volume",
                                serde_json::json!({ "volume": volume.clamp(0.0, 1.0) }),
                            );
                        });
                    }
                    {
                        let app = app.clone();
                        player.connect_set_loop_status(move |_: &Player, status: LoopStatus| {
                            let action = match status {
                                LoopStatus::None => "loop-off",
                                LoopStatus::Track => "loop-one",
                                LoopStatus::Playlist => "loop-all",
                            };
                            emit_action(&app, action);
                        });
                    }
                    {
                        let app = app.clone();
                        player.connect_set_shuffle(move |_: &Player, shuffle: bool| {
                            emit_action(&app, if shuffle { "shuffle-on" } else { "shuffle-off" });
                        });
                    }

                    let shared: Rc<Player> = Rc::new(player);
                    let command_player = shared.clone();
                    async_std::task::spawn_local(async move {
                        command_loop(rx, command_player).await;
                    });
                    async_std::task::spawn_local(shared.run());
                    future::pending::<()>().await;
                });
            })
            .is_ok();
        if !enabled {
            let _ = thread_tx.try_send(MprisCmd::Clear);
        }
        Self { tx, enabled }
    }

    pub fn update_track(
        &self,
        id: &str,
        title: &str,
        artist: &str,
        album: &str,
        duration: f64,
        art_url: Option<String>,
    ) {
        self.send(MprisCmd::Metadata {
            track_id: id.to_string(),
            title: title.to_string(),
            artist: artist.to_string(),
            album: album.to_string(),
            duration,
            art_url,
        });
    }

    pub fn set_playing(&self, playing: bool) {
        self.send(MprisCmd::Status(playing));
    }

    pub fn set_position(&self, seconds: f64) {
        self.send(MprisCmd::Position(seconds));
    }

    pub fn set_volume(&self, value: f64) {
        self.send(MprisCmd::Volume(value));
    }

    pub fn clear(&self) {
        self.send(MprisCmd::Clear);
    }

    fn send(&self, cmd: MprisCmd) {
        if self.enabled {
            let _ = self.tx.try_send(cmd);
        }
    }
}

async fn command_loop(rx: Receiver<MprisCmd>, player: Rc<Player>) {
    while let Ok(cmd) = rx.recv().await {
        match cmd {
            MprisCmd::Metadata {
                track_id,
                title,
                artist,
                album,
                duration,
                art_url,
            } => {
                let path = track_path(&track_id);
                let mut metadata = Metadata::builder().trackid(path).title(title).album(album);
                if !artist.trim().is_empty() {
                    metadata = metadata.artist([artist]);
                }
                if duration > 0.0 {
                    metadata = metadata.length(Time::from_millis((duration * 1000.0) as i64));
                }
                if let Some(art_url) = art_url {
                    metadata = metadata.art_url(art_url);
                }
                let _ = player.set_metadata(metadata.build()).await;
                let _ = player.set_playback_status(PlaybackStatus::Playing).await;
            }
            MprisCmd::Status(playing) => {
                let _ = player
                    .set_playback_status(if playing {
                        PlaybackStatus::Playing
                    } else {
                        PlaybackStatus::Paused
                    })
                    .await;
            }
            MprisCmd::Position(seconds) => {
                player.set_position(Time::from_millis((seconds.max(0.0) * 1000.0) as i64));
            }
            MprisCmd::Volume(value) => {
                let _ = player.set_volume(value).await;
            }
            MprisCmd::Clear => {
                let _ = player.set_metadata(Metadata::new()).await;
                let _ = player.set_playback_status(PlaybackStatus::Stopped).await;
            }
        }
    }
}

fn track_path(id: &str) -> TrackId {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    id.hash(&mut hasher);
    let path = format!("/io/github/davo/davusic/track/{:016x}", hasher.finish());
    TrackId::try_from(path).unwrap_or(TrackId::NO_TRACK)
}

fn emit_action(app: &AppHandle, action: &str) {
    let _ = app.emit("mpris-action", serde_json::json!({ "action": action }));
}
