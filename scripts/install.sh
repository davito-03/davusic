#!/usr/bin/env bash
# Instala Davusic para el usuario actual, sin permisos de administrador.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="${DAVUSIC_BIN_DIR:-$HOME/.local/bin}"
APP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/512x512/apps"
ICON_NAME="io.github.davo.davusic"
RELEASE_BIN="$ROOT/target/release/davusic"

needs_build=0
if [[ ! -x "$RELEASE_BIN" ]]; then
  needs_build=1
elif find "$ROOT/src" "$ROOT/frontend" "$ROOT/capabilities" "$ROOT/assets/icons" \
  -type f -newer "$RELEASE_BIN" -print -quit 2>/dev/null | grep -q .; then
  needs_build=1
elif [[ "$ROOT/Cargo.toml" -nt "$RELEASE_BIN" ]] \
  || [[ -f "$ROOT/Cargo.lock" && "$ROOT/Cargo.lock" -nt "$RELEASE_BIN" ]] \
  || [[ "$ROOT/build.rs" -nt "$RELEASE_BIN" ]] \
  || [[ "$ROOT/tauri.conf.json" -nt "$RELEASE_BIN" ]]; then
  needs_build=1
fi

if (( needs_build )); then
  echo "Compilando Davusic en modo release…"
  # Fuerza a que tauri-build vuelva a embeber el frontend si solo cambiaron
  # archivos estáticos, sin recompilar todas las dependencias.
  touch "$ROOT/build.rs"
  (cd "$ROOT" && cargo build --release)
fi

install -Dm755 "$RELEASE_BIN" "$BIN_DIR/davusic"
install -Dm644 "$ROOT/assets/icons/512x512.png" "$ICON_DIR/$ICON_NAME.png"

mkdir -p "$APP_DIR"
sed "s|^Exec=davusic$|Exec=\"$BIN_DIR/davusic\"|; s|^TryExec=davusic$|TryExec=$BIN_DIR/davusic|" \
  "$ROOT/assets/davusic.desktop" > "$APP_DIR/davusic.desktop"
chmod 644 "$APP_DIR/davusic.desktop"


if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q -t "${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor" >/dev/null 2>&1 || true
fi

NIRI_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/niri"
if [[ -d "$NIRI_DIR" && -f "$ROOT/assets/davusic.kdl" ]]; then
  install -Dm644 "$ROOT/assets/davusic.kdl" "$NIRI_DIR/davusic.kdl"
  if [[ -f "$NIRI_DIR/config.kdl" ]] && ! grep -q 'davusic.kdl' "$NIRI_DIR/config.kdl"; then
    printf '\ninclude optional=true "davusic.kdl"\n' >> "$NIRI_DIR/config.kdl"
  fi
fi

echo "Davusic instalado en $BIN_DIR/davusic"
echo "Lánzalo desde el menú de aplicaciones o ejecutando: $BIN_DIR/davusic"
