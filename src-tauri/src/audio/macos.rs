// AabSara — macOS Audio Capture (CoreAudio)

use super::types::*;

pub struct CoreAudioBackend {
    active: bool,
}

impl CoreAudioBackend {
    pub fn new() -> Self {
        Self { active: false }
    }
}

impl AudioBackend for CoreAudioBackend {
    fn start(&mut self, config: &AudioCaptureConfig) -> Result<(), String> {
        log::info!("Starting CoreAudio capture");
        // TODO: ফেজ ৩ — CoreAudio ইমপ্লিমেন্ট
        self.active = true;
        Ok(())
    }

    fn read_samples(&mut self) -> Result<AudioBuffer, String> {
        Ok(AudioBuffer {
            data: vec![0.0f32; 1024],
            channels: 2,
            sample_rate: 48000,
            timestamp_ns: 0,
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
