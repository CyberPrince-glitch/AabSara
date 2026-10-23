// AabSara — Windows Screen Capture (DXGI Desktop Duplication API)
// GPU থেকে সরাসরি ফ্রেম ক্যাপচার করে, CPU তে চাপ পড়ে না

use super::types::*;

/// উইন্ডোজে ক্যাপচারযোগ্য সোর্স তালিকা
pub fn list_sources() -> Vec<CaptureSource> {
    let mut sources = Vec::new();

    // প্রাথমিক মনিটর — সব সময় থাকবে
    // TODO: EnumDisplayMonitors দিয়ে সব মনিটর ডিটেক্ট করো
    sources.push(CaptureSource {
        id: "monitor-primary".into(),
        name: "Primary Monitor".into(),
        source_type: CaptureSourceType::Monitor,
        width: get_screen_width(),
        height: get_screen_height(),
    });

    // TODO: EnumWindows দিয়ে সব ভিজিবল উইন্ডোও যোগ করো

    sources
}

/// স্ক্রিনের প্রস্থ পায়
fn get_screen_width() -> u32 {
    unsafe {
        windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics(
            windows::Win32::UI::WindowsAndMessaging::SM_CXSCREEN,
        ) as u32
    }
}

/// স্ক্রিনের উচ্চতা পায়
fn get_screen_height() -> u32 {
    unsafe {
        windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics(
            windows::Win32::UI::WindowsAndMessaging::SM_CYSCREEN,
        ) as u32
    }
}

/// DXGI Desktop Duplication ভিত্তিক ক্যাপচার
pub struct DxgiCapture {
    active: bool,
    width: u32,
    height: u32,
    frame_count: u64,
    // TODO: DXGI ডিভাইস, আউটপুট, ডুপ্লিকেশন অবজেক্ট যোগ করো
    // device: Option<ID3D11Device>,
    // context: Option<ID3D11DeviceContext>,
    // duplication: Option<IDXGIOutputDuplication>,
}

impl DxgiCapture {
    pub fn new() -> Self {
        Self {
            active: false,
            width: 0,
            height: 0,
            frame_count: 0,
        }
    }
}

impl CaptureBackend for DxgiCapture {
    fn start(&mut self, config: &CaptureConfig) -> Result<(), String> {
        log::info!(
            "Starting DXGI capture: {}x{} @ {}fps",
            config.source.width, config.source.height, config.fps
        );

        self.width = config.source.width;
        self.height = config.source.height;

        // TODO: ফেজ ২ — সম্পূর্ণ DXGI Desktop Duplication ইনিশিয়ালাইজ
        //
        // ধাপসমূহ:
        // 1. D3D11CreateDevice() দিয়ে Direct3D 11 ডিভাইস তৈরি
        // 2. IDXGIDevice -> IDXGIAdapter -> IDXGIOutput পেতে হবে
        // 3. IDXGIOutput1::DuplicateOutput() দিয়ে ডুপ্লিকেশন তৈরি
        // 4. ফ্রেম টেক্সচার staging texture-এ কপি করো
        //
        // এতে GPU থেকে সরাসরি ফ্রেম পাওয়া যায় — zero-copy!

        self.active = true;
        Ok(())
    }

    fn grab_frame(&mut self) -> Result<VideoFrame, String> {
        if !self.active {
            return Err("Capture not started".into());
        }

        self.frame_count += 1;

        // TODO: ফেজ ২ — আসল DXGI ফ্রেম ক্যাপচার ইমপ্লিমেন্ট করো
        //
        // ধাপসমূহ:
        // 1. AcquireNextFrame() দিয়ে পরবর্তী ফ্রেম পাও
        // 2. GetDesc() দিয়ে ফ্রেম ডাইমেনশন নাও
        // 3. staging texture এ CopyResource() করো
        // 4. Map() দিয়ে CPU-accessible pixel data পাও
        // 5. VideoFrame struct এ data কপি করো
        // 6. Unmap() এবং ReleaseFrame() করো

        let data_size = (self.width * self.height * 4) as usize;
        let data = vec![0u8; data_size]; // placeholder — কালো ফ্রেম

        Ok(VideoFrame {
            data,
            width: self.width,
            height: self.height,
            timestamp_ns: self.frame_count * (1_000_000_000 / 30),
            stride: self.width * 4,
        })
    }

    fn stop(&mut self) -> Result<(), String> {
        log::info!("Stopping DXGI capture after {} frames", self.frame_count);
        self.active = false;
        self.frame_count = 0;
        // TODO: DXGI resources release করো
        Ok(())
    }

    fn is_active(&self) -> bool {
        self.active
    }
}
