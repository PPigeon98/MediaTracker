use serde_json::Value;

#[tauri::command]
pub async fn hardcover_search_books(api_key: String, query: String) -> Result<Value, String> {
    let token = api_key.trim().trim_start_matches("Bearer ").trim();
    if token.is_empty() {
        return Ok(serde_json::json!({ "data": { "search": { "results": [] } } }));
    }

    let gql = r#"
      query HardcoverBookSearch($query: String!, $perPage: Int!, $page: Int!) {
        search(query: $query, query_type: "Book", per_page: $perPage, page: $page) {
          results
        }
      }
    "#;

    let body = serde_json::json!({
        "query": gql,
        "variables": {
            "query": query,
            "perPage": 25,
            "page": 1
        }
    });

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.hardcover.app/v1/graphql")
        .header("content-type", "application/json")
        .header("authorization", format!("Bearer {token}"))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status();
    let payload: Value = response.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!("Hardcover API error ({status}): {payload}"));
    }

    Ok(payload)
}

