// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct SoundSet {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Mood {
    pub id: i64,
    pub sound_set_id: i64,
    pub name: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioElement {
    pub id: i64,
    pub mood_id: i64,
    pub file_path: String,
    pub file_name: String,
    pub channel_type: String,
    pub volume_db: f64,
    pub created_at: String,
}

fn get_db_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle.path().app_data_dir().unwrap();
    fs::create_dir_all(&app_dir).unwrap();
    app_dir.join("immersive_scene.db")
}

fn init_database(conn: &Connection) -> SqliteResult<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sound_sets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS moods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sound_set_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sound_set_id) REFERENCES sound_sets(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS audio_elements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mood_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            channel_type TEXT DEFAULT 'ambient',
            volume_db REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mood_id) REFERENCES moods(id) ON DELETE CASCADE
        )",
        [],
    )?;

    Ok(())
}

#[tauri::command]
async fn create_sound_set(
    app_handle: AppHandle,
    name: String,
    description: String,
) -> Result<SoundSet, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO sound_sets (name, description) VALUES (?1, ?2)",
        [&name, &description],
    ).map_err(|e| e.to_string())?;
    
    let id = conn.last_insert_rowid();
    
    Ok(SoundSet {
        id,
        name,
        description,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_sound_sets(app_handle: AppHandle) -> Result<Vec<SoundSet>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, name, description, created_at FROM sound_sets ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let sound_sets = stmt.query_map([], |row| {
        Ok(SoundSet {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            created_at: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let result: Result<Vec<_>, _> = sound_sets.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_sound_set(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM sound_sets WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn create_mood(
    app_handle: AppHandle,
    sound_set_id: i64,
    name: String,
    description: String,
) -> Result<Mood, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO moods (sound_set_id, name, description) VALUES (?1, ?2, ?3)",
        [&sound_set_id.to_string(), &name, &description],
    ).map_err(|e| e.to_string())?;
    
    let id = conn.last_insert_rowid();
    
    Ok(Mood {
        id,
        sound_set_id,
        name,
        description,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_moods(app_handle: AppHandle, sound_set_id: i64) -> Result<Vec<Mood>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, sound_set_id, name, description, created_at FROM moods WHERE sound_set_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let moods = stmt.query_map([sound_set_id], |row| {
        Ok(Mood {
            id: row.get(0)?,
            sound_set_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let result: Result<Vec<_>, _> = moods.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_audio_element(
    app_handle: AppHandle,
    mood_id: i64,
    file_path: String,
    file_name: String,
    channel_type: String,
) -> Result<AudioElement, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO audio_elements (mood_id, file_path, file_name, channel_type) VALUES (?1, ?2, ?3, ?4)",
        [&mood_id.to_string(), &file_path, &file_name, &channel_type],
    ).map_err(|e| e.to_string())?;
    
    let id = conn.last_insert_rowid();
    
    Ok(AudioElement {
        id,
        mood_id,
        file_path,
        file_name,
        channel_type,
        volume_db: 0.0,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_audio_elements(app_handle: AppHandle, mood_id: i64) -> Result<Vec<AudioElement>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, mood_id, file_path, file_name, channel_type, volume_db, created_at FROM audio_elements WHERE mood_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let elements = stmt.query_map([mood_id], |row| {
        Ok(AudioElement {
            id: row.get(0)?,
            mood_id: row.get(1)?,
            file_path: row.get(2)?,
            file_name: row.get(3)?,
            channel_type: row.get(4)?,
            volume_db: row.get(5)?,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let result: Result<Vec<_>, _> = elements.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_audio_element(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute("DELETE FROM audio_elements WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn init_db_command(app_handle: AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    init_database(&conn).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            init_db_command,
            create_sound_set,
            get_sound_sets,
            delete_sound_set,
            create_mood,
            get_moods,
            create_audio_element,
            get_audio_elements,
            delete_audio_element,
        ])
        .setup(|app| {
            let app_handle = app.handle();
            let db_path = get_db_path(&app_handle);
            if let Ok(conn) = Connection::open(db_path) {
                let _ = init_database(&conn);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
