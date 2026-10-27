// Cliente HTTP compartido. Usamos el proveedor criptográfico ring para que la
// compilación cruzada a Windows y Android no dependa de CMake/NASM de aws-lc.
use std::sync::Once;

static PROVIDER: Once = Once::new();

fn install_provider() {
    PROVIDER.call_once(|| {
        let _ = rustls::crypto::ring::default_provider().install_default();
    });
}

pub fn blocking_client_builder() -> reqwest::blocking::ClientBuilder {
    install_provider();
    reqwest::blocking::Client::builder()
}
