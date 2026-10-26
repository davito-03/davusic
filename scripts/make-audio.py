#!/usr/bin/env python3
"""
Genera las pistas instrumentales originales de demostración de Davusic.
Síntesis aditiva, percusión, delays y mastering sencillo; todo el material
es original y se publica con la aplicación.
"""
from pathlib import Path
import math
import subprocess
import wave

import numpy as np

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "assets" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
rng_global = np.random.default_rng(20261025)


def midi(n):
    return 440.0 * 2.0 ** ((n - 69) / 12.0)


def smoothstep(x):
    return x * x * (3.0 - 2.0 * x)


def adsr(n, attack, decay, sustain, release, curve=2.0):
    a = max(1, int(attack * SR))
    d = max(1, int(decay * SR))
    r = max(1, int(release * SR))
    a = min(a, n)
    d = min(d, max(1, n - a))
    r = min(r, max(1, n - a - d))
    s = max(0, n - a - d - r)
    env = np.empty(n, dtype=np.float64)
    env[:a] = np.linspace(0, 1, a) ** (1.0 / max(curve, .1))
    if d:
        env[a:a + d] = np.linspace(1, sustain, d) ** curve
    if s:
        env[a + d:a + d + s] = sustain
    if r:
        env[-r:] = sustain * np.linspace(1, 0, r) ** curve
    return np.clip(env, 0, 1)


def pan_add(buf, sig, start, gain=1.0, pan=0.0, width=0.0):
    n = len(sig)
    if start >= buf.shape[0]:
        return
    end = min(buf.shape[0], start + n)
    if end <= start:
        return
    sig = sig[: end - start]
    theta = (np.clip(pan, -1, 1) + 1.0) * math.pi / 4.0
    gl = math.cos(theta) * gain
    gr = math.sin(theta) * gain
    # Pequeña decorrelación estéreo para dar anchura sin perder centro.
    if width:
        shifted = np.roll(sig, max(1, int(width * SR)))
        shifted[: max(1, int(width * SR))] = 0
        buf[start:end, 0] += (sig * (1 - width) + shifted * width) * gl
        buf[start:end, 1] += (shifted * (1 - width) + sig * width) * gr
    else:
        buf[start:end, 0] += sig * gl
        buf[start:end, 1] += sig * gr


def additive_tone(freq, dur, harmonics=(1.0, .34, .16, .08, .035), detune=.0013,
                  vibrato=.0017, vib_rate=.22, phase_seed=0.0):
    n = int(dur * SR)
    t = np.arange(n, dtype=np.float64) / SR
    drift = 1.0 + detune * np.sin(2 * np.pi * .071 * t + phase_seed)
    vib = 1.0 + vibrato * np.sin(2 * np.pi * vib_rate * t + phase_seed * 1.7)
    sig = np.zeros(n)
    for i, amp in enumerate(harmonics, start=1):
        if not amp:
            continue
        ph = (2 * np.pi * freq * i * np.cumsum(drift * vib) / SR
              + phase_seed * (1.3 + i * .31))
        sig += amp * np.sin(ph)
    return sig / max(1e-9, np.max(np.abs(sig)))


def pad_chord(buf, notes, start, dur, gain, attack, release, bright=.7, pan_spread=.75):
    for j, note in enumerate(notes):
        n = int(dur * SR)
        env = adsr(n, attack, dur * .18, .72, release, 1.4)
        f = midi(note)
        tone = additive_tone(f, dur, harmonics=(1, .46, .23 * bright, .12 * bright, .05), detune=.002, phase_seed=j * 1.618)
        # Respiración lenta del filtro: refuerza las octavas altas en el centro del acorde.
        t = np.arange(n) / SR
        air = .08 * np.sin(2 * np.pi * .035 * t + j)
        tone *= env * (1 + air)
        pan = (j / max(1, len(notes) - 1) - .5) * 2 * pan_spread
        pan_add(buf, tone, start, gain, pan, .03)


def pluck(freq, dur, gain=1.0, brightness=.65, seed=0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t * (2.4 + 4.8 / max(.08, dur)))
    env *= np.minimum(1, t / .004)
    # FM ligera + armónicos impares; evita el sonido de seno puro.
    mod = np.sin(2 * np.pi * freq * 2.002 * t + seed) * (1.4 * brightness)
    sig = np.sin(2 * np.pi * freq * t + mod)
    sig += .38 * np.sin(2 * np.pi * freq * 2 * t + .6) * env
    sig += .16 * np.sin(2 * np.pi * freq * 3.01 * t + 1.2)
    return sig * env * gain


def bass_note(dur, freq, gain=1.0, drive=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = adsr(n, .008, .12, .72, min(.18, dur * .35), 1.8)
    sig = np.sin(2 * np.pi * freq * t)
    sig += .34 * np.sin(2 * np.pi * freq * 2 * t + .1)
    sig += .12 * np.sin(2 * np.pi * freq * 3 * t + .3)
    sig = np.tanh(sig * drive) * env * gain
    return sig


def kick(dur=.5, gain=1.0, low=47.0, punch=155.0, seed=0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t * 8.4) * np.minimum(1, t / .002)
    sweep = low + (punch - low) * np.exp(-t * 32)
    sig = np.sin(2 * np.pi * np.cumsum(sweep) / SR)
    click = rng_global.standard_normal(n) * np.exp(-t * 150) * .018
    return np.tanh((sig + click) * 1.5) * env * gain


def snare(dur=.26, gain=1.0, seed=0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.exp(-t * 22) * np.minimum(1, t / .002)
    noise = rng_global.standard_normal(n)
    noise = np.diff(np.concatenate([[0], noise]))  # high-pass barato
    noise = noise - .45 * np.roll(noise, 1)
    body = np.sin(2 * np.pi * 186 * t) * np.exp(-t * 17) * .28
    return (noise * .38 + body) * env * gain


def hat(dur=.055, gain=1.0, open_=False):
    n = int((.18 if open_ else dur) * SR)
    t = np.arange(n) / SR
    env = np.exp(-t * (16 if open_ else 52)) * np.minimum(1, t / .001)
    noise = rng_global.standard_normal(n)
    noise = np.diff(np.concatenate([[0], noise]))
    noise = noise - np.roll(noise, 1)
    return noise * env * .12 * gain


def clap(dur=.28, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for d, a in [(0, 1.0), (.028, .8), (.056, .7), (.08, .55)]:
        i = int(d * SR)
        if i < n:
            env[i:] += a * np.exp(-(t[:n - i]) * 26)
    noise = rng_global.standard_normal(n)
    noise = noise - .4 * np.roll(noise, 1)
    return noise * env * .11 * gain


def rim(dur=.08, gain=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 820 * t) + .4 * rng_global.standard_normal(n)) * np.exp(-t * 72) * .08 * gain


def vinyl(dur, amount=.02):
    n = int(dur * SR)
    t = np.arange(n) / SR
    crackle = np.zeros(n)
    count = int(dur * 28)
    idx = rng_global.integers(0, n, count)
    crackle[idx] = rng_global.standard_normal(count) * rng_global.uniform(.2, 1.0, count)
    kernel = np.exp(-np.arange(int(.004 * SR)) / (SR * .0011))
    crackle = np.convolve(crackle, kernel, mode="same")[:n]
    hiss = rng_global.standard_normal(n) * .006
    wow = .5 + .5 * np.sin(2 * np.pi * .3 * t)
    return (crackle * .35 + hiss) * amount * (0.7 + .3 * wow)


def ambience(sig, amount=.24, lp=1):
    """Reverb de tipo multi-tap, suave y estéreo."""
    out = sig.copy()
    for delay_ms, gain, spread in [(79, .24, -0.3), (127, .19, .35), (191, .14, -.2), (311, .09, .25), (487, .055, 0)]:
        d = int(delay_ms * SR / 1000)
        if d >= len(sig):
            continue
        wet = sig[:-d].copy()
        for _ in range(lp):
            wet = .5 * (wet + np.roll(wet, 1))
        out[d:, 0] += wet[:, 0] * gain * (1 - max(0, spread))
        out[d:, 1] += wet[:, 1] * gain * (1 + min(0, spread))
    return out * amount + sig * (1 - amount)


def delay(sig, time_s=.34, feedback=.28, mix=.2, pingpong=True):
    out = sig.copy()
    d = int(time_s * SR)
    if d <= 0:
        return sig
    for i in range(1, 5):
        sh = d * i
        if sh >= len(sig):
            break
        k = feedback ** (i - 1)
        src = sig[:-sh]
        if pingpong and i % 2:
            out[sh:, 1] += src[:, 0] * mix * k
        elif pingpong:
            out[sh:, 0] += src[:, 1] * mix * k
        else:
            out[sh:] += src * mix * k
    return out


def stereo_tone(mono, pan=0):
    theta = (pan + 1) * math.pi / 4
    return np.column_stack([mono * math.cos(theta), mono * math.sin(theta)])


def normalize_master(buf, peak=.91, fade_in=1.5, fade_out=5.0):
    n = len(buf)
    fi = min(n, int(fade_in * SR))
    fo = min(n, int(fade_out * SR))
    env = np.ones(n)
    env[:fi] = smoothstep(np.linspace(0, 1, fi))
    env[-fo:] *= smoothstep(np.linspace(1, 0, fo))
    buf *= env[:, None]
    # Compresión suave y limitador final.
    buf = np.tanh(buf * 1.32) / 1.32
    m = float(np.max(np.abs(buf)))
    if m > 0:
        buf *= peak / m
    return np.clip(buf, -1, 1)


class Song:
    def __init__(self, name, seconds, bpm, chords, root, kind="ambient"):
        self.name = name
        self.seconds = seconds
        self.bpm = bpm
        self.beat = 60.0 / bpm
        self.bar = self.beat * 4
        self.chords = chords
        self.root = root
        self.kind = kind
        self.n = int(seconds * SR)
        self.buf = np.zeros((self.n, 2), dtype=np.float64)
        self.lead_bus = np.zeros_like(self.buf)
        self.arp_bus = np.zeros_like(self.buf)
        self.drum_bus = np.zeros_like(self.buf)

    def at(self, beat, bars=0):
        return int((beat * self.beat + bars * self.bar) * SR)

    def progression(self):
        return [self.chords[i % len(self.chords)] for i in range(int(self.seconds / self.bar) + 2)]

    def add_pads(self, start_bar=0, end_bar=None, gain=.13, bright=.6, attack=2.0, release=2.3):
        if end_bar is None:
            end_bar = int(self.seconds / self.bar)
        for bar in range(start_bar, end_bar):
            chord = self.chords[bar % len(self.chords)]
            notes = [self.root + 12 + x for x in chord]  # register centered
            start = self.at(0, bar)
            pad_chord(self.buf, notes, start, self.bar + release, gain, attack, release, bright)
            # octava superior muy tenue
            pad_chord(self.buf, [n + 12 for n in notes[:3]], start, self.bar * .96, gain * .17, attack * 1.6, release, bright * .8)

    def add_bass(self, start_bar=0, style="pulse", gain=.12):
        end_bar = int(self.seconds / self.bar)
        for bar in range(start_bar, end_bar):
            chord = self.chords[bar % len(self.chords)]
            root = self.root + chord[0]
            if style == "pulse":
                for b in [0, 1.5, 2.5, 3.5]:
                    f = midi(root - 12 + (0 if b in (0, 2.5) else 7))
                    n = bass_note(self.beat * (.45 if b != 0 else .75), f, gain)
                    pan_add(self.buf, n, self.at(b, bar), 1, -.08)
            elif style == "long":
                n = bass_note(self.bar * .92, midi(root - 12), gain, .8)
                pan_add(self.buf, n, self.at(0, bar), 1, 0)
            elif style == "walk":
                seq = [root, root + 7, root + 12, root + 7]
                for b in range(4):
                    n = bass_note(self.beat * .7, midi(seq[b] - 12), gain)
                    pan_add(self.buf, n, self.at(b, bar), 1, 0)

    def add_arp(self, start_bar=0, gain=.065, pattern=(0, 2, 1, 3, 2, 4, 1, 3), note_beats=.5, octave=12):
        end_bar = int(self.seconds / self.bar)
        for bar in range(start_bar, end_bar):
            chord = self.chords[bar % len(self.chords)]
            for k, idx in enumerate(pattern):
                pos = k * note_beats
                if pos >= 4:
                    break
                note = self.root + 12 + chord[idx % len(chord)] + (octave if k % 7 in (5, 6) else 0)
                sig = pluck(midi(note), .55, 1.0, .8, seed=bar + k)
                pan = math.sin((bar * 8 + k) * .73) * .62
                pan_add(self.arp_bus, sig, self.at(pos, bar), gain, pan, .12)

    def add_lead(self, phrase, start_bar, repeat_every=4, gain=.10, octave=24, instrument="pluck"):
        """phrase = [(beat, scale_degree, dur_beats)]"""
        scale = [0, 2, 3, 5, 7, 8, 10, 12, 15]
        for bar in range(start_bar, int(self.seconds / self.bar) - 1, repeat_every):
            chord = self.chords[bar % len(self.chords)]
            for beat, degree, dur in phrase:
                note = self.root + octave + scale[degree % len(scale)]
                if instrument == "pluck":
                    sig = pluck(midi(note), dur * self.beat, 1.0, .7, seed=bar + beat)
                else:
                    sig = additive_tone(midi(note), dur * self.beat, (1, .22, .09), .001, .003, .19) * adsr(int(dur * self.beat * SR), .08, .1, .62, .2)
                pan = .12 * math.sin(bar + beat)
                pan_add(self.lead_bus, sig, self.at(beat, bar), gain, pan, .05)

    def drums(self, start_bar=0, style="slow", gain=1.0):
        end_bar = int(self.seconds / self.bar)
        for bar in range(start_bar, end_bar):
            if style == "ambient":
                if bar % 2 == 0:
                    pan_add(self.drum_bus, kick(.65, .22 * gain, 42, 95), self.at(0, bar), 1, 0)
                continue
            if style in ("four", "drive"):
                for b in range(4):
                    pan_add(self.drum_bus, kick(.5, .45 * gain), self.at(b, bar), 1, 0)
            else:
                pan_add(self.drum_bus, kick(.5, .5 * gain), self.at(0, bar), 1, 0)
                if style != "lofi":
                    pan_add(self.drum_bus, kick(.5, .32 * gain), self.at(2.5, bar), 1, 0)
            if style == "slow":
                for b in (1, 3):
                    pan_add(self.drum_bus, snare(.26, .32 * gain), self.at(b, bar), 1, .06)
                for e in range(8):
                    pan_add(self.drum_bus, hat(.04, (.38 if e % 2 else .22) * gain, open_=e == 7), self.at(e * .5, bar), 1, .25)
            elif style == "drive":
                for b in (1, 3):
                    pan_add(self.drum_bus, clap(.26, .36 * gain), self.at(b, bar), 1, -.06)
                for e in range(16):
                    pan_add(self.drum_bus, hat(.025, (.32 if e % 4 == 2 else .18) * gain, open_=e == 14), self.at(e * .25, bar), 1, -.18)
                pan_add(self.drum_bus, rim(.08, .22 * gain), self.at(3.5, bar), 1, .25)
            elif style == "four":
                for b in (1, 3):
                    pan_add(self.drum_bus, clap(.25, .38 * gain), self.at(b, bar), 1, 0)
                for e in range(8):
                    pan_add(self.drum_bus, hat(.025, (.36 if e % 2 == 0 else .18) * gain, open_=e == 7), self.at(e * .5 + .06 * (e % 2), bar), 1, .3)
            elif style == "lofi":
                for b in (1, 3):
                    pan_add(self.drum_bus, snare(.24, .23 * gain), self.at(b + .02, bar), 1, .1)
                for e in range(8):
                    pan_add(self.drum_bus, hat(.035, (.2 if e % 2 else .1) * gain), self.at(e * .5 + (.05 if e % 2 else 0), bar), 1, .3)
                pan_add(self.drum_bus, rim(.08, .10 * gain), self.at(2.75, bar), 1, -.1)

    def mix(self):
        # Pads ya están en el bus principal. Los buses creativos se procesan por separado.
        arp = delay(self.arp_bus, .42 if self.bpm < 100 else .33, .34, .24)
        lead = delay(self.lead_bus, .55, .29, .22)
        drums = np.tanh(self.drum_bus * 1.18) / 1.18
        mix = self.buf + arp * .95 + lead * 1.05 + drums
        if self.kind == "lofi":
            mix[:, 0] += vinyl(self.seconds, .026)
            mix[:, 1] += vinyl(self.seconds, .021)
        elif self.kind in ("ambient", "organic"):
            mix += np.column_stack([vinyl(self.seconds, .005), vinyl(self.seconds, .005)])
        mix = ambience(mix, .20 if self.kind != "ambient" else .3, 2)
        return normalize_master(mix, .92, 1.8, 6.0)


def add_ocean(buf, seconds, gain=.035):
    n = len(buf)
    t = np.arange(n) / SR
    noise = rng_global.standard_normal(n)
    mod = .16 + .12 * (0.5 + .5 * np.sin(2 * np.pi * .055 * t + .3))
    ocean = np.convolve(noise, np.ones(85) / 85, mode="same") * mod
    pan_add(buf, ocean, 0, gain, -.35, .4)
    pan_add(buf, np.roll(ocean, 211), 0, gain * .7, .45, .4)


def build_tracks():
    specs = [
        dict(
            file="bajamar", seconds=88, bpm=82, root=45, kind="organic",
            chords=[[0, 3, 7, 10, 14], [-4, 0, 3, 7, 10], [5, 8, 12, 15, 19], [3, 7, 10, 14, 17]],
            intro=2, drums_style="slow", arp_gain=.042, bass_gain=.115,
            phrase=[(0, 4, 1.5), (1.5, 5, 1), (2.5, 4, 1.2), (4, 2, 1.5), (5.5, 4, 2.4)],
            ocean=True,
        ),
        dict(
            file="sal-y-miel", seconds=68, bpm=94, root=53, kind="organic",
            chords=[[0, 4, 7, 11, 14], [5, 9, 12, 16, 19], [7, 11, 14, 17, 21], [2, 5, 9, 12, 16]],
            intro=2, drums_style="slow", arp_gain=.05, bass_gain=.105,
            phrase=[(0, 5, .8), (1, 6, .8), (2, 4, 1.5), (4, 3, 1), (5, 5, 2.5)],
        ),
        dict(
            file="kilometro-cero", seconds=82, bpm=103, root=50, kind="cinematic",
            chords=[[0, 3, 7, 10, 14], [-2, 2, 5, 9, 12], [3, 7, 10, 14, 17], [5, 8, 12, 15, 19]],
            intro=3, drums_style="slow", arp_gain=.05, bass_gain=.13, bright=.95,
            phrase=[(0, 6, 1), (1.5, 5, 1), (2.5, 4, 2.5), (4.5, 2, 1), (5.5, 4, 2)],
        ),
        dict(
            file="viento-sur", seconds=76, bpm=90, root=52, kind="cinematic",
            chords=[[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]],
            intro=2, drums_style="slow", arp_gain=.043, bass_gain=.1,
            phrase=[(0, 4, 2), (2, 6, 1), (3, 5, 1), (4.5, 2, 3)],
        ),
        dict(
            file="medianoche", seconds=84, bpm=111, root=54, kind="neon",
            chords=[[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [5, 8, 12, 15]],
            intro=2, drums_style="four", arp_gain=.06, bass_gain=.13, bright=1.0,
            phrase=[(0, 7, .8), (1, 6, .8), (2, 4, 1.2), (4, 5, 1.5), (5.5, 7, 2)],
        ),
        dict(
            file="cromo", seconds=70, bpm=118, root=49, kind="neon",
            chords=[[0, 3, 7, 10], [3, 7, 10, 14], [5, 8, 12, 15], [7, 10, 14, 17]],
            intro=1, drums_style="drive", arp_gain=.053, bass_gain=.13, bright=.9,
            phrase=[(0, 3, .7), (1, 4, .7), (2, 5, .7), (3, 6, .7), (4, 4, 3)],
        ),
        dict(
            file="aguas-lentas", seconds=94, bpm=88, root=43, kind="organic",
            chords=[[0, 4, 7, 11], [2, 5, 9, 12], [5, 9, 12, 16], [-3, 0, 4, 7]],
            intro=2, drums_style="four", arp_gain=.04, bass_gain=.12,
            phrase=[(0, 3, 1.5), (2, 4, 1.5), (4, 6, 2), (6, 4, 2)],
        ),
        dict(
            file="polen", seconds=90, bpm=59, root=49, kind="ambient",
            chords=[[0, 4, 7, 11, 14], [5, 9, 12, 16, 19], [-3, 0, 4, 7, 11], [2, 7, 9, 12, 16]],
            intro=1, drums_style="ambient", arp_gain=.024, bass_gain=.075,
            phrase=[(0, 5, 3), (3.5, 6, 2), (6, 4, 4)],
        ),
        dict(
            file="via-88", seconds=78, bpm=77, root=48, kind="lofi",
            chords=[[0, 3, 7, 10, 14], [5, 8, 12, 15, 19], [-2, 2, 5, 9, 12], [3, 7, 10, 14, 17]],
            intro=2, drums_style="lofi", arp_gain=.028, bass_gain=.10, bright=.45,
            phrase=[(0, 4, 1), (1.5, 5, 1), (3, 3, 2), (5, 4, 3)],
        ),
    ]
    for spec in specs:
        print("synthesizing", spec["file"])
        s = Song(spec["file"], spec["seconds"], spec["bpm"], spec["chords"], spec["root"], spec["kind"])
        intro_bar = spec.get("intro", 2)
        s.add_pads(0, gain=.12, bright=spec.get("bright", .6), attack=2.2, release=2.5)
        s.add_bass(intro_bar, style="long" if spec["kind"] in ("ambient", "organic") else "pulse", gain=spec["bass_gain"])
        s.drums(intro_bar + 1, spec["drums_style"])
        if spec["kind"] not in ("ambient",):
            s.add_arp(intro_bar, gain=spec["arp_gain"], pattern=(0, 2, 1, 3, 4, 2, 1, 3) if spec["kind"] == "neon" else (0, 1, 2, 3, 4, 2, 3, 1), note_beats=.5)
        if spec["kind"] == "ambient":
            s.add_arp(intro_bar, gain=spec["arp_gain"], pattern=(0, 2, 4, 1), note_beats=1.5)
        s.add_lead(spec["phrase"], max(intro_bar + 1, 2), repeat_every=4, gain=.085 if spec["kind"] != "ambient" else .055,
                   octave=24 if spec["kind"] != "neon" else 12, instrument="pluck" if spec["kind"] != "ambient" else "voice")
        if spec.get("ocean"):
            add_ocean(s.buf, spec["seconds"], .042)
        mix = s.mix()
        pcm = (mix * 32767.0).astype(np.int16)
        wav_path = OUT / f"{spec['file']}.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        ogg_path = OUT / f"{spec['file']}.ogg"
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-c:a", "libvorbis", "-q:a", "4", str(ogg_path)],
            check=True,
        )
        wav_path.unlink()
        print("  ->", ogg_path.name, f"{ogg_path.stat().st_size/1024/1024:.1f} MB")


if __name__ == "__main__":
    build_tracks()
    print("audio listo en", OUT)
