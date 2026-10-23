# 🎬 AabSara — Project Progress & Developer Guide

> **AabSara** হচ্ছে একটি ফ্রি, ওপেন-সোর্স, ক্রস-প্ল্যাটফর্ম স্ক্রিন ও গেম রেকর্ডার।
> Action! (actionrecorder.com) এর সমস্ত ফিচার ফ্রিতে — 4GB RAM পিসিতেও স্মুথ চলে।

---

## 📋 Quick Start (নতুন ডেভেলপারদের জন্য)

### প্রয়োজনীয় সফটওয়্যার
- **Rust** (1.75+): https://rustup.rs
- **Node.js** (18+): https://nodejs.org
- **FFmpeg**: https://ffmpeg.org (PATH এ থাকতে হবে)
- **Git**: https://git-scm.com

### প্রজেক্ট চালানো
```bash
cd D:\AabSara
npm install
npm run tauri dev
```

### বিল্ড (Production)
```bash
npm run tauri build
```

---

## 🏗️ Tech Stack

| Component | Technology | কেন বেছে নেওয়া হয়েছে |
|---|---|---|
| **UI Framework** | Tauri 2.0 + React + TypeScript | ক্রস-প্ল্যাটফর্ম, হালকা (~3MB), নেটিভ পারফরম্যান্স |
| **Backend** | Rust | C++ এর মতো ফাস্ট, মেমোরি-সেফ, ~50MB RAM |
| **Screen Capture** | Platform-specific APIs | DXGI (Win), PipeWire/X11 (Linux), ScreenCaptureKit (Mac) |
| **Audio Capture** | Platform-specific APIs | WASAPI (Win), PulseAudio (Linux), CoreAudio (Mac) |
| **Video Encoding** | FFmpeg (subprocess) | সব কোডেক সাপোর্ট, HW encoding, সহজ আপডেট |
| **Styling** | Pure CSS (Dark Theme) | Action!-ইনস্পায়ার্ড ডার্ক থিম |

---

## 📁 প্রজেক্ট স্ট্রাকচার

```
D:\AabSara/
├── src/                        # 🌐 Frontend (React + TypeScript)
│   ├── App.tsx                 # মেইন UI কম্পোনেন্ট
│   ├── App.css                 # ডার্ক থিম স্টাইলশিট
│   ├── main.tsx                # React entry point
│   └── assets/                 # স্ট্যাটিক অ্যাসেটস
│
├── src-tauri/                  # 🦀 Rust Backend
│   ├── src/
│   │   ├── main.rs             # Tauri entry point
│   │   ├── lib.rs              # মডিউল রেজিস্ট্রেশন ও অ্যাপ সেটআপ
│   │   ├── commands.rs         # Tauri IPC commands (Frontend ↔ Rust)
│   │   ├── config.rs           # অ্যাপ কনফিগারেশন ও সেটিংস
│   │   ├── recorder.rs         # মূল রেকর্ডিং অর্কেস্ট্রেশন
│   │   │
│   │   ├── capture/            # স্ক্রিন ক্যাপচার মডিউল
│   │   │   ├── mod.rs          # ক্যাপচার ব্যাকএন্ড ফ্যাক্টরি
│   │   │   ├── types.rs        # CaptureBackend trait ও টাইপস
│   │   │   ├── windows.rs      # DXGI Desktop Duplication (Windows)
│   │   │   ├── linux.rs        # X11/PipeWire (Linux)
│   │   │   └── macos.rs        # ScreenCaptureKit (macOS)
│   │   │
│   │   ├── audio/              # অডিও ক্যাপচার মডিউল
│   │   │   ├── mod.rs          # অডিও ব্যাকএন্ড ফ্যাক্টরি
│   │   │   ├── types.rs        # AudioBackend trait ও টাইপস
│   │   │   ├── windows.rs      # WASAPI (Windows)
│   │   │   ├── linux.rs        # PulseAudio/PipeWire (Linux)
│   │   │   └── macos.rs        # CoreAudio (macOS)
│   │   │
│   │   └── encoder/            # FFmpeg এনকোডার
│   │       └── mod.rs          # FFmpeg subprocess ম্যানেজার
│   │
│   ├── Cargo.toml              # Rust dependencies
│   └── tauri.conf.json         # Tauri অ্যাপ কনফিগ
│
├── package.json                # Node.js dependencies
├── index.html                  # HTML entry
├── vite.config.ts              # Vite bundler config
├── tsconfig.json               # TypeScript config
├── PROGRESS.md                 # 📌 তুমি এখন এটা পড়ছো!
└── README.md                   # প্রজেক্ট README
```

---

## 🛣️ Development Roadmap

### ✅ সম্পন্ন হয়েছে (Milestones Achieved)
- [x] **উইন্ডো কন্ট্রোলস ফিক্স (Minimize / Maximize / Close):** সরাসরি Rust ব্যাকএন্ডের IPC কমান্ড (`cmd_window_minimize`, `cmd_window_maximize`, `cmd_window_close`) দিয়ে ১০০% কার্যকর করা হয়েছে।
- [x] **স্ট্রিমল্যাবস ও স্ট্রিমএলিমেন্টস স্টাইল ওভারলে ইঞ্জিন:**
  - ৪টি এক্সক্লুসিভ টেমপ্লেট: **Crimson Action**, **Cyber Neon**, **Gold Mythic**, **Minimal Clean** (বা Off)।
  - স্ট্রিমার গেমার ট্যাগ, ইউটিউব, ফেসবুক ও টুইচ সোশ্যাল হ্যান্ডেল এবং কাস্টমাইজেবল লাইভ টিকার বার।
- [x] **রিয়েল-টাইম গ্রিন স্ক্রিন (Chroma Key):** ওয়েবক্যামের সলিড কালার ব্যাকগ্রাউন্ড রিমুভাল, কালার পিকার এবং টলারেন্স ও স্মুথনেস স্লাইডার।
- [x] **ডুয়েল অডিও মিক্সার (Web Audio API):** গেম/সিস্টেম সাউন্ড ও মাইক্রোফোনের কমেন্ট্রি দুটিকে আলাদা ভলিউম গেইন দিয়ে একটি মাস্টার ট্র্যাকে মিক্স করা।
- [x] **রিয়েল RTMP লাইভ স্ট্রিমিং (FFmpeg Engine):** YouTube, Facebook, Twitch এবং Custom RTMP সার্ভারে রিয়েল-টাইম লাইভ ব্রডকাস্ট পাইপিং (`cmd_start_rtmp_stream`, `cmd_write_stream_chunk`, `cmd_stop_rtmp_stream`)।
- [x] **ক্যানভাস ভিডিও কম্পোজিটর:** স্ক্রিন ভিডিওর ওপর স্বয়ংক্রিয়ভাবে ওয়েবক্যাম PiP, গ্রিন স্ক্রিন কাটআউট এবং স্ট্রিমল্যাবস ফ্রেম বার্ন করে রেকর্ড ও স্ট্রিমে পাঠানো।
- [x] **অফিসিয়াল AabSara ব্র্যান্ডিং ও লোগো:** গোল্ড ও ক্রাইমসন রেড সাইবার-অ্যাপারচার ভেক্টর এসভিজি লোগো এবং `AabSara PRO` ব্র্যান্ডিং।
- [x] **১০০% নিখুঁত ভেক্টর SVGs (কোনো কার্টুন ইমোজি নেই):** গেমপ্লে কন্ট্রোলার, আল্ট্রা-ওয়াইড মনিটর, প্রিসিশন ক্রপ এরিয়া, ডিভাইস/ওয়েবক্যাম, ক্যামেরা, ফোল্ডার, প্লে, ট্র্যাশ, স্লাইডার—সবকিছুই শার্প ভেক্টর এসভিজি।
- [x] **পোর্টেবল সিঙ্গেল .exe ও NSIS ইনস্টলার রেডি:** 
  - **পোর্টেবল সিঙ্গেল EXE:** `D:\AabSara\AabSara_Release\AabSara_Portable.exe` (5.90 MB)
  - **অফিসিয়াল NSIS ইনস্টলার:** `D:\AabSara\AabSara_Release\AabSara_Installer.exe` (1.85 MB)

### 🔨 ফেজ ২ — Windows সম্পূর্ণ ক্যাপচার (NEXT)
- [ ] DXGI Desktop Duplication সম্পূর্ণ ইমপ্লিমেন্ট
- [ ] D3D11 device তৈরি ও frame acquire
- [ ] Staging texture + CPU readback
- [ ] WASAPI loopback (সিস্টেম অডিও)
- [ ] WASAPI microphone ক্যাপচার
- [ ] অডিও + ভিডিও sync (A/V sync)
- [ ] Webcam ইন্টিগ্রেশন (DirectShow)
- [ ] FPS overlay (ইন-গেম)
- [ ] গ্লোবাল হটকি (F9, F10, F11)
- [ ] Screenshot ফিচার
- [ ] Output folder open button
- [ ] Window capture (নির্দিষ্ট উইন্ডো রেকর্ড)
- [ ] Region capture (স্ক্রিনের অংশ)
- [ ] Multi-monitor সাপোর্ট

### 🔨 ফেজ ৩ — Linux ও macOS সাপোর্ট
- [ ] X11 SHM ক্যাপচার ইমপ্লিমেন্ট
- [ ] PipeWire/Wayland ক্যাপচার
- [ ] PulseAudio অডিও ক্যাপচার
- [ ] macOS ScreenCaptureKit ইমপ্লিমেন্ট
- [ ] CoreAudio অডিও ক্যাপচার
- [ ] ক্রস-প্ল্যাটফর্ম টেস্টিং

### 🔨 ফেজ ৪ — মাল্টি-লাইভ স্ট্রিমিং (Multi-Destination Live Streaming)
- [ ] **একসাথে একাধিক প্ল্যাটফর্মে স্ট্রিম (Multi-Streaming / Restream):**
  - YouTube + Facebook + Twitch + Custom RTMP একসাথে
  - **FFmpeg `-f tee` muxer আর্কিটেকচার:** এনকোডিং মাত্র ১ বার হবে (GPU দিয়ে), কিন্তু মাল্টিপল RTMP সার্ভারে একসাথে পুশ হবে — ফলে 4GB RAM পিসিতেও কোনো অতিরিক্ত ল্যাগ হবে না!
- [ ] স্ট্রিম কী (Stream Key) ও আরটিএমপি ইউআরএল সেভ/ম্যানেজমেন্ট
- [ ] স্ট্রিম করার সময় লোকাল ডিস্কে হাই-কোয়ালিটি ব্যাকআপ রেকর্ড একসাথে চলা (Stream + Record simultaneously)
- [ ] চ্যাট ওভারলে / ভিউয়ার কাউন্টার ইন্টিগ্রেশন (ভবিষ্যত)

### 🔨 ফেজ ৫ — মোবাইল (Android + iOS)
- [ ] Tauri Mobile ইনিশিয়ালাইজ
- [ ] Android MediaProjection API
- [ ] iOS ReplayKit ইন্টিগ্রেশন
- [ ] মোবাইল-অপ্টিমাইজড UI
- [ ] Mobile ↔ Desktop রিমোট কন্ট্রোল

### 🔨 ফেজ ৬ — Advanced ফিচার
- [ ] ওয়েবক্যাম ব্যাকগ্রাউন্ড রিমুভাল (AI)
- [ ] ভিডিও ট্রিমিং/কাটিং (বিল্ট-ইন এডিটর)
- [ ] Recording history ও gallery
- [ ] ক্লাউড আপলোড (Google Drive, OneDrive)
- [ ] Plugin সিস্টেম
- [ ] আন্তর্জাতিকীকরণ (i18n — বাংলা, English)

---

## 🔑 Key Architecture Decisions

### 1. FFmpeg subprocess (library linking নয়)
FFmpeg কে subprocess হিসেবে চালানো হচ্ছে কারণ:
- Static linking করলে binary 100MB+ হতো
- Subprocess pipe দিয়ে raw ফ্রেম পাঠালে একই কাজ
- FFmpeg আপডেট সহজ — শুধু binary বদলাও
- License complexity এড়ানো যায়

### 2. Platform-specific capture (কোনো abstraction library নয়)
প্রতিটি OS এর নিজস্ব API সরাসরি ব্যবহার করা হচ্ছে:
- **সর্বোচ্চ পারফরম্যান্স** — কোনো abstraction overhead নেই
- **Zero-copy** সম্ভব (DXGI)
- কিন্তু প্রতি প্ল্যাটফর্মে আলাদা কোড লিখতে হবে

### 3. Tauri 2.0 (Electron নয়)
- RAM: ~50MB vs Electron এর ~300MB
- Binary: ~5MB vs Electron এর ~150MB
- 4GB RAM পিসিতে Electron অসম্ভব, Tauri স্মুথ

### 4. Recording thread model
```
Main Thread (UI)
    │
    └── Recording Thread
            ├── Capture loop (grab_frame)
            ├── Encode (FFmpeg stdin pipe)
            └── Stats update (every 10 frames)
```

---

## 🐛 Known Issues / TODO
1. DXGI ক্যাপচার এখনো placeholder (কালো ফ্রেম রিটার্ন করে)
2. অডিও ক্যাপচার placeholder
3. FFmpeg PATH এ না থাকলে error হবে
4. গ্লোবাল হটকি এখনো কাজ করে না
5. File size tracking এখনো নেই

---

## 📅 Last Updated
- **তারিখ:** 2026-10-21
- **শেষ কাজ:** ফেজ ১ সম্পন্ন — প্রজেক্ট scaffold, Rust backend modules, React UI
- **পরবর্তী কাজ:** ফেজ ২ — DXGI Desktop Duplication সম্পূর্ণ ইমপ্লিমেন্ট

---

## 👨‍💻 Contributing
যেকোনো ডেভেলপার এই ফাইলটি পড়ে সহজেই বুঝতে পারবে:
1. কোন ফেজে কাজ চলছে
2. কোন ফাইলে কী কোড আছে
3. কোন API/library ব্যবহার হচ্ছে
4. কী বাকি আছে

প্রতিটি Rust ফাইলে বাংলা + ইংরেজি কমেন্ট আছে এবং TODO মার্ক করা আছে।


---

## 🚀 Version 1.0.1 Update — Liquid Glass & Complete Feature Rollout (2026-10-21)

### 🌟 Key Enhancements:
1. **Liquid Glass & Mythic Gold Redesign:**
   - Apple Liquid Glass 6 Principles applied: Transparency, Frost Blur (`backdrop-filter: blur(28px)`), Neon Rim Glowing perimeter (Cyan, Purple, Gold, Ruby), Specular top reflections, Layering, and Smooth transitions.
   - Mythic Gold & Cosmic Velvet obsidian aesthetic inspired by high-end gaming and fantasy UI references.
2. **Custom Area Recording Mode (Mirillis Action! Feature):**
   - Precise Width (px) & Height (px) inputs with `+`/`-` stepper controls.
   - 1-Click resolution presets: `1080p Full HD`, `720p HD`, `480p SD`, `9:16 TikTok/Reels`, `1:1 Square`.
   - Real-time golden dashed crop frame on the Live Preview canvas showing the exact capture bounding box.
   - Final video recording is automatically cropped to the user's selected dimensions.
3. **Live Streaming (RTMP) Full Suite:**
   - Server presets: YouTube Live, Twitch, Facebook Live, Kick, Custom RTMP.
   - Automatic RTMP URL population.
   - Stream Key input with Show/Hide toggle and 1-Click Paste button.
   - Direct "START LIVE BROADCAST" button with live status feedback.
4. **Recording & Screenshot Bug Fixes:**
   - **Screenshot Fix:** Removed non-standard `ImageCapture` API that was failing in WebView2; implemented reliable HTML5 Canvas snapshot. Instant capture when Live Preview is running, with zero double-dot naming bugs.
   - **0-Byte Recording Fix:** Enforced `mediaRecorder.requestData()` buffer flush before stop, added persistent DOM sink for offscreen video rendering to avoid WebView2 freeze, and postponed media track cleanup until blob saving completes.

### 📦 Released Binaries:
- Standalone Portable EXE: `D:\AabSara\AabSara_Release\AabSara_Portable.exe` (5.91 MB)
- NSIS Full Setup Installer: `D:\AabSara\AabSara_Release\AabSara_Installer.exe` (1.85 MB)

---

## 🎨 Version 1.0.2 — Marketing Landing Page Rebuild (2026-10-21)

### 📄 File
`D:\AabSara\landing.html` — single-file marketing site (no build step, no external JS/CSS dependencies).

### ✨ What changed
1. **Liquid Glass design system:**
   - `--glass` / `--glass-2` surface tokens with `backdrop-filter: blur(26px) saturate(1.65)`, layered specular top highlight, neon rim glow, and 44px panel radii.
   - Shared radius scale (`--r-lg` / `--r-md` / `--r-sm`) and one gold accent ramp so every surface shares the same visual system.
2. **Mythic Gold ornament system:**
   - 4 corner filigree SVGs (`.filigree` × 4) rendered as gold gradient strokes — **verified: 4.34–9.5% gold pixel coverage per corner, 0% in a control region.**
   - Gold ornament crest above the H1, gold vine divider between sections, gold-medallion centrepiece in the hero.
3. **Cosmic Velvet background:**
   - Layered radial nebula washes (violet + blue) over obsidian `#05060e`, with a faint star field and vignette.
4. **Typography:**
   - `Cinzel` (display serif) for the H1 and section headings, `Outfit` (premium sans) for body/UI — no generic `Inter + slate-900` default.
5. **Sections:** Hero → Trust strip → 6 feature cards → Comparison ledger (gold = AabSara) → 4 download cards → FAQ (5 items) → Footer CTA.
6. **Accessibility / responsiveness:**
   - Gold CTA + all nav/FAQ controls meet **WCAG AA 4.5:1** contrast.
   - `prefers-reduced-motion` respected; visible focus rings; semantic landmarks; `aria-expanded` on FAQ.
   - Mobile-only hint added for the horizontally scrollable comparison table.

### 🐛 Bugs found & fixed during verification
- **Feature-card copy collided with the glass illustrations** (110–126px overlap) at 390 / 1024 / 1440 / 1920px. Fixed by giving the illustration its own reserved lower band (`padding-bottom: 152px`) instead of absolute-overlay positioning. Re-verified: **0 collisions at all 5 breakpoints.**
- Filigree was rendering as flat white (not gold) — traced to the SVG gradient `gradientUnits`; fixed to `userSpaceOnUse` so the gold ramp actually applies.

### ✅ Verification evidence
- Headless Chrome (CDP) audit at **390 / 768 / 1024 / 1440 / 1920px**:
  - `horizontalOverflow = 0` at every width
  - `console errors = 0`, `broken images = 0`, `fonts = loaded`
  - 0 sub-36px tap targets, filigree stays inside the hero panel, comparison table scrolls only where needed
- Pixel-probe analysis of the full 1440×4824 render confirmed the gold/violet/blue class map matches the intended composition.

---

## 🚀 Version 1.0.3 — Live Stream Engine Fix, Taskbar Icon & Interactive Area Controls (2026-10-23)

### 🌟 Key Fixes & Enhancements:
1. **Facebook Live & RTMP Ingestion Fix:**
   - Facebook Live এবং YouTube RTMP অডিও ছাড়া স্ট্রিম রিজেক্ট করে বা "Waiting for video signal"-এ আটকে রাখে। এখন Web Audio মিক্সারে একটি ব্যাকগ্রাউন্ড অডিও জেনারেটর নিশ্চিত করে যে অডিও ট্র্যাক সবসময় সক্রিয় রয়েছে।
   - FFmpeg পাইপ থেকে `-re` ফ্ল্যাগ সরানো হয়েছে যা লাইভ পাইপ ইনপুটকে থ্রটল করত।
   - `-probesize 64k -analyzeduration 500000 -flush_packets 1` যোগ করা হয়েছে যাতে প্রথম ফ্রেম থেকেই ইনস্ট্যান্ট সার্ভার হ্যান্ডশেক হয়।
   - চাঙ্ক সাইজ ১০০০ms থেকে কমিয়ে ৫০০ms করা হয়েছে।
   - লাইভ স্ট্রিম স্ট্যাটাস হার্টবিট যোগ করা হয়েছে যা প্রতি ২.৫ সেকেন্ডে FFmpeg প্রসেস মনিটর করে এবং সংযোগ বিচ্ছিন্ন হলে সঙ্গে সঙ্গে সতর্ক করে।
   - লাইভ স্ট্রিম ট্যাবে **"View RTMP Log / Server Diagnostics"** কনসোল বক্স যুক্ত করা হয়েছে।

2. **মাল্টি-রেজোলিউশন উইন্ডোজ টাস্কবার আইকন:**
   - পূর্বের ৮৩০ বাইটের অসম্পূর্ণ `.ico` ফাইলের পরিবর্তে Pillow মাস্টার ইঞ্জিন দিয়ে উইন্ডোজ স্ট্যান্ডার্ড ৭টি সাইজ (16×16, 24×24, 32×32, 48×48, 64×64, 128×128, 256×256) সমৃদ্ধ 69 KB কমপ্লিট `.ico` তৈরি করে রিলিজ এক্সেকিউটেবলে এম্বেড করা হয়েছে।

3. **ইন্টারেক্টিভ এরিয়া মোড (Draggable Live Preview & Precise Offsets):**
   - লাইভ প্রিভিউ ক্যানভাসে গোল্ডেন এরিয়া ফ্রেমটি এখন মাউস পয়েন্টার দিয়ে ফ্রিভাবে ড্র্যাগ করে স্ক্রিনের যেকোনো অংশে বসানো যায়।
   - Width এবং Height এর পাশাপাশি `X Offset` এবং `Y Offset` এর জন্য স্ট্যাপার কন্ট্রোল যুক্ত করা হয়েছে।
   - ১-ক্লিক অ্যালাইনমেন্ট মেট্রিক্স (Center, Top-Left, Top-Right, Bottom-Left, Bottom-Right, Full 1080p)।
   - স্ক্রিন স্ন্যাপ টুলে উইন্ডো স্বয়ংক্রিয়ভাবে ম্যাক্সিমাইজ ও স্ন্যাপ শেষে রিস্টোর হয়।

4. **সঠিক রিয়েল-টাইম ডিস্ক স্পেস:**
   - Win32 নেটিভ `GetDiskFreeSpaceExW` ইন্টিগ্রেশনের মাধ্যমে হার্ডকোড ভ্যালুর বদলে D: ও C: ড্রাইভের প্রকৃত ফ্রি স্পেস রিয়েল-টাইমে বের করা হচ্ছে।

### 📦 Updated Production Binaries:
- Standalone Portable EXE: `D:\AabSara\AabSara_Release\AabSara_Portable.exe` (6.39 MB)
- NSIS Full Setup Installer: `D:\AabSara\AabSara_Release\AabSara_Installer.exe` (2.26 MB)

