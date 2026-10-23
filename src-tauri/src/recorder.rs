// AabSara — Recorder module
// মূল রেকর্ডিং অর্কেস্ট্রেশন — ক্যাপচার + এনকোড + ডিস্ক রাইট

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Instant;

use parking_lot::Mutex;
use serde::{Deserialize, Serialize};

use crate::capture;
use crate::config::AppConfig;
use crate::encoder::FfmpegEncoder;

/// রেকর্ডিং স্ট্যাটাস
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RecordingStatus {
    Idle,
    Recording,
    Paused,
    Stopping,
    Error(String),
}

/// রিয়েল-টাইম রেকর্ডিং তথ্য
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingInfo {
    pub status: RecordingStatus,
    pub duration_secs: f64,
    pub fps: f64,
    pub frame_count: u64,
    pub file_size_mb: f64,
    pub output_path: String,
}

/// মূল রেকর্ডার — সব কিছু নিয়ন্ত্রণ করে
pub struct Recorder {
    status: Arc<Mutex<RecordingStatus>>,
    info: Arc<Mutex<RecordingInfo>>,
    is_running: Arc<AtomicBool>,
    is_paused: Arc<AtomicBool>,
    config: AppConfig,
}

impl Recorder {
    pub fn new(config: AppConfig) -> Self {
        Self {
            status: Arc::new(Mutex::new(RecordingStatus::Idle)),
            info: Arc::new(Mutex::new(RecordingInfo {
                status: RecordingStatus::Idle,
                duration_secs: 0.0,
                fps: 0.0,
                frame_count: 0,
                file_size_mb: 0.0,
                output_path: String::new(),
            })),
            is_running: Arc::new(AtomicBool::new(false)),
            is_paused: Arc::new(AtomicBool::new(false)),
            config,
        }
    }

    /// রেকর্ডিং শুরু করে — আলাদা thread এ চলে
    pub fn start(&self) -> Result<String, String> {
        if self.is_running.load(Ordering::Relaxed) {
            return Err("Already recording".into());
        }

        // আউটপুট ফাইল পাথ তৈরি
        let output_dir = &self.config.output.output_dir;
        std::fs::create_dir_all(output_dir)
            .map_err(|e| format!("Cannot create output dir: {e}"))?;

        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let filename = format!(
            "{}_{}.{}",
            self.config.output.filename_prefix, timestamp, self.config.output.format
        );
        let output_path = format!("{}/{}", output_dir.trim_end_matches(['/', '\\']), filename);

        log::info!("Recording to: {output_path}");

        // ক্যাপচার সোর্স পাও
        let sources = capture::list_sources();
        let source = sources.first().ok_or("No capture source found")?.clone();

        let width = source.width;
        let height = source.height;
        let fps = self.config.video.fps;

        // স্ট্যাটাস আপডেট করো
        self.is_running.store(true, Ordering::Relaxed);
        *self.status.lock() = RecordingStatus::Recording;

        let is_running = self.is_running.clone();
        let is_paused = self.is_paused.clone();
        let status = self.status.clone();
        let info = self.info.clone();
        let config = self.config.clone();
        let out_path = output_path.clone();

        // রেকর্ডিং থ্রেড — ক্যাপচার ও এনকোড একসাথে
        std::thread::spawn(move || {
            let result = Self::recording_loop(
                &out_path, width, height, fps, &config,
                &is_running, &is_paused, &status, &info,
            );

            if let Err(e) = result {
                log::error!("Recording error: {e}");
                *status.lock() = RecordingStatus::Error(e);
            }

            is_running.store(false, Ordering::Relaxed);
        });

        // info আপডেট
        {
            let mut i = self.info.lock();
            i.status = RecordingStatus::Recording;
            i.output_path = output_path.clone();
            i.frame_count = 0;
            i.duration_secs = 0.0;
        }

        Ok(output_path)
    }

    /// মূল রেকর্ডিং লুপ
    fn recording_loop(
        output_path: &str,
        width: u32,
        height: u32,
        fps: u32,
        config: &AppConfig,
        is_running: &AtomicBool,
        is_paused: &AtomicBool,
        status: &Mutex<RecordingStatus>,
        info: &Mutex<RecordingInfo>,
    ) -> Result<(), String> {
        // ক্যাপচার ব্যাকএন্ড তৈরি
        let mut capturer = capture::create_capture_backend();
        let sources = capture::list_sources();
        let source = sources.first().ok_or("No source")?.clone();

        let capture_config = crate::capture::types::CaptureConfig {
            source,
            fps,
        };
        capturer.start(&capture_config)?;

        // এনকোডার শুরু
        let mut encoder = FfmpegEncoder::new();
        encoder.start(output_path, width, height, fps, config)?;

        let start_time = Instant::now();
        let frame_interval = std::time::Duration::from_secs_f64(1.0 / fps as f64);
        let mut frame_count: u64 = 0;

        // মূল লুপ — যতক্ষণ না stop হয়
        while is_running.load(Ordering::Relaxed) {
            // pause হলে অপেক্ষা করো
            if is_paused.load(Ordering::Relaxed) {
                std::thread::sleep(std::time::Duration::from_millis(50));
                continue;
            }

            let frame_start = Instant::now();

            // ফ্রেম ক্যাপচার
            match capturer.grab_frame() {
                Ok(frame) => {
                    // FFmpeg এ ফ্রেম পাঠাও
                    if let Err(e) = encoder.write_frame(&frame.data) {
                        log::warn!("Frame write error: {e}");
                    }
                    frame_count += 1;

                    // info আপডেট (প্রতি 10 ফ্রেমে)
                    if frame_count % 10 == 0 {
                        let elapsed = start_time.elapsed().as_secs_f64();
                        let mut i = info.lock();
                        i.frame_count = frame_count;
                        i.duration_secs = elapsed;
                        i.fps = frame_count as f64 / elapsed.max(0.001);
                    }
                }
                Err(e) => {
                    log::warn!("Capture error: {e}");
                }
            }

            // FPS ম্যাচ করার জন্য sleep
            let elapsed = frame_start.elapsed();
            if elapsed < frame_interval {
                std::thread::sleep(frame_interval - elapsed);
            }
        }

        // ক্লিনআপ
        capturer.stop()?;
        encoder.stop()?;

        *status.lock() = RecordingStatus::Idle;
        log::info!("Recording complete: {frame_count} frames");

        Ok(())
    }

    /// রেকর্ডিং বন্ধ
    pub fn stop(&self) -> Result<(), String> {
        if !self.is_running.load(Ordering::Relaxed) {
            return Err("Not recording".into());
        }
        *self.status.lock() = RecordingStatus::Stopping;
        self.is_running.store(false, Ordering::Relaxed);
        Ok(())
    }

    /// রেকর্ডিং পজ
    pub fn pause(&self) -> Result<(), String> {
        if !self.is_running.load(Ordering::Relaxed) {
            return Err("Not recording".into());
        }
        self.is_paused.store(true, Ordering::Relaxed);
        *self.status.lock() = RecordingStatus::Paused;
        Ok(())
    }

    /// পজ থেকে ফিরে আসা
    pub fn resume(&self) -> Result<(), String> {
        self.is_paused.store(false, Ordering::Relaxed);
        *self.status.lock() = RecordingStatus::Recording;
        Ok(())
    }

    /// বর্তমান স্ট্যাটাস
    pub fn get_info(&self) -> RecordingInfo {
        let mut i = self.info.lock().clone();
        i.status = self.status.lock().clone();
        i
    }
}
