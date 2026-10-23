// AabSara — Screen Capture module
// Platform-specific screen/window capture backends

pub mod types;

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "linux")]
pub mod linux;

#[cfg(target_os = "macos")]
pub mod macos;

use types::*;

/// ক্যাপচারযোগ্য সোর্সের তালিকা রিটার্ন করে (মনিটর, উইন্ডো ইত্যাদি)
pub fn list_sources() -> Vec<CaptureSource> {
    #[cfg(target_os = "windows")]
    {
        windows::list_sources()
    }
    #[cfg(target_os = "linux")]
    {
        linux::list_sources()
    }
    #[cfg(target_os = "macos")]
    {
        macos::list_sources()
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        vec![]
    }
}

/// প্ল্যাটফর্ম অনুযায়ী ক্যাপচার ব্যাকএন্ড তৈরি করে
pub fn create_capture_backend() -> Box<dyn CaptureBackend> {
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::DxgiCapture::new())
    }
    #[cfg(target_os = "linux")]
    {
        Box::new(linux::X11Capture::new())
    }
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacCapture::new())
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        compile_error!("Unsupported platform for screen capture")
    }
}
