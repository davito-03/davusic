// Motor de audio nativo en un hilo dedicado.
use std::fs;
use std::io::BufReader;
use std::path::PathBuf;
use std::sync::mpsc::{self, Receiver, Sender};
use std::time::Duration;

use rodio::{Decoder, DeviceSinkBuilder, Player, Source};
use tauri::{AppHandle, Emitter};

use crate::models::{PlaybackRequest, PlayerSnapshot};
use crate::paths::Paths;

#[derive(Clone)]
pub struct AudioHandle {
    tx: Sender<AudioCmd>,
}

enum AudioCmd {
    Play {
        request: PlaybackRequest,
        reply: Sender<Result<f64, String>>,
    },
    Pause(Sender<Result<(), String>>),
    Resume(Sender<Result<(), String>>),
    Stop(Sender<Result<(), String>>),
    Seek {
        position: f64,
        reply: Sender<Result<(), String>>,
    },
    Volume {
        value: f32,
        reply: Sender<Result<(), String>>,
    },
    Query(Sender<PlayerSnapshot>),
}

impl AudioHandle {
    pub fn spawn(app: AppHandle, paths: Paths) -> Self {
        let (tx, rx) = mpsc::channel();
        std::thread::Builder::new()
            .name("davusic-audio".into())
            .spawn(move || audio_loop(app, paths, rx))
            .ok();
        Self { tx }
    }

    pub fn play(&self, request: PlaybackRequest) -> Result<f64, String> {
        let (tx, rx) = mpsc::channel();
        self.tx
            .send(AudioCmd::Play { request, reply: tx })
            .map_err(|_| "El motor de audio no está disponible.".to_string())?;
        rx.recv_timeout(Duration::from_secs(25))
            .map_err(|_| "El motor de audio tardó demasiado en responder.".to_string())?
    }

    pub fn pause(&self) -> Result<(), String> {
        self.simple(|reply| AudioCmd::Pause(reply))
    }

    pub fn resume(&self) -> Result<(), String> {
        self.simple(|reply| AudioCmd::Resume(reply))
    }

    pub fn stop(&self) -> Result<(), String> {
        self.simple(|reply| AudioCmd::Stop(reply))
    }

    fn simple(
        &self,
        make: impl FnOnce(Sender<Result<(), String>>) -> AudioCmd,
    ) -> Result<(), String> {
        let (tx, rx) = mpsc::channel();
        self.tx
            .send(make(tx))
            .map_err(|_| "El motor de audio no está disponible.".to_string())?;
        rx.recv_timeout(Duration::from_secs(6))
            .map_err(|_| "El motor de audio no respondió.".to_string())?
    }

    pub fn seek(&self, position: f64) -> Result<(), String> {
        let (tx, rx) = mpsc::channel();
        self.tx
            .send(AudioCmd::Seek {
                position,
                reply: tx,
            })
            .map_err(|_| "El motor de audio no está disponible.".to_string())?;
        rx.recv_timeout(Duration::from_secs(6))
            .map_err(|_| "El motor de audio no respondió.".to_string())?
    }

    pub fn volume(&self, value: f32) -> Result<(), String> {
        let (tx, rx) = mpsc::channel();
        self.tx
            .send(AudioCmd::Volume { value, reply: tx })
            .map_err(|_| "El motor de audio no está disponible.".to_string())?;
        rx.recv_timeout(Duration::from_secs(6))
            .map_err(|_| "El motor de audio no respondió.".to_string())?
    }

    pub fn snapshot(&self) -> PlayerSnapshot {
        let (tx, rx) = mpsc::channel();
        if self.tx.send(AudioCmd::Query(tx)).is_err() {
            return PlayerSnapshot::default();
        }
        rx.recv_timeout(Duration::from_secs(2)).unwrap_or_default()
    }
}

struct Playing {
    id: String,
    duration: f64,
    ended_pending: bool,
    last_playing: bool,
}

fn audio_loop(app: AppHandle, paths: Paths, rx: Receiver<AudioCmd>) {
    let sink = match DeviceSinkBuilder::open_default_sink() {
        Ok(sink) => sink,
        Err(error) => {
            let _ = app.emit(
                "playback-error",
                serde_json::json!({
                    "message": format!("No se pudo abrir la salida de audio: {error}")
                }),
            );
            while let Ok(cmd) = rx.recv() {
                match cmd {
                    AudioCmd::Play { reply, .. } => {
                        let _ = reply.send(Err("No hay salida de audio disponible.".into()));
                    }
                    AudioCmd::Pause(reply)
                    | AudioCmd::Resume(reply)
                    | AudioCmd::Stop(reply)
                    | AudioCmd::Seek { reply, .. }
                    | AudioCmd::Volume { reply, .. } => {
                        let _ = reply.send(Err("No hay salida de audio disponible.".into()));
                    }
                    AudioCmd::Query(reply) => {
                        let _ = reply.send(PlayerSnapshot {
                            error: Some("No hay salida de audio disponible.".into()),
                            ..Default::default()
                        });
                    }
                }
            }
            return;
        }
    };
    let player = Player::connect_new(sink.mixer());
    let mut volume: f32 = 1.0;
    let mut current: Option<Playing> = None;

    loop {
        match rx.recv_timeout(Duration::from_millis(120)) {
            Ok(AudioCmd::Play { request, reply }) => {
                let result = load_track(&paths, &player, &request, volume);
                match result {
                    Ok(duration) => {
                        let duration = if duration > 0.0 {
                            duration
                        } else {
                            request.duration
                        };
                        current = Some(Playing {
                            id: request.id,
                            duration,
                            ended_pending: false,
                            last_playing: true,
                        });
                        let _ = reply.send(Ok(duration));
                    }
                    Err(error) => {
                        let _ = app.emit("playback-error", serde_json::json!({ "message": error }));
                        let _ = reply.send(Err(error));
                    }
                }
            }
            Ok(AudioCmd::Pause(reply)) => {
                if player.empty() {
                    let _ = reply.send(Err("No hay una pista sonando.".into()));
                } else {
                    player.pause();
                    let _ = reply.send(Ok(()));
                }
            }
            Ok(AudioCmd::Resume(reply)) => {
                if player.empty() {
                    let _ = reply.send(Err("La pista ha terminado.".into()));
                } else {
                    player.play();
                    let _ = reply.send(Ok(()));
                }
            }
            Ok(AudioCmd::Stop(reply)) => {
                player.clear();
                current = None;
                let _ = reply.send(Ok(()));
            }
            Ok(AudioCmd::Seek { position, reply }) => {
                let duration = Duration::from_secs_f64(position.max(0.0));
                match player.try_seek(duration) {
                    Ok(()) => {
                        if let Some(info) = current.as_mut() {
                            info.ended_pending = false;
                            info.last_playing = !player.empty();
                        }
                        let _ = reply.send(Ok(()));
                    }
                    Err(error) => {
                        let _ = reply.send(Err(format!("No se pudo avanzar: {error}")));
                    }
                }
            }
            Ok(AudioCmd::Volume { value, reply }) => {
                volume = value.clamp(0.0, 2.0);
                player.set_volume(volume);
                let _ = reply.send(Ok(()));
            }
            Ok(AudioCmd::Query(reply)) => {
                let mut snapshot = snapshot_of(&player, current.as_mut(), volume);
                if let Some(info) = current.as_mut() {
                    if info.ended_pending {
                        snapshot.ended = true;
                        info.ended_pending = false;
                    }
                }
                let _ = reply.send(snapshot);
            }
            Err(mpsc::RecvTimeoutError::Timeout) => {
                if let Some(info) = current.as_mut() {
                    let empty = player.empty();
                    let playing = !empty && !player.is_paused();
                    if empty && info.last_playing {
                        info.ended_pending = true;
                        info.last_playing = false;
                        let _ = app.emit(
                            "playback-ended",
                            serde_json::json!({ "track_id": info.id, "duration": info.duration }),
                        );
                    } else if playing {
                        info.last_playing = true;
                    }
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
}

fn snapshot_of(player: &Player, current: Option<&mut Playing>, volume: f32) -> PlayerSnapshot {
    let empty = player.empty();
    let position = player.get_pos().as_secs_f64();
    let duration = current.as_ref().map(|c| c.duration).unwrap_or(0.0);
    PlayerSnapshot {
        playing: !empty && !player.is_paused(),
        position: if empty && duration > 0.0 {
            duration
        } else {
            position
        },
        duration,
        ended: false,
        track_id: current.map(|c| c.id.clone()).unwrap_or_default(),
        volume: f64::from(volume),
        error: None,
    }
}

fn load_track(
    paths: &Paths,
    player: &Player,
    request: &PlaybackRequest,
    volume: f32,
) -> Result<f64, String> {
    if request.path.trim().is_empty() {
        return Err("La pista no tiene una ruta de audio.".into());
    }
    let file_path = if request.source == "demo" {
        materialize_demo(paths, &request.path)?
    } else {
        let path = PathBuf::from(&request.path);
        if !path.is_file() {
            return Err(format!("No se encuentra el archivo: {}", request.path));
        }
        path
    };

    let file = fs::File::open(&file_path)
        .map_err(|error| format!("No se pudo abrir el archivo: {error}"))?;
    let decoder = Decoder::try_from(BufReader::with_capacity(256 * 1024, file))
        .map_err(|error| format!("Formato de audio no reconocido: {error}"))?;
    let duration = decoder
        .total_duration()
        .map(|d| d.as_secs_f64())
        .unwrap_or(0.0);

    player.clear();
    player.set_volume(volume.clamp(0.0, 2.0));
    player.append(decoder);
    player.play();
    Ok(duration)
}

fn materialize_demo(paths: &Paths, raw: &str) -> Result<PathBuf, String> {
    let name = PathBuf::from(raw)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    let bytes = demo_audio_bytes(&name)
        .ok_or_else(|| format!("La pista de demostración «{name}» no está incluida."))?;
    let target = paths.demo_audio.join(&name);
    if !target.is_file() || fs::metadata(&target).map(|m| m.len()).unwrap_or(0) == 0 {
        fs::write(&target, bytes)
            .map_err(|error| format!("No se pudo preparar la demo: {error}"))?;
    }
    Ok(target)
}

fn demo_audio_bytes(name: &str) -> Option<&'static [u8]> {
    Some(match name {
        "bajamar.ogg" => include_bytes!("../frontend/assets/audio/bajamar.ogg").as_slice(),
        "sal-y-miel.ogg" => include_bytes!("../frontend/assets/audio/sal-y-miel.ogg").as_slice(),
        "kilometro-cero.ogg" => {
            include_bytes!("../frontend/assets/audio/kilometro-cero.ogg").as_slice()
        }
        "viento-sur.ogg" => include_bytes!("../frontend/assets/audio/viento-sur.ogg").as_slice(),
        "medianoche.ogg" => include_bytes!("../frontend/assets/audio/medianoche.ogg").as_slice(),
        "cromo.ogg" => include_bytes!("../frontend/assets/audio/cromo.ogg").as_slice(),
        "aguas-lentas.ogg" => {
            include_bytes!("../frontend/assets/audio/aguas-lentas.ogg").as_slice()
        }
        "polen.ogg" => include_bytes!("../frontend/assets/audio/polen.ogg").as_slice(),
        "via-88.ogg" => include_bytes!("../frontend/assets/audio/via-88.ogg").as_slice(),
        _ => return None,
    })
}
