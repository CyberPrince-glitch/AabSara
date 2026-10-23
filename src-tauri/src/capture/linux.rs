// AabSara — Linux Screen Capture (X11 / PipeWire)
// লিনাক্সে স্ক্রিন ক্যাপচারের জন্য X11 SHM বা PipeWire ব্যবহার

use super::types::*;

pub fn list_sources() -> Vec<CaptureSource> {
    // TODO: X11 — XOpenDisplay, XRandr দিয়ে মনিটর ডিটেক্ট
    // TODO: PipeWire portal দিয়ে screen/window সোর্স পাওয়া
    vec![CaptureSource {
        id: "monitor-primary".into(),
        name: "Primary Monitor (Linux)".into(),
        source_type: CaptureSourceType::Monitor,
        width: 1920,
        height: 1080,
    }]
}

/// X11 SHM ভিত্তিক স্ক্রিন ক্যাপচার
pub struct X11Capture {
    active: bool,
    frame_count: u64,
}

impl X11Capture {
    pub fn new() -> Self {
        Self {
            active: false,
            frame_count: 0,
        }
    }
}

impl CaptureBackend for X11Capture {
    fn start(&mut self, config: &CaptureConfig) -> Result<(), String> {
        log::info!("Starting X11/PipeWire capture: {}x{}", config.source.width, config.source.height);
        // TODO: ফেজ ৩ — X11 SHM বা PipeWire ক্যাপচার ইমপ্লিমেন্ট করো
        self.active = true;
        Ok(())
    }

    fn grab_frame(&mut self) -> Result<VideoFrame, String> {
        if !self.active {
            return Err("Capture not started".into());
        }
        self.frame_count += 1;

        // TODO: ফেজ ৩ — আসল X11 ফ্রেম ক্যাপচার
        Ok(VideoFrame {
            data: vec![0u8; 1920 * 1080 * 4],
            width: 1920,
            height: 1080,
            timestamp_ns: self.frame_count * (1_000_000_000 / 30),
            stride: 1920 * 4,
        })
    }

    fn stop(&mut self) -> Result<(), String> {
        log::info!("Stopping X11 capture");
        self.active = false;
        Ok(())
    }

    fn is_active(&self) -> bool {
        self.active
    }
}
