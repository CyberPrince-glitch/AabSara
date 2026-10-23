// AabSara — macOS Screen Capture (ScreenCaptureKit / AVFoundation)
// ম্যাকে স্ক্রিন ক্যাপচারের জন্য ScreenCaptureKit ব্যবহার

use super::types::*;

pub fn list_sources() -> Vec<CaptureSource> {
    // TODO: ফেজ ৩ — SCShareableContent দিয়ে ডিসপ্লে ও উইন্ডো তালিকা পাওয়া
    vec![CaptureSource {
        id: "monitor-primary".into(),
        name: "Primary Monitor (macOS)".into(),
        source_type: CaptureSourceType::Monitor,
        width: 2560,
        height: 1600,
    }]
}

/// macOS ScreenCaptureKit ভিত্তিক ক্যাপচার
pub struct MacCapture {
    active: bool,
    frame_count: u64,
}

impl MacCapture {
    pub fn new() -> Self {
        Self {
            active: false,
            frame_count: 0,
        }
    }
}

impl CaptureBackend for MacCapture {
    fn start(&mut self, config: &CaptureConfig) -> Result<(), String> {
        log::info!("Starting macOS ScreenCaptureKit: {}x{}", config.source.width, config.source.height);
        // TODO: ফেজ ৩ — ScreenCaptureKit ইমপ্লিমেন্ট
        self.active = true;
        Ok(())
    }

    fn grab_frame(&mut self) -> Result<VideoFrame, String> {
        if !self.active {
            return Err("Capture not started".into());
        }
        self.frame_count += 1;

        // TODO: ফেজ ৩ — আসল macOS ফ্রেম ক্যাপচার
        Ok(VideoFrame {
            data: vec![0u8; 2560 * 1600 * 4],
            width: 2560,
            height: 1600,
            timestamp_ns: self.frame_count * (1_000_000_000 / 30),
            stride: 2560 * 4,
        })
    }

    fn stop(&mut self) -> Result<(), String> {
        self.active = false;
        Ok(())
    }

    fn is_active(&self) -> bool {
        self.active
    }
}
