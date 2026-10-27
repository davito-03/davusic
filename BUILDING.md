# Compilar Davusic

Davusic usa Tauri 2, Rust y un frontend estático. No hay `package.json`, bundler
ni servidor de desarrollo: los archivos de `frontend/` se embeben en el binario.

## Linux

### Dependencias

Arch/CachyOS:

```bash
sudo pacman -S --needed base-devel rust webkit2gtk-4.1 gtk3 librsvg pkgconf alsa-lib
```

Debian/Ubuntu:

```bash
sudo apt-get install -y \
  build-essential pkg-config \
  libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev \
  libasound2-dev patchelf
```

### Binario y paquetes

```bash
cargo build --release
./target/release/davusic

# Paquetes .deb y AppImage (requiere cargo-tauri)
cargo tauri build --bundles deb,appimage
```

Los paquetes quedan en `target/release/bundle/deb/` y
`target/release/bundle/appimage/`.

Para instalar en el usuario actual:

```bash
./scripts/install.sh
```

## Windows

Requisitos:

- Rust estable con el toolchain **MSVC** (`x86_64-pc-windows-msvc`).
- Visual Studio Build Tools con “Desktop development with C++”.
- WebView2 Runtime. El instalador de Davusic incluye el bootstrapper.
- [Tauri CLI 2](https://v2.tauri.app/start/prerequisites/).

Compilar desde PowerShell:

```powershell
cargo build --release
cargo tauri build
```

`tauri.windows.conf.json` genera instaladores **NSIS** y **MSI** en:

```text
target\release\bundle\nsis\
target\release\bundle\msi\
```

Los instaladores no están firmados con un certificado de código. Windows puede
mostrar SmartScreen hasta que exista uno.

## Android (vista previa)

El proyecto Android se genera en `gen/android` y se mantiene versionado para que
la CI no dependa de ejecutar `tauri android init` en cada compilación.

Requisitos:

- JDK 17.
- Android SDK con `platforms;android-37` y `build-tools;37.0.0`.
- Android NDK `27.0.12077973`.
- Rust targets de Android:
  `aarch64-linux-android`, `armv7-linux-androideabi`,
  `i686-linux-android` y `x86_64-linux-android`.

Ejemplo:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/27.0.12077973"
export ANDROID_NDK_HOME="$NDK_HOME"

rustup target add \
  aarch64-linux-android armv7-linux-androideabi \
  i686-linux-android x86_64-linux-android

cargo tauri android build --apk --ci
```

El APK de release sin configurar un keystore queda sin firmar. Para una APK de
prueba instalable se puede compilar en modo debug:

```bash
cargo tauri android build --debug --apk --ci
```

La CI publica esa APK como **vista previa**. Antes de distribuir en Google Play
hay que crear un keystore, configurar `gen/android/keystore.properties` y añadir
la configuración de firma en `gen/android/app/build.gradle.kts`.

### Límites actuales de Android

- No se ejecuta `yt-dlp`: no hay streaming de YouTube.
- No hay MPRIS ni integración con controles multimedia del sistema.
- No hay selector de carpetas/SAF para importar música local.
- La app abre con la biblioteca de demostración para poder evaluar la interfaz.

La versión de escritorio (Linux y Windows) conserva toda la funcionalidad.

## CI y releases

- `.github/workflows/ci.yml`: tests de Rust, sintaxis del frontend y build Linux.
- `.github/workflows/build.yml`: compila Linux, Windows y Android, sube
  artefactos y publica la release al empujar un tag `v*`.

```bash
git tag v0.1.0
git push origin v0.1.0
```

La release incluye `.deb`, `.AppImage`, `.exe` (NSIS), `.msi` y la APK de
vista previa. Los binarios de Windows y Android se generan en GitHub Actions;
no se compilan de forma cruzada desde Linux.
