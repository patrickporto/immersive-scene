use once_cell::sync::Lazy;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

const DISCORD_API_BASE: &str = "https://discord.com/api/v10";

#[derive(Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub struct DiscordStreamTelemetry {
    connected: bool,
    bridge_ready: bool,
    bridge_connected: bool,
    guild_id: Option<String>,
    channel_id: Option<String>,
    chunks_sent: u64,
    chunks_dropped: u64,
    queue_depth: usize,
    queue_capacity: usize,
    underruns: u64,
    dropped_frames: u64,
    reconnect_attempts: u64,
    last_error: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SidecarTelemetry {
    connected: bool,
    guild_id: Option<String>,
    channel_id: Option<String>,
    chunks_sent: u64,
    chunks_dropped: u64,
    queue_depth: usize,
    queue_capacity: usize,
    underruns: u64,
    dropped_frames: u64,
    reconnect_attempts: u64,
    last_error: Option<String>,
}

#[derive(Debug, Serialize)]
struct SidecarRequest {
    id: u64,
    command: String,
    payload: Value,
}

#[derive(Debug, Deserialize)]
struct SidecarResponse {
    id: u64,
    ok: bool,
    result: Option<Value>,
    error: Option<String>,
}

struct SidecarProcess {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
    next_request_id: u64,
}

struct SidecarState {
    process: Option<SidecarProcess>,
}

impl SidecarState {
    fn new() -> Self {
        Self { process: None }
    }
}

static SIDECAR_STATE: Lazy<Mutex<SidecarState>> = Lazy::new(|| Mutex::new(SidecarState::new()));

fn discord_http_client() -> Result<Client, String> {
    Client::builder()
        .user_agent("immersive-scene-discord/1.0")
        .build()
        .map_err(|err| format!("Failed to build HTTP client: {err}"))
}

fn resolve_sidecar_script_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let dev_candidate = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("sidecar")
        .join("discord-voice-sidecar.cjs");

    if dev_candidate.exists() {
        return Ok(dev_candidate);
    }

    let resource_candidate = app_handle
        .path()
        .resource_dir()
        .map_err(|err| format!("Failed to resolve resource dir: {err}"))?
        .join("sidecar")
        .join("discord-voice-sidecar.cjs");

    if resource_candidate.exists() {
        return Ok(resource_candidate);
    }

    let flat_resource_candidate = app_handle
        .path()
        .resource_dir()
        .map_err(|err| format!("Failed to resolve resource dir: {err}"))?
        .join("discord-voice-sidecar.cjs");

    if flat_resource_candidate.exists() {
        return Ok(flat_resource_candidate);
    }

    Err("Discord sidecar script not found".to_string())
}

fn spawn_sidecar(app_handle: &AppHandle) -> Result<SidecarProcess, String> {
    let script_path = resolve_sidecar_script_path(app_handle)?;
    let node_binary = env::var("IMMERSIVE_SCENE_NODE_BIN").unwrap_or_else(|_| "node".to_string());

    let mut command = Command::new(node_binary);
    command
        .arg(script_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit());

    if let Ok(current_dir) = env::current_dir() {
        command.current_dir(current_dir);
    }

    let mut child = command
        .spawn()
        .map_err(|err| format!("Failed to start Discord sidecar: {err}"))?;

    let stdin = child
        .stdin
        .take()
        .ok_or_else(|| "Failed to open sidecar stdin".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Failed to open sidecar stdout".to_string())?;

    Ok(SidecarProcess {
        child,
        stdin,
        stdout: BufReader::new(stdout),
        next_request_id: 1,
    })
}

fn ensure_sidecar_started<'a>(
    app_handle: &AppHandle,
    state: &'a mut SidecarState,
) -> Result<&'a mut SidecarProcess, String> {
    let should_spawn = match state.process.as_mut() {
        Some(process) => process
            .child
            .try_wait()
            .map_err(|err| format!("Failed to query sidecar process state: {err}"))?
            .is_some(),
        None => true,
    };

    if should_spawn {
        state.process = Some(spawn_sidecar(app_handle)?);
    }

    state
        .process
        .as_mut()
        .ok_or_else(|| "Discord sidecar process is unavailable".to_string())
}

fn send_sidecar_request(app_handle: &AppHandle, command: &str, payload: Value) -> Result<Value, String> {
    let mut state = SIDECAR_STATE
        .lock()
        .map_err(|_| "Failed to lock Discord sidecar state".to_string())?;

    let process = ensure_sidecar_started(app_handle, &mut state)?;

    let request_id = process.next_request_id;
    process.next_request_id = process.next_request_id.saturating_add(1);

    let request = SidecarRequest {
        id: request_id,
        command: command.to_string(),
        payload,
    };

    let json_line = serde_json::to_string(&request)
        .map_err(|err| format!("Failed to serialize sidecar request: {err}"))?;

    process
        .stdin
        .write_all(json_line.as_bytes())
        .map_err(|err| format!("Failed to write sidecar request: {err}"))?;
    process
        .stdin
        .write_all(b"\n")
        .map_err(|err| format!("Failed to terminate sidecar request: {err}"))?;
    process
        .stdin
        .flush()
        .map_err(|err| format!("Failed to flush sidecar request: {err}"))?;

    let mut response_line = String::new();
    let bytes = process
        .stdout
        .read_line(&mut response_line)
        .map_err(|err| format!("Failed to read sidecar response: {err}"))?;

    if bytes == 0 {
        let exit_state = process
            .child
            .try_wait()
            .map_err(|err| format!("Failed to inspect sidecar exit state: {err}"))?;
        return Err(match exit_state {
            Some(status) => format!("Discord sidecar closed unexpectedly (status: {status})"),
            None => "Discord sidecar closed unexpectedly".to_string(),
        });
    }

    let response: SidecarResponse = serde_json::from_str(response_line.trim())
        .map_err(|err| format!("Failed to parse sidecar response: {err}"))?;

    if response.id != request_id {
        return Err("Discord sidecar response id mismatch".to_string());
    }

    if !response.ok {
        return Err(response
            .error
            .unwrap_or_else(|| "Discord sidecar returned an unknown error".to_string()));
    }

    Ok(response.result.unwrap_or(Value::Null))
}

fn map_sidecar_telemetry(raw: SidecarTelemetry) -> DiscordStreamTelemetry {
    DiscordStreamTelemetry {
        connected: raw.connected,
        bridge_ready: true,
        bridge_connected: raw.connected,
        guild_id: raw.guild_id,
        channel_id: raw.channel_id,
        chunks_sent: raw.chunks_sent,
        chunks_dropped: raw.chunks_dropped,
        queue_depth: raw.queue_depth,
        queue_capacity: raw.queue_capacity,
        underruns: raw.underruns,
        dropped_frames: raw.dropped_frames,
        reconnect_attempts: raw.reconnect_attempts,
        last_error: raw.last_error,
    }
}

#[tauri::command]
pub async fn discord_validate_token(token: String) -> Result<Value, String> {
    let client = discord_http_client()?;
    let response = client
        .get(format!("{DISCORD_API_BASE}/users/@me"))
        .header("Authorization", format!("Bot {token}"))
        .send()
        .await
        .map_err(|err| format!("Failed to validate token: {err}"))?;

    if !response.status().is_success() {
        return Err(format!("Token validation failed with status {}", response.status()));
    }

    response
        .json::<Value>()
        .await
        .map_err(|err| format!("Failed to parse Discord user response: {err}"))
}

#[tauri::command]
pub async fn discord_list_guilds(token: String) -> Result<Vec<Value>, String> {
    let client = discord_http_client()?;
    let response = client
        .get(format!("{DISCORD_API_BASE}/users/@me/guilds"))
        .header("Authorization", format!("Bot {token}"))
        .send()
        .await
        .map_err(|err| format!("Failed to list guilds: {err}"))?;

    if !response.status().is_success() {
        return Err(format!("Failed to list guilds with status {}", response.status()));
    }

    response
        .json::<Vec<Value>>()
        .await
        .map_err(|err| format!("Failed to parse guild list: {err}"))
}

#[tauri::command]
pub async fn discord_list_voice_channels(token: String, guild_id: String) -> Result<Vec<Value>, String> {
    let client = discord_http_client()?;
    let response = client
        .get(format!("{DISCORD_API_BASE}/guilds/{guild_id}/channels"))
        .header("Authorization", format!("Bot {token}"))
        .send()
        .await
        .map_err(|err| format!("Failed to list channels: {err}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to list channels for guild {guild_id} with status {}",
            response.status()
        ));
    }

    let all_channels = response
        .json::<Vec<Value>>()
        .await
        .map_err(|err| format!("Failed to parse channel list: {err}"))?;

    Ok(all_channels
        .into_iter()
        .filter(|channel| channel.get("type").and_then(|value| value.as_i64()) == Some(2))
        .collect())
}

#[tauri::command]
pub async fn discord_connect(
    app_handle: AppHandle,
    token: String,
    guild_id: String,
    channel_id: String,
) -> Result<(), String> {
    send_sidecar_request(
        &app_handle,
        "connect",
        json!({
            "token": token,
            "guildId": guild_id,
            "channelId": channel_id,
        }),
    )?;

    Ok(())
}

#[tauri::command]
pub async fn discord_disconnect(app_handle: AppHandle) -> Result<(), String> {
    send_sidecar_request(&app_handle, "disconnect", json!({}))?;
    Ok(())
}

#[tauri::command]
pub async fn discord_send_audio(app_handle: AppHandle, pcm_data: Vec<i16>) -> Result<(), String> {
    if pcm_data.is_empty() {
        return Ok(());
    }

    send_sidecar_request(
        &app_handle,
        "sendPcm",
        json!({
            "pcmData": pcm_data,
        }),
    )?;

    Ok(())
}

#[tauri::command]
pub async fn discord_get_stream_telemetry(app_handle: AppHandle) -> Result<DiscordStreamTelemetry, String> {
    let result = send_sidecar_request(&app_handle, "getTelemetry", json!({}))?;

    let raw = serde_json::from_value::<SidecarTelemetry>(result)
        .map_err(|err| format!("Failed to decode sidecar telemetry: {err}"))?;

    Ok(map_sidecar_telemetry(raw))
}

pub async fn shutdown_discord_connection(app_handle: AppHandle) {
    let _ = send_sidecar_request(&app_handle, "shutdown", json!({}));

    if let Ok(mut state) = SIDECAR_STATE.lock() {
        if let Some(mut process) = state.process.take() {
            let _ = process.child.kill();
            let _ = process.child.wait();
        }
    }
}
