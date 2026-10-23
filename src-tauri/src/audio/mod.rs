// AabSara — Audio Capture module
// Platform-specific audio capture (system audio + microphone)

pub mod types;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "linux")]
pub mod linux;

#[cfg(target_os = "macos")]
pub mod macos;

use types::*;

/// প্ল্যাটফর্ম অনুযায়ী অডিও ব্যাকএন্ড তৈরি করে
pub fn create_audio_backend() -> Box<dyn AudioBackend> {
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WasapiAudio::new())
    }
    #[cfg(target_os = "linux")]
    {
        Box::new(linux::PulseAudio::new())
    }
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::CoreAudioBackend::new())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        compile_error!("Unsupported platform for audio capture")
    }
}
