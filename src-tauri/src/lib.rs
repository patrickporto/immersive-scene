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
    pub sound_set_id: i64,
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
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimelineElement {
    pub id: i64,
    pub track_id: i64,
    pub audio_element_id: i64,
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
        "CREATE TABLE IF NOT EXISTS audio_elements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sound_set_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            channel_type TEXT DEFAULT 'ambient',
            volume_db REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sound_set_id) REFERENCES sound_sets(id) ON DELETE CASCADE
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS timeline_elements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timeline_id INTEGER,
            track_id INTEGER,
            audio_element_id INTEGER NOT NULL,
            start_time_ms INTEGER DEFAULT 0,
            duration_ms INTEGER DEFAULT 0,
            FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE,
            FOREIGN KEY (track_id) REFERENCES timeline_tracks(id) ON DELETE CASCADE,
            FOREIGN KEY (audio_element_id) REFERENCES audio_elements(id) ON DELETE CASCADE
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

    // Timeline elements migration for tracks and duration
    let mut stmt = conn.prepare("PRAGMA table_info(timeline_elements)")?;
    let has_track_id = stmt
        .query_map([], |row| {
            let name: String = row.get(1)?;
            Ok(name == "track_id")
        })?
        .any(|r| r.unwrap_or(false));

    if !has_track_id {
        conn.execute(
            "ALTER TABLE timeline_elements ADD COLUMN track_id INTEGER",
            [],
        )?;
        conn.execute(
            "ALTER TABLE timeline_elements ADD COLUMN duration_ms INTEGER DEFAULT 0",
            [],
        )?;

        conn.execute("INSERT INTO timeline_tracks (timeline_id, name, order_index) SELECT id, 'Master Track', 0 FROM timelines", [])?;
        conn.execute("UPDATE timeline_elements SET track_id = (SELECT id FROM timeline_tracks WHERE timeline_tracks.timeline_id = timeline_elements.timeline_id)", [])?;
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
async fn create_audio_element(
    app_handle: AppHandle,
    sound_set_id: i64,
    file_path: String,
    file_name: String,
    channel_type: String,
) -> Result<AudioElement, String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO audio_elements (sound_set_id, file_path, file_name, channel_type) VALUES (?1, ?2, ?3, ?4)",
        [&sound_set_id.to_string(), &file_path, &file_name, &channel_type],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(AudioElement {
        id,
        sound_set_id,
        file_path,
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
        "SELECT id, sound_set_id, file_path, file_name, channel_type, volume_db, created_at FROM audio_elements WHERE sound_set_id = ?1 ORDER BY created_at DESC"
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
        [&channel_type, &id.to_string()],
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
        "INSERT INTO timeline_tracks (timeline_id, name, order_index) VALUES (?1, ?2, ?3)",
        [&timeline_id.to_string(), &name, &order_index.to_string()],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(TimelineTrack {
        id,
        timeline_id,
        name,
        order_index,
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
        "SELECT id, timeline_id, name, order_index, created_at FROM timeline_tracks WHERE timeline_id = ?1 ORDER BY order_index ASC"
    ).map_err(|e| e.to_string())?;

    let tracks = stmt
        .query_map([timeline_id], |row| {
            Ok(TimelineTrack {
                id: row.get(0)?,
                timeline_id: row.get(1)?,
                name: row.get(2)?,
                order_index: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let result: Result<Vec<_>, _> = tracks.collect();
    result.map_err(|e| e.to_string())
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
    audio_element_id: i64,
    start_time_ms: i64,
    duration_ms: i64,
) -> Result<TimelineElement, String> {
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
        "INSERT INTO timeline_elements (timeline_id, track_id, audio_element_id, start_time_ms, duration_ms) VALUES (?1, ?2, ?3, ?4, ?5)",
        [
            &timeline_id.to_string(),
            &track_id.to_string(),
            &audio_element_id.to_string(),
            &start_time_ms.to_string(),
            &duration_ms.to_string(),
        ],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(TimelineElement {
        id,
        track_id,
        audio_element_id,
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
        "SELECT id, track_id, audio_element_id, start_time_ms, duration_ms FROM timeline_elements WHERE track_id = ?1 ORDER BY start_time_ms ASC"
    ).map_err(|e| e.to_string())?;

    let elements = stmt
        .query_map([track_id], |row| {
            Ok(TimelineElement {
                id: row.get(0)?,
                track_id: row.get(1)?,
                audio_element_id: row.get(2)?,
                start_time_ms: row.get(3)?,
                duration_ms: row.get(4)?,
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
            update_audio_element_channel,
            create_timeline,
            get_timelines,
            delete_timeline,
            update_timeline_loop,
            create_timeline_track,
            get_timeline_tracks,
            delete_timeline_track,
            update_timeline_track_order,
            add_element_to_track,
            get_track_elements,
            update_element_time_and_duration,
            delete_timeline_element,
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
            "INSERT INTO timeline_tracks (id, timeline_id, name) VALUES (5, 1, 'Trk')",
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
