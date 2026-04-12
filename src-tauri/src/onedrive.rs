//! OneDrive via Microsoft Graph (OAuth 2.0 PKCE). Browser sign-in → redirect **`media-tracker://oauth`** → app.
//!
//! **Publisher:** register one [Entra app](https://entra.microsoft.com/) (mobile/desktop public client), redirect
//! `media-tracker://oauth`, Graph delegated `Files.ReadWrite` + `offline_access`.
//! The Application (client) ID **must** be supplied at **compile time** only:
//! `MEDIATRACKER_ONEDRIVE_CLIENT_ID=<guid> cargo build` / `tauri build` (not a secret for native PKCE).
//! Builds without it cannot use OneDrive (sign-in and sync operations fail with a clear error).

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;
use tokio::sync::oneshot;
use url::Url;

pub const OAUTH_REDIRECT_URI: &str = "media-tracker://oauth";

const GRAPH_ITEM_PATH: &str = "Apps/media-tracker/sync-data.json";

fn embedded_client_id() -> Option<&'static str> {
    option_env!("MEDIATRACKER_ONEDRIVE_CLIENT_ID")
        .map(str::trim)
        .filter(|s| !s.is_empty())
}

#[derive(Serialize, Deserialize)]
struct OnedriveSettings {
    #[serde(alias = "clientId")]
    client_id: String,
}

#[derive(Serialize, Deserialize)]
struct TokenCache {
    access_token: String,
    refresh_token: String,
    expires_at_unix: i64,
}

#[derive(Clone, Default)]
pub struct OauthPending(pub Arc<Mutex<Option<OauthPendingInner>>>);

pub struct OauthPendingInner {
    pub expected_csrf: String,
    pub reply: oneshot::Sender<Result<String, String>>,
}

fn oauth_pending_clear(pending: &OauthPending) {
    if let Ok(mut g) = pending.0.lock() {
        *g = None;
    }
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

fn settings_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    Ok(app_data_dir(app)?.join("onedrive_settings.json"))
}

fn tokens_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    Ok(app_data_dir(app)?.join("onedrive_tokens.json"))
}

fn read_tokens(app: &tauri::AppHandle) -> Result<TokenCache, String> {
    let p = tokens_path(app)?;
    let raw = std::fs::read_to_string(&p).map_err(|e| format!("Not signed in to OneDrive: {e}"))?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

fn write_tokens(app: &tauri::AppHandle, cache: &TokenCache) -> Result<(), String> {
    let p = tokens_path(app)?;
    std::fs::write(&p, serde_json::to_string_pretty(cache).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())
}

fn pkce_verifier() -> String {
    let mut bytes = [0u8; 48];
    rand::thread_rng().fill_bytes(&mut bytes);
    URL_SAFE_NO_PAD.encode(bytes)
}

fn pkce_challenge(verifier: &str) -> String {
    let hash = Sha256::digest(verifier.as_bytes());
    URL_SAFE_NO_PAD.encode(hash)
}

pub fn handle_oauth_redirect_url(app: &tauri::AppHandle, pending: &OauthPending, raw_url: &str) {
    let Ok(parsed) = Url::parse(raw_url) else {
        return;
    };
    if parsed.scheme() != "media-tracker" {
        return;
    }

    let mut code: Option<String> = None;
    let mut state: Option<String> = None;
    let mut oauth_err: Option<String> = None;
    let mut oauth_desc: Option<String> = None;

    for (k, v) in parsed.query_pairs() {
        match k.as_ref() {
            "code" => code = Some(v.into_owned()),
            "state" => state = Some(v.into_owned()),
            "error" => oauth_err = Some(v.into_owned()),
            "error_description" => oauth_desc = Some(v.into_owned()),
            _ => {}
        }
    }

    let mut guard = match pending.0.lock() {
        Ok(g) => g,
        Err(_) => return,
    };

    let Some(inner) = guard.take() else {
        return;
    };

    if let Some(err) = oauth_err {
        let msg = oauth_desc.unwrap_or_default();
        let _ = inner
            .reply
            .send(Err(format!("{err}: {msg}")));
        return;
    }

    let Some(c) = code else {
        let _ = inner.reply.send(Err("OAuth redirect missing code.".into()));
        return;
    };

    let Some(st) = state else {
        let _ = inner.reply.send(Err("OAuth redirect missing state.".into()));
        return;
    };

    if st != inner.expected_csrf {
        let _ = inner.reply.send(Err("Invalid OAuth state.".into()));
        return;
    }

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.set_focus();
    }
    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        let _ = app;
    }

    let _ = inner.reply.send(Ok(c));
}

async fn exchange_code_for_tokens(
    client: &reqwest::Client,
    client_id: &str,
    code: &str,
    code_verifier: &str,
) -> Result<TokenCache, String> {
    let redirect = OAUTH_REDIRECT_URI;
    let body = format!(
        "client_id={}&grant_type=authorization_code&code={}&redirect_uri={}&code_verifier={}&scope={}",
        urlencoding::encode(client_id),
        urlencoding::encode(code),
        urlencoding::encode(redirect),
        urlencoding::encode(code_verifier),
        urlencoding::encode("Files.ReadWrite offline_access"),
    );
    let res = client
        .post("https://login.microsoftonline.com/common/oauth2/v2.0/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {t}"));
    }
    let v: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let access = v
        .get("access_token")
        .and_then(|x| x.as_str())
        .ok_or_else(|| "No access_token in response".to_string())?
        .to_string();
    let refresh = v
        .get("refresh_token")
        .and_then(|x| x.as_str())
        .unwrap_or("")
        .to_string();
    if refresh.is_empty() {
        return Err(
            "No refresh_token (sign in again and ensure offline_access scope is granted).".into(),
        );
    }
    let expires_in = v.get("expires_in").and_then(|x| x.as_i64()).unwrap_or(3600);
    let expires_at_unix = chrono::Utc::now().timestamp() + expires_in - 60;
    Ok(TokenCache {
        access_token: access,
        refresh_token: refresh,
        expires_at_unix,
    })
}

async fn refresh_tokens(
    client: &reqwest::Client,
    client_id: &str,
    refresh: &str,
) -> Result<TokenCache, String> {
    let body = format!(
        "client_id={}&grant_type=refresh_token&refresh_token={}&scope={}",
        urlencoding::encode(client_id),
        urlencoding::encode(refresh),
        urlencoding::encode("Files.ReadWrite offline_access"),
    );
    let res = client
        .post("https://login.microsoftonline.com/common/oauth2/v2.0/token")
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {t}"));
    }
    let v: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let access = v
        .get("access_token")
        .and_then(|x| x.as_str())
        .ok_or_else(|| "No access_token".to_string())?
        .to_string();
    let new_refresh = v
        .get("refresh_token")
        .and_then(|x| x.as_str())
        .unwrap_or(refresh)
        .to_string();
    let expires_in = v.get("expires_in").and_then(|x| x.as_i64()).unwrap_or(3600);
    let expires_at_unix = chrono::Utc::now().timestamp() + expires_in - 60;
    Ok(TokenCache {
        access_token: access,
        refresh_token: new_refresh,
        expires_at_unix,
    })
}

async fn ensure_access_token(app: &tauri::AppHandle) -> Result<String, String> {
    let client_id = embedded_client_id().ok_or_else(|| {
        "This build has no OneDrive client id. Rebuild with MEDIATRACKER_ONEDRIVE_CLIENT_ID set to your Entra Application (client) ID."
            .to_string()
    })?;
    let mut cache = read_tokens(app)?;
    let client = reqwest::Client::new();
    if chrono::Utc::now().timestamp() >= cache.expires_at_unix {
        cache = refresh_tokens(&client, client_id, &cache.refresh_token).await?;
        write_tokens(app, &cache)?;
    }
    Ok(cache.access_token)
}

#[tauri::command]
pub async fn onedrive_sign_in(
    app: tauri::AppHandle,
    pending: tauri::State<'_, OauthPending>,
) -> Result<(), String> {
    let effective = embedded_client_id().ok_or_else(|| {
        "This build has no OneDrive client id. Rebuild with MEDIATRACKER_ONEDRIVE_CLIENT_ID=<Application (client) ID> (compile-time only)."
            .to_string()
    })?;
    let settings = OnedriveSettings {
        client_id: effective.to_string(),
    };
    let sp = settings_path(&app)?;
    std::fs::write(
        &sp,
        serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    let verifier = pkce_verifier();
    let challenge = pkce_challenge(&verifier);
    let csrf: String = {
        let mut b = [0u8; 16];
        rand::thread_rng().fill_bytes(&mut b);
        URL_SAFE_NO_PAD.encode(b)
    };

    let (reply_tx, reply_rx) = oneshot::channel::<Result<String, String>>();

    {
        let mut g = pending.0.lock().map_err(|e| e.to_string())?;
        if g.is_some() {
            return Err("A sign-in is already in progress.".into());
        }
        *g = Some(OauthPendingInner {
            expected_csrf: csrf.clone(),
            reply: reply_tx,
        });
    }

    let redirect_uri = urlencoding::encode(OAUTH_REDIRECT_URI);
    let auth_url = format!(
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={}&response_type=code&redirect_uri={}&response_mode=query&scope={}&code_challenge={}&code_challenge_method=S256&state={}",
        urlencoding::encode(&effective),
        redirect_uri,
        urlencoding::encode("Files.ReadWrite offline_access"),
        urlencoding::encode(&challenge),
        urlencoding::encode(&csrf),
    );

    if let Err(e) = app.opener().open_url(&auth_url, None::<&str>) {
        oauth_pending_clear(&pending);
        return Err(e.to_string());
    }

    let code_result =
        tokio::time::timeout(std::time::Duration::from_secs(600), reply_rx).await;

    let code = match code_result {
        Ok(Ok(Ok(c))) => c,
        Ok(Ok(Err(e))) => {
            oauth_pending_clear(&pending);
            return Err(e);
        }
        Ok(Err(_)) => {
            oauth_pending_clear(&pending);
            return Err("Sign-in channel closed.".into());
        }
        Err(_) => {
            oauth_pending_clear(&pending);
            return Err("Sign-in timed out.".into());
        }
    };

    let http = reqwest::Client::new();
    let tokens = exchange_code_for_tokens(&http, effective, &code, &verifier).await?;
    write_tokens(&app, &tokens)?;
    Ok(())
}

#[tauri::command]
pub fn onedrive_sign_out(app: tauri::AppHandle) -> Result<(), String> {
    let tp = tokens_path(&app)?;
    if tp.exists() {
        std::fs::remove_file(&tp).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn onedrive_status(app: tauri::AppHandle) -> Result<bool, String> {
    let tp = tokens_path(&app)?;
    Ok(tp.exists())
}

#[tauri::command]
pub async fn onedrive_push(app: tauri::AppHandle, staging_filename: String) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join(staging_filename.trim());
    if !path.starts_with(&dir) {
        return Err("Invalid staging path.".into());
    }
    let bytes = std::fs::read(&path).map_err(|e| format!("Read staging file: {e}"))?;
    if bytes.is_empty() {
        return Err("Staging file is empty.".into());
    }
    let token = ensure_access_token(&app).await?;
    let client = reqwest::Client::new();
    let url = format!(
        "https://graph.microsoft.com/v1.0/me/drive/root:/{}:/content",
        GRAPH_ITEM_PATH
    );
    const SIMPLE_LIMIT: usize = 3_500_000;
    if bytes.len() <= SIMPLE_LIMIT {
        let res = client
            .put(&url)
            .header("Authorization", format!("Bearer {token}"))
            .header("Content-Type", "application/json")
            .body(bytes)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        if !res.status().is_success() {
            let t = res.text().await.unwrap_or_default();
            return Err(format!("OneDrive upload failed: {t}"));
        }
        return Ok(());
    }

    let session_url = format!(
        "https://graph.microsoft.com/v1.0/me/drive/root:/{}:/createUploadSession",
        GRAPH_ITEM_PATH
    );
    let res = client
        .post(&session_url)
        .header("Authorization", format!("Bearer {token}"))
        .header("Content-Type", "application/json")
        .json(&serde_json::json!({
            "item": { "@microsoft.graph.conflictBehavior": "replace" }
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("createUploadSession: {t}"));
    }
    let v: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let upload_url = v
        .get("uploadUrl")
        .and_then(|x| x.as_str())
        .ok_or_else(|| "No uploadUrl".to_string())?;
    let total = bytes.len();
    let res = client
        .put(upload_url)
        .header(
            "Content-Range",
            format!("bytes {}-{}/{}", 0, total.saturating_sub(1), total),
        )
        .body(bytes)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() && res.status() != reqwest::StatusCode::CREATED {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("Chunk upload: {t}"));
    }
    Ok(())
}

#[tauri::command]
pub async fn onedrive_pull(app: tauri::AppHandle, staging_filename: String) -> Result<(), String> {
    let token = ensure_access_token(&app).await?;
    let url = format!(
        "https://graph.microsoft.com/v1.0/me/drive/root:/{}:/content",
        GRAPH_ITEM_PATH
    );
    let client = reqwest::Client::new();
    let res = client
        .get(&url)
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if res.status() == reqwest::StatusCode::NOT_FOUND {
        return Err("No backup found in OneDrive yet. Push from another device first.".into());
    }
    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("OneDrive download failed: {t}"));
    }
    let bytes = res.bytes().await.map_err(|e| e.to_string())?;
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = dir.join(staging_filename.trim());
    if !path.starts_with(&dir) {
        return Err("Invalid staging path.".into());
    }
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(())
}
