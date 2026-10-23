// AabSara — Audio types & traits

/// একটি অডিও চাংক (PCM sample data)
pub struct AudioBuffer {
    /// Raw PCM samples (f32 interleaved)
    pub data: Vec<f32>,
    /// চ্যানেল সংখ্যা (1 = mono, 2 = stereo)
    pub channels: u16,
    /// স্যাম্পল রেট
    pub sample_rate: u32,
    /// টাইমস্ট্যাম্প (nanoseconds)
    pub timestamp_ns: u64,
}

/// অডিও ক্যাপচার কনফিগ
pub struct AudioCaptureConfig {
    pub record_system: bool,
    pub record_mic: bool,
    pub sample_rate: u32,
}

/// অডিও ক্যাপচার trait — সব প্ল্যাটফর্ম এটা implement করবে
pub trait AudioBackend: Send {
    /// অডিও ক্যাপচার শুরু
    fn start(&mut self, config: &AudioCaptureConfig) -> Result<(), String>;

    /// অডিও স্যাম্পল পড়ে
    fn read_samples(&mut self) -> Result<AudioBuffer, String>;

    /// অডিও ক্যাপচার বন্ধ
    fn stop(&mut self) -> Result<(), String>;

    /// চলছে কিনা
    fn is_active(&self) -> bool;
}
