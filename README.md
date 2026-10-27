# Davusic

**Tu música, en tu equipo.** Reproductor nativo, local-first y en español para Linux y Windows, con una versión Android en vista previa. Combina tu biblioteca local, búsqueda y streaming de YouTube mediante `yt-dlp`, letras de LRCLIB e importación de playlists de Spotify, YouTube Music y **Exportify**.

Davusic está hecho con **Tauri 2 + Rust** y un frontend estático sin bundler. No hay anuncios, telemetría ni servidor propio. La cuenta de Spotify es opcional y **solo se usa para leer metadatos**: Davusic no reproduce el catálogo de Spotify ni elude DRM.

> Estado: **0.1.0**, primera versión funcional. Pensada para Niri/DMS en CachyOS, pero funciona en cualquier escritorio Linux moderno con Wayland o X11 y en Windows 10/11. Android se distribuye como vista previa: interfaz y demo, sin biblioteca local, streaming ni MPRIS. Incluye restablecimiento de fábrica y exportación compatible con Exportify.

---

## Principios

- **Local-first**: preferencias, historial, likes, playlists y catálogo viven en tu equipo.
- **Referencias, no descargas**: las playlists importadas guardan título, artista, álbum y enlace. El audio se resuelve al pulsar play y queda en una caché temporal.
- **Spotify oficial**: OAuth 2.0 PKCE para leer playlists y Me gusta. Sin cookies, tokens ajenos, Web Playback SDK ni streaming no oficial.
- **Sin ruido**: interfaz en español, atajos, MPRIS y una estética HUD alineada con davito.dev.

## Funciones

- **Biblioteca local**: escanea MP3, FLAC, OGG, Opus, M4A, WAV, AIFF, WavPack y otros formatos con `lofty`; lee etiquetas, carátulas, álbumes y artistas.
- **Reproducción nativa**: motor `rodio` + Symphonia, cola, aleatorio, repetición, búsqueda de posición, volumen, silencio y reproductor inmersivo.
- **Streaming**: búsqueda en YouTube (`ytsearch`) y reproducción con `yt-dlp`; el audio se guarda en caché y se poda automáticamente.
- **Búsqueda estilo Spotify**: biblioteca y YouTube en la misma barra; un resultado en línea se puede reproducir al instante.
- **Para ti**: recomendaciones privadas construidas con reproducciones, canciones completadas, saltos, búsquedas, likes y playlists.
- **Letras**: LRCLIB con letra sincronizada LRC o texto plano; se puede hacer clic en una línea para saltar a ese punto.
- **Importación**:
  - Pestaña **Exportify** con enlace a [exportify.net](https://exportify.net/) y selector de CSV/ZIP.
  - ZIP de **Exportify**, Spotify o Google Takeout.
  - CSV/TSV de **Google Takeout** / YouTube Music.
  - Enlaces públicos de Spotify y enlaces/playlists de YouTube Music.
  - Archivos JSON, M3U/M3U8, TXT y listas pegadas a mano.
  - **Spotify OAuth**: listado, **Importar todas** (Me gusta + playlists) y traer una a una.
- **Exportar a Exportify**: genera un ZIP con un CSV por playlist (o un CSV suelto desde el detalle de una playlist) con las columnas `Track Name`, `Artist Name(s)`, `Album Name`, `Duration (ms)`, `Track URI` y `Playlist Name`.
- **Me gusta y playlists**: crea o fusiona playlists importadas, evita duplicados y lleva las listas tipo *Liked Songs* a **Biblioteca → Me gusta**.
- **Restablecimiento de fábrica**: borra biblioteca indexada, playlists, likes, historial, señales del algoritmo, preferencias, sesión de Spotify y cachés en un solo paso, conservando tus archivos de música y `yt-dlp`.
- **Temas y personalización**: Nocturno, Neón/Cyberpunk, Matrix, Ember y Claro; seis acentos; animaciones reducibles; fuentes del sistema o TTF/OTF/WOFF propios; perfil y portadas locales.
- **Sesión**: guarda cola, pista y posición al cerrar, y las restaura en pausa al abrir.
- **MPRIS en Linux**: controles multimedia, metadatos, carátula, volumen y búsqueda de posición. En Windows se usa el reproductor nativo sin MPRIS.
- **Multiplataforma**: mismo código Tauri para Linux y Windows; Android se prepara como vista previa experimental.

## Requisitos

### Ejecutar en Linux

- PipeWire o PulseAudio y ALSA.
- `yt-dlp` para buscar y streamear en YouTube. Davusic puede instalarlo bajo demanda en `~/.local/share/davusic/bin/`.
- `curl` o `wget` para esa instalación.
- Opcional: `ffmpeg` si quieres convertir audio; el streaming no lo necesita.

### Ejecutar en Windows

- Windows 10/11 con WebView2. Los instaladores incluyen el bootstrapper.
- `yt-dlp.exe` para streaming. Davusic puede instalarlo bajo demanda en `%LOCALAPPDATA%\davusic\bin\`.
- Opcional: `ffmpeg.exe` en `PATH` o junto a `yt-dlp.exe`.

### Android

Vista previa para Android 8.0 (API 26) o superior. Incluye la interfaz y una
biblioteca de demostración; todavía no importa música local, no ejecuta
`yt-dlp` y no expone MPRIS. Consulta [BUILDING.md](BUILDING.md) para compilarla.

### Compilar en Arch/CachyOS

```bash
sudo pacman -S --needed base-devel rust webkit2gtk-4.1 gtk3 librsvg pkgconf alsa-lib
```

Tauri usa GTK/WebKitGTK. En otras distribuciones consulta los paquetes
equivalentes de Tauri 2. El proyecto declara Rust 1.95 o superior.

## Compilar y ejecutar

```bash
cargo build --release
./target/release/davusic
```

Para desarrollo no hace falta Node, bundler ni servidor de desarrollo: el
frontend estático se embebe en el binario.

```bash
cargo build
./target/debug/davusic
```

Pruebas:

```bash
cargo test
node --check frontend/app.js
```

Instrucciones detalladas para Linux, Windows y Android: [BUILDING.md](BUILDING.md).

## Instalar en tu usuario

### Linux

```bash
./scripts/install.sh
```

El instalador compila en modo release si el binario no existe o si alguna fuente
es más nueva, y coloca:

- binario: `~/.local/bin/davusic`
- lanzador: `~/.local/share/applications/davusic.desktop`
- icono: `~/.local/share/icons/hicolor/512x512/apps/io.github.davo.davusic.png`
- regla opcional de Niri: `~/.config/niri/davusic.kdl` (solo si existe `~/.config/niri`)

También puedes generar paquetes `.deb` y AppImage con Tauri CLI:

```bash
cargo tauri build --bundles deb,appimage
```

### Windows

Descarga el instalador NSIS (`.exe`) o MSI (`.msi`) desde
[Releases](https://github.com/davito-03/davusic/releases). Los instaladores no
están firmados con un certificado comercial; SmartScreen puede pedir
confirmación.

### Android

Descarga `davusic-android-preview.apk` desde Releases. Es una APK de vista
previa firmada en modo debug: se instala, pero no sirve para Google Play y no
sustituye a la versión de escritorio.

## Uso rápido

- **Biblioteca local**: Ajustes → **Biblioteca local** → **Añadir carpeta**, o arrastra una carpeta/archivos sobre la ventana. Davusic no copia ni mueve tus archivos.
- **Buscar y reproducir**: `Ctrl + K` abre la búsqueda; los resultados de YouTube se pueden reproducir directamente.
- **Importar**: `Ctrl + I`. Para Spotify, Exportify, YouTube Music, ZIP/CSV o listas de texto.
- **Exportar**: Ajustes → **Exportify** para descargar un ZIP con todas tus playlists, o el icono de descarga en una playlist concreta para un CSV.
- **Cola y panel**: `Q` abre la cola; `L` abre la letra; `I` abre el reproductor inmersivo.
- **Ajustes**: `Ctrl + ,`; **Atajos**: `?`.
- **Empezar de cero**: Ajustes → **Zona de peligro** → **Restablecer todo**.

## Importar playlists

Abre el botón de importación o `Ctrl + I`:

1. **Música local**: añade una carpeta.
2. **Archivo / ZIP**: Exportify, Google Takeout o CSV/JSON/M3U/TXT.
3. **Exportify**: abre la web oficial y vuelve con el CSV o ZIP descargado.
4. **Spotify**: conecta tu cuenta con la API oficial, pega un enlace público o importa una lista concreta.
5. **YouTube Music**: pega el enlace de una playlist; se lee con `yt-dlp`.
6. **Texto**: pega una lista con una canción por línea, por ejemplo `Artista - Título` o `Título · Artista`.

Después elige las playlists y pulsa **Guardar referencias**. Las coincidencias de YouTube son opcionales: si no las buscas ahora, Davusic resuelve cada canción al reproducirla. No se descarga la biblioteca completa.

## Exportify

[Exportify](https://exportify.net/) es una herramienta web independiente para exportar playlists de Spotify a CSV/ZIP. Davusic no incrusta su inicio de sesión ni comparte cookies: abre la web en tu navegador y lee los archivos exportados con su propio parser local.

- **Importar**: `Ctrl + I` → **Exportify** → **Abrir exportify.net**, descarga el ZIP (o un CSV) y vuelve a **Importar CSV o ZIP**.
- **Exportar**: Ajustes → **Exportify** → **Exportar todas mis playlists a ZIP**, o el botón de descarga en la cabecera de una playlist para un CSV individual.
- **Formato**: los CSV incluyen `Track Name`, `Artist Name(s)`, `Album Name`, `Duration (ms)`, `Track URI` y `Playlist Name`. Se pueden volver a importar en Davusic o abrir en cualquier hoja de cálculo.

No se envía tu biblioteca a Spotify ni a Exportify. La exportación se escribe en la ubicación que elijas con el diálogo nativo.

## Restablecer de fábrica

Ajustes → **Zona de peligro** → **Restablecer todo**. Hay que escribir `BORRAR` para confirmar. La app borra los datos activos y las copias internas, limpia el almacenamiento del WebView y se recarga vacía.

Se eliminan:

- La biblioteca indexada, carpetas añadidas y carátulas.
- Me gusta, playlists, historial y señales de recomendación.
- Preferencias, perfil, temas, fuentes propias, letras y la sesión de Spotify.
- Catálogos `streams.json` y `playlists.json`, sesión de reproducción y cachés de audio, portadas y temas.
- Copias antiguas de Davusic y de la versión Auralis, para que una migración posterior no recupere datos.

Se conservan:

- Tus archivos de música, estén donde estén.
- La carpeta de descargas `~/Music/Davusic/` (si la usaste).
- `~/.local/share/davusic/bin/`, incluido `yt-dlp`.

El restablecimiento no se puede deshacer. Si quieres conservar el catálogo, haz una copia de `~/.config/davusic/` antes.

## Spotify (opcional)

Davusic no reproduce audio de Spotify. Si conectas tu cuenta, solo importa metadatos (título, artista, álbum, duración y enlace) para buscarlos en YouTube.

1. Crea una app en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Añade exactamente este **Redirect URI**: `http://127.0.0.1:43827/callback`.
3. Copia el **Client ID** (no hace falta el Client Secret) y pégalo en Ajustes o en el importador.
4. Pulsa **Conectar con Spotify** y acepta el consentimiento oficial en el navegador.

Permisos solicitados: `playlist-read-private`, `playlist-read-collaborative`, `user-library-read`, `user-read-private`.

La API oficial limita las páginas a 50 elementos. Davusic intenta primero `/playlists/{id}/tracks` y, si falla, reintenta el listado con `/playlists/{id}/items`. Algunas playlists de otros usuarios, listas editoriales o colecciones *Made for You* pueden no exponer sus pistas a apps de terceros; Davusic avisa y continúa con el resto. En modo desarrollo, Spotify exige que la cuenta propietaria de la app tenga Premium y limita quién puede autorizarla.

## Streaming y caché

`yt-dlp` resuelve el audio de YouTube y lo deja en la caché de Davusic (`~/.cache/davusic/streams/` en Linux, `%LOCALAPPDATA%\davusic\streams\` en Windows). Davusic conserva como máximo **80 archivos / 2 GB** y elimina los más antiguos. La URI canónica se guarda en el catálogo, no la ruta de caché, así que la poda no rompe la reproducción.

El catálogo de streaming y las playlists de usuario se guardan en `streams.json` y `playlists.json`, dentro de la carpeta de configuración de cada plataforma. Las preferencias pequeñas, likes, recientes, señales, letras en localStorage y el perfil viven en el WebView. El catálogo grande no cabe en `localStorage` y por eso se escribe directamente en disco.

## Datos y privacidad

| Dato | Linux | Windows |
| --- | --- | --- |
| Configuración y catálogo | `~/.config/davusic/` | `%APPDATA%\davusic\` |
| Sesión opcional de Spotify | `~/.config/davusic/spotify.json` (`0600`) | `%APPDATA%\davusic\spotify.json` |
| Sesión de reproducción | `~/.config/davusic/session.json` | `%APPDATA%\davusic\session.json` |
| Carátulas, temas y demo | `~/.cache/davusic/` | `%LOCALAPPDATA%\davusic\` |
| Caché de streaming y letras | `~/.cache/davusic/streams/`, `lyrics/` | `%LOCALAPPDATA%\davusic\streams\`, `lyrics\` |
| `yt-dlp` instalado por Davusic | `~/.local/share/davusic/bin/yt-dlp` | `%LOCALAPPDATA%\davusic\bin\yt-dlp.exe` |
| Preferencias, likes, recientes, señales y perfil | `localStorage` del WebView | `localStorage` del WebView |
| Datos del WebView | `~/.local/share/io.github.davo.davusic/` | `%LOCALAPPDATA%\io.github.davo.davusic\` |

No hay telemetría. Las búsquedas y la reproducción en streaming contactan con YouTube; las letras con LRCLIB; las carátulas con los CDN de Spotify/YouTube. La API de Spotify solo se usa si conectas tu cuenta. Davusic nunca lee cookies ni tokens de otras aplicaciones.

La primera vez, Davusic copia la configuración de instalaciones anteriores si existe y migra las claves antiguas de `localStorage` a las claves nuevas. El **restablecimiento de fábrica** elimina también esas rutas heredadas (`auralis`) a propósito; una instalación normal no borra tus datos originales.

## Publicar en GitHub

El repositorio oficial es [davito-03/davusic](https://github.com/davito-03/davusic). El árbol excluye `target/`, logs, `gen/schemas` y datos locales; la licencia es MIT y el frontend no necesita Node ni un servidor de desarrollo.

`main` contiene el código y los workflows:

- `.github/workflows/ci.yml` ejecuta tests, sintaxis del frontend y build Linux.
- `.github/workflows/build.yml` compila Linux, Windows y Android y publica una release con todos los artefactos al empujar un tag `v*`.

```bash
git push origin main
git tag v0.1.0
git push origin v0.1.0
```

La release incluye `.deb`, `.AppImage`, instaladores NSIS/MSI y `davusic-android-preview.apk`. Las compilaciones de Windows y Android se realizan en GitHub Actions, no en local.

## Atajos

| Atajo | Acción |
| --- | --- |
| `Espacio` | Reproducir / pausar |
| `←` / `→` | Retroceder / avanzar 5 s |
| `Mayús + ←` / `Mayús + →` | Pista anterior / siguiente |
| `Ctrl + K` | Enfocar buscador (biblioteca y YouTube) |
| `Ctrl + P` | Paleta de comandos |
| `Ctrl + F` o `/` | Enfocar el buscador |
| `Ctrl + 1…6` | Inicio, Para ti, Explorar, Biblioteca, Me gusta, Recientes |
| `Ctrl + ,` | Ajustes |
| `Ctrl + I` | Importar |
| `Ctrl + R` | Reescanear la biblioteca local |
| `Q` / `L` / `I` | Cola / letra / reproductor inmersivo |
| `M` / `S` / `R` | Silenciar / aleatorio / repetición |
| `?` | Ver todos los atajos |

## Estructura

```text
src/
  main.rs            Entrada de escritorio; llama a davusic_lib::run()
  lib.rs             Comandos Tauri, protocolos, eventos y arranque compartido
  audio.rs           Motor nativo y demo embebida
  library.rs         Escaneo, carátulas e IDs de la biblioteca
  theme.rs           Temas fijos y utilidades de imagen
  palette.rs         Extracción de paletas
  paths.rs           Rutas de datos, caché, herramientas y restablecimiento
  playlist_import.rs Parser de ZIP/CSV/JSON/M3U y exportador compatible con Exportify
  spotify.rs         OAuth PKCE, playlists y Me gusta
  youtube.rs         yt-dlp, búsqueda, streaming y caché
  lyrics.rs          LRCLIB
  mpris.rs           Integración MPRIS (Linux)
  mpris_stub.rs      Integración MPRIS no-op para otras plataformas
  dialogs.rs         Diálogos nativos de archivos (stub en Android)
  platform.rs        Abrir enlaces, revelar carpetas y detección de SO
  net.rs             Cliente HTTP con rustls/ring
frontend/
  index.html         Shell de la interfaz
  app.js             Estado, vistas, recomendaciones, importador y exportador
  styles.css         Diseño, temas y responsive
assets/
  icons/             Iconos de la aplicación, incluido icon.ico
  fonts/             Fuentes embebidas
scripts/
  install.sh         Instalación local y regla de Niri
  make-icon.sh       Generación del icono
  make-art.py        Portadas de demostración
  make-audio.py      Audio de demostración
gen/android/         Proyecto Android generado y versionado
.github/
  workflows/ci.yml   Tests, sintaxis JS y build Linux
  workflows/build.yml Compilaciones Linux/Windows/Android y release
```

## Límites conocidos

- El streaming depende de YouTube y de `yt-dlp`; si YouTube cambia o bloquea una petición, hay que actualizar la herramienta.
- No hay reproducción oficial del catálogo de Spotify ni descarga de audio de Spotify.
- Las playlists de otros usuarios y las listas editoriales pueden estar restringidas por la API de Spotify.
- La importación de Spotify no se ha podido probar de extremo a extremo sin un Client ID y una cuenta autorizada.
- Exportify es un servicio externo: su disponibilidad y su flujo de inicio de sesión dependen de su proyecto, no de Davusic.
- El restablecimiento de fábrica no borra archivos de música personales, descargas de `~/Music/Davusic/` ni `yt-dlp`; es deliberado para evitar pérdidas irreversibles.
- La interfaz se prueba manualmente; no hay suite de tests de UI.
- Android está en vista previa: no importa música local, no ejecuta `yt-dlp` y no tiene MPRIS. La demo sí se puede reproducir.
- Los instaladores de Windows y la APK de vista previa no están firmados con certificados de distribución.

## Auditoría

La revisión técnica completa del proyecto, las decisiones de compatibilidad y las verificaciones de esta versión se documentan en el vault de Obsidian:

`/home/davo/Sync/Dabot-Vault/16-Davusic/Auditoría del Proyecto 2026-10-26.md`

## Licencia

MIT. Consulta [LICENSE](LICENSE).
