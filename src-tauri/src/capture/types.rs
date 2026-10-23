// AabSara — Capture types & traits
// সব প্ল্যাটফর্মের জন্য কমন টাইপ এবং trait ডেফিনিশন

use serde::{Deserialize, Serialize};

/// ক্যাপচার করা একটি ফ্রেম (raw BGRA pixel data)
pub struct VideoFrame {
    /// Raw pixel data (BGRA format)
    pub data: Vec<u8>,
    /// ফ্রেমের প্রস্থ (pixels)
    pub width: u32,
    /// ফ্রেমের উচ্চতা (pixels)
    pub height: u32,
    /// ফ্রেম ক্যাপচারের সময় (nanoseconds since recording start)
    pub timestamp_ns: u64,
    /// Bytes per row (stride) — padding থাকতে পারে
    pub stride: u32,
}

/// ক্যাপচারযোগ্য সোর্স (মনিটর বা উইন্ডো)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureSource {
    /// ইউনিক আইডি
    pub id: String,
    /// ডিসপ্লে নেম
    pub name: String,
    /// সোর্সের ধরন
    pub source_type: CaptureSourceType,
    /// প্রস্থ (pixels)
    pub width: u32,
    /// উচ্চতা (pixels)
    pub height: u32,
}

/// ক্যাপচার সোর্সের ধরন
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CaptureSourceType {
    /// পুরো মনিটর/ডিসপ্লে
    Monitor,
    /// নির্দিষ্ট উইন্ডো
    Window,
    /// নির্দিষ্ট এলাকা (region)
    Region,
}

/// ক্যাপচার কনফিগারেশন
pub struct CaptureConfig {
    pub source: CaptureSource,
    pub fps: u32,
}

/// সব প্ল্যাটফর্মের ক্যাপচার ব্যাকএন্ড এই trait ইমপ্লিমেন্ট করবে
pub trait CaptureBackend: Send {
    /// ক্যাপচার শুরু করে
    fn start(&mut self, config: &CaptureConfig) -> Result<(), String>;

    /// পরবর্তী ফ্রেম ক্যাপচার করে
    fn grab_frame(&mut self) -> Result<VideoFrame, String>;

    /// ক্যাপচার বন্ধ করে
    fn stop(&mut self) -> Result<(), String>;

    /// ক্যাপচার চলছে কিনা
    fn is_active(&self) -> bool;
}
