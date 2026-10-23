// AabSara — Encoder module
// ভিডিও ও অডিও এনকোডিং (FFmpeg subprocess ব্যবহার)
//
// কৌশল: FFmpeg কে subprocess হিসেবে চালানো হয়
// কারণ:
// 1. FFmpeg static linking কঠিন ও ভারী (100+ MB)
// 2. subprocess pipe দিয়ে raw ফ্রেম পাঠালে ঠিক একই কাজ হয়
// 3. FFmpeg আপডেট করা সহজ — শুধু binary বদলাও
// 4. 4GB RAM পিসিতেও স্মুথ চলে

use std::io::Write;
use std::process::{Child, Command, Stdio};

use crate::config::AppConfig;

/// FFmpeg প্রসেস ম্যানেজার
pub struct FfmpegEncoder {
    process: Option<Child>,
    width: u32,
    height: u32,
    fps: u32,
}

impl FfmpegEncoder {
    pub fn new() -> Self {
        Self {
            process: None,
            width: 0,
            height: 0,
            fps: 30,
        }
    }

    /// FFmpeg ইনস্টল আছে কিনা চেক করে
    pub fn check_ffmpeg() -> Result<String, String> {
        let output = Command::new("ffmpeg")
            .arg("-version")
            .output()
            .map_err(|e| format!("FFmpeg not found: {e}. Please install FFmpeg."))?;

        let version = String::from_utf8_lossy(&output.stdout);
        let first_line = version.lines().next().unwrap_or("unknown");
        Ok(first_line.to_string())
    }

    /// হার্ডওয়্যার এনকোডার ডিটেক্ট করে
    pub fn detect_hw_encoders() -> Vec<String> {
        let mut encoders = Vec::new();

        // NVENC (Nvidia) চেক
        if Self::has_encoder("h264_nvenc") {
            encoders.push("h264_nvenc".into());
        }
        // AMD AMF চেক
        if Self::has_encoder("h264_amf") {
            encoders.push("h264_amf".into());
        }
        // Intel QuickSync চেক
        if Self::has_encoder("h264_qsv") {
            encoders.push("h264_qsv".into());
        }
        // সব ব্যর্থ হলে software encoder
        if encoders.is_empty() {
            encoders.push("libx264".into());
        }

        encoders
    }

    fn has_encoder(name: &str) -> bool {
        Command::new("ffmpeg")
            .args(["-hide_banner", "-encoders"])
            .output()
            .map(|out| {
                let s = String::from_utf8_lossy(&out.stdout);
                s.contains(name)
            })
            .unwrap_or(false)
    }

    /// রেকর্ডিং শুরু — FFmpeg pipe খোলে
    pub fn start(
        &mut self,
        output_path: &str,
        width: u32,
        height: u32,
        fps: u32,
        config: &AppConfig,
    ) -> Result<(), String> {
        self.width = width;
        self.height = height;
        self.fps = fps;

        // সেরা এনকোডার বেছে নাও
        let encoder = if config.video.use_hw_encoder {
            let hw = Self::detect_hw_encoders();
            hw.first().cloned().unwrap_or_else(|| "libx264".into())
        } else {
            "libx264".into()
        };

        log::info!(
            "Starting FFmpeg: {}x{} @ {}fps, encoder={}, output={}",
            width, height, fps, encoder, output_path
        );

        // FFmpeg কমান্ড বিল্ড করো
        let mut args: Vec<String> = vec![
            "-y".into(),
            "-f".into(), "rawvideo".into(),
            "-pix_fmt".into(), "bgra".into(),
            "-s".into(), format!("{width}x{height}"),
            "-r".into(), fps.to_string(),
            "-i".into(), "pipe:0".into(),  // stdin থেকে raw video
        ];

        // TODO: অডিও ইনপুটও যোগ করো (pipe:3 বা আলাদা ফাইল)

        // এনকোডার সেটিংস
        args.extend([
            "-c:v".into(), encoder.clone(),
            "-b:v".into(), format!("{}k", config.video.bitrate_kbps),
            "-pix_fmt".into(), "yuv420p".into(),
        ]);

        // Encoder-specific টিউনিং
        if encoder == "libx264" {
            args.extend([
                "-preset".into(), "ultrafast".into(),  // 4GB RAM এর জন্য
                "-tune".into(), "zerolatency".into(),
            ]);
        } else if encoder.contains("nvenc") {
            args.extend([
                "-preset".into(), "p4".into(),        // balanced
                "-tune".into(), "ll".into(),           // low latency
            ]);
        }

        args.push(output_path.into());

        let child = Command::new("ffmpeg")
            .args(&args)
            .stdin(Stdio::piped())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start FFmpeg: {e}"))?;

        self.process = Some(child);
        Ok(())
    }

    /// একটি ফ্রেম FFmpeg এ পাঠায়
    pub fn write_frame(&mut self, frame_data: &[u8]) -> Result<(), String> {
        if let Some(ref mut child) = self.process {
            if let Some(ref mut stdin) = child.stdin {
                stdin
                    .write_all(frame_data)
                    .map_err(|e| format!("Failed to write frame: {e}"))?;
            }
            Ok(())
        } else {
            Err("FFmpeg not running".into())
        }
    }

    /// রেকর্ডিং বন্ধ — FFmpeg প্রসেস শেষ করে
    pub fn stop(&mut self) -> Result<(), String> {
        if let Some(mut child) = self.process.take() {
            // stdin বন্ধ করলে FFmpeg নিজেই ফাইল finalize করবে
            drop(child.stdin.take());
            let status = child
                .wait()
                .map_err(|e| format!("Failed to wait for FFmpeg: {e}"))?;
            log::info!("FFmpeg exited with: {status}");
            Ok(())
        } else {
            Ok(())
        }
    }

    pub fn is_running(&self) -> bool {
        self.process.is_some()
    }
}
