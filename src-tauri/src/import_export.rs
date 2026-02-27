use rusqlite::{Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::fs::File;
use std::io::{Read, Seek, Write};
use std::path::{Component, Path, PathBuf};
use tauri::AppHandle;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::get_db_path;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportManifest {
    pub format_version: i32,
    pub soundset: ExportSoundSet,
    pub channels: Vec<ExportChannel>,
    pub elements: Vec<ExportElement>,
    pub moods: Vec<ExportMood>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportSoundSet {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportChannel {
    pub name: String,
    pub icon: String,
    pub volume: f64,
    pub order_index: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportElement {
    pub file_name: String,
    pub archive_path: String,
    pub channel_name: Option<String>,
    pub channel_type: String,
    pub volume_db: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportMood {
    pub name: String,
    pub description: String,
    pub timeline: Option<ExportTimeline>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportTimeline {
    pub is_looping: bool,
    pub tracks: Vec<ExportTrack>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportTrack {
    pub name: String,
    pub order_index: i64,
    pub clips: Vec<ExportClip>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportClip {
    pub element_file_name: String,
    pub start_time_ms: i64,
    pub duration_ms: i64,
}

pub fn package_sound_set_folder(
    source_folder: &Path,
    output_path: Option<&Path>,
) -> Result<PathBuf, String> {
    if !source_folder.exists() {
        return Err(format!(
            "Source folder does not exist: {}",
            source_folder.display()
        ));
    }

    if !source_folder.is_dir() {
        return Err(format!(
            "Source path is not a folder: {}",
            source_folder.display()
        ));
    }

    let manifest = load_manifest_from_folder(source_folder)?;
    validate_manifest_for_packaging(&manifest)?;

    let mut files_to_package: Vec<(PathBuf, String)> = Vec::new();
    for element in &manifest.elements {
        validate_archive_path(&element.archive_path).map_err(|error| {
            format!(
                "Invalid elements[].archive_path '{}': {}",
                element.archive_path, error
            )
        })?;

        let source_path = source_folder.join(&element.archive_path);
        if !source_path.exists() {
            return Err(format!(
                "Missing referenced audio file for elements[].archive_path '{}': {}",
                element.archive_path,
                source_path.display()
            ));
        }

        if !source_path.is_file() {
            return Err(format!(
                "Referenced path is not a file for elements[].archive_path '{}': {}",
                element.archive_path,
                source_path.display()
            ));
        }

        files_to_package.push((source_path, element.archive_path.clone()));
    }

    files_to_package.sort_by(|left, right| left.1.cmp(&right.1));

    let output = match output_path {
        Some(path) => path.to_path_buf(),
        None => {
            let safe_name = sanitize_archive_name(&manifest.soundset.name);
            std::env::current_dir()
                .map_err(|error| format!("Failed to read current directory: {}", error))?
                .join(format!("{}.zip", safe_name))
        }
    };

    if let Some(parent) = output.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("Failed to create output directory: {}", error))?;
        }
    }

    let file = File::create(&output).map_err(|error| {
        format!(
            "Failed to create zip file '{}': {}",
            output.display(),
            error
        )
    })?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);

    zip.start_file("manifest.json", options.clone())
        .map_err(|error| format!("Failed to write manifest.json: {}", error))?;
    let manifest_json = serde_json::to_string_pretty(&manifest)
        .map_err(|error| format!("Failed to serialize manifest: {}", error))?;
    zip.write_all(manifest_json.as_bytes())
        .map_err(|error| format!("Failed to write manifest.json contents: {}", error))?;

    for (source_path, archive_path) in files_to_package {
        zip.start_file(&archive_path, options.clone())
            .map_err(|error| {
                format!(
                    "Failed to create archive entry '{}': {}",
                    archive_path, error
                )
            })?;
        let data = fs::read(&source_path).map_err(|error| {
            format!(
                "Failed to read source audio file '{}': {}",
                source_path.display(),
                error
            )
        })?;
        zip.write_all(&data).map_err(|error| {
            format!(
                "Failed to write archive entry '{}': {}",
                archive_path, error
            )
        })?;
    }

    zip.finish()
        .map_err(|error| format!("Failed to finish zip archive: {}", error))?;

    Ok(output)
}

pub(crate) fn read_manifest_from_zip<R: Read + Seek>(
    archive: &mut zip::ZipArchive<R>,
) -> Result<ExportManifest, String> {
    let mut manifest_json = String::new();
    {
        let mut manifest_file = archive
            .by_name("manifest.json")
            .map_err(|error| format!("Manifest not found in zip: {}", error))?;
        manifest_file
            .read_to_string(&mut manifest_json)
            .map_err(|error| format!("Failed to read manifest.json: {}", error))?;
    }

    let manifest: ExportManifest = serde_json::from_str(&manifest_json)
        .map_err(|error| format!("Failed to parse manifest: {}", error))?;
    validate_manifest_for_packaging(&manifest)?;
    Ok(manifest)
}

fn load_manifest_from_folder(source_folder: &Path) -> Result<ExportManifest, String> {
    let manifest_path = source_folder.join("manifest.json");
    if !manifest_path.exists() {
        return Err(format!(
            "manifest.json not found in source folder: {}",
            manifest_path.display()
        ));
    }

    let manifest_json = fs::read_to_string(&manifest_path).map_err(|error| {
        format!(
            "Failed to read manifest.json '{}': {}",
            manifest_path.display(),
            error
        )
    })?;
    let manifest: ExportManifest = serde_json::from_str(&manifest_json)
        .map_err(|error| format!("Invalid manifest.json: {}", error))?;
    Ok(manifest)
}

fn validate_manifest_for_packaging(manifest: &ExportManifest) -> Result<(), String> {
    if manifest.format_version != 1 {
        return Err(format!(
            "Unsupported format_version {}. Supported versions: [1]",
            manifest.format_version
        ));
    }

    if manifest.soundset.name.trim().is_empty() {
        return Err("Invalid manifest.soundset.name: value must not be empty".to_string());
    }

    for (index, element) in manifest.elements.iter().enumerate() {
        if element.archive_path.trim().is_empty() {
            return Err(format!(
                "Invalid manifest.elements[{}].archive_path: value must not be empty",
                index
            ));
        }

        if element.file_name.trim().is_empty() {
            return Err(format!(
                "Invalid manifest.elements[{}].file_name: value must not be empty",
                index
            ));
        }
    }

    Ok(())
}

fn validate_archive_path(value: &str) -> Result<(), String> {
    let path = Path::new(value);
    if path.is_absolute() {
        return Err("path must be relative".to_string());
    }

    for component in path.components() {
        match component {
            Component::Normal(_) => {}
            Component::CurDir => {}
            Component::ParentDir => {
                return Err("path must not contain '..' segments".to_string());
            }
            Component::RootDir | Component::Prefix(_) => {
                return Err("path must not be absolute".to_string());
            }
        }
    }

    Ok(())
}

fn sanitize_archive_name(name: &str) -> String {
    let sanitized: String = name
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '-' || character == '_' {
                character
            } else {
                '-'
            }
        })
        .collect();

    let trimmed = sanitized.trim_matches('-');
    if trimmed.is_empty() {
        "soundset-export".to_string()
    } else {
        trimmed.to_string()
    }
}

#[tauri::command]
pub async fn export_sound_set(
    app_handle: AppHandle,
    sound_set_id: i64,
    destination_path: String,
) -> Result<(), String> {
    let db_path = get_db_path(&app_handle);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    // 1. SoundSet
    let soundset = conn
        .query_row(
            "SELECT name, description FROM sound_sets WHERE id = ?1",
            [&sound_set_id],
            |row| {
                Ok(ExportSoundSet {
                    name: row.get(0)?,
                    description: row.get(1)?,
                })
            },
        )
        .map_err(|e| format!("Failed to find soundset: {}", e))?;

    // 2. Channels
    let mut stmt = conn.prepare("SELECT id, name, icon, volume, order_index FROM audio_channels WHERE sound_set_id = ?1").map_err(|e| e.to_string())?;
    let channels_data: Vec<(i64, ExportChannel)> = stmt
        .query_map([sound_set_id], |row| {
            Ok((
                row.get(0)?,
                ExportChannel {
                    name: row.get(1)?,
                    icon: row.get(2)?,
                    volume: row.get(3)?,
                    order_index: row.get(4)?,
                },
            ))
        })
        .map_err(|e| e.to_string())?
        .map(|r| r.unwrap())
        .collect();

    let channel_map: HashMap<i64, String> = channels_data
        .iter()
        .map(|(id, c)| (*id, c.name.clone()))
        .collect();
    let export_channels: Vec<ExportChannel> = channels_data.into_iter().map(|(_, c)| c).collect();

    // 3. Elements (excluding global oneshots because sound_set_id filters them)
    let mut stmt = conn.prepare("SELECT id, channel_id, file_path, file_name, channel_type, volume_db FROM audio_elements WHERE sound_set_id = ?1").map_err(|e| e.to_string())?;
    let elements_data: Vec<(i64, ExportElement, String)> = stmt
        .query_map([sound_set_id], |row| {
            let id: i64 = row.get(0)?;
            let channel_id: Option<i64> = row.get(1)?;
            let file_path: String = row.get(2)?;
            let file_name: String = row.get(3)?;
            let channel_type: String = row.get(4)?;
            let volume_db: f64 = row.get(5)?;

            let channel_name = channel_id.and_then(|cid| channel_map.get(&cid).cloned());
            let archive_path = format!("audio/{}", file_name);

            Ok((
                id,
                ExportElement {
                    file_name,
                    archive_path,
                    channel_name,
                    channel_type,
                    volume_db,
                },
                file_path,
            ))
        })
        .map_err(|e| e.to_string())?
        .map(|r| r.unwrap())
        .collect();

    let element_name_map: HashMap<i64, String> = elements_data
        .iter()
        .map(|(id, e, _)| (*id, e.file_name.clone()))
        .collect();

    let mut export_elements = Vec::new();
    let mut files_to_copy = Vec::new();
    for (_, e, file_path) in elements_data {
        files_to_copy.push((file_path.clone(), e.archive_path.clone()));
        export_elements.push(e);
    }

    // 4. Moods, Timelines, Tracks, Clips
    let mut stmt = conn
        .prepare("SELECT id, name, description FROM moods WHERE sound_set_id = ?1")
        .map_err(|e| e.to_string())?;
    let moods_data: Vec<(i64, String, String)> = stmt
        .query_map([sound_set_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })
        .map_err(|e| e.to_string())?
        .map(|r| r.unwrap())
        .collect();

    let mut export_moods = Vec::new();

    for (mood_id, name, description) in moods_data {
        let timeline = conn
            .query_row(
                "SELECT id, is_looping FROM timelines WHERE mood_id = ?1",
                [&mood_id],
                |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)? != 0)),
            )
            .optional()
            .map_err(|e| e.to_string())?;

        let export_timeline = if let Some((timeline_id, is_looping)) = timeline {
            let mut t_stmt = conn.prepare("SELECT id, name, order_index FROM timeline_tracks WHERE timeline_id = ?1 ORDER BY order_index").map_err(|e| e.to_string())?;
            let tracks_data: Vec<(i64, String, i64)> = t_stmt
                .query_map([timeline_id], |row| {
                    Ok((row.get(0)?, row.get(1)?, row.get(2)?))
                })
                .map_err(|e| e.to_string())?
                .map(|r| r.unwrap())
                .collect();

            let mut export_tracks = Vec::new();
            for (track_id, t_name, t_order) in tracks_data {
                let mut clip_stmt = conn.prepare("SELECT audio_element_id, start_time_ms, duration_ms FROM timeline_elements WHERE track_id = ?1").map_err(|e| e.to_string())?;
                let clips: Vec<ExportClip> = clip_stmt
                    .query_map([track_id], |row| {
                        let element_id: i64 = row.get(0)?;
                        let file_name = element_name_map
                            .get(&element_id)
                            .cloned()
                            .unwrap_or_default();
                        Ok(ExportClip {
                            element_file_name: file_name,
                            start_time_ms: row.get(1)?,
                            duration_ms: row.get(2)?,
                        })
                    })
                    .map_err(|e| e.to_string())?
                    .map(|r| r.unwrap())
                    .collect();

                export_tracks.push(ExportTrack {
                    name: t_name,
                    order_index: t_order,
                    clips,
                });
            }
            Some(ExportTimeline {
                is_looping,
                tracks: export_tracks,
            })
        } else {
            None
        };

        export_moods.push(ExportMood {
            name,
            description,
            timeline: export_timeline,
        });
    }

    let manifest = ExportManifest {
        format_version: 1,
        soundset,
        channels: export_channels,
        elements: export_elements,
        moods: export_moods,
    };

    // 5. Create ZIP archive
    let file =
        File::create(&destination_path).map_err(|e| format!("Failed to create zip file: {}", e))?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);

    // Write manifest
    zip.start_file("manifest.json", options.clone())
        .map_err(|e| format!("Failed to create manifest in zip: {}", e))?;
    let manifest_json = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
    zip.write_all(manifest_json.as_bytes())
        .map_err(|e| e.to_string())?;

    // Create audio dir implicitly or by adding files
    for (src_path, archive_path) in files_to_copy {
        zip.start_file(&archive_path, options.clone())
            .map_err(|e| format!("Failed to start file in zip: {}", e))?;
        if let Ok(mut src_file) = File::open(&src_path) {
            let mut buffer = Vec::new();
            src_file
                .read_to_end(&mut buffer)
                .map_err(|e| format!("Failed to read source file: {}", e))?;
            zip.write_all(&buffer)
                .map_err(|e| format!("Failed to write file to zip: {}", e))?;
        }
    }

    zip.finish()
        .map_err(|e| format!("Failed to finish zip: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn import_sound_set(app_handle: AppHandle, source_path: String) -> Result<(), String> {
    let db_path = crate::get_db_path(&app_handle);
    let mut conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let file = File::open(&source_path).map_err(|e| format!("Failed to open zip file: {}", e))?;
    let mut archive =
        zip::ZipArchive::new(file).map_err(|e| format!("Failed to read zip archive: {}", e))?;

    let manifest = read_manifest_from_zip(&mut archive)?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut actual_name = manifest.soundset.name.clone();
    let mut suffix = 1;
    loop {
        let count: i64 = tx
            .query_row(
                "SELECT count(*) FROM sound_sets WHERE name = ?1",
                [&actual_name],
                |row| row.get(0),
            )
            .unwrap_or(0);

        if count == 0 {
            break;
        }
        actual_name = format!("{} ({})", manifest.soundset.name, suffix);
        suffix += 1;
    }

    tx.execute(
        "INSERT INTO sound_sets (name, description) VALUES (?1, ?2)",
        [&actual_name, &manifest.soundset.description],
    )
    .map_err(|e| e.to_string())?;

    let sound_set_id = tx.last_insert_rowid();

    let mut channel_id_map: HashMap<String, i64> = HashMap::new();
    for channel in manifest.channels {
        tx.execute(
            "INSERT INTO audio_channels (sound_set_id, name, icon, volume, order_index) VALUES (?1, ?2, ?3, ?4, ?5)",
            (sound_set_id, &channel.name, &channel.icon, channel.volume, channel.order_index),
        ).map_err(|e| e.to_string())?;
        channel_id_map.insert(channel.name.clone(), tx.last_insert_rowid());
    }

    let settings = crate::read_app_settings(&app_handle);
    let library_dir = if settings.library_path.trim().is_empty() {
        crate::get_default_library_path(&app_handle)
    } else {
        PathBuf::from(&settings.library_path)
    };

    if !library_dir.exists() {
        std::fs::create_dir_all(&library_dir).map_err(|e| e.to_string())?;
    }

    let mut element_id_map: HashMap<String, i64> = HashMap::new();

    for element in manifest.elements {
        let final_file_path = if let Ok(mut zipped_file) = archive.by_name(&element.archive_path) {
            let dest_path = library_dir.join(&element.file_name);
            let mut actual_dest = dest_path.clone();
            let mut f_suffix = 1;

            while actual_dest.exists() {
                let file_stem = dest_path.file_stem().unwrap_or_default().to_string_lossy();
                let extension = dest_path.extension().unwrap_or_default().to_string_lossy();
                actual_dest = library_dir.join(format!("{}-{}.{}", file_stem, f_suffix, extension));
                f_suffix += 1;
            }

            let mut out_file = File::create(&actual_dest).map_err(|e| e.to_string())?;
            std::io::copy(&mut zipped_file, &mut out_file).map_err(|e| e.to_string())?;
            actual_dest.to_string_lossy().to_string()
        } else {
            return Err(format!(
                "Audio file not found in archive: {}",
                element.archive_path
            ));
        };

        let channel_id = element
            .channel_name
            .and_then(|name| channel_id_map.get(&name).copied());

        tx.execute(
            "INSERT INTO audio_elements (sound_set_id, channel_id, file_path, file_name, channel_type, volume_db) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            (sound_set_id, channel_id, &final_file_path, &element.file_name, &element.channel_type, element.volume_db),
        ).map_err(|e| e.to_string())?;

        element_id_map.insert(element.file_name.clone(), tx.last_insert_rowid());
    }

    for mood in manifest.moods {
        tx.execute(
            "INSERT INTO moods (sound_set_id, name, description) VALUES (?1, ?2, ?3)",
            (sound_set_id, &mood.name, &mood.description),
        )
        .map_err(|e| e.to_string())?;
        let mood_id = tx.last_insert_rowid();

        if let Some(timeline) = mood.timeline {
            tx.execute(
                "INSERT INTO timelines (mood_id, name, order_index, is_looping) VALUES (?1, 'Timeline', 0, ?2)",
                (mood_id, timeline.is_looping),
            ).map_err(|e| e.to_string())?;
            let timeline_id = tx.last_insert_rowid();

            for track in timeline.tracks {
                tx.execute(
                    "INSERT INTO timeline_tracks (timeline_id, name, order_index) VALUES (?1, ?2, ?3)",
                    (timeline_id, &track.name, track.order_index),
                ).map_err(|e| e.to_string())?;
                let track_id = tx.last_insert_rowid();

                for clip in track.clips {
                    if let Some(&audio_element_id) = element_id_map.get(&clip.element_file_name) {
                        tx.execute(
                            "INSERT INTO timeline_elements (timeline_id, track_id, audio_element_id, start_time_ms, duration_ms) VALUES (?1, ?2, ?3, ?4, ?5)",
                            (timeline_id, track_id, audio_element_id, clip.start_time_ms, clip.duration_ms),
                        ).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{package_sound_set_folder, read_manifest_from_zip, ExportManifest};
    use std::fs;
    use std::fs::File;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_dir(name: &str) -> PathBuf {
        let mut path = std::env::temp_dir();
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock should be valid")
            .as_nanos();
        path.push(format!("immersive-scene-{}-{}", name, timestamp));
        fs::create_dir_all(&path).expect("should create test directory");
        path
    }

    fn write_valid_package_folder(base: &Path) {
        fs::create_dir_all(base.join("audio")).expect("should create audio directory");
        fs::write(base.join("audio/rain.wav"), b"rain").expect("should write rain audio");
        fs::write(base.join("audio/wind.wav"), b"wind").expect("should write wind audio");

        let manifest = r#"{
  "format_version": 1,
  "soundset": { "name": "Forest Set", "description": "Nature ambience" },
  "channels": [],
  "elements": [
    {
      "file_name": "rain.wav",
      "archive_path": "audio/rain.wav",
      "channel_name": null,
      "channel_type": "ambient",
      "volume_db": -2.0
    },
    {
      "file_name": "wind.wav",
      "archive_path": "audio/wind.wav",
      "channel_name": null,
      "channel_type": "ambient",
      "volume_db": -1.0
    }
  ],
  "moods": []
}"#;
        fs::write(base.join("manifest.json"), manifest).expect("should write manifest");
    }

    #[test]
    fn packages_valid_folder_successfully() {
        let source = test_dir("package-valid-source");
        let output_dir = test_dir("package-valid-output");
        write_valid_package_folder(&source);

        let output_zip = output_dir.join("forest.zip");
        let generated = package_sound_set_folder(&source, Some(&output_zip))
            .expect("packaging should succeed for valid folder");
        assert!(generated.exists());

        let file = File::open(generated).expect("zip should exist");
        let mut archive = zip::ZipArchive::new(file).expect("should read zip archive");

        let mut names = Vec::new();
        for index in 0..archive.len() {
            let item = archive
                .by_index(index)
                .expect("zip entry should be readable");
            names.push(item.name().to_string());
        }
        assert_eq!(
            names,
            vec![
                "manifest.json".to_string(),
                "audio/rain.wav".to_string(),
                "audio/wind.wav".to_string()
            ]
        );

        let manifest = read_manifest_from_zip(&mut archive)
            .expect("manifest should be readable by import logic");
        assert_eq!(manifest.format_version, 1);
    }

    #[test]
    fn fails_when_manifest_is_missing() {
        let source = test_dir("missing-manifest-source");
        let output = test_dir("missing-manifest-output").join("out.zip");

        let error = package_sound_set_folder(&source, Some(&output))
            .expect_err("packaging should fail without manifest");
        assert!(error.contains("manifest.json not found"));
        assert!(!output.exists());
    }

    #[test]
    fn fails_on_unsupported_manifest_version() {
        let source = test_dir("unsupported-version-source");
        fs::create_dir_all(source.join("audio")).expect("should create audio directory");
        fs::write(source.join("audio/rain.wav"), b"rain").expect("should write audio");
        fs::write(
            source.join("manifest.json"),
            r#"{
  "format_version": 999,
  "soundset": { "name": "Bad Version", "description": "" },
  "channels": [],
  "elements": [
    {
      "file_name": "rain.wav",
      "archive_path": "audio/rain.wav",
      "channel_name": null,
      "channel_type": "ambient",
      "volume_db": 0.0
    }
  ],
  "moods": []
}"#,
        )
        .expect("should write manifest");

        let output = test_dir("unsupported-version-output").join("out.zip");
        let error = package_sound_set_folder(&source, Some(&output))
            .expect_err("packaging should fail with unsupported version");
        assert!(error.contains("Unsupported format_version"));
        assert!(!output.exists());
    }

    #[test]
    fn fails_when_referenced_file_is_missing() {
        let source = test_dir("missing-file-source");
        fs::write(
            source.join("manifest.json"),
            r#"{
  "format_version": 1,
  "soundset": { "name": "Missing File", "description": "" },
  "channels": [],
  "elements": [
    {
      "file_name": "rain.wav",
      "archive_path": "audio/rain.wav",
      "channel_name": null,
      "channel_type": "ambient",
      "volume_db": 0.0
    }
  ],
  "moods": []
}"#,
        )
        .expect("should write manifest");

        let output = test_dir("missing-file-output").join("out.zip");
        let error = package_sound_set_folder(&source, Some(&output))
            .expect_err("packaging should fail with missing referenced file");
        assert!(error.contains("Missing referenced audio file"));
        assert!(error.contains("audio/rain.wav"));
        assert!(!output.exists());
    }

    #[test]
    fn fails_on_unsafe_archive_path() {
        let source = test_dir("unsafe-path-source");
        fs::write(
            source.join("manifest.json"),
            r#"{
  "format_version": 1,
  "soundset": { "name": "Unsafe Path", "description": "" },
  "channels": [],
  "elements": [
    {
      "file_name": "escape.wav",
      "archive_path": "../escape.wav",
      "channel_name": null,
      "channel_type": "ambient",
      "volume_db": 0.0
    }
  ],
  "moods": []
}"#,
        )
        .expect("should write manifest");

        let output = test_dir("unsafe-path-output").join("out.zip");
        let error = package_sound_set_folder(&source, Some(&output))
            .expect_err("packaging should fail with unsafe archive path");
        assert!(error.contains("Invalid elements[].archive_path"));
        assert!(error.contains(".."));
        assert!(!output.exists());
    }

    #[test]
    fn uses_default_output_name_when_output_is_omitted() {
        let source = test_dir("default-output-source");
        write_valid_package_folder(&source);

        let current_dir = std::env::current_dir().expect("should read current directory");
        let generated = package_sound_set_folder(&source, None)
            .expect("packaging should generate default output path");

        assert!(generated.starts_with(current_dir));
        assert!(generated.ends_with("Forest-Set.zip"));

        if generated.exists() {
            fs::remove_file(generated).expect("should remove generated archive");
        }
    }

    #[test]
    fn packaged_archive_manifest_is_compatible_with_import_parser() {
        let source = test_dir("integration-source");
        let output = test_dir("integration-output").join("integration.zip");
        write_valid_package_folder(&source);

        let zip_path = package_sound_set_folder(&source, Some(&output))
            .expect("packaging should produce zip archive");

        let file = File::open(zip_path).expect("zip file should be readable");
        let mut archive = zip::ZipArchive::new(file).expect("zip should open");
        let manifest: ExportManifest =
            read_manifest_from_zip(&mut archive).expect("import parser should read manifest");

        assert_eq!(manifest.soundset.name, "Forest Set");

        for element in manifest.elements {
            let zip_entry = archive.by_name(&element.archive_path);
            assert!(
                zip_entry.is_ok(),
                "archive should contain {} for import compatibility",
                element.archive_path
            );
        }
    }
}
