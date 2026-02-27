// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

pub mod import_export;
pub use import_export::*;
pub mod discord;

#[derive(Debug, Serialize, Deserialize)]
pub struct SoundSet {
    pub id: i64,
    pub name: String,
    pub description: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub audio_file_strategy: String, // "reference" or "copy"
    pub library_path: String,
    #[serde(default)]
    pub output_device_id: String,
    #[serde(default)]
    pub discord_bot_token: String,
    #[serde(default)]
    pub discord_guild_id: String,
    #[serde(default)]
    pub discord_channel_id: String,
}

pub(crate) fn get_settings_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle.path().app_data_dir().unwrap();
    fs::create_dir_all(&app_dir).unwrap();
    app_dir.join("settings.json")
}

pub(crate) fn get_default_library_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle.path().app_data_dir().unwrap();
    app_dir.join("library").join("audio")
}

pub(crate) fn read_app_settings(app_handle: &AppHandle) -> AppSettings {
    let settings_path = get_settings_path(app_handle);
    let default_library_path = get_default_library_path(app_handle)
        .to_string_lossy()
        .to_string();

    if settings_path.exists() {
        if let Ok(content) = fs::read_to_string(&settings_path) {
            if let Ok(mut settings) = serde_json::from_str::<AppSettings>(&content) {
                if settings.library_path.trim().is_empty() {
                    settings.library_path = default_library_path;
                }
                return settings;
            }
        }
    }

    AppSettings {
        audio_file_strategy: "reference".to_string(),
        library_path: default_library_path,
        output_device_id: "".to_string(),
        discord_bot_token: "".to_string(),
        discord_guild_id: "".to_string(),
        discord_channel_id: "".to_string(),
    }
}

#[tauri::command]
async fn get_app_settings(app_handle: AppHandle) -> Result<AppSettings, String> {
    Ok(read_app_settings(&app_handle))
}

#[tauri::command]
async fn update_app_settings(app_handle: AppHandle, settings: AppSettings) -> Result<(), String> {
    let settings_path = get_settings_path(&app_handle);

    let json = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path, json).map_err(|e| e.to_string())?;

    Ok(())
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
pub struct AudioChannel {
    pub id: i64,
    pub sound_set_id: i64,
    pub name: String,
    pub icon: String,
    pub volume: f64,
    pub order_index: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioElement {
    pub id: i64,
    pub sound_set_id: Option<i64>,
    pub channel_id: Option<i64>,
    pub file_path: String,
    pub file_name: String,
    pub channel_type: String,
    pub volume_db: f64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Timeline {
    pub id: i64,
    pub mood_id: i64,
    pub name: String,
    pub order_index: i64,
    pub is_looping: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineTrack {
    pub id: i64,
    pub timeline_id: i64,
    pub name: String,
    pub order_index: i64,
    pub is_looping: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ElementGroup {
    pub id: i64,
    pub name: String,
    pub sound_set_id: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ElementGroupMember {
    pub id: i64,
    pub group_id: i64,
    pub audio_element_id: i64,
    pub order_index: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineElement {
    pub id: i64,
    pub track_id: i64,
    pub audio_element_id: Option<i64>,
    pub element_group_id: Option<i64>,
    pub start_time_ms: i64,
    pub duration_ms: i64,
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
        "CREATE TABLE IF NOT EXISTS audio_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sound_set_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT 'generic',
            volume REAL NOT NULL DEFAULT 1.0,
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sound_set_id) REFERENCES sound_sets(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS audio_elements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sound_set_id INTEGER,
            channel_id INTEGER,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            channel_type TEXT DEFAULT 'ambient',
            volume_db REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sound_set_id) REFERENCES sound_sets(id) ON DELETE CASCADE,
            FOREIGN KEY (channel_id) REFERENCES audio_channels(id) ON DELETE SET NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS timelines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mood_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            is_looping INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mood_id) REFERENCES moods(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS timeline_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timeline_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            order_index INTEGER DEFAULT 0,
            is_looping INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS element_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sound_set_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sound_set_id) REFERENCES sound_sets(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS element_group_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id INTEGER NOT NULL,
            audio_element_id INTEGER NOT NULL,
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY (group_id) REFERENCES element_groups(id) ON DELETE CASCADE,
            FOREIGN KEY (audio_element_id) REFERENCES audio_elements(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS timeline_elements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timeline_id INTEGER,
            track_id INTEGER,
            audio_element_id INTEGER,
            element_group_id INTEGER,
            start_time_ms INTEGER DEFAULT 0,
            duration_ms INTEGER DEFAULT 0,
            FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES timeline_tracks(id) ON DELETE CASCADE,
            FOREIGN KEY (audio_element_id) REFERENCES audio_elements(id) ON DELETE CASCADE,
            FOREIGN KEY (element_group_id) REFERENCES element_groups(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Migration
    let mut stmt = conn.prepare("PRAGMA table_info(audio_elements)")?;
    let has_mood_id = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "mood_id")
        })?
        .any(|r| r.unwrap_or(false));

    let mut stmt2 = conn.prepare("PRAGMA table_info(audio_elements)")?;
    let has_sound_set_id = stmt2
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "sound_set_id")
        })?
        .any(|r| r.unwrap_or(false));

    if has_mood_id && !has_sound_set_id {
        conn.execute(
            "ALTER TABLE audio_elements ADD COLUMN sound_set_id INTEGER REFERENCES sound_sets(id)",
            [],
        )?;
        conn.execute("UPDATE audio_elements SET sound_set_id = (SELECT sound_set_id FROM moods WHERE moods.id = audio_elements.mood_id)", [])?;
    }

    // Timelines migration for is_looping
    let mut stmt = conn.prepare("PRAGMA table_info(timelines)")?;
    let has_is_looping = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "is_looping")
        })?
        .any(|r| r.unwrap_or(false));

    if !has_is_looping {
        conn.execute(
            "ALTER TABLE timelines ADD COLUMN is_looping INTEGER DEFAULT 0",
            [],
        )?;
    }

    // Timeline tracks migration for is_looping
    let mut stmt = conn.prepare("PRAGMA table_info(timeline_tracks)")?;
    let track_has_is_looping = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "is_looping")
        })?
        .any(|r| r.unwrap_or(false));

    if !track_has_is_looping {
        conn.execute(
            "ALTER TABLE timeline_tracks ADD COLUMN is_looping INTEGER DEFAULT 0",
            [],
        )?;
    }

    // Audio channels migration
    let mut stmt = conn.prepare("PRAGMA table_info(audio_elements)")?;
    let has_channel_id = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "channel_id")
        })?
        .any(|r| r.unwrap_or(false));

    if !has_channel_id {
        conn.execute(
            "ALTER TABLE audio_elements ADD COLUMN channel_id INTEGER REFERENCES audio_channels(id)",
            [],
        )?;

        // Ensure default Music channel exists for all soundsets that have elements before we update
        conn.execute(
            "INSERT INTO audio_channels (sound_set_id, name, icon, volume, order_index)
             SELECT DISTINCT sound_set_id, 'Music', 'music', 1.0, 0 
             FROM audio_elements WHERE sound_set_id NOT IN (SELECT sound_set_id FROM audio_channels WHERE name = 'Music')",
            [],
        )?;

        // Assign existing elements to the Music channel of their sound set
        conn.execute(
            "UPDATE audio_elements SET channel_id = (
                SELECT id FROM audio_channels 
                WHERE audio_channels.sound_set_id = audio_elements.sound_set_id 
                AND audio_channels.name = 'Music' LIMIT 1
            )",
            [],
        )?;
    }

    // Timeline elements migration for tracks and duration + element groups
    let mut stmt = conn.prepare("PRAGMA table_info(timeline_elements)")?;
    let has_track_id = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "track_id")
        })?
        .any(|r| r.unwrap_or(false));

    let mut stmt_eg = conn.prepare("PRAGMA table_info(timeline_elements)")?;
    let has_element_group_id = stmt_eg
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "element_group_id")
        })?
        .any(|r| r.unwrap_or(false));

    if !has_track_id || !has_element_group_id {
        conn.execute("PRAGMA foreign_keys=off;", [])?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS timeline_elements_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timeline_id INTEGER,
                track_id INTEGER,
                audio_element_id INTEGER,
                element_group_id INTEGER,
                start_time_ms INTEGER DEFAULT 0,
                duration_ms INTEGER DEFAULT 0,
                FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE,
                FOREIGN KEY (track_id) REFERENCES timeline_tracks(id) ON DELETE CASCADE,
                FOREIGN KEY (audio_element_id) REFERENCES audio_elements(id) ON DELETE CASCADE,
                FOREIGN KEY (element_group_id) REFERENCES element_groups(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Assume columns match original except potentially missing track_id, duration_ms, element_group_id
        if !has_track_id {
            // Need to create default master track and copy over
            conn.execute("INSERT INTO timeline_tracks (timeline_id, name, order_index) SELECT id, 'Master Track', 0 FROM timelines", [])?;
            conn.execute(
                "INSERT INTO timeline_elements_new (id, timeline_id, track_id, audio_element_id, start_time_ms, duration_ms)
                 SELECT e.id, e.timeline_id, t.id, e.audio_element_id, COALESCE(e.start_time_ms, 0), 0 
                 FROM timeline_elements e 
                 LEFT JOIN timeline_tracks t ON t.timeline_id = e.timeline_id",
                [],
            )?;
        } else {
            conn.execute(
                "INSERT INTO timeline_elements_new (id, timeline_id, track_id, audio_element_id, start_time_ms, duration_ms)
                 SELECT id, timeline_id, track_id, audio_element_id, start_time_ms, duration_ms FROM timeline_elements",
                [],
            )?;
        }

        conn.execute("DROP TABLE timeline_elements", [])?;
        conn.execute(
            "ALTER TABLE timeline_elements_new RENAME TO timeline_elements",
            [],
        )?;
        conn.execute("PRAGMA foreign_keys=on;", [])?;
    }

    // Timeline deduplication migration
    let mut stmt = conn.prepare(
        "SELECT count(*) FROM sqlite_master WHERE type='index' AND name='ux_timelines_mood_id'",
    )?;
    let has_unique_timeline_index = stmt
        .query_row([], |row| {
            let count: i64 = row.get(0)?;
            Ok(count > 0)
        })
        .unwrap_or(false);

    if !has_unique_timeline_index {
        // Keep the oldest timeline per mood, delete the rest
        conn.execute(
            "DELETE FROM timelines WHERE id NOT IN (
                SELECT MIN(id) FROM timelines GROUP BY mood_id
            )",
            [],
        )?;

        // Create unique index
        conn.execute(
            "CREATE UNIQUE INDEX ux_timelines_mood_id ON timelines(mood_id)",
            [],
        )?;
    }

    // Global one-shots migration (drop legacy mood_id and allow global rows)
    let mut stmt = conn.prepare("PRAGMA table_info(audio_elements)")?;
    let is_sound_set_id_not_null = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            let notnull: bool = row.get(3)?;
            Ok(name == "sound_set_id" && notnull)
        })?
        .any(|r| r.unwrap_or(false));

    let needs_audio_elements_rebuild = has_mood_id || is_sound_set_id_not_null;

    if needs_audio_elements_rebuild {
        conn.execute("PRAGMA foreign_keys=off;", [])?;
        conn.execute(
            "CREATE TABLE IF NOT EXISTS audio_elements_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sound_set_id INTEGER,
                channel_id INTEGER,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                channel_type TEXT DEFAULT 'ambient',
                volume_db REAL DEFAULT 0.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sound_set_id) REFERENCES sound_sets(id) ON DELETE CASCADE,
                FOREIGN KEY (channel_id) REFERENCES audio_channels(id) ON DELETE SET NULL
            )",
            [],
        )?;

        if has_mood_id {
            conn.execute(
                "INSERT INTO audio_elements_new (id, sound_set_id, channel_id, file_path, file_name, channel_type, volume_db, created_at)
                 SELECT
                    id,
                    COALESCE(
                        sound_set_id,
                        (SELECT sound_set_id FROM moods WHERE moods.id = audio_elements.mood_id)
                    ),
                    channel_id,
                    file_path,
                    file_name,
                    channel_type,
                    volume_db,
                    created_at
                 FROM audio_elements",
                [],
            )?;
        } else {
            conn.execute(
                "INSERT INTO audio_elements_new (id, sound_set_id, channel_id, file_path, file_name, channel_type, volume_db, created_at)
                 SELECT
                    id,
                    sound_set_id,
                    channel_id,
                    file_path,
                    file_name,
                    channel_type,
                    volume_db,
                    created_at
                 FROM audio_elements",
                [],
            )?;
        }

        conn.execute("DROP TABLE audio_elements", [])?;
        conn.execute(
            "ALTER TABLE audio_elements_new RENAME TO audio_elements",
            [],
        )?;
        conn.execute("PRAGMA foreign_keys=on;", [])?;
    }

    Ok(())
}

fn check_element_overlap(
    conn: &Connection,
    track_id: i64,
    start_time_ms: i64,
    duration_ms: i64,
    exclude_id: Option<i64>,
) -> Result<bool, String> {
    let end_time_ms = start_time_ms + duration_ms;

    let query = match exclude_id {
        Some(_) => "SELECT count(*) FROM timeline_elements WHERE track_id = ?1 AND id != ?2 AND start_time_ms < ?3 AND (start_time_ms + duration_ms) > ?4",
        None => "SELECT count(*) FROM timeline_elements WHERE track_id = ?1 AND start_time_ms < ?2 AND (start_time_ms + duration_ms) > ?3",
    };

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

    let count: i64 = match exclude_id {
        Some(id) => stmt
            .query_row([&track_id, &id, &end_time_ms, &start_time_ms], |row| {
                row.get(0)
            })
            .map_err(|e| e.to_string())?,
        None => stmt
            .query_row([&track_id, &end_time_ms, &start_time_ms], |row| row.get(0))
            .map_err(|e| e.to_string())?,
    };

    Ok(count > 0)
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
    )
    .map_err(|e| e.to_string())?;

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

    let mut stmt = conn
        .prepare(
            "SELECT id, name, description, created_at FROM sound_sets ORDER BY created_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let sound_sets = stmt
        .query_map([], |row| {
            Ok(SoundSet {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

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
    )
    .map_err(|e| e.to_string())?;

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

    let moods = stmt
        .query_map([sound_set_id], |row| {
            Ok(Mood {
                id: row.get(0)?,
                sound_set_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = moods.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_mood(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM moods WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_audio_element(
    app_handle: AppHandle,
    sound_set_id: i64,
    file_path: String,
    file_name: String,
    channel_type: String,
    channel_id: Option<i64>,
) -> Result<AudioElement, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let settings = get_app_settings(app_handle.clone()).await?;
    let mut final_file_path = file_path.clone();

    if settings.audio_file_strategy == "copy" {
        let library_dir = if settings.library_path.trim().is_empty() {
            get_default_library_path(&app_handle)
        } else {
            PathBuf::from(&settings.library_path)
        };
        if !library_dir.exists() {
            fs::create_dir_all(&library_dir).map_err(|e| e.to_string())?;
        }

        let destination = library_dir.join(&file_name);
        fs::copy(&file_path, &destination).map_err(|e| e.to_string())?;
        final_file_path = destination.to_string_lossy().to_string();
    }

    conn.execute(
        "INSERT INTO audio_elements (sound_set_id, file_path, file_name, channel_type, channel_id) VALUES (?1, ?2, ?3, ?4, ?5)",
        (&sound_set_id, &final_file_path, &file_name, &channel_type, &channel_id),
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(AudioElement {
        id,
        sound_set_id: Some(sound_set_id),
        channel_id,
        file_path: final_file_path,
        file_name,
        channel_type,
        volume_db: 0.0,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_audio_elements(
    app_handle: AppHandle,
    sound_set_id: i64,
) -> Result<Vec<AudioElement>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, sound_set_id, file_path, file_name, channel_type, volume_db, created_at, channel_id FROM audio_elements WHERE sound_set_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let elements = stmt
        .query_map([sound_set_id], |row| {
            Ok(AudioElement {
                id: row.get(0)?,
                sound_set_id: row.get(1)?,
                file_path: row.get(2)?,
                file_name: row.get(3)?,
                channel_type: row.get(4)?,
                volume_db: row.get(5)?,
                created_at: row.get(6)?,
                channel_id: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

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
async fn update_audio_element_channel(
    app_handle: AppHandle,
    id: i64,
    channel_type: String,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE audio_elements SET channel_type = ?1 WHERE id = ?2",
        (&channel_type, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn update_audio_element_channel_id(
    app_handle: AppHandle,
    id: i64,
    channel_id: Option<i64>,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE audio_elements SET channel_id = ?1 WHERE id = ?2",
        (&channel_id, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_timeline(
    app_handle: AppHandle,
    mood_id: i64,
    name: String,
) -> Result<Timeline, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // Check if one already exists
    let mut stmt = conn.prepare("SELECT id, name, order_index, is_looping, created_at FROM timelines WHERE mood_id = ?1").map_err(|e| e.to_string())?;

    let existing = stmt.query_row([&mood_id], |row| {
        Ok(Timeline {
            id: row.get(0)?,
            mood_id,
            name: row.get(1)?,
            order_index: row.get(2)?,
            is_looping: row.get::<_, i64>(3)? != 0,
            created_at: row.get(4)?,
        })
    });

    if let Ok(timeline) = existing {
        return Ok(timeline);
    }

    conn.execute(
        "INSERT INTO timelines (mood_id, name, order_index, is_looping) VALUES (?1, ?2, 0, 0)",
        [&mood_id.to_string(), &name],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    // Automatically create a default track for new timelines
    conn.execute(
        "INSERT INTO timeline_tracks (timeline_id, name, order_index, is_looping) VALUES (?1, 'Track 1', 0, 0)",
        [&id.to_string()],
    )
    .map_err(|e| e.to_string())?;

    Ok(Timeline {
        id,
        mood_id,
        name,
        order_index: 0,
        is_looping: false,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_timelines(app_handle: AppHandle, mood_id: i64) -> Result<Vec<Timeline>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, mood_id, name, order_index, is_looping, created_at FROM timelines WHERE mood_id = ?1 ORDER BY order_index ASC"
    ).map_err(|e| e.to_string())?;

    let timelines = stmt
        .query_map([mood_id], |row| {
            Ok(Timeline {
                id: row.get(0)?,
                mood_id: row.get(1)?,
                name: row.get(2)?,
                order_index: row.get(3)?,
                is_looping: row.get::<_, i64>(4)? != 0,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = timelines.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_timeline(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM timelines WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn update_timeline_loop(
    app_handle: AppHandle,
    id: i64,
    is_looping: bool,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let loop_int = if is_looping { 1 } else { 0 };
    conn.execute(
        "UPDATE timelines SET is_looping = ?1 WHERE id = ?2",
        [&loop_int.to_string(), &id.to_string()],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE timeline_tracks SET is_looping = ?1 WHERE timeline_id = ?2",
        [&loop_int.to_string(), &id.to_string()],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_timeline_track(
    app_handle: AppHandle,
    timeline_id: i64,
    name: String,
) -> Result<TimelineTrack, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT COALESCE(MAX(order_index), -1) + 1 FROM timeline_tracks WHERE timeline_id = ?1",
        )
        .map_err(|e| e.to_string())?;
    let order_index: i64 = stmt
        .query_row([&timeline_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO timeline_tracks (timeline_id, name, order_index, is_looping) VALUES (?1, ?2, ?3, 0)",
        [&timeline_id.to_string(), &name, &order_index.to_string()],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(TimelineTrack {
        id,
        timeline_id,
        name,
        order_index,
        is_looping: false,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_timeline_tracks(
    app_handle: AppHandle,
    timeline_id: i64,
) -> Result<Vec<TimelineTrack>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, timeline_id, name, order_index, is_looping, created_at FROM timeline_tracks WHERE timeline_id = ?1 ORDER BY order_index ASC"
    ).map_err(|e| e.to_string())?;

    let tracks = stmt
        .query_map([timeline_id], |row| {
            Ok(TimelineTrack {
                id: row.get(0)?,
                timeline_id: row.get(1)?,
                name: row.get(2)?,
                order_index: row.get(3)?,
                is_looping: row.get::<_, i64>(4)? != 0,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = tracks.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_timeline_track_looping(
    app_handle: AppHandle,
    id: i64,
    is_looping: bool,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let loop_int = if is_looping { 1 } else { 0 };

    conn.execute(
        "UPDATE timeline_tracks SET is_looping = ?1 WHERE id = ?2",
        [&loop_int.to_string(), &id.to_string()],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn delete_timeline_track(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM timeline_tracks WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn update_timeline_track_order(
    app_handle: AppHandle,
    id: i64,
    order_index: i64,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE timeline_tracks SET order_index = ?1 WHERE id = ?2",
        [&order_index.to_string(), &id.to_string()],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn add_element_to_track(
    app_handle: AppHandle,
    track_id: i64,
    audio_element_id: Option<i64>,
    element_group_id: Option<i64>,
    start_time_ms: i64,
    duration_ms: i64,
) -> Result<TimelineElement, String> {
    if audio_element_id.is_none() && element_group_id.is_none() {
        return Err("Must provide either audio_element_id or element_group_id".into());
    }

    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    if check_element_overlap(&conn, track_id, start_time_ms, duration_ms, None)? {
        return Err("Element overlaps with existing element in track".to_string());
    }

    let timeline_id: i64 = conn
        .query_row(
            "SELECT timeline_id FROM timeline_tracks WHERE id = ?1",
            [track_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO timeline_elements (timeline_id, track_id, audio_element_id, element_group_id, start_time_ms, duration_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        (
            &timeline_id,
            &track_id,
            &audio_element_id,
            &element_group_id,
            &start_time_ms,
            &duration_ms,
        ),
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(TimelineElement {
        id,
        track_id,
        audio_element_id,
        element_group_id,
        start_time_ms,
        duration_ms,
    })
}

#[tauri::command]
async fn get_track_elements(
    app_handle: AppHandle,
    track_id: i64,
) -> Result<Vec<TimelineElement>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, track_id, audio_element_id, element_group_id, start_time_ms, duration_ms FROM timeline_elements WHERE track_id = ?1 ORDER BY start_time_ms ASC"
    ).map_err(|e| e.to_string())?;

    let elements = stmt
        .query_map([track_id], |row| {
            Ok(TimelineElement {
                id: row.get(0)?,
                track_id: row.get(1)?,
                audio_element_id: row.get(2)?,
                element_group_id: row.get(3)?,
                start_time_ms: row.get(4)?,
                duration_ms: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = elements.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_element_time_and_duration(
    app_handle: AppHandle,
    id: i64,
    start_time_ms: i64,
    duration_ms: i64,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let track_id: i64 = conn
        .query_row(
            "SELECT track_id FROM timeline_elements WHERE id = ?1",
            [id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if check_element_overlap(&conn, track_id, start_time_ms, duration_ms, Some(id))? {
        return Err("Element overlaps with existing element in track".to_string());
    }

    conn.execute(
        "UPDATE timeline_elements SET start_time_ms = ?1, duration_ms = ?2 WHERE id = ?3",
        [
            &start_time_ms.to_string(),
            &duration_ms.to_string(),
            &id.to_string(),
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn delete_timeline_element(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM timeline_elements WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_audio_channel(
    app_handle: AppHandle,
    sound_set_id: i64,
    name: String,
    icon: String,
    volume: f64,
) -> Result<AudioChannel, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT COALESCE(MAX(order_index), -1) + 1 FROM audio_channels WHERE sound_set_id = ?1",
        )
        .map_err(|e| e.to_string())?;
    let order_index: i64 = stmt
        .query_row([&sound_set_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO audio_channels (sound_set_id, name, icon, volume, order_index) VALUES (?1, ?2, ?3, ?4, ?5)",
        (&sound_set_id, &name, &icon, &volume, &order_index),
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(AudioChannel {
        id,
        sound_set_id,
        name,
        icon,
        volume,
        order_index,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_audio_channels(
    app_handle: AppHandle,
    sound_set_id: i64,
) -> Result<Vec<AudioChannel>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, sound_set_id, name, icon, volume, order_index, created_at FROM audio_channels WHERE sound_set_id = ?1 ORDER BY order_index ASC"
    ).map_err(|e| e.to_string())?;

    let channels = stmt
        .query_map([sound_set_id], |row| {
            Ok(AudioChannel {
                id: row.get(0)?,
                sound_set_id: row.get(1)?,
                name: row.get(2)?,
                icon: row.get(3)?,
                volume: row.get(4)?,
                order_index: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = channels.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_audio_channel(
    app_handle: AppHandle,
    id: i64,
    name: String,
    icon: String,
    volume: f64,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE audio_channels SET name = ?1, icon = ?2, volume = ?3 WHERE id = ?4",
        rusqlite::params![name, icon, volume, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn delete_audio_channel(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM audio_channels WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn reorder_audio_channels(
    app_handle: AppHandle,
    id: i64,
    order_index: i64,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE audio_channels SET order_index = ?1 WHERE id = ?2",
        rusqlite::params![order_index, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn seed_default_channels(
    app_handle: AppHandle,
    sound_set_id: i64,
) -> Result<Vec<AudioChannel>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT count(*) FROM audio_channels WHERE sound_set_id = ?1")
        .map_err(|e| e.to_string())?;
    let count: i64 = stmt
        .query_row([&sound_set_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    if count == 0 {
        let defaults = [
            ("Music", "music", 1.0, 0),
            ("Ambient", "ambient", 1.0, 1),
            ("Sound Effects", "sfx", 1.0, 2),
        ];

        for (name, icon, volume, order) in defaults.iter() {
            conn.execute(
                "INSERT INTO audio_channels (sound_set_id, name, icon, volume, order_index) VALUES (?1, ?2, ?3, ?4, ?5)",
                (&sound_set_id, name, icon, volume, order),
            ).map_err(|e| e.to_string())?;
        }
    }

    let mut stmt = conn.prepare(
        "SELECT id, sound_set_id, name, icon, volume, order_index, created_at FROM audio_channels WHERE sound_set_id = ?1 ORDER BY order_index ASC"
    ).map_err(|e| e.to_string())?;

    let channels = stmt
        .query_map([sound_set_id], |row| {
            Ok(AudioChannel {
                id: row.get(0)?,
                sound_set_id: row.get(1)?,
                name: row.get(2)?,
                icon: row.get(3)?,
                volume: row.get(4)?,
                order_index: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = channels.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn init_db_command(app_handle: AppHandle) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    init_database(&conn).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn create_global_oneshot(
    app_handle: AppHandle,
    file_path: String,
    file_name: String,
    channel_type: String,
) -> Result<AudioElement, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let settings = get_app_settings(app_handle.clone()).await?;
    let mut final_file_path = file_path.clone();

    if settings.audio_file_strategy == "copy" {
        let library_dir = if settings.library_path.trim().is_empty() {
            get_default_library_path(&app_handle)
        } else {
            PathBuf::from(&settings.library_path)
        };
        if !library_dir.exists() {
            fs::create_dir_all(&library_dir).map_err(|e| e.to_string())?;
        }

        let destination = library_dir.join(&file_name);
        fs::copy(&file_path, &destination).map_err(|e| e.to_string())?;
        final_file_path = destination.to_string_lossy().to_string();
    }

    conn.execute(
        "INSERT INTO audio_elements (sound_set_id, file_path, file_name, channel_type, channel_id) VALUES (NULL, ?1, ?2, ?3, NULL)",
        (&final_file_path, &file_name, &channel_type),
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(AudioElement {
        id,
        sound_set_id: None,
        channel_id: None,
        file_path: final_file_path,
        file_name,
        channel_type,
        volume_db: 0.0,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_global_oneshots(app_handle: AppHandle) -> Result<Vec<AudioElement>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, sound_set_id, file_path, file_name, channel_type, volume_db, created_at, channel_id FROM audio_elements WHERE sound_set_id IS NULL ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let elements = stmt
        .query_map([], |row| {
            Ok(AudioElement {
                id: row.get(0)?,
                sound_set_id: row.get(1)?,
                file_path: row.get(2)?,
                file_name: row.get(3)?,
                channel_type: row.get(4)?,
                volume_db: row.get(5)?,
                created_at: row.get(6)?,
                channel_id: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = elements.collect();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_global_oneshot(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM audio_elements WHERE id = ?1 AND sound_set_id IS NULL",
        [id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_element_group(
    app_handle: AppHandle,
    name: String,
    sound_set_id: Option<i64>,
) -> Result<ElementGroup, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO element_groups (name, sound_set_id) VALUES (?1, ?2)",
        (&name, &sound_set_id),
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(ElementGroup {
        id,
        name,
        sound_set_id,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn rename_element_group(app_handle: AppHandle, id: i64, name: String) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE element_groups SET name = ?1 WHERE id = ?2",
        (&name, &id),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn delete_element_group(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM element_groups WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn get_element_groups(
    app_handle: AppHandle,
    sound_set_id: Option<i64>,
) -> Result<Vec<ElementGroup>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = if sound_set_id.is_some() {
        conn.prepare("SELECT id, name, sound_set_id, created_at FROM element_groups WHERE sound_set_id = ?1 ORDER BY created_at DESC")
    } else {
        conn.prepare("SELECT id, name, sound_set_id, created_at FROM element_groups WHERE sound_set_id IS NULL ORDER BY created_at DESC")
    }.map_err(|e| e.to_string())?;

    let elements = if let Some(sid) = sound_set_id {
        stmt.query_map([sid], |row| {
            Ok(ElementGroup {
                id: row.get(0)?,
                name: row.get(1)?,
                sound_set_id: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
    } else {
        stmt.query_map([], |row| {
            Ok(ElementGroup {
                id: row.get(0)?,
                name: row.get(1)?,
                sound_set_id: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
    };

    elements.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_element_to_group(
    app_handle: AppHandle,
    group_id: i64,
    audio_element_id: i64,
) -> Result<ElementGroupMember, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT COALESCE(MAX(order_index), -1) + 1 FROM element_group_members WHERE group_id = ?1")
        .map_err(|e| e.to_string())?;

    let order_index: i64 = stmt
        .query_row([&group_id], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO element_group_members (group_id, audio_element_id, order_index) VALUES (?1, ?2, ?3)",
        (&group_id, &audio_element_id, &order_index),
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(ElementGroupMember {
        id,
        group_id,
        audio_element_id,
        order_index,
    })
}

#[tauri::command]
async fn remove_element_from_group(app_handle: AppHandle, id: i64) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM element_group_members WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn get_group_members(
    app_handle: AppHandle,
    group_id: i64,
) -> Result<Vec<ElementGroupMember>, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, group_id, audio_element_id, order_index FROM element_group_members WHERE group_id = ?1 ORDER BY order_index ASC"
    ).map_err(|e| e.to_string())?;

    let members = stmt
        .query_map([group_id], |row| {
            Ok(ElementGroupMember {
                id: row.get(0)?,
                group_id: row.get(1)?,
                audio_element_id: row.get(2)?,
                order_index: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = members.collect();
    result.map_err(|e| e.to_string())
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
            get_app_settings,
            update_app_settings,
            create_audio_channel,
            get_audio_channels,
            update_audio_channel,
            delete_audio_channel,
            reorder_audio_channels,
            seed_default_channels,
            create_sound_set,
            get_sound_sets,
            delete_sound_set,
            create_mood,
            get_moods,
            delete_mood,
            create_audio_element,
            get_audio_elements,
            delete_audio_element,
            create_global_oneshot,
            get_global_oneshots,
            delete_global_oneshot,
            update_audio_element_channel,
            update_audio_element_channel_id,
            create_timeline,
            get_timelines,
            delete_timeline,
            update_timeline_loop,
            create_timeline_track,
            get_timeline_tracks,
            update_timeline_track_looping,
            delete_timeline_track,
            update_timeline_track_order,
            add_element_to_track,
            get_track_elements,
            update_element_time_and_duration,
            delete_timeline_element,
            export_sound_set,
            import_sound_set,
            discord::discord_validate_token,
            discord::discord_list_guilds,
            discord::discord_list_voice_channels,
            discord::discord_connect,
            discord::discord_disconnect,
            discord::discord_send_audio,
            get_group_members,
            create_element_group,
            rename_element_group,
            delete_element_group,
            get_element_groups,
            add_element_to_group,
            remove_element_from_group,
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

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_timeline_migration_singleton() {
        let mut conn = Connection::open_in_memory().unwrap();

        // Setup initial old schema without unique index
        conn.execute_batch(
            "CREATE TABLE timelines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mood_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                order_index INTEGER DEFAULT 0,
                is_looping INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );",
        )
        .unwrap();

        // Insert multiple timelines for same mood
        conn.execute(
            "INSERT INTO timelines (id, mood_id, name) VALUES (1, 10, 'First')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO timelines (id, mood_id, name) VALUES (2, 10, 'Second')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO timelines (id, mood_id, name) VALUES (3, 20, 'Other Mood')",
            [],
        )
        .unwrap();

        // Run full database init which includes the migration
        let _ = init_database(&conn).unwrap();

        // Verify deductions
        let mut stmt = conn
            .prepare("SELECT id, name FROM timelines WHERE mood_id = 10")
            .unwrap();
        let timelines: Vec<(i64, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap();

        // Should only have kept the oldest (id = 1)
        assert_eq!(timelines.len(), 1);
        assert_eq!(timelines[0].0, 1);
        assert_eq!(timelines[0].1, "First");

        // Verify we can't insert another one
        let err = conn.execute(
            "INSERT INTO timelines (mood_id, name) VALUES (10, 'Third')",
            [],
        );
        assert!(err.is_err());
    }

    #[test]
    fn test_element_overlap_rejection() {
        let conn = Connection::open_in_memory().unwrap();
        let _ = init_database(&conn).unwrap();

        // Setup base tables
        conn.execute(
            "INSERT INTO sound_sets (id, name, description) VALUES (1, 'S', 'D')",
            [],
        )
        .unwrap();
        conn.execute("INSERT INTO audio_elements (id, sound_set_id, file_path, file_name, channel_type) VALUES (100, 1, 'path', 'f', 'music')", []).unwrap();
        conn.execute(
            "INSERT INTO moods (id, sound_set_id, name) VALUES (1, 1, 'M')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO timelines (id, mood_id, name) VALUES (1, 1, 'T')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO timeline_tracks (id, timeline_id, name, is_looping) VALUES (5, 1, 'Trk', 0)",
            [],
        )
        .unwrap();

        // Add element 1: 1000ms to 3000ms (duration 2000ms)
        conn.execute("INSERT INTO timeline_elements (id, track_id, audio_element_id, start_time_ms, duration_ms) VALUES (10, 5, 100, 1000, 2000)", []).unwrap();

        // Test overlap checks
        // 1. Completely before (0-500) - OK
        assert!(!check_element_overlap(&conn, 5, 0, 500, None).unwrap());

        // 2. Exactly before (0-1000) - OK
        assert!(!check_element_overlap(&conn, 5, 0, 1000, None).unwrap());

        // 3. Completely after (3000-4000) - OK
        assert!(!check_element_overlap(&conn, 5, 3000, 1000, None).unwrap());

        // 4. Overlap start (500-1500) - BAD
        assert!(check_element_overlap(&conn, 5, 500, 1000, None).unwrap());

        // 5. Overlap end (2500-3500) - BAD
        assert!(check_element_overlap(&conn, 5, 2500, 1000, None).unwrap());

        // 6. Enclosing (500-4000) - BAD
        assert!(check_element_overlap(&conn, 5, 500, 3500, None).unwrap());

        // 7. Contained (1500-2500) - BAD
        assert!(check_element_overlap(&conn, 5, 1500, 1000, None).unwrap());

        // 8. Overlapping itself when excluded - OK
        assert!(!check_element_overlap(&conn, 5, 500, 1500, Some(10)).unwrap());

        // 9. Different track overlap - OK
        assert!(!check_element_overlap(&conn, 6, 1500, 1000, None).unwrap());
    }
}
