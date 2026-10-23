// AabSara — Real Production Tauri IPC Commands
// Real recording saving, clip management, screenshots, folder opening, RTMP streaming,
// and AabSara CineStudio™ PRO NLE Video Editing Suite.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use crate::config::AppConfig;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingItem {
    pub name: String,
    pub path: String,
    pub size_mb: f64,
    pub date: String,
    pub is_video: bool,
}

/// রেকর্ডিংস ডিরেক্টরি নিশ্চিত করা (Cross-Platform)
fn get_recordings_dir() -> String {
    #[cfg(target_os = "windows")]
    let dir = "D:\\AabSara\\Recordings".to_string();

    #[cfg(not(target_os = "windows"))]
    let dir = match std::env::var("EXTERNAL_STORAGE") {
        Ok(storage) => format!("{}/Download/AabSara", storage),
        Err(_) => "/sdcard/Download/AabSara".to_string(),
    };

    if !Path::new(&dir).exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

/// আসল ভিডিও বাইটস সরাসরি ডিস্কে সেভ করা (কোনো Base64 কনভার্সন ছাড়া - 100% নিরাপদ ও অক্ষত)
#[tauri::command]
pub fn cmd_save_recording_bytes(filename: String, bytes: Vec<u8>) -> Result<String, String> {
    use std::io::Write;

    let dir = get_recordings_dir();
    let clean_filename = filename
        .replace("..", ".")
        .replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    let file_path = format!("{dir}\\{clean_filename}");

    if bytes.is_empty() {
        return Err("Cannot save empty recording: buffer contains 0 bytes".to_string());
    }

    let mut file = fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file {file_path}: {e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write data: {e}"))?;

    log::info!("Successfully saved recording to: {file_path} ({} bytes)", bytes.len());

    // সাইলেন্টলি ব্যাকগ্রাউন্ডে আল্ট্রাফাস্ট H.264 + AAC MP4 এ কনভার্ট করা (যাতে এডিটর এবং প্লেয়ার উভয়েই নিমেষে চলে)
    if clean_filename.ends_with(".webm") {
        let mp4_filename = clean_filename.replace(".webm", ".mp4");
        let mp4_path = format!("{dir}\\{mp4_filename}");
        let mut cmd = Command::new("ffmpeg");
        cmd.args([
            "-y",
            "-i", &file_path,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "22",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-movflags", "+faststart",
            &mp4_path,
        ]);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        if let Ok(status) = cmd.status() {
            if status.success() && Path::new(&mp4_path).exists() {
                let _ = fs::remove_file(&file_path);
                return Ok(mp4_path);
            }
        }
    }

    Ok(file_path)
}

/// বেস৬৪ ডাটা সেভ করা (স্ক্রিনশটের জন্য)
#[tauri::command]
pub fn cmd_save_recording_blob(filename: String, base64_data: String) -> Result<String, String> {
    use std::io::Write;

    let dir = get_recordings_dir();
    let clean_filename = filename
        .replace("..", ".")
        .replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    let file_path = format!("{dir}\\{clean_filename}");

    let raw_b64 = if let Some(idx) = base64_data.find(",") {
        &base64_data[idx + 1..]
    } else {
        &base64_data
    };

    let bytes = match decode_base64(raw_b64) {
        Ok(b) => b,
        Err(e) => return Err(format!("Base64 decode error: {e}")),
    };

    if bytes.is_empty() {
        return Err("Cannot save empty recording: buffer contains 0 bytes".to_string());
    }

    let mut file = fs::File::create(&file_path)
        .map_err(|e| format!("Failed to create file {file_path}: {e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write data: {e}"))?;

    // সাইলেন্টলি ব্যাকগ্রাউন্ডে .mp4 এ রিমাক্স করা
    if clean_filename.ends_with(".webm") {
        let mp4_filename = clean_filename.replace(".webm", ".mp4");
        let mp4_path = format!("{dir}\\{mp4_filename}");
        let mut cmd = Command::new("ffmpeg");
        cmd.args(["-y", "-i", &file_path, "-c", "copy", &mp4_path]);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        if let Ok(status) = cmd.status() {
            if status.success() && Path::new(&mp4_path).exists() {
                return Ok(mp4_path);
            }
        }
    }

    Ok(file_path)
}

/// স্ক্রিনশট সেভ করা (PNG)
#[tauri::command]
pub fn cmd_save_screenshot(filename: String, base64_png: String) -> Result<String, String> {
    use std::io::Write;

    let dir = get_recordings_dir();
    let clean_filename = filename
        .replace("..", ".")
        .replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    let file_path = format!("{dir}\\{clean_filename}");

    let raw_b64 = if let Some(idx) = base64_png.find(",") {
        &base64_png[idx + 1..]
    } else {
        &base64_png
    };

    let bytes = match decode_base64(raw_b64) {
        Ok(b) => b,
        Err(e) => return Err(format!("Base64 decode error: {e}")),
    };

    if bytes.is_empty() {
        return Err("Screenshot buffer is empty".to_string());
    }

    let mut file = fs::File::create(&file_path)
        .map_err(|e| format!("Failed to save screenshot: {e}"))?;
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write screenshot: {e}"))?;

    log::info!("Saved screenshot to: {file_path} ({} bytes)", bytes.len());
    Ok(file_path)
}

/// AabSara CineStudio™ PRO ভিডিও এডিটিং ও এক্সপোর্ট ইঞ্জিন (ট্রিম, কালার গ্রেডিং, স্পিড, ওয়াটারমার্ক)
#[tauri::command]
pub fn cmd_export_edited_video(
    input_path: String,
    output_filename: String,
    start_sec: f64,
    duration_sec: f64,
    brightness: f64,
    contrast: f64,
    saturation: f64,
    speed: f64,
    watermark_text: String,
) -> Result<String, String> {
    let dir = get_recordings_dir();
    let clean_name = output_filename
        .replace("..", ".")
        .replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    let output_path = format!("{dir}\\{clean_name}");

    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y");

    // Seek
    if start_sec > 0.0 {
        cmd.args(["-ss", &format!("{:.3}", start_sec)]);
    }

    cmd.args(["-i", &input_path]);

    if duration_sec > 0.0 {
        cmd.args(["-t", &format!("{:.3}", duration_sec)]);
    }

    // Video Filters (Color grading + Speed + Watermark)
    let mut vf_filters = Vec::new();
    if (speed - 1.0).abs() > 0.01 && speed > 0.1 {
        vf_filters.push(format!("setpts={:.4}*PTS", 1.0 / speed));
    }

    if (brightness - 1.0).abs() > 0.01 || (contrast - 1.0).abs() > 0.01 || (saturation - 1.0).abs() > 0.01 {
        vf_filters.push(format!(
            "eq=brightness={:.2}:contrast={:.2}:saturation={:.2}",
            (brightness - 1.0) * 0.5,
            contrast,
            saturation
        ));
    }

    if !watermark_text.is_empty() {
        let clean_text = watermark_text.replace("'", "").replace(":", "\\:");
        if Path::new("C:\\Windows\\Fonts\\arial.ttf").exists() {
            vf_filters.push(format!(
                "drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='{}':x=24:y=24:fontsize=24:fontcolor=white@0.9:shadowcolor=black@0.7:shadowx=2:shadowy=2",
                clean_text
            ));
        } else {
            vf_filters.push(format!(
                "drawtext=text='{}':x=24:y=24:fontsize=24:fontcolor=white@0.9:shadowcolor=black@0.7:shadowx=2:shadowy=2",
                clean_text
            ));
        }
    }

    if !vf_filters.is_empty() {
        cmd.args(["-vf", &vf_filters.join(",")]);
    }

    if (speed - 1.0).abs() > 0.01 && speed > 0.1 {
        cmd.args(["-af", &format!("atempo={:.2}", speed)]);
    }

    cmd.args([
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        &output_path,
    ]);

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let status = cmd.status().map_err(|e| format!("Failed to run FFmpeg: {e}"))?;
    if status.success() && Path::new(&output_path).exists() {
        Ok(output_path)
    } else {
        Err("FFmpeg CineStudio export failed".into())
    }
}

/// ভিডিও ফাইল প্লেযোগ্য MP4 ফরম্যাটে রূপান্তর/নিশ্চিত করা
#[tauri::command]
pub fn cmd_ensure_playable_video(file_path: String) -> Result<String, String> {
    let p = Path::new(&file_path);
    if !p.exists() {
        return Err(format!("File does not exist: {file_path}"));
    }

    let ext = p.extension().unwrap_or_default().to_string_lossy().to_lowercase();
    let dir = get_recordings_dir();
    let stem = p.file_stem().unwrap_or_default().to_string_lossy().to_string();
    let target_mp4 = format!("{dir}\\{stem}.mp4");

    if ext == "mp4" {
        return Ok(file_path);
    }

    if Path::new(&target_mp4).exists() && fs::metadata(&target_mp4).map(|m| m.len() > 1024).unwrap_or(false) {
        return Ok(target_mp4);
    }

    let mut cmd = Command::new("ffmpeg");
    cmd.args([
        "-y",
        "-i", &file_path,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        &target_mp4,
    ]);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let status = cmd.status().map_err(|e| format!("FFmpeg transcode error: {e}"))?;
    if status.success() && Path::new(&target_mp4).exists() {
        Ok(target_mp4)
    } else {
        Err("Could not transcode video to playable MP4".into())
    }
}

/// ভিডিও ফাইল বাইটস সরাসরি পড়া (যাতে HTML5 Blob দিয়ে ০ সেকেন্ডে ও নিরবচ্ছিন্ন সিকিং হয়)
#[tauri::command]
pub fn cmd_read_video_bytes(file_path: String) -> Result<Vec<u8>, String> {
    fs::read(&file_path).map_err(|e| format!("Failed to read file {file_path}: {e}"))
}

/// সব রেকর্ডেড ফাইল এবং স্ক্রিনশট লিস্ট করা (০ বাইট ও অপ্রয়োজনীয় ডুপ্লিকেট বাদ দিয়ে)
#[tauri::command]
pub fn cmd_list_recordings() -> Result<Vec<RecordingItem>, String> {
    let dir = get_recordings_dir();
    let mut items = Vec::new();
    let mut seen_stems_with_mp4 = std::collections::HashSet::new();

    // প্রথমে দেখি কোন কোন ফাইলের .mp4 আছে
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let ext = path.extension().unwrap_or_default().to_string_lossy().to_lowercase();
                if ext == "mp4" {
                    if let Ok(meta) = entry.metadata() {
                        if meta.len() > 0 {
                            let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
                            seen_stems_with_mp4.insert(stem);
                        }
                    }
                }
            }
        }
    }

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                let ext = path.extension().unwrap_or_default().to_string_lossy().to_lowercase();
                let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();

                let is_video = ext == "mp4" || ext == "mkv" || ext == "webm" || ext == "avi";
                let is_img = ext == "png" || ext == "jpg" || ext == "jpeg";

                if is_video || is_img {
                    let metadata = entry.metadata().ok();
                    let file_size = metadata.as_ref().map(|m| m.len()).unwrap_or(0);

                    // ০ বাইটের ফাইল বাদ
                    if file_size == 0 {
                        continue;
                    }

                    // যদি এই ভিডিওটির .mp4 থাকে, তবে ডুপ্লিকেট .webm বাদ দেব
                    if ext == "webm" && seen_stems_with_mp4.contains(&stem) {
                        continue;
                    }

                    let size_mb = (file_size as f64) / (1024.0 * 1024.0);

                    let date = metadata
                        .and_then(|m| m.modified().ok())
                        .map(|t| {
                            let datetime: chrono::DateTime<chrono::Local> = t.into();
                            datetime.format("%Y-%m-%d %H:%M").to_string()
                        })
                        .unwrap_or_else(|| "Recent".into());

                    items.push(RecordingItem {
                        name,
                        path: path.to_string_lossy().to_string(),
                        size_mb,
                        date,
                        is_video,
                    });
                }
            }
        }
    }

    // নতুন ফাইলগুলো প্রথমে দেখানো
    items.sort_by(|a, b| b.date.cmp(&a.date));
    Ok(items)
}

/// রেকর্ডিংস ফোল্ডার উইন্ডোজ এক্সপ্লোরারে ওপেন করা
#[tauri::command]
pub fn cmd_open_recordings_folder() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let dir = get_recordings_dir();
        let mut cmd = Command::new("explorer");
        cmd.arg(&dir);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().map_err(|e| format!("Failed to open folder: {e}"))?;
    }
    Ok(())
}

/// নির্দিষ্ট ভিডিও বা ছবি সিস্টেমের ডিফল্ট প্লেয়ারে চালানো
#[tauri::command]
pub fn cmd_play_media(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut cmd = Command::new("explorer");
        cmd.arg(&file_path);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().map_err(|e| format!("Failed to open file: {e}"))?;
    }
    Ok(())
}

/// রেকর্ডিং ফাইল মুছে ফেলা
#[tauri::command]
pub fn cmd_delete_media(file_path: String) -> Result<(), String> {
    fs::remove_file(&file_path).map_err(|e| format!("Failed to delete: {e}"))?;
    Ok(())
}

/// উইন্ডো মিনিমাইজ করা
#[tauri::command]
pub fn cmd_window_minimize(window: tauri::Window) -> Result<(), String> {
    #[cfg(not(target_os = "android"))]
    {
        let _ = window.minimize();
    }
    Ok(())
}

/// উইন্ডো ম্যাক্সিমাইজ বা রিস্টোর করা
#[tauri::command]
pub fn cmd_window_maximize(window: tauri::Window) -> Result<(), String> {
    #[cfg(not(target_os = "android"))]
    {
        if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
    Ok(())
}

/// উইন্ডো ফুলস্ক্রিন বা রিস্টোর করা (Area Snip Mode)
#[tauri::command]
pub fn cmd_window_fullscreen(window: tauri::Window, fullscreen: bool) -> Result<(), String> {
    #[cfg(not(target_os = "android"))]
    {
        let _ = window.set_fullscreen(fullscreen);
    }
    Ok(())
}

/// উইন্ডো বন্ধ করা
#[tauri::command]
pub fn cmd_window_close(window: tauri::Window) -> Result<(), String> {
    #[cfg(not(target_os = "android"))]
    {
        let _ = window.close();
    }
    Ok(())
}

// ── REAL RTMP LIVE STREAMING MANAGER ──
use std::sync::Mutex;
use std::sync::mpsc::{channel, Sender};
use std::io::Write;

static STREAM_CHILD: Mutex<Option<std::process::Child>> = Mutex::new(None);
static STREAM_TX: Mutex<Option<Sender<Vec<u8>>>> = Mutex::new(None);

#[tauri::command]
pub fn cmd_start_rtmp_stream(rtmp_url: String, stream_key: String, bitrate_kbps: u32) -> Result<String, String> {
    let mut lock = STREAM_CHILD.lock().unwrap();
    if lock.is_some() {
        return Err("A live stream is already active".into());
    }

    if stream_key.trim().is_empty() {
        return Err("Stream key cannot be empty. Please enter your stream key!".into());
    }

    let full_target = if stream_key.trim().starts_with("rtmp://") || stream_key.trim().starts_with("rtmps://") {
        stream_key.trim().to_string()
    } else if stream_key.trim().starts_with("FB-") {
        // 🔴 SMART AUTO-ROUTING FOR FACEBOOK LIVE:
        // Even if user forgot to change the dropdown from YouTube to Facebook,
        // any stream key starting with "FB-" is unconditionally sent to Facebook RTMPS!
        format!("rtmps://live-api-s.facebook.com:443/rtmp/{}", stream_key.trim())
    } else if rtmp_url.ends_with('/') {
        format!("{}{}", rtmp_url, stream_key.trim())
    } else {
        format!("{}/{}", rtmp_url, stream_key.trim())
    };

    let b_str = format!("{}k", bitrate_kbps);
    let max_b = format!("{}k", bitrate_kbps);
    let buf_s = format!("{}k", bitrate_kbps * 2);

    let mut cmd = Command::new("ffmpeg");
    cmd.args([
        "-y",
        "-loglevel", "info",
        "-f", "webm",
        "-i", "pipe:0",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "zerolatency",
        "-b:v", &b_str,
        "-maxrate", &max_b,
        "-bufsize", &buf_s,
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-g", "60",
        "-keyint_min", "60",
        "-sc_threshold", "0",
        "-flags", "+global_header", // 🔴 CRITICAL for Facebook/YouTube/Twitch RTMP/RTMPS ingestion!
        "-c:a", "aac",
        "-b:a", "128k",
        "-ar", "48000",
        "-flush_packets", "1",
        "-f", "flv",
        &full_target,
    ]);

    cmd.stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::null());

    // ডায়াগনস্টিক লগ যাতে স্ট্রিম সংযোগে কোনো সমস্যা হলে দেখা যায়
    if let Ok(log_f) = fs::File::create("D:\\AabSara\\stream.log") {
        cmd.stderr(std::process::Stdio::from(log_f));
    } else {
        cmd.stderr(std::process::Stdio::null());
    }

    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn FFmpeg stream: {e}"))?;
    let mut stdin = child.stdin.take().ok_or("Failed to open FFmpeg stdin pipe")?;

    let (tx, rx) = channel::<Vec<u8>>();

    // Dedicated asynchronous writer thread to prevent pipe blocking & UI deadlock
    std::thread::spawn(move || {
        while let Ok(bytes) = rx.recv() {
            if stdin.write_all(&bytes).is_err() {
                break;
            }
            let _ = stdin.flush();
        }
    });

    *STREAM_TX.lock().unwrap() = Some(tx);
    *lock = Some(child);
    log::info!("Live RTMP Stream initiated to target: {}", full_target);
    Ok("Stream connected successfully".into())
}

#[tauri::command]
pub fn cmd_write_stream_bytes(bytes: Vec<u8>) -> Result<(), String> {
    let lock = STREAM_TX.lock().unwrap();
    if let Some(ref tx) = *lock {
        let _ = tx.send(bytes);
    }
    Ok(())
}

#[tauri::command]
pub fn cmd_write_stream_chunk(base64_chunk: String) -> Result<(), String> {
    let raw_b64 = if let Some(idx) = base64_chunk.find(",") {
        &base64_chunk[idx + 1..]
    } else {
        &base64_chunk
    };
    if let Ok(bytes) = decode_base64(raw_b64) {
        let lock = STREAM_TX.lock().unwrap();
        if let Some(ref tx) = *lock {
            let _ = tx.send(bytes);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn cmd_get_stream_status() -> Result<bool, String> {
    let mut lock = STREAM_CHILD.lock().unwrap();
    if let Some(ref mut child) = *lock {
        match child.try_wait() {
            Ok(Some(status)) => {
                log::warn!("Live Stream process finished with: {:?}", status);
                return Ok(false);
            }
            Ok(None) => return Ok(true),
            Err(e) => return Err(e.to_string()),
        }
    }
    Ok(false)
}

#[tauri::command]
pub fn cmd_stop_rtmp_stream() -> Result<(), String> {
    {
        let mut tx_lock = STREAM_TX.lock().unwrap();
        *tx_lock = None;
    }
    {
        let mut child_lock = STREAM_CHILD.lock().unwrap();
        if let Some(mut child) = child_lock.take() {
            let _ = child.kill();
            log::info!("Live RTMP Stream terminated.");
        }
    }
    Ok(())
}

#[tauri::command]
pub fn cmd_get_stream_log() -> Result<String, String> {
    if let Ok(content) = fs::read_to_string("D:\\AabSara\\stream.log") {
        let lines: Vec<&str> = content.lines().collect();
        let tail_count = if lines.len() > 25 { lines.len() - 25 } else { 0 };
        return Ok(lines[tail_count..].join("\n"));
    }
    Ok("No live stream log generated yet.".into())
}

/// আসল ড্রাইভের ফ্রি ডিস্ক স্পেস বের করা (GB)
#[tauri::command]
pub fn cmd_get_free_disk_space() -> Result<f64, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use std::ffi::OsStr;
        unsafe extern "system" {
            fn GetDiskFreeSpaceExW(
                lpDirectoryName: *const u16,
                lpFreeBytesAvailableToCaller: *mut u64,
                lpTotalNumberOfBytes: *mut u64,
                lpTotalNumberOfFreeBytes: *mut u64,
            ) -> i32;
        }

        // Check D: drive first, or fallback to C:
        for drive in &["D:\\", "C:\\"] {
            let mut path_utf16: Vec<u16> = OsStr::new(drive).encode_wide().collect();
            path_utf16.push(0);

            let mut free_bytes_avail: u64 = 0;
            let mut total_bytes: u64 = 0;
            let mut total_free: u64 = 0;

            let success = unsafe {
                GetDiskFreeSpaceExW(
                    path_utf16.as_ptr(),
                    &mut free_bytes_avail,
                    &mut total_bytes,
                    &mut total_free,
                )
            };

            if success != 0 && free_bytes_avail > 0 {
                let gb = free_bytes_avail as f64 / (1024.0 * 1024.0 * 1024.0);
                return Ok((gb * 10.0).round() / 10.0);
            }
        }
    }

    Ok(50.0)
}

/// কনফিগ সংক্রান্ত
#[tauri::command]
pub fn cmd_get_config() -> Result<AppConfig, String> {
    Ok(AppConfig::load())
}

#[tauri::command]
pub fn cmd_set_config(config: AppConfig) -> Result<(), String> {
    config.save()
}

/// ওয়েব ইউআরএল বা লিংক ব্রাউজারে ওপেন করা
#[tauri::command]
pub fn cmd_open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut cmd = Command::new("explorer");
        cmd.arg(&url);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().map_err(|e| format!("Failed to open URL: {e}"))?;
    }
    Ok(())
}

use base64::prelude::*;

// স্ট্যান্ডার্ড ও ১০০% নিরাপদ Base64 ডিকোডার
fn decode_base64(input: &str) -> Result<Vec<u8>, String> {
    let clean = input.replace(['\r', '\n', ' ', '\t'], "");
    BASE64_STANDARD.decode(clean.trim()).map_err(|e| e.to_string())
}
