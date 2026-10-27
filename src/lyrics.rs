// Letras en línea con LRCLIB: sincronizadas cuando existen, sin cuenta ni clave.
use std::fs;
use std::time::Duration;

use serde::Deserialize;

use crate::models::{LyricsLine, LyricsResult};
use crate::paths::{self, Paths};

const LRCLIB_GET: &str = "https://lrclib.net/api/get";
const LRCLIB_SEARCH: &str = "https://lrclib.net/api/search";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LrclibHit {
    #[serde(default)]
    track_name: String,
    #[serde(default)]
    artist_name: String,
    #[serde(default)]
    duration: f64,
    #[serde(default)]
    instrumental: bool,
    #[serde(default)]
    plain_lyrics: Option<String>,
    #[serde(default)]
    synced_lyrics: Option<String>,
}

pub fn fetch(
    paths: &Paths,
    title: &str,
    artist: &str,
    album: &str,
    duration: f64,
) -> Result<LyricsResult, String> {
    let title = title.trim();
    let artist = artist.trim();
    if title.is_empty() {
        return Err("No hay título para buscar la letra.".into());
    }
    let cache_key = format!(
        "{}|{}|{}",
        title.to_lowercase(),
        artist.to_lowercase(),
        duration.round() as i64
    );
    let cache_file = paths
        .lyrics
        .join(format!("{:016x}.json", paths::stable_hash(&cache_key)));
    if let Ok(raw) = fs::read_to_string(&cache_file) {
        if let Ok(cached) = serde_json::from_str::<LyricsResult>(&raw) {
            if cached.found || cached.source == "instrumental" {
                return Ok(cached);
            }
        }
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(18))
        .connect_timeout(Duration::from_secs(8))
        .user_agent(format!(
            "Davusic/{} (local-first music player; lrclib.net)",
            env!("CARGO_PKG_VERSION")
        ))
        .build()
        .map_err(|error| format!("No se pudo preparar la búsqueda de letra: {error}"))?;

    let mut result = match get_exact(&client, title, artist, album, duration) {
        Ok(Some(hit)) => hit_to_result(hit),
        Ok(None) => LyricsResult::not_found(),
        Err(error) => return Err(error),
    };
    if !result.found {
        if let Some(hit) = search_best(&client, title, artist, duration)? {
            result = hit_to_result(hit);
        }
    }

    let _ = fs::create_dir_all(&paths.lyrics);
    if let Ok(raw) = serde_json::to_string(&result) {
        let _ = fs::write(&cache_file, raw);
    }
    Ok(result)
}

fn get_exact(
    client: &reqwest::blocking::Client,
    title: &str,
    artist: &str,
    album: &str,
    duration: f64,
) -> Result<Option<LrclibHit>, String> {
    let mut url = format!(
        "{LRCLIB_GET}?track_name={}&artist_name={}",
        encode_query(title),
        encode_query(artist)
    );
    if !album.trim().is_empty() {
        url.push_str("&album_name=");
        url.push_str(&encode_query(album.trim()));
    }
    if duration > 1.0 {
        url.push_str(&format!("&duration={}", duration.round() as i64));
    }
    let response = client
        .get(&url)
        .send()
        .map_err(|error| format!("No se pudo consultar LRCLIB: {error}"))?;
    let status = response.status();
    if status.as_u16() == 404 {
        return Ok(None);
    }
    let body = response
        .text()
        .map_err(|error| format!("LRCLIB devolvió una respuesta ilegible: {error}"))?;
    if !status.is_success() {
        return Err(format!("LRCLIB no pudo buscar la letra ({status})."));
    }
    let hit = serde_json::from_str::<LrclibHit>(&body)
        .map_err(|_| "LRCLIB devolvió una letra que no se pudo leer.".to_string())?;
    Ok(Some(hit))
}

fn search_best(
    client: &reqwest::blocking::Client,
    title: &str,
    artist: &str,
    duration: f64,
) -> Result<Option<LrclibHit>, String> {
    let query = if artist.is_empty() {
        title.to_string()
    } else {
        format!("{artist} {title}")
    };
    let response = client
        .get(format!("{LRCLIB_SEARCH}?q={}", encode_query(&query)))
        .send()
        .map_err(|error| format!("No se pudo buscar la letra: {error}"))?;
    if !response.status().is_success() {
        return Ok(None);
    }
    let body = response
        .text()
        .map_err(|error| format!("LRCLIB devolvió una respuesta ilegible: {error}"))?;
    let hits: Vec<LrclibHit> = serde_json::from_str(&body).unwrap_or_default();
    let title_fold = fold(title);
    let artist_fold = fold(artist);
    let mut ranked: Vec<(i64, LrclibHit)> = hits
        .into_iter()
        .map(|hit| {
            let mut score = 0i64;
            let hit_title = fold(&hit.track_name);
            let hit_artist = fold(&hit.artist_name);
            if hit_title == title_fold {
                score += 40;
            } else if hit_title.contains(&title_fold) || title_fold.contains(&hit_title) {
                score += 22;
            }
            if !artist_fold.is_empty()
                && (hit_artist.contains(&artist_fold) || artist_fold.contains(&hit_artist))
            {
                score += 24;
            }
            if duration > 1.0 && hit.duration > 1.0 {
                let diff = (duration - hit.duration).abs();
                score += if diff <= 2.0 {
                    16
                } else if diff <= 8.0 {
                    8
                } else if diff <= 20.0 {
                    2
                } else {
                    -8
                };
            }
            if hit.synced_lyrics.as_deref().unwrap_or("").trim().is_empty() {
                score -= 4;
            }
            (score, hit)
        })
        .collect();
    ranked.sort_by(|a, b| b.0.cmp(&a.0));
    Ok(ranked
        .into_iter()
        .find(|(score, _)| *score >= 20)
        .map(|(_, hit)| hit))
}

fn hit_to_result(hit: LrclibHit) -> LyricsResult {
    if hit.instrumental {
        return LyricsResult {
            found: true,
            synced: false,
            instrumental: true,
            source: "LRCLIB".into(),
            lines: Vec::new(),
        };
    }
    let synced = hit
        .synced_lyrics
        .as_deref()
        .map(str::trim)
        .filter(|text| !text.is_empty())
        .map(parse_lrc)
        .filter(|lines| !lines.is_empty());
    if let Some(lines) = synced {
        return LyricsResult {
            found: true,
            synced: true,
            instrumental: false,
            source: "LRCLIB".into(),
            lines,
        };
    }
    let plain = hit
        .plain_lyrics
        .as_deref()
        .unwrap_or("")
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(|text| LyricsLine {
            t: -1.0,
            text: text.to_string(),
        })
        .collect::<Vec<_>>();
    if plain.is_empty() {
        return LyricsResult::not_found();
    }
    LyricsResult {
        found: true,
        synced: false,
        instrumental: false,
        source: "LRCLIB".into(),
        lines: plain,
    }
}

pub fn parse_lrc(raw: &str) -> Vec<LyricsLine> {
    let mut lines = Vec::new();
    for raw_line in raw.lines() {
        let line = raw_line.trim();
        if line.is_empty() {
            continue;
        }
        let mut stamps = Vec::new();
        let mut rest = line;
        loop {
            let Some(stripped) = rest.strip_prefix('[') else {
                break;
            };
            let Some(end) = stripped.find(']') else {
                break;
            };
            let stamp = &stripped[..end];
            rest = stripped[end + 1..].trim_start();
            if let Some(seconds) = parse_timestamp(stamp) {
                stamps.push(seconds);
            }
        }
        let text = rest.trim();
        if stamps.is_empty() || text.is_empty() {
            continue;
        }
        for t in stamps {
            lines.push(LyricsLine {
                t,
                text: text.to_string(),
            });
        }
    }
    lines.sort_by(|a, b| a.t.partial_cmp(&b.t).unwrap_or(std::cmp::Ordering::Equal));
    lines
}

fn parse_timestamp(value: &str) -> Option<f64> {
    if value.chars().any(|ch| ch.is_ascii_alphabetic()) {
        return None;
    }
    let (minutes, seconds) = value.split_once(':')?;
    let minutes: f64 = minutes.parse().ok()?;
    let seconds: f64 = seconds.parse().ok()?;
    Some(minutes * 60.0 + seconds)
}

fn encode_query(value: &str) -> String {
    let mut out = String::new();
    for byte in value.as_bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*byte as char);
            }
            b' ' => out.push_str("%20"),
            _ => out.push_str(&format!("%{byte:02X}")),
        }
    }
    out
}

fn fold(value: &str) -> String {
    value
        .chars()
        .map(|ch| match ch {
            'á' | 'à' | 'ä' | 'â' => 'a',
            'é' | 'è' | 'ë' | 'ê' => 'e',
            'í' | 'ì' | 'ï' | 'î' => 'i',
            'ó' | 'ò' | 'ö' | 'ô' => 'o',
            'ú' | 'ù' | 'ü' | 'û' => 'u',
            'ñ' => 'n',
            other => other,
        })
        .filter(|ch| ch.is_ascii_alphanumeric() || ch.is_whitespace())
        .collect::<String>()
        .to_lowercase()
}

impl LyricsResult {
    fn not_found() -> Self {
        Self {
            found: false,
            synced: false,
            instrumental: false,
            source: String::new(),
            lines: Vec::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_synced_lrc_with_repeated_stamps() {
        let lines =
            parse_lrc("[ar:Lúa]\n[00:12.00]La marea deja su rumor\n[00:20.50][00:41.00]Bajamar\n");
        assert_eq!(lines.len(), 3);
        assert!((lines[0].t - 12.0).abs() < 0.01);
        assert_eq!(lines[0].text, "La marea deja su rumor");
        assert!((lines[1].t - 20.5).abs() < 0.01);
        assert_eq!(lines[2].text, "Bajamar");
    }
}
