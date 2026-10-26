#!/usr/bin/env python3
"""Genera la obra gráfica original de la biblioteca de demostración de Davusic."""
from pathlib import Path
import math
import random
import subprocess

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "assets" / "covers"
OUT.mkdir(parents=True, exist_ok=True)
W = 1000

GRAIN = """
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="4" seed="{seed}" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="table" tableValues="0 .105"/></feComponentTransfer>
</filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="38"/>
</filter>
<filter id="soft2" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="9"/>
</filter>
<filter id="blur24" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="24"/>
</filter>
"""


def svg(content, defs="", seed=1):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{W}" viewBox="0 0 {W} {W}">
<defs>
{GRAIN.format(seed=seed)}
{defs}
</defs>
{content}
<rect width="{W}" height="{W}" filter="url(#grain)" opacity=".7"/>
</svg>'''


def write(name, body, defs="", seed=1):
    p = OUT / f"{name}.svg"
    p.write_text(svg(body, defs, seed))
    subprocess.run(["rsvg-convert", "-w", "1000", "-h", "1000", str(p), "-o", str(OUT / f"{name}.webp")], check=True)
    # keep the raster cover only in the app bundle; svg is source
    p.unlink()


# 1 — Lúa / Mareas : marea profunda, coral y sal
def mareas():
    rnd = random.Random(7)
    waves = []
    for i in range(9):
        y = 330 + i * 62
        amp = 26 + i * 5
        pts_a = []
        pts_b = []
        for x in range(-20, 1041, 20):
            yy = y + math.sin(x / (110 + i * 8) + i * .6) * amp + math.sin(x / 41 + i) * 5
            pts_a.append((x, yy))
            pts_b.append((x, yy + 42 + i * 3))
        d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts_a)
        d += " L" + " L".join(f"{x:.1f} {y:.1f}" for x, y in reversed(pts_b)) + " Z"
        waves.append(f'<path d="{d}" fill="#071b23" opacity="{.22 + i*.05:.2f}"/>')
    stars = "".join(
        f'<circle cx="{rnd.uniform(40,960):.1f}" cy="{rnd.uniform(30,620):.1f}" r="{rnd.uniform(.7,2.4):.2f}" fill="#d8f1e9" opacity="{rnd.uniform(.18,.6):.2f}"/>'
        for _ in range(80)
    )
    return f'''
<rect width="1000" height="1000" fill="url(#deep)"/>
<ellipse cx="715" cy="360" rx="490" ry="410" fill="#0d5c62" opacity=".7" filter="url(#soft)"/>
<ellipse cx="690" cy="365" rx="255" ry="252" fill="url(#sun)"/>
<circle cx="690" cy="365" r="308" fill="none" stroke="#ffc0b4" stroke-width="1.4" opacity=".5"/>
<circle cx="690" cy="365" r="354" fill="none" stroke="#e9f6ed" stroke-width="1" opacity=".14"/>
{stars}
<g opacity=".86">{''.join(waves)}</g>
<path d="M0 780 C180 740 250 820 410 785 S690 722 1000 770 L1000 1000 L0 1000Z" fill="#031318"/>
<path d="M0 856 C230 800 340 900 570 847 S820 806 1000 846" fill="none" stroke="#ffb5a6" stroke-width="2" opacity=".28"/>
<text x="72" y="142" fill="#f5e9df" font-family="Manrope, sans-serif" font-size="20" letter-spacing="8" opacity=".88">LÚA</text>
<text x="72" y="188" fill="#f5e9df" font-family="Manrope, sans-serif" font-size="14" letter-spacing="5" opacity=".45">MAREAS</text>
''', '''
<linearGradient id="deep" x1="0" y1="0" x2=".8" y2="1">
  <stop stop-color="#061317"/><stop offset=".55" stop-color="#09232b"/><stop offset="1" stop-color="#020b0e"/>
</linearGradient>
<radialGradient id="sun" cx=".38" cy=".34" r=".7">
  <stop stop-color="#ffe3d3"/><stop offset=".35" stop-color="#ffb9a6"/><stop offset=".76" stop-color="#eb7d79"/><stop offset="1" stop-color="#b95164"/>
</radialGradient>
'''


# 2 — Nómada / Horizonte ciego
def horizonte():
    lines = "".join(
        f'<path d="M0 {620 + i*13} C250 {590 + i*13} 360 {650 + i*13} 580 {615 + i*13} S820 {585+i*13} 1000 {610+i*13}" fill="none" stroke="#1b0d08" stroke-width="{1.3 - i*.08}" opacity="{.5 - i*.035}"/>'
        for i in range(11)
    )
    dunes = []
    for i, (y, o, c) in enumerate([(760, .9, "#3b1c12"), (830, .96, "#24100a"), (910, 1, "#120907")]):
        dunes.append(f'<path d="M0 {y} C210 {y-110-i*20} 350 {y+30} 565 {y-30} S820 {y-125} 1000 {y-55} L1000 1000 L0 1000Z" fill="{c}" opacity="{o}"/>')
    return f'''
<rect width="1000" height="1000" fill="url(#dusk)"/>
<circle cx="635" cy="505" r="318" fill="#ffb06f" opacity=".16" filter="url(#soft)"/>
<circle cx="635" cy="505" r="256" fill="url(#disk)"/>
<circle cx="635" cy="505" r="256" fill="#1c0b05" opacity=".92"/>
<circle cx="635" cy="505" r="310" fill="none" stroke="#ffbd83" stroke-width="1.2" opacity=".6"/>
<circle cx="635" cy="505" r="353" fill="none" stroke="#f5d6b5" stroke-width=".8" opacity=".22"/>
{''.join(dunes)}
{lines}
<path d="M88 252 L88 168 M88 168 L140 168" stroke="#f5d8bd" stroke-width="1.5" opacity=".44"/>
<text x="88" y="130" fill="#f5d8bd" font-family="Manrope, sans-serif" font-size="18" letter-spacing="7" opacity=".88">NÓMADA</text>
<text x="88" y="302" fill="#f5d8bd" font-family="Manrope, sans-serif" font-size="13" letter-spacing="4" opacity=".48">HORIZONTE CIEGO</text>
''', '''
<linearGradient id="dusk" x1="0" y1="0" x2=".4" y2="1">
  <stop stop-color="#5e2c1c"/><stop offset=".45" stop-color="#b95f36"/><stop offset=".72" stop-color="#e9a16d"/><stop offset="1" stop-color="#32160d"/>
</linearGradient>
<radialGradient id="disk" cx=".34" cy=".28" r=".8">
  <stop stop-color="#ffe8c8"/><stop offset=".45" stop-color="#ffc07a"/><stop offset=".8" stop-color="#da6d3e"/><stop offset="1" stop-color="#7a2a19"/>
</radialGradient>
'''


# 3 — Vera Nox / Piel de neón
def neon():
    rnd = random.Random(22)
    lines = "".join(
        f'<path d="M0 {470 + i*i*5.8:.1f} Q500 {330 + i*28} 1000 {470 + i*i*5.8:.1f}" fill="none" stroke="#ff6ad5" stroke-width="{.8 + i*.12:.2f}" opacity="{.44 - i*.033:.2f}"/>'
        for i in range(11)
    )
    glitch = "".join(
        f'<rect x="{rnd.randint(0,720)}" y="{rnd.randint(80,900)}" width="{rnd.randint(30,260)}" height="{rnd.randint(1,4)}" fill="{rnd.choice(["#ff74d4", "#7df7ec", "#f6d8ff"])}" opacity="{rnd.uniform(.15,.55):.2f}"/>'
        for _ in range(26)
    )
    return f'''
<rect width="1000" height="1000" fill="url(#night)"/>
<ellipse cx="520" cy="470" rx="380" ry="310" fill="#ff4fca" opacity=".2" filter="url(#soft)"/>
<circle cx="515" cy="465" r="287" fill="none" stroke="url(#chrome)" stroke-width="72" opacity=".9" filter="url(#soft2)"/>
<path d="M330 570 C245 370 505 188 694 365 C826 488 707 675 564 646 C407 615 381 473 506 407 C631 342 747 441 692 548 C640 648 469 654 410 525" fill="none" stroke="url(#chrome)" stroke-width="54" stroke-linecap="round"/>
<circle cx="515" cy="465" r="95" fill="#0a0610"/>
<circle cx="515" cy="465" r="112" fill="none" stroke="#f5cbff" stroke-width="1" opacity=".5"/>
{lines}
{glitch}
<rect x="0" y="0" width="1000" height="1000" fill="url(#vignette)" opacity=".3"/>
<text x="72" y="884" fill="#ffe9fb" font-family="Manrope, sans-serif" font-size="22" letter-spacing="10" opacity=".9">VERA NOX</text>
<text x="72" y="922" fill="#ff9ee6" font-family="Manrope, sans-serif" font-size="13" letter-spacing="5" opacity=".66">PIEL DE NEÓN</text>
''', '''
<linearGradient id="night" x1="0" y1="0" x2="1" y2="1">
  <stop stop-color="#08050f"/><stop offset=".45" stop-color="#180a2c"/><stop offset="1" stop-color="#30082d"/>
</linearGradient>
<linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
  <stop stop-color="#ffe5fa"/><stop offset=".2" stop-color="#ff68d9"/><stop offset=".48" stop-color="#8c3eff"/><stop offset=".72" stop-color="#5ff8e8"/><stop offset="1" stop-color="#ffe9fb"/>
</linearGradient>
<radialGradient id="vignette" cx=".5" cy=".5" r=".72">
  <stop stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000"/>
</radialGradient>
'''


# 4 — Cauce / Río interior
def rio():
    contours = []
    for i in range(24):
        y0 = 490 + i * 17
        pts = []
        for x in range(0, 1001, 25):
            y = y0 + math.sin(x / 95 + i * .22) * (18 + i * 2.6) + math.sin(x / 37 + i) * 4
            pts.append(f"{x} {y:.1f}")
        contours.append(f'<path d="M{" L".join(pts)}" fill="none" stroke="#24352e" stroke-width="{1.5 + i*.03:.2f}" opacity="{.72 - i*.021:.2f}"/>')
    blobs = "".join(
        f'<circle cx="{240 + i*110}" cy="{600 + math.sin(i)*70:.0f}" r="{22+i*8}" fill="{["#dfe1bb","#b9c7a1","#88aa9b"][i%3]}" opacity=".22" filter="url(#soft2)"/>'
        for i in range(6)
    )
    return f'''
<rect width="1000" height="1000" fill="url(#paper)"/>
<circle cx="245" cy="260" r="380" fill="#d0d3a7" opacity=".7" filter="url(#soft)"/>
<circle cx="825" cy="635" r="310" fill="#62988c" opacity=".3" filter="url(#soft)"/>
<path d="M-60 545 C150 380 305 420 410 510 C526 610 676 650 1060 500" fill="none" stroke="#113e39" stroke-width="116" opacity=".92" filter="url(#soft2)"/>
<path d="M-60 545 C150 380 305 420 410 510 C526 610 676 650 1060 500" fill="none" stroke="#d9d9ac" stroke-width="23" opacity=".35"/>
<path d="M-60 610 C150 445 305 485 410 575 C526 675 676 715 1060 565" fill="none" stroke="#0b2421" stroke-width="4" opacity=".5"/>
{blobs}
{''.join(contours)}
<circle cx="745" cy="545" r="7" fill="#f3e7ca"/>
<text x="72" y="120" fill="#16221e" font-family="Manrope, sans-serif" font-size="19" letter-spacing="7" opacity=".9">CAUCE</text>
<text x="72" y="157" fill="#16221e" font-family="Manrope, sans-serif" font-size="12" letter-spacing="4" opacity=".48">RÍO INTERIOR</text>
''', '''
<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
  <stop stop-color="#ebe7d0"/><stop offset=".55" stop-color="#cbcfab"/><stop offset="1" stop-color="#9fb69e"/>
</linearGradient>
'''


# 5 — Orion Jardín / Bioluminiscencia
def bioluminiscencia():
    rnd = random.Random(51)
    orbs = "".join(
        f'<circle cx="{rnd.uniform(130,830):.0f}" cy="{rnd.uniform(370,900):.0f}" r="{rnd.uniform(3,20):.1f}" fill="{rnd.choice(["#b8ffb2", "#5df2d1", "#dcffa4"])}" opacity="{rnd.uniform(.15,.75):.2f}" filter="url(#soft2)"/>'
        for _ in range(45)
    )
    stems = []
    for i in range(6):
        x = 180 + i * 125 + rnd.uniform(-25, 25)
        h = rnd.uniform(130, 330)
        y = 540
        stems.append(f'<path d="M{x:.0f} 760 C{x-30:.0f} {760-h*.6:.0f} {x+32:.0f} {760-h:.0f} {x+8:.0f} {760-h*1.16:.0f}" fill="none" stroke="#73ebba" stroke-width="1.1" opacity=".36"/>')
        for k in range(5):
            yy = 760 - h * (.3 + k * .13)
            side = -1 if k % 2 else 1
            stems.append(f'<ellipse cx="{x+side*26:.0f}" cy="{yy:.0f}" rx="25" ry="8" fill="#9bffc2" opacity=".11" transform="rotate({side*28} {x} {yy})"/>')
        stems.append(f'<circle cx="{x+8:.0f}" cy="{760-h*1.16:.0f}" r="3" fill="#e2ffce" opacity=".8"/>')
    return f'''
<rect width="1000" height="1000" fill="url(#abyss)"/>
<ellipse cx="500" cy="505" rx="440" ry="390" fill="#0f8f7d" opacity=".15" filter="url(#soft)"/>
<circle cx="500" cy="505" r="325" fill="#0b2e30"/>
<circle cx="500" cy="505" r="325" fill="none" stroke="#7effcc" stroke-width="1.1" opacity=".35"/>
<circle cx="500" cy="505" r="372" fill="none" stroke="#b8ffcc" stroke-width=".8" opacity=".13"/>
<path d="M175 505 A325 325 0 0 1 825 505 A220 160 0 0 0 175 505" fill="#56ffc2" opacity=".06"/>
{orbs}
{''.join(stems)}
<path d="M0 916 C180 850 326 950 502 880 S800 834 1000 900 L1000 1000 L0 1000Z" fill="#02100f" opacity=".85"/>
<text x="50%" y="936" text-anchor="middle" fill="#ddffe7" font-family="Manrope, sans-serif" font-size="15" letter-spacing="8" opacity=".66">ORION JARDÍN</text>
''', '''
<radialGradient id="abyss" cx=".5" cy=".42" r=".8">
  <stop stop-color="#06191d"/><stop offset=".55" stop-color="#030e11"/><stop offset="1" stop-color="#010506"/>
</radialGradient>
'''


# 6 — Nocturno 88 / Autopista
def autopista():
    rnd = random.Random(88)
    stars = "".join(
        f'<circle cx="{rnd.uniform(50,950):.0f}" cy="{rnd.uniform(40,430):.0f}" r="{rnd.uniform(.6,2):.1f}" fill="#ffe8c4" opacity="{rnd.uniform(.2,.7):.2f}"/>'
        for _ in range(60)
    )
    beams = "".join(
        f'<path d="M{rnd.uniform(0,1000):.0f} {rnd.uniform(480,900):.0f} L{rnd.uniform(200,800):.0f} 1000" stroke="#ffb46c" stroke-width="1" opacity="{rnd.uniform(.08,.24):.2f}"/>'
        for _ in range(12)
    )
    return f'''
<rect width="1000" height="1000" fill="url(#sky)"/>
<circle cx="500" cy="520" r="330" fill="#ffb063" opacity=".12" filter="url(#soft)"/>
<circle cx="500" cy="520" r="172" fill="url(#sun88)" opacity=".96"/>
<g opacity=".55">{stars}</g>
<path d="M0 603 C220 570 380 620 520 592 S790 560 1000 600 L1000 1000 L0 1000Z" fill="#1a0f22" opacity=".78"/>
<path d="M0 710 C240 620 374 706 540 670 S810 622 1000 684 L1000 1000 L0 1000Z" fill="#0d0913"/>
<path d="M410 1000 L480 618 L520 618 L678 1000Z" fill="#0b0710"/>
<path d="M461 1000 L492 620 M579 1000 L515 620" stroke="#ffc07a" stroke-width="3" stroke-dasharray="18 26" opacity=".84"/>
<path d="M0 885 L1000 845" stroke="#ff8f6a" stroke-width="1.4" opacity=".22"/>
{beams}
<text x="72" y="936" fill="#ffe3c5" font-family="Manrope, sans-serif" font-size="15" letter-spacing="7" opacity=".78">NOCTURNO 88</text>
<text x="928" y="936" text-anchor="end" fill="#ffb886" font-family="Manrope, sans-serif" font-size="12" letter-spacing="4" opacity=".55">AUTOPISTA</text>
''', '''
<linearGradient id="sky" x1="0" y1="0" x2=".3" y2="1">
  <stop stop-color="#171021"/><stop offset=".38" stop-color="#38203d"/><stop offset=".64" stop-color="#8c4d55"/><stop offset=".82" stop-color="#e18a64"/><stop offset="1" stop-color="#f5b87d"/>
</linearGradient>
<radialGradient id="sun88" cx=".4" cy=".35" r=".7">
  <stop stop-color="#fff0cf"/><stop offset=".5" stop-color="#ffc27e"/><stop offset="1" stop-color="#e07d57"/>
</radialGradient>
'''


for name, fn in [
    ("mareas", mareas),
    ("horizonte", horizonte),
    ("neon", neon),
    ("rio", rio),
    ("luz", bioluminiscencia),
    ("autopista", autopista),
]:
    body, defs = fn()
    write(name, body, defs, seed=len(name))
    print("cover:", name)

print("covers ready in", OUT)
