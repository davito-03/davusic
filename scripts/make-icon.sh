#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

command -v rsvg-convert >/dev/null 2>&1 || {
  echo "Falta rsvg-convert (librsvg2-bin)." >&2
  exit 1
}
command -v cargo >/dev/null 2>&1 || {
  echo "Falta cargo." >&2
  exit 1
}

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

# Genera el .ico y los mipmaps de Android con el mismo motor que Tauri.
cargo tauri icon assets/icon.svg -o "$tmp_dir"

mkdir -p assets/icons
for size in 32 128 256 512; do
  rsvg-convert -w "$size" -h "$size" assets/icon.svg -o "assets/icons/${size}x${size}.png"
done
rsvg-convert -w 1024 -h 1024 assets/icon.svg -o assets/icons/icon.png
cp assets/icons/256x256.png assets/icons/128x128@2x.png
cp "$tmp_dir/icon.ico" assets/icons/icon.ico
cp assets/icons/512x512.png frontend/assets/logo.png

for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  install -m 0644 "$tmp_dir/android/mipmap-${density}/ic_launcher.png" "gen/android/app/src/main/res/mipmap-${density}/ic_launcher.png"
  install -m 0644 "$tmp_dir/android/mipmap-${density}/ic_launcher_round.png" "gen/android/app/src/main/res/mipmap-${density}/ic_launcher_round.png"
  install -m 0644 "$tmp_dir/android/mipmap-${density}/ic_launcher_foreground.png" "gen/android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png"
done

echo "Iconos actualizados:"
ls -lh assets/icons frontend/assets/logo.png
