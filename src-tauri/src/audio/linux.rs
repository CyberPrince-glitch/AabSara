// AabSara — Linux Audio Capture (PulseAudio / PipeWire)

use super::types::*;

pub struct PulseAudio {
    active: bool,
}

impl PulseAudio {
    pub fn new() -> Self {
        Self { active: false }
    }
}

impl AudioBackend for PulseAudio {
    fn start(&mut self, config: &AudioCaptureConfig) -> Result<(), String> {
        log::info!("Starting PulseAudio capture");
        // TODO: ফেজ ৩ — PulseAudio/PipeWire ইমপ্লিমেন্ট
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
