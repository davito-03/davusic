fn main() {
    // Client ID de la app de Spotify que se incrusta en el binario para que
    // «Conectar con Spotify» funcione sin configurar nada. No es un secreto:
    // el flujo PKCE no usa Client Secret. Se toma de la variable de entorno
    // o, si no existe, de `spotify_client_id.txt` en la raíz del repositorio.
    println!("cargo:rerun-if-env-changed=DAVUSIC_SPOTIFY_CLIENT_ID");
    println!("cargo:rerun-if-changed=spotify_client_id.txt");
    let client_id = std::env::var("DAVUSIC_SPOTIFY_CLIENT_ID")
        .ok()
        .or_else(|| std::fs::read_to_string("spotify_client_id.txt").ok())
        .map(|raw| raw.trim().to_string())
        .filter(|id| {
            id.len() >= 8
                && id
                    .chars()
                    .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_')
        })
        .unwrap_or_default();
    println!("cargo:rustc-env=DAVUSIC_BUILTIN_SPOTIFY_CLIENT_ID={client_id}");

    tauri_build::build()
}
