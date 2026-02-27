use std::path::PathBuf;

use immersive_scene_lib::import_export::package_sound_set_folder;

fn print_help() {
    println!(
        "soundset-package\n\nUSAGE:\n  soundset_package <source-folder> [output-zip]\n\nARGS:\n  <source-folder>   Folder containing manifest.json and referenced audio files\n  [output-zip]      Optional destination zip path\n\nEXAMPLES:\n  soundset_package ./my-soundset-folder\n  soundset_package ./my-soundset-folder ./exports/my-soundset.zip"
    );
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() == 1
        || args
            .iter()
            .any(|argument| argument == "-h" || argument == "--help")
    {
        print_help();
        if args.len() == 1 {
            std::process::exit(1);
        }
        return;
    }

    if args.len() < 2 || args.len() > 3 {
        eprintln!("Invalid number of arguments.");
        print_help();
        std::process::exit(1);
    }

    let source_folder = PathBuf::from(&args[1]);
    let output = if args.len() == 3 {
        Some(PathBuf::from(&args[2]))
    } else {
        None
    };

    let output_ref = output.as_deref();
    match package_sound_set_folder(&source_folder, output_ref) {
        Ok(path) => {
            println!("SoundSet package created: {}", path.display());
        }
        Err(error) => {
            eprintln!("Failed to package SoundSet folder: {}", error);
            std::process::exit(1);
        }
    }
}
