#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets/icons
cat > /tmp/davusic-icon.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1d1a20"/>
      <stop offset=".55" stop-color="#0d0c11"/>
      <stop offset="1" stop-color="#08080b"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd9c9"/>
      <stop offset=".38" stop-color="#ff9b8e"/>
      <stop offset=".78" stop-color="#ef6f82"/>
      <stop offset="1" stop-color="#7de4d2"/>
    </linearGradient>
    <linearGradient id="arc" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffb5a7"/>
      <stop offset=".5" stop-color="#ff8c81"/>
      <stop offset="1" stop-color="#72dfcf"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".48" r=".55">
      <stop offset="0" stop-color="#ff9d90" stop-opacity=".32"/>
      <stop offset=".55" stop-color="#ff8b83" stop-opacity=".08"/>
      <stop offset="1" stop-color="#ff8b83" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="8" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 .08"/></feComponentTransfer>
      <feBlend in="SourceGraphic" mode="soft-light"/>
    </filter>
    <clipPath id="squircle">
      <rect width="1024" height="1024" rx="228"/>
    </clipPath>
  </defs>
  <g clip-path="url(#squircle)">
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <circle cx="530" cy="500" r="330" fill="url(#glow)"/>
    <g transform="rotate(-24 512 512)">
      <ellipse cx="512" cy="512" rx="302" ry="250" fill="none" stroke="url(#ring)" stroke-width="52" opacity=".96" filter="url(#blur)" transform="translate(0 6)"/>
      <ellipse cx="512" cy="512" rx="302" ry="250" fill="none" stroke="url(#ring)" stroke-width="52"/>
      <ellipse cx="512" cy="512" rx="196" ry="160" fill="none" stroke="#f7e5da" stroke-width="5" opacity=".38"/>
      <path d="M250 512h524" stroke="url(#bg)" stroke-width="58" stroke-linecap="round" opacity=".94"/>
      <path d="M300 512h424" stroke="url(#arc)" stroke-width="12" stroke-linecap="round" opacity=".8"/>
    </g>
    <circle cx="512" cy="512" r="38" fill="#f7e8df"/>
    <circle cx="512" cy="512" r="58" fill="none" stroke="#0c0b10" stroke-width="16" opacity=".9"/>
    <rect width="1024" height="1024" filter="url(#grain)" opacity=".32"/>
  </g>
</svg>
SVG
rsvg-convert -w 1024 -h 1024 /tmp/davusic-icon.svg -o assets/icons/icon.png
for size in 32 128 256 512; do
  rsvg-convert -w "$size" -h "$size" /tmp/davusic-icon.svg -o "assets/icons/${size}x${size}.png"
done
cp assets/icons/256x256.png assets/icons/128x128@2x.png
cp assets/icons/icon.png frontend/assets/logo.png
ls -lh assets/icons
