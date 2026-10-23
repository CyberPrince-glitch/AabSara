// AabSara — Windows Audio Capture (WASAPI)
// সিস্টেম অডিও (loopback) + মাইক্রোফোন ক্যাপচার

use super::types::*;

pub struct WasapiAudio {
    active: bool,
}

impl WasapiAudio {
    pub fn new() -> Self {
        Self { active: false }
    }
}

impl AudioBackend for WasapiAudio {
    fn start(&mut self, config: &AudioCaptureConfig) -> Result<(), String> {
        log::info!(
            "Starting WASAPI audio: system={}, mic={}, rate={}",
            config.record_system, config.record_mic, config.sample_rate
        );
        // TODO: ফেজ ২ — WASAPI loopback ও mic ক্যাপচার ইমপ্লিমেন্ট
        //
        // ধাপসমূহ:
        // 1. CoInitializeEx() দিয়ে COM ইনিশিয়ালাইজ
        // 2. IMMDeviceEnumerator দিয়ে ডিফল্ট render device পাও (loopback)
        // 3. IAudioClient::Initialize() — AUDCLNT_STREAMFLAGS_LOOPBACK
        // 4. IAudioCaptureClient দিয়ে buffer পড়ো
        // 5. মাইকের জন্য আলাদা capture device ব্যবহার করো
        self.active = true;
        Ok(())
    }

    fn read_samples(&mut self) -> Result<AudioBuffer, String> {
        if !self.active {
            return Err("Audio not started".into());
        }
        // TODO: ফেজ ২ — WASAPI থেকে আসল PCM data পড়ো
        Ok(AudioBuffer {
            data: vec![0.0f32; 1024],
            channels: 2,
            sample_rate: 48000,
            timestamp_ns: 0,
        })
    }

    fn stop(&mut self) -> Result<(), String> {
        log::info!("Stopping WASAPI audio");
        self.active = false;
        Ok(())
    }

    fn is_active(&self) -> bool {
        self.active
    }
}
