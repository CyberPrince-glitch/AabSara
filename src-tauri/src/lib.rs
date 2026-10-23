// AabSara — Main library entry point

mod config;
mod commands;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    log::info!("AabSara v{} starting...", env!("CARGO_PKG_VERSION"));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            cmd_save_recording_bytes,
            cmd_save_recording_blob,
            cmd_save_screenshot,
            cmd_export_edited_video,
            cmd_ensure_playable_video,
            cmd_read_video_bytes,
            cmd_list_recordings,
            cmd_open_recordings_folder,
            cmd_play_media,
            cmd_delete_media,
            cmd_window_minimize,
            cmd_window_maximize,
            cmd_window_fullscreen,
            cmd_window_close,
            cmd_start_rtmp_stream,
            cmd_write_stream_chunk,
            cmd_write_stream_bytes,
            cmd_get_stream_status,
            cmd_get_stream_log,
            cmd_stop_rtmp_stream,
            cmd_get_free_disk_space,
            cmd_get_config,
            cmd_set_config,
            cmd_open_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AabSara");
}
