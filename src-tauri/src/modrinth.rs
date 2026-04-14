use serde_json::Value;

#[tauri::command]
pub async fn modrinth_search_projects(query: String) -> Result<Value, String> {
    let q = query.trim();
    if q.is_empty() {
        return Ok(serde_json::json!({ "hits": [] }));
    }

    // Search only mods + modpacks so they map cleanly to game items.
    let facets = r#"[["project_type:mod","project_type:modpack"]]"#;
    let url = format!(
        "https://api.modrinth.com/v2/search?query={}&limit=25&facets={}",
        urlencoding::encode(q),
        urlencoding::encode(facets),
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        // Modrinth requests a descriptive User-Agent for API usage.
        .header("user-agent", "MediaTracker/0.5 (desktop app)")
        .header("accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status();
    let payload: Value = response.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("Modrinth API error ({status}): {payload}"));
    }

    Ok(payload)
}
