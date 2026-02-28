use reqwest::Client;
use serde_json::Value;

#[tauri::command]
pub async fn discord_validate_token(token: String) -> Result<Value, String> {
    let client = Client::new();
    let res = client
        .get("https://discord.com/api/v10/users/@me")
        .header("Authorization", format!("Bot {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        res.json::<Value>().await.map_err(|e| e.to_string())
    } else {
        Err(format!(
            "Invalid token or unexpected status: {}",
            res.status()
        ))
    }
}

#[tauri::command]
pub async fn discord_list_guilds(token: String) -> Result<Vec<Value>, String> {
    let client = Client::new();
    let res = client
        .get("https://discord.com/api/v10/users/@me/guilds")
        .header("Authorization", format!("Bot {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        res.json::<Vec<Value>>().await.map_err(|e| e.to_string())
    } else {
        Err(format!("Failed to list guilds: {}", res.status()))
    }
}

#[tauri::command]
pub async fn discord_list_voice_channels(
    token: String,
    guild_id: String,
) -> Result<Vec<Value>, String> {
    let client = Client::new();
    let res = client
        .get(&format!(
            "https://discord.com/api/v10/guilds/{}/channels",
            guild_id
        ))
        .header("Authorization", format!("Bot {}", token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let channels: Vec<Value> = res.json().await.map_err(|e| e.to_string())?;
        // Filter type 2 (GUILD_VOICE)
        let voice_channels = channels
            .into_iter()
            .filter(|c| c.get("type").and_then(|t| t.as_u64()) == Some(2))
            .collect();
        Ok(voice_channels)
    } else {
        Err(format!("Failed to list channels: {}", res.status()))
    }
}

// TODO: Implement actual Songbird + Serenity connection state management.
// For now, these are stubs so the frontend can build against the API.

#[tauri::command]
pub async fn discord_connect(
    token: String,
    guild_id: String,
    channel_id: String,
) -> Result<(), String> {
    println!(
        "Stub: Connecting to discord G:{} C:{} with token: {}",
        guild_id, channel_id, token
    );
    // In a real implementation, we would initialize a Serenity client here,
    // establish a voice connection using songbird, and spawn a background task.
    Ok(())
}

#[tauri::command]
pub async fn discord_disconnect() -> Result<(), String> {
    println!("Stub: Disconnecting from discord");
    Ok(())
}

#[tauri::command]
pub async fn discord_send_audio(_pcm_data: Vec<f32>) -> Result<(), String> {
    // Stub: feed audio to the songbird track
    Ok(())
}
