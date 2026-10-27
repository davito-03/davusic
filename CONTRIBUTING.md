# Contribuir a Davusic

Gracias por querer mejorar Davusic. El proyecto es pequeño y prioriza tres cosas: que la música sea tuya, que la interfaz sea tranquila y que el código se pueda mantener sin una fábrica de JavaScript.

## Antes de empezar

- Davusic es un reproductor **local-first**. No añadas telemetría, anuncios, cuentas obligatorias ni streaming no oficial de Spotify.
- La reproducción de YouTube depende de `yt-dlp`; no descargues bibliotecas completas ni prometas disponibilidad permanente.
- Respeta los archivos locales del usuario. Ningún cambio debe borrar música, descargas o `yt-dlp` sin una confirmación explícita.

## Entorno

En Arch/CachyOS:

```bash
sudo pacman -S --needed base-devel rust webkit2gtk-4.1 gtk3 librsvg pkgconf
```

El proyecto requiere Rust 1.95 o superior. Para comprobar la sintaxis del frontend hace falta Node 20 o superior. En Windows se necesita el toolchain MSVC y WebView2; para Android, JDK 17, SDK 36 y NDK 27. Las instrucciones completas están en [BUILDING.md](BUILDING.md).

## Desarrollo

```bash
cargo build
cargo test
node --check frontend/app.js
./target/debug/davusic
```

No hay bundler ni servidor de desarrollo: `frontend/index.html`, `frontend/app.js` y `frontend/styles.css` se embeben en el binario. Después de tocar el frontend, vuelve a compilar para verlo en la app.

Build release e instalación local en Linux:

```bash
cargo build --release
./scripts/install.sh
```

En Windows, `cargo tauri build` genera los instaladores NSIS/MSI. En Android,
la compilación se hace con `cargo tauri android build --apk --ci` (véase
[BUILDING.md](BUILDING.md)).

## Estilo

- Rust: `cargo fmt` y `cargo clippy` cuando estén disponibles; mantén los mensajes de error en español.
- Frontend: JavaScript moderno sin framework, plantillas HTML dentro de `app.js` y CSS con variables. Usa `esc()` para cualquier dato que venga de un archivo o de una API.
- Los diálogos, textos y estados nuevos deben estar en español y seguir el tono de la interfaz existente.
- No introduzcas dependencias nuevas si una función pequeña del propio proyecto resuelve el problema.

## Datos de prueba

No incluyas en el repositorio:

- `~/.config/davusic/`
- `~/.cache/davusic/`
- `~/.local/share/davusic/`
- archivos de música, carátulas extraídas o exportaciones de tu cuenta.

Las pruebas de importación crean sus propios ZIP temporales y los eliminan al terminar. Si añades una prueba de exportación, usa también un directorio temporal.

## Pull requests

Incluye en la descripción:

1. Qué problema resuelve.
2. Cómo lo has probado (comandos y pasos manuales).
3. Si afecta a datos del usuario, qué se conserva y qué se borra.

Antes de enviar:

```bash
cargo test
node --check frontend/app.js
cargo build --release
```

La CI de GitHub ejecuta esos mismos pasos en Ubuntu. El workflow de compilaciones
(`.github/workflows/build.yml`) genera Linux, Windows y Android en runners nativos
y publica una release con el tag `v*`.
