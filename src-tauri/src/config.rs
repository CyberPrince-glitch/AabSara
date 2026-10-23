// AabSara — Configuration module
// Handles recording settings, serialization, and persistence

use serde::{Deserialize, Serialize};

/// সম্পূর্ণ অ্যাপ্লিকেশন কনফিগারেশন
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub video: VideoConfig,
    pub audio: AudioConfig,
    pub output: OutputConfig,
    pub hotkeys: HotkeyConfig,
}

/// ভিডিও রেকর্ডিং সেটিংস
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoConfig {
    /// রেকর্ডিং FPS (15, 24, 30, 60, 120)
    pub fps: u32,
    /// রেজ্যুলেশন (0 = ডিসপ্লে নেটিভ)
    pub width: u32,
    pub height: u32,
    /// বিটরেট Kbps এ (যেমন 8000 = 8Mbps)
    pub bitrate_kbps: u32,
    /// কোডেক — "h264", "h265", "vp9"
    pub codec: String,
    /// হার্ডওয়্যার এনকোডিং ব্যবহার করবে কিনা
    pub use_hw_encoder: bool,
}

/// অডিও রেকর্ডিং সেটিংস
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioConfig {
    /// সিস্টেম অডিও রেকর্ড করবে কিনা
    pub record_system: bool,
    /// মাইক্রোফোন রেকর্ড করবে কিনা
    pub record_mic: bool,
    /// অডিও বিটরেট Kbps এ
    pub bitrate_kbps: u32,
    /// স্যাম্পল রেট (44100, 48000)
    pub sample_rate: u32,
}

/// আউটপুট ফাইল সেটিংস
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputConfig {
    /// সেভ ডিরেক্টরি পাথ
    pub output_dir: String,
    /// ফাইল ফরম্যাট — "mp4", "mkv", "webm"
    pub format: String,
    /// ফাইলনেম প্রিফিক্স
    pub filename_prefix: String,
}

/// গ্লোবাল হটকি সেটিংস
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyConfig {
    pub start_stop: String,
    pub pause_resume: String,
    pub screenshot: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            video: VideoConfig {
                fps: 30,
                width: 0,   // auto-detect
                height: 0,  // auto-detect
                bitrate_kbps: 8000,
                codec: "h264".into(),
                use_hw_encoder: true,
            },
            audio: AudioConfig {
                record_system: true,
                record_mic: false,
                bitrate_kbps: 192,
                sample_rate: 48000,
            },
            output: OutputConfig {
                output_dir: default_output_dir(),
                format: "mp4".into(),
                filename_prefix: "AabSara".into(),
            },
            hotkeys: HotkeyConfig {
                start_stop: "F9".into(),
                pause_resume: "F10".into(),
                screenshot: "F11".into(),
            },
        }
    }
}

/// ডিফল্ট আউটপুট ডিরেক্টরি — Videos ফোল্ডার
fn default_output_dir() -> String {
    if let Some(video_dir) = dirs_next_video_dir() {
        video_dir
    } else {
        "./recordings".into()
    }
}

/// ভিডিও ডিরেক্টরি পাথ রিটার্ন করে (cross-platform)
fn dirs_next_video_dir() -> Option<String> {
    #[cfg(target_os = "windows")]
    {
        std::env::var("USERPROFILE")
            .ok()
            .map(|home| format!("{home}\\Videos\\AabSara"))
    }
    #[cfg(target_os = "linux")]
    {
        std::env::var("HOME")
            .ok()
            .map(|home| format!("{home}/Videos/AabSara"))
    }
    #[cfg(target_os = "macos")]
    {
        std::env::var("HOME")
            .ok()
            .map(|home| format!("{home}/Movies/AabSara"))
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        None
    }
}

impl AppConfig {
    /// কনফিগ ফাইল থেকে লোড করে, না থাকলে ডিফল্ট রিটার্ন করে
    pub fn load() -> Self {
        let config_path = Self::config_path();
        if let Ok(data) = std::fs::read_to_string(&config_path) {
            serde_json::from_str(&data).unwrap_or_default()
        } else {
            let config = Self::default();
            let _ = config.save();
            config
        }
    }

    /// কনফিগ ফাইলে সেভ করে
    pub fn save(&self) -> Result<(), String> {
        let config_path = Self::config_path();
        if let Some(parent) = std::path::Path::new(&config_path).parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config dir: {e}"))?;
        }
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize config: {e}"))?;
        std::fs::write(&config_path, json)
            .map_err(|e| format!("Failed to write config: {e}"))?;
        Ok(())
    }

    fn config_path() -> String {
        #[cfg(target_os = "windows")]
        {
            let appdata = std::env::var("APPDATA").unwrap_or_else(|_| ".".into());
            format!("{appdata}\\AabSara\\config.json")
        }
        #[cfg(not(target_os = "windows"))]
        {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
            format!("{home}/.config/aabsara/config.json")
        }
    }
}
