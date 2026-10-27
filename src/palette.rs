// Extracción de color a partir de carátulas y wallpapers.
use image::{DynamicImage, GenericImageView};

#[derive(Clone, Copy, Debug)]
struct Hsv {
    h: f64,
    s: f64,
    v: f64,
}

#[derive(Clone, Copy, Debug)]
struct Rgb {
    r: f64,
    g: f64,
    b: f64,
}

#[derive(Clone, Copy, Debug)]
struct Cluster {
    h: f64,
    s: f64,
    v: f64,
    count: f64,
}

#[derive(Clone, Debug)]
pub struct Extracted {
    pub accent: String,
    pub accent2: String,
    pub hue: f64,
    pub saturation: f64,
}

fn rgb_to_hsv(c: Rgb) -> Hsv {
    let max = c.r.max(c.g).max(c.b);
    let min = c.r.min(c.g).min(c.b);
    let delta = max - min;
    let mut h = if delta <= f64::EPSILON {
        0.0
    } else if (max - c.r).abs() < f64::EPSILON {
        60.0 * (((c.g - c.b) / delta) % 6.0)
    } else if (max - c.g).abs() < f64::EPSILON {
        60.0 * ((c.b - c.r) / delta + 2.0)
    } else {
        60.0 * ((c.r - c.g) / delta + 4.0)
    };
    if h < 0.0 {
        h += 360.0;
    }
    Hsv {
        h,
        s: if max <= f64::EPSILON {
            0.0
        } else {
            delta / max
        },
        v: max,
    }
}

fn hsv_to_rgb(h: f64, s: f64, v: f64) -> (u8, u8, u8) {
    let h = h.rem_euclid(360.0);
    let c = v * s;
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs());
    let m = v - c;
    let (r, g, b) = if h < 60.0 {
        (c, x, 0.0)
    } else if h < 120.0 {
        (x, c, 0.0)
    } else if h < 180.0 {
        (0.0, c, x)
    } else if h < 240.0 {
        (0.0, x, c)
    } else if h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };
    (
        ((r + m).clamp(0.0, 1.0) * 255.0).round() as u8,
        ((g + m).clamp(0.0, 1.0) * 255.0).round() as u8,
        ((b + m).clamp(0.0, 1.0) * 255.0).round() as u8,
    )
}

pub fn hex(rgb: (u8, u8, u8)) -> String {
    format!("#{:02x}{:02x}{:02x}", rgb.0, rgb.1, rgb.2)
}

fn hsl_hex(h: f64, s: f64, l: f64) -> String {
    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - ((h / 60.0).rem_euclid(2.0) - 1.0).abs());
    let m = l - c / 2.0;
    let (r, g, b) = if h < 60.0 {
        (c, x, 0.0)
    } else if h < 120.0 {
        (x, c, 0.0)
    } else if h < 180.0 {
        (0.0, c, x)
    } else if h < 240.0 {
        (0.0, x, c)
    } else if h < 300.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };
    hex((
        ((r + m + 0.5) * 255.0).round() as u8,
        ((g + m + 0.5) * 255.0).round() as u8,
        ((b + m + 0.5) * 255.0).round() as u8,
    ))
}

fn hue_distance(a: f64, b: f64) -> f64 {
    let d = (a - b).abs() % 360.0;
    d.min(360.0 - d)
}

fn clusters(image: &DynamicImage) -> Vec<Cluster> {
    let (w, h) = image.dimensions();
    if w == 0 || h == 0 {
        return Vec::new();
    }
    // 32×32 es suficiente para estimar la paleta y evita recorrer imágenes enormes.
    let small = image.resize(48, 48, image::imageops::FilterType::Triangle);
    let mut buckets: Vec<(f64, f64, f64, f64)> = vec![(0.0, 0.0, 0.0, 0.0); 24 * 4 * 4];
    let mut total = 0.0;
    for (_, _, px) in small.pixels() {
        let [r, g, b, a] = px.0;
        if a < 24 {
            continue;
        }
        let c = rgb_to_hsv(Rgb {
            r: r as f64 / 255.0,
            g: g as f64 / 255.0,
            b: b as f64 / 255.0,
        });
        // Ignorar casi negros y casi blancos para elegir el acento.
        let hb = ((c.h / 15.0).floor() as usize) % 24;
        let sb = ((c.s * 4.0).floor() as usize).min(3);
        let vb = ((c.v * 4.0).floor() as usize).min(3);
        let weight = 0.25 + c.s * 0.9 + (1.0 - (c.v - 0.6).abs()) * 0.35;
        let idx = hb * 16 + sb * 4 + vb;
        let slot = &mut buckets[idx];
        slot.0 += c.h * weight;
        slot.1 += c.s * weight;
        slot.2 += c.v * weight;
        slot.3 += weight;
        total += weight;
    }
    let mut out = Vec::new();
    for (hsum, ssum, vsum, count) in buckets {
        if count <= 0.0 {
            continue;
        }
        out.push(Cluster {
            h: hsum / count,
            s: ssum / count,
            v: vsum / count,
            count: count / total.max(0.0001),
        });
    }
    out.sort_by(|a, b| b.count.total_cmp(&a.count));
    out
}

fn pick_accent(clusters: &[Cluster], skip_hue: Option<f64>) -> Option<Cluster> {
    let mut candidates: Vec<(f64, Cluster)> = clusters
        .iter()
        .copied()
        .filter(|c| c.count > 0.004 && c.s > 0.16 && c.v > 0.12 && c.v < 0.96)
        .filter(|c| match skip_hue {
            Some(h) => hue_distance(c.h, h) > 42.0,
            None => true,
        })
        .map(|c| {
            let hue_penalty = if (20.0..45.0).contains(&c.h) || c.h > 345.0 {
                0.85
            } else {
                1.0
            };
            let focus = (-((c.v - 0.62).powi(2)) / 0.13).exp();
            let score = c.count.sqrt() * (0.35 + c.s) * (0.55 + focus) * hue_penalty;
            (score, c)
        })
        .collect();
    candidates.sort_by(|a, b| b.0.total_cmp(&a.0));
    candidates.first().map(|(_, c)| *c)
}

fn vivid(c: Option<Cluster>, fallback_hue: f64) -> (f64, String) {
    match c {
        Some(c) => {
            let s = c.s.clamp(0.42, 0.78);
            let h = c.h;
            (h, {
                let lightness = (0.55 + c.v * 0.16).clamp(0.56, 0.74);
                let rgb = hsv_to_rgb(h, s, (lightness * 1.45).min(0.95));
                hex(rgb)
            })
        }
        None => (fallback_hue, hsl_hex(fallback_hue, 0.62, 0.68)),
    }
}

pub fn extract(image: &DynamicImage, fallback_hue: f64) -> Extracted {
    let clusters = clusters(image);
    let dominant = clusters.first().copied();
    let accent_cluster = pick_accent(&clusters, None);
    let hue = accent_cluster
        .map(|c| c.h)
        .or_else(|| dominant.map(|c| c.h))
        .unwrap_or(fallback_hue);
    let (accent_hue, accent) = vivid(accent_cluster, fallback_hue);
    let second = pick_accent(&clusters, Some(accent_hue));
    let (_, accent2) = vivid(second, (accent_hue + 150.0) % 360.0);
    Extracted {
        accent,
        accent2,
        hue,
        saturation: dominant.map(|c| c.s).unwrap_or(0.4),
    }
}

pub fn cover_colors(image: &DynamicImage) -> (String, String) {
    let ex = extract(image, 18.0);
    (ex.accent, ex.accent2)
}

pub fn wallpaper_palette(image: &DynamicImage) -> crate::models::Palette {
    let ex = extract(image, 265.0);
    let hue = ex.hue;
    // La interfaz es siempre oscura, pero hereda el color y la temperatura del wallpaper.
    let bg = hsl_hex(hue, (0.16 + ex.saturation * 0.38).clamp(0.16, 0.48), 0.052);
    let bg_deep = hsl_hex(hue, (0.18 + ex.saturation * 0.34).clamp(0.16, 0.46), 0.032);
    let bg_elev = hsl_hex(hue, (0.12 + ex.saturation * 0.3).clamp(0.1, 0.38), 0.082);
    let text = hsl_hex((hue + 18.0) % 360.0, 0.28, 0.95);
    let text_soft = hsl_hex((hue + 12.0) % 360.0, 0.2, 0.82);
    let muted = hsl_hex(hue, 0.12, 0.60);
    let faint = hsl_hex(hue, 0.1, 0.43);
    crate::models::Palette {
        bg,
        bg_deep,
        bg_elev,
        text,
        text_soft,
        muted,
        faint,
        accent: ex.accent,
        accent2: ex.accent2,
        wallpaper: String::new(),
    }
}
