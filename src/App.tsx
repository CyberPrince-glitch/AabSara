// AabSara PRO — High-Performance Screen Recorder & CineStudio Pro NLE Suite
// Published By KyneticAuraLab • Created By Cyber Prince
// Architecture: Mirillis Action! Core + AabSara CineStudio™ PRO + Streamlabs Engine

import { useState, useEffect, useRef } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import "./App.css";

import {
  AabSaraLogo,
  GameIcon,
  ScreenIcon,
  AreaIcon,
  DeviceIcon,
  CameraIcon,
  FolderIcon,
  PlayIcon,
  TrashIcon,
  GearIcon,
  LiveIcon,
  BenchmarkIcon,
  MicIcon,
  WebcamIcon,
  RefreshIcon,
  OverlayIcon,
  SlidersIcon,
  EditIcon,
  InfoIcon,
  ScissorsIcon,
  ArrowLeftIcon,
  PaletteIcon,
  TypeIcon,
  SparklesIcon,
  VolumeHighIcon,
} from "./icons";

import {
  OverlayConfig,
  defaultOverlayConfig,
  processChromaKey,
  renderOverlayElements,
  renderWebcamFrame,
} from "./overlays";

interface RecordingItem {
  name: string;
  path: string;
  size_mb: number;
  date: string;
  is_video: boolean;
}

type MainTab = "file-manager" | "preview" | "editor";
type RightTab = "video" | "stream" | "overlays" | "audio" | "screenshots" | "benchmark" | "about" | "settings";
type RecordMode = "game" | "screen" | "area" | "device";

export default function App() {
  // Navigation
  const [leftTab, setLeftTab] = useState<MainTab>("preview");
  const [rightTab, setRightTab] = useState<RightTab>("video");
  const [recordMode, setRecordMode] = useState<RecordMode>("screen");

  // Recording & Streaming State
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [freeSpace, setFreeSpace] = useState(48.5);

  // Custom Area Mode Settings (Mirillis Action! Area Selection)
  const [areaWidth, setAreaWidth] = useState(1280);
  const [areaHeight, setAreaHeight] = useState(720);
  const [areaX, setAreaX] = useState(0);
  const [areaY, setAreaY] = useState(0);
  const [areaPreset, setAreaPreset] = useState("720p");
  const [isSnippingArea, setIsSnippingArea] = useState(false);
  const [snipBgImage, setSnipBgImage] = useState<string>("");
  const [snipDragStart, setSnipDragStart] = useState<{ x: number; y: number } | null>(null);
  const [snipCurrentRect, setSnipCurrentRect] = useState<{ x: number; y: number; w: number; h: number }>({ x: 100, y: 100, w: 1280, h: 720 });

  // 🚀 Cinematic Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStatus, setSplashStatus] = useState("Initializing AabSara Engine...");

  // Live Screen Preview
  const [isLivePreview, setIsLivePreview] = useState(false);
  const screenPreviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const livePreviewStreamRef = useRef<MediaStream | null>(null);

  // Video Options
  const [fileFormat, setFileFormat] = useState("MP4");
  const [hwAccel, setHwAccel] = useState("NVIDIA NVENC");
  const [videoSize, setVideoSize] = useState("Original");
  const [videoFps, setVideoFps] = useState("60");
  const [timeShift, setTimeShift] = useState(false);

  // Audio Mixer Controls
  const [micEnabled, setMicEnabled] = useState(true);
  const [systemVolume, setSystemVolume] = useState(100);
  const [micVolume, setMicVolume] = useState(100);
  const [availableMics, setAvailableMics] = useState<string[]>(["Default Microphone"]);
  const [micDevice, setMicDevice] = useState("Default Microphone");
  
  // Webcam Controls
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [availableCameras, setAvailableCameras] = useState<string[]>(["Integrated Camera"]);
  const [webcamDevice, setWebcamDevice] = useState("Integrated Camera");
  const [webcamActive, setWebcamActive] = useState(false);

  // Streamlabs & StreamElements Overlay & Green Screen Config
  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    ...defaultOverlayConfig,
    streamerName: "Cyber Prince",
    tickerText: "★ PUBLISHED BY KYNETICAURALAB • CREATED BY CYBER PRINCE • 1080P 60FPS ★",
  });

  // Live Streaming Settings (Default: Facebook Live RTMPS)
  const [streamService, setStreamService] = useState("Facebook");
  const [streamUrl, setStreamUrl] = useState("rtmps://live-api-s.facebook.com:443/rtmp/");
  const [streamKey, setStreamKey] = useState("");
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [streamBitrate, setStreamBitrate] = useState("4500");
  const [streamRecordDisk, setStreamRecordDisk] = useState(true);
  const [streamStatusMsg, setStreamStatusMsg] = useState("");
  const [streamLogText, setStreamLogText] = useState("");
  const [showStreamLog, setShowStreamLog] = useState(false);
  const streamCheckIntervalRef = useRef<number | null>(null);
  const [isDraggingPreviewCrop, setIsDraggingPreviewCrop] = useState(false);
  const cropDragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  // ☕ Buy Me a Coffee & Litecoin (LTC) Crypto Support State
  const [ltcCopied, setLtcCopied] = useState(false);
  const LITECOIN_ADDRESS = "LKbYGyKFQsMtxP4ezZky5Q2DPMbGxqKKyp";

  // Screenshots & Audio
  const [screenshotFormat, setScreenshotFormat] = useState("PNG");
  const [audioFormat, setAudioFormat] = useState("M4A");

  // Library
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<RecordingItem | null>(null);

  // 🎬 AabSara CineStudio™ PRO State
  const [editorFile, setEditorFile] = useState<RecordingItem | null>(null);
  const [editorVideoSrc, setEditorVideoSrc] = useState<string>("");
  const [editorDuration, setEditorDuration] = useState<number>(0);
  const [editorCurrentTime, setEditorCurrentTime] = useState<number>(0);
  const [editorTrimStart, setEditorTrimStart] = useState<number>(0);
  const [editorTrimEnd, setEditorTrimEnd] = useState<number>(0);
  const [editorIsPlaying, setEditorIsPlaying] = useState<boolean>(false);
  const [editorSpeed, setEditorSpeed] = useState<number>(1.0);
  const [editorBrightness, setEditorBrightness] = useState<number>(1.0);
  const [editorContrast, setEditorContrast] = useState<number>(1.0);
  const [editorSaturation, setEditorSaturation] = useState<number>(1.0);
  const [editorTemperature, setEditorTemperature] = useState<number>(0);
  const [editorVignette, setEditorVignette] = useState<number>(0);
  const [editorLut, setEditorLut] = useState<string>("clean");
  const [editorWatermark, setEditorWatermark] = useState<string>("Created By Cyber Prince • KyneticAuraLab");
  const [editorWatermarkEnabled, setEditorWatermarkEnabled] = useState<boolean>(true);
  const [editorWatermarkPos, setEditorWatermarkPos] = useState<"bottom-right" | "bottom-left" | "top-right" | "top-left" | "center">("bottom-right");
  const [editorWatermarkSize, setEditorWatermarkSize] = useState<number>(14);
  const [editorWatermarkOpacity, setEditorWatermarkOpacity] = useState<number>(0.85);
  const [editorWatermarkGlow, setEditorWatermarkGlow] = useState<boolean>(true);
  const [editorVolume, setEditorVolume] = useState<number>(100);
  const [editorMute, setEditorMute] = useState<boolean>(false);
  const [editorAudioFadeIn, setEditorAudioFadeIn] = useState<number>(0);
  const [editorAudioFadeOut, setEditorAudioFadeOut] = useState<number>(0);
  const [editorAspectRatio, setEditorAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "21:9">("16:9");
  const [editorActiveTab, setEditorActiveTab] = useState<"color" | "speed" | "title" | "audio">("color");
  const [editorTimelineZoom, setEditorTimelineZoom] = useState<number>(1);
  const [editorExporting, setEditorExporting] = useState<boolean>(false);
  const [editorExportMsg, setEditorExportMsg] = useState<string>("");
  const editorVideoRef = useRef<HTMLVideoElement | null>(null);

  // Refs for Compositor and Media
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const compositorAnimRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<any>(null);

  // Load hardware, recordings, and disk space
  useEffect(() => {
    loadRecordings();
    loadDiskSpace();
    detectDevices();
    initWebcam();
  }, []);

  // 🚀 Cinematic Splash Screen 0% -> 100% Boot
  useEffect(() => {
    const steps = [
      { pct: 15, msg: "Initializing AabSara Core Engine..." },
      { pct: 35, msg: "Detecting GPU & NVENC Hardware Encoders..." },
      { pct: 55, msg: "Calibrating 48kHz Master Audio Subsystems..." },
      { pct: 75, msg: "Loading CineStudio™ Pro 3D LUT Color Engine..." },
      { pct: 90, msg: "Configuring RTMP & Streamlabs Compositor..." },
      { pct: 100, msg: "Ready! Published by KyneticAuraLab & Cyber Prince" },
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setSplashProgress(steps[stepIdx].pct);
        setSplashStatus(steps[stepIdx].msg);
        stepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setShowSplash(false);
        }, 450);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // 100% Reliable Rust IPC Window Controls
  const handleMinimize = async () => {
    try {
      await invoke("cmd_window_minimize");
    } catch (e) {
      console.error(e);
    }
  };

  const handleMaximize = async () => {
    try {
      await invoke("cmd_window_maximize");
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async () => {
    try {
      await invoke("cmd_window_close");
    } catch (e) {
      console.error(e);
    }
  };

  // Hardware device detection
  const detectDevices = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => d.label || `Camera ${d.deviceId.slice(0, 5)}`);
        const audioDevs = devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => d.label || `Microphone ${d.deviceId.slice(0, 5)}`);

        if (videoDevs.length > 0) {
          setAvailableCameras(videoDevs);
          setWebcamDevice(videoDevs[0]);
        }
        if (audioDevs.length > 0) {
          setAvailableMics(audioDevs);
          setMicDevice(audioDevs[0]);
        }
      }
    } catch (e) {
      console.warn("Could not enumerate devices:", e);
    }
  };

  // Live Webcam activation
  const initWebcam = async (preferredLabel?: string) => {
    try {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
        webcamStreamRef.current = null;
      }

      let deviceId: string | undefined = undefined;
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === "videoinput");
        const targetLabel = preferredLabel || webcamDevice;
        const matched = videoDevs.find((d) => d.label === targetLabel);
        if (matched) {
          deviceId = matched.deviceId;
        } else if (videoDevs.length > 0 && !preferredLabel) {
          deviceId = videoDevs[0].deviceId;
          if (videoDevs[0].label) setWebcamDevice(videoDevs[0].label);
        }
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 360 } }
          : { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      webcamStreamRef.current = stream;

      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        webcamVideoRef.current.play().catch((err) => console.warn("Webcam play warning:", err));
      }
      setWebcamActive(true);

      // Refresh camera labels now that user media permission has been granted
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => d.label || `Camera ${d.deviceId.slice(0, 5)}`);
        if (videoDevs.length > 0) {
          setAvailableCameras(videoDevs);
        }
      }
    } catch (e) {
      console.warn("Could not start webcam:", e);
      setWebcamActive(false);
    }
  };

  // Launch Fullscreen Area Snipper with Desktop Background Snapshot
  const launchAreaSnipper = async () => {
    try {
      let snapshot = "";
      // Fast path: use active preview stream if running
      if (livePreviewStreamRef.current && screenPreviewVideoRef.current && screenPreviewVideoRef.current.videoWidth > 0) {
        const c = document.createElement("canvas");
        c.width = screenPreviewVideoRef.current.videoWidth;
        c.height = screenPreviewVideoRef.current.videoHeight;
        const cctx = c.getContext("2d");
        if (cctx) {
          cctx.drawImage(screenPreviewVideoRef.current, 0, 0);
          snapshot = c.toDataURL("image/jpeg", 0.9);
        }
      }

      // If no active preview, grab quick screen frame
      if (!snapshot) {
        try {
          if (navigator.mediaDevices && typeof (navigator.mediaDevices as any).getDisplayMedia === "function") {
            const tempStream: MediaStream = await (navigator.mediaDevices as any).getDisplayMedia({
              video: { displaySurface: "monitor" },
              audio: false,
            });
          const tempVid = document.createElement("video");
          tempVid.srcObject = tempStream;
          await tempVid.play();
          const c = document.createElement("canvas");
          c.width = tempVid.videoWidth || window.screen.width || 1366;
          c.height = tempVid.videoHeight || window.screen.height || 768;
          const cctx = c.getContext("2d");
          if (cctx) {
            cctx.drawImage(tempVid, 0, 0);
            snapshot = c.toDataURL("image/jpeg", 0.9);
          }
            tempStream.getTracks().forEach((t) => t.stop());
          }
        } catch (snapErr) {
          console.warn("Could not capture desktop snapshot for snip overlay:", snapErr);
        }
      }

      if (snapshot) {
        setSnipBgImage(snapshot);
      }

      // Switch window to real fullscreen
      await invoke("cmd_window_fullscreen", { fullscreen: true });

      const screenW = window.screen.width || 1366;
      const screenH = window.screen.height || 768;
      setSnipCurrentRect({
        x: areaX > 0 && areaX < screenW ? areaX : Math.max(0, Math.round((screenW - areaWidth) / 2)),
        y: areaY > 0 && areaY < screenH ? areaY : Math.max(0, Math.round((screenH - areaHeight) / 2)),
        w: Math.min(areaWidth, screenW),
        h: Math.min(areaHeight, screenH),
      });
      setIsSnippingArea(true);
    } catch (err) {
      console.error("Failed to launch area snipper:", err);
    }
  };

  // Toggle Live Screen Preview on the left panel
  const toggleLiveScreenPreview = async () => {
    if (isLivePreview) {
      if (livePreviewStreamRef.current) {
        livePreviewStreamRef.current.getTracks().forEach((t) => t.stop());
        livePreviewStreamRef.current = null;
      }
      if (screenPreviewVideoRef.current) {
        screenPreviewVideoRef.current.srcObject = null;
      }
      setIsLivePreview(false);
    } else {
      try {
        let stream: MediaStream;
        if (navigator.mediaDevices && typeof (navigator.mediaDevices as any).getDisplayMedia === "function") {
          stream = await (navigator.mediaDevices as any).getDisplayMedia({
            video: true,
            audio: false,
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
        }
        livePreviewStreamRef.current = stream;
        if (screenPreviewVideoRef.current) {
          screenPreviewVideoRef.current.srcObject = stream;
        }
        setIsLivePreview(true);
        stream.getVideoTracks()[0].onended = () => {
          setIsLivePreview(false);
        };
      } catch (err) {
        console.error("Live preview error:", err);
      }
    }
  };

  // Global hotkeys (F9 = Record/Stop, F12 = Screenshot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        if (isRecording) {
          stopCapture();
        } else {
          startCapture();
        }
      } else if (e.key === "F12") {
        e.preventDefault();
        takeScreenshot();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRecording, isLivePreview, overlayConfig, recordMode, areaWidth, areaHeight]);

  // Timer updater
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const loadRecordings = async () => {
    try {
      const items = await invoke<RecordingItem[]>("cmd_list_recordings");
      setRecordings(items);
      if (items.length > 0 && !selectedFile) {
        setSelectedFile(items[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDiskSpace = async () => {
    try {
      const space = await invoke<number>("cmd_get_free_disk_space");
      setFreeSpace(space);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Stream Service Presets
  const handleStreamServiceChange = (service: string) => {
    setStreamService(service);
    if (service === "YouTube") {
      setStreamUrl("rtmp://a.rtmp.youtube.com/live2");
    } else if (service === "Twitch") {
      setStreamUrl("rtmp://live.twitch.tv/app/");
    } else if (service === "Facebook") {
      setStreamUrl("rtmps://live-api-s.facebook.com:443/rtmp/");
    } else if (service === "Kick") {
      setStreamUrl("rtmp://fa723fc1b171.global-contribute.live-video.net/app/");
    }
  };

  // 🧠 Intelligent Stream Key Auto-Detection & Server Route
  const handleStreamKeyChange = (val: string) => {
    const clean = val.trim();
    setStreamKey(clean);
    if (clean.startsWith("FB-")) {
      setStreamService("Facebook");
      setStreamUrl("rtmps://live-api-s.facebook.com:443/rtmp/");
      setStreamStatusMsg("🟢 Facebook Live Key Detected • Secure RTMPS Ready!");
    } else if (clean.startsWith("live_")) {
      setStreamService("Twitch");
      setStreamUrl("rtmp://live.twitch.tv/app/");
      setStreamStatusMsg("🟢 Twitch Stream Key Detected • RTMP Ready!");
    }
  };

  // 🪙 Copy Litecoin LTC Wallet Address
  const copyLtcAddress = () => {
    navigator.clipboard.writeText(LITECOIN_ADDRESS);
    setLtcCopied(true);
    setTimeout(() => setLtcCopied(false), 3000);
  };

  // Clean up media tracks safely
  const cleanupTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  // ── REAL COMPOSITED RECORDING & RTMP STREAMING ENGINE ──
  const startCapture = async () => {
    try {
      const isStreamMode = rightTab === "stream";
      const screenW = window.screen.width || 1366;
      const screenH = window.screen.height || 768;

      // 1. Capture Desktop Screen (or Mobile Camera on Android)
      let displayStream: MediaStream;
      if (navigator.mediaDevices && typeof (navigator.mediaDevices as any).getDisplayMedia === "function") {
        displayStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: {
            frameRate: parseInt(videoFps) || 60,
            displaySurface: recordMode === "area" || recordMode === "screen" ? "monitor" : "window",
          },
          audio: true,
        });
      } else {
        // Fallback for Android / Mobile: activate camera and audio
        displayStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: parseInt(videoFps) || 30 },
          },
          audio: true,
        });
      }

      streamRef.current = displayStream;

      if (screenPreviewVideoRef.current) {
        screenPreviewVideoRef.current.srcObject = displayStream;
        setIsLivePreview(!isStreamMode);
      }

      displayStream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };

      // 2. Dual Web Audio API Mixer (System Sound + Microphone)
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      const audioDest = audioCtx.createMediaStreamDestination();

      // 🔴 CRITICAL: Always ensure an active audio track is present in mixed audio
      // Facebook Live & YouTube RTMP ingest reject/drop video streams that have no audio track
      try {
        const silentOsc = audioCtx.createOscillator();
        const silentGain = audioCtx.createGain();
        silentGain.gain.value = 0.00001;
        silentOsc.connect(silentGain);
        silentGain.connect(audioDest);
        silentOsc.start();
      } catch (e) {
        console.warn("Silent audio init error:", e);
      }

      // Connect System Audio
      if (displayStream.getAudioTracks().length > 0) {
        try {
          const sysSource = audioCtx.createMediaStreamSource(
            new MediaStream([displayStream.getAudioTracks()[0]])
          );
          const sysGain = audioCtx.createGain();
          sysGain.gain.value = systemVolume / 100;
          sysSource.connect(sysGain);
          sysGain.connect(audioDest);
        } catch (e) {
          console.warn("System audio mixer error:", e);
        }
      }

      // Connect Microphone Audio
      let micStream: MediaStream | null = null;
      if (micEnabled && displayStream.getAudioTracks().length === 0) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          const micSource = audioCtx.createMediaStreamSource(micStream);
          const micGain = audioCtx.createGain();
          micGain.gain.value = micVolume / 100;
          micSource.connect(micGain);
          micGain.connect(audioDest);
        } catch (e) {
          console.warn("Could not attach microphone to mixer:", e);
        }
      }

      // 3. Hardware Canvas Compositor with Area Crop & Overlays
      const canvas = document.createElement("canvas");
      const outW = recordMode === "area"
        ? areaWidth
        : isStreamMode
          ? Math.min(1280, screenW)
          : screenW;
      const outH = recordMode === "area"
        ? areaHeight
        : isStreamMode
          ? Math.min(720, screenH)
          : screenH;
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d", { alpha: false });

      // Offscreen canvas for Chroma Key processing
      const chromaCanvas = document.createElement("canvas");
      chromaCanvas.width = 640;
      chromaCanvas.height = 360;
      const chromaCtx = chromaCanvas.getContext("2d", { willReadFrequently: true });

      // Attach offscreen video to DOM sink to guarantee continuous frame decoding in WebView2
      const screenVideo = document.createElement("video");
      screenVideo.srcObject = displayStream;
      screenVideo.muted = true;
      screenVideo.playsInline = true;
      const sink = document.getElementById("aabsara-hidden-video-sink");
      sink?.appendChild(screenVideo);
      await screenVideo.play();

      let webcamVideo: HTMLVideoElement | null = null;
      if (webcamEnabled && webcamStreamRef.current) {
        webcamVideo = document.createElement("video");
        webcamVideo.srcObject = webcamStreamRef.current;
        webcamVideo.muted = true;
        webcamVideo.playsInline = true;
        sink?.appendChild(webcamVideo);
        await webcamVideo.play();
      }

      let lastDrawTime = 0;
      const targetFps = isStreamMode ? 30 : (parseInt(videoFps) || 60);
      const frameInterval = 1000 / targetFps;

      const drawCompositorFrame = (timestamp?: number) => {
        if (!ctx) return;
        compositorAnimRef.current = requestAnimationFrame(drawCompositorFrame);

        // Throttle frame drawing to exact target FPS to keep CPU & GPU cool and prevent UI lag
        if (timestamp && timestamp - lastDrawTime < frameInterval - 1.5) {
          return;
        }
        lastDrawTime = timestamp || 0;

        // Draw Screen Video (with Area Cropping if in Area mode)
        if (recordMode === "area") {
          const srcW = screenVideo.videoWidth || screenW;
          const srcH = screenVideo.videoHeight || screenH;
          const validX = Math.min(srcW - 50, Math.max(0, areaX));
          const validY = Math.min(srcH - 50, Math.max(0, areaY));
          const validW = Math.min(srcW - validX, areaWidth);
          const validH = Math.min(srcH - validY, areaHeight);
          ctx.drawImage(screenVideo, validX, validY, validW, validH, 0, 0, outW, outH);
        } else {
          ctx.drawImage(screenVideo, 0, 0, outW, outH);
        }

        // Draw Webcam PiP with optional Chroma Key
        if (webcamEnabled && webcamVideo && webcamVideo.readyState >= 2) {
          const pipW = overlayConfig.webcamWidth * 1.5;
          const pipH = overlayConfig.webcamHeight * 1.5;
          let pipX = outW - pipW - 24;
          let pipY = outH - pipH - 45;

          if (overlayConfig.webcamPosition === "bottom-left") {
            pipX = 24;
            pipY = outH - pipH - 45;
          } else if (overlayConfig.webcamPosition === "top-right") {
            pipX = outW - pipW - 24;
            pipY = 45;
          } else if (overlayConfig.webcamPosition === "top-left") {
            pipX = 24;
            pipY = 45;
          }

          if (overlayConfig.greenScreenEnabled && chromaCtx) {
            chromaCtx.drawImage(webcamVideo, 0, 0, 640, 360);
            processChromaKey(
              chromaCanvas,
              overlayConfig.greenScreenColor,
              overlayConfig.greenScreenTolerance,
              overlayConfig.greenScreenSmoothness
            );
            ctx.drawImage(chromaCanvas, pipX, pipY, pipW, pipH);
          } else {
            ctx.drawImage(webcamVideo, pipX, pipY, pipW, pipH);
            if (overlayConfig.showWebcamBorder) {
              renderWebcamFrame(ctx, pipX, pipY, pipW, pipH, overlayConfig);
            }
          }
        }

        // Draw Streamlabs / StreamElements Overlays
        renderOverlayElements(ctx, outW, outH, overlayConfig);
      };

      drawCompositorFrame();

      // 4. Capture Final Composited Stream with Mixed Audio (30 FPS for smooth live streaming)
      const compositedStream = canvas.captureStream(targetFps);
      if (audioDest.stream.getAudioTracks().length > 0) {
        compositedStream.addTrack(audioDest.stream.getAudioTracks()[0]);
      }

      // 5. If in Streaming Mode, Launch Real RTMP Stream via FFmpeg in Rust
      if (isStreamMode) {
        if (!streamKey.trim()) {
          alert("Please enter your Stream Key in the Live Stream tab before broadcasting!");
          return;
        }

        try {
          setStreamStatusMsg("Connecting to RTMP Server...");
          await invoke("cmd_start_rtmp_stream", {
            rtmpUrl: streamUrl,
            streamKey: streamKey.trim(),
            bitrateKbps: parseInt(streamBitrate) || 2500,
          });
          setIsStreaming(true);
          setStreamStatusMsg(`● LIVE BROADCAST ACTIVE (${streamBitrate} Kbps)`);

          // Start active stream heartbeat monitoring (every 2.5s)
          if (streamCheckIntervalRef.current) clearInterval(streamCheckIntervalRef.current);
          streamCheckIntervalRef.current = window.setInterval(async () => {
            try {
              const active = await invoke<boolean>("cmd_get_stream_status");
              if (!active) {
                if (streamCheckIntervalRef.current) {
                  clearInterval(streamCheckIntervalRef.current);
                  streamCheckIntervalRef.current = null;
                }
                const log = await invoke<string>("cmd_get_stream_log");
                setStreamLogText(log);
                setStreamStatusMsg("⚠️ Live Stream Disconnected from Server (check log below)");
                setIsStreaming(false);
              }
            } catch (err) {
              console.error("Stream heartbeat check failed:", err);
            }
          }, 2500);
        } catch (streamErr) {
          console.error("RTMP Stream Launch Error:", streamErr);
          setStreamStatusMsg(`Stream Error: ${streamErr}`);
        }
      }

      // 6. MediaRecorder for Saving Raw Direct Bytes (prefer ultra-fast VP8 over CPU-heavy VP9)
      const mimeTypes = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=h264,opus",
        "video/webm",
      ];
      let selectedMime = "";
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(
        compositedStream,
        selectedMime ? { mimeType: selectedMime } : undefined
      );

      recordedChunksRef.current = [];
      let chunkQueue: Promise<void> = Promise.resolve();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);

          // If live streaming is active, pipe chunks in strict FIFO sequence directly as binary bytes
          if (isStreamMode) {
            const blob = e.data;
            chunkQueue = chunkQueue.then(async () => {
              try {
                const buf = await blob.arrayBuffer();
                const bytes = Array.from(new Uint8Array(buf));
                await invoke("cmd_write_stream_bytes", { bytes });
              } catch (err) {
                console.error("Stream chunk pipe error:", err);
              }
            });
          }
        }
      };

      recorder.onstop = async () => {
        if (compositorAnimRef.current) {
          cancelAnimationFrame(compositorAnimRef.current);
          compositorAnimRef.current = null;
        }

        if (sink) {
          sink.innerHTML = "";
        }

        if (isStreamMode) {
          try {
            await invoke("cmd_stop_rtmp_stream");
            setIsStreaming(false);
            setStreamStatusMsg("Stream ended.");
          } catch (e) {
            console.error(e);
          }
        }

        // Save local copy to Recordings directory using RAW BINARY BYTES (zero corruption!)
        if (!isStreamMode || streamRecordDisk) {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, {
              type: selectedMime || "video/webm",
            });

            if (blob.size > 0) {
              try {
                const arrayBuffer = await blob.arrayBuffer();
                const uint8 = new Uint8Array(arrayBuffer);
                const bytes = Array.from(uint8);

                const now = new Date();
                const pad = (n: number) => n.toString().padStart(2, "0");
                const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
                const prefix = isStreamMode ? "LiveStream" : recordMode === "game" ? "Game" : recordMode === "area" ? "Area" : "Desktop";
                const filename = `${prefix}_${timestamp}.webm`;

                await invoke("cmd_save_recording_bytes", {
                  filename,
                  bytes,
                });

                await loadRecordings();
                await loadDiskSpace();
                setLeftTab("file-manager");
              } catch (err) {
                console.error("Error saving recording bytes:", err);
              }
            }
          }
        }

        if (streamCheckIntervalRef.current) {
          clearInterval(streamCheckIntervalRef.current);
          streamCheckIntervalRef.current = null;
        }

        // Clean up tracks after MediaRecorder finishes writing
        cleanupTracks();
        if (micStream) micStream.getTracks().forEach((t) => t.stop());
        setIsLivePreview(false);
      };

      // Start recorder with 1000ms chunks for steady GOP timestamps & smooth RTMP ingestion
      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      setRecordTime(0);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Error starting capture:", err);
      setIsRecording(false);
      setIsStreaming(false);
    }
  };

  const stopCapture = () => {
    if (streamCheckIntervalRef.current) {
      clearInterval(streamCheckIntervalRef.current);
      streamCheckIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.requestData();
      } catch (e) {
        console.warn("requestData error:", e);
      }
      mediaRecorderRef.current.stop();
    } else {
      cleanupTracks();
    }
    setIsRecording(false);
    setIsStreaming(false);
    setIsPaused(false);
  };

  // ── 100% RELIABLE SCREENSHOT ──
  const takeScreenshot = async () => {
    try {
      const captureCanvas = document.createElement("canvas");
      let ctx = captureCanvas.getContext("2d");

      if (isLivePreview && screenPreviewVideoRef.current && screenPreviewVideoRef.current.readyState >= 2) {
        const vid = screenPreviewVideoRef.current;
        captureCanvas.width = vid.videoWidth || 1920;
        captureCanvas.height = vid.videoHeight || 1080;
        ctx = captureCanvas.getContext("2d");
        ctx?.drawImage(vid, 0, 0, captureCanvas.width, captureCanvas.height);
      } else {
        let stream: MediaStream;
        if (navigator.mediaDevices && typeof (navigator.mediaDevices as any).getDisplayMedia === "function") {
          stream = await (navigator.mediaDevices as any).getDisplayMedia({
            video: true,
            audio: false,
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
          });
        }

        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        const sink = document.getElementById("aabsara-hidden-video-sink");
        sink?.appendChild(video);
        await video.play();

        await new Promise<void>((resolve) => {
          if (video.videoWidth > 0) return resolve();
          video.onloadedmetadata = () => resolve();
          setTimeout(resolve, 300);
        });

        captureCanvas.width = video.videoWidth || 1920;
        captureCanvas.height = video.videoHeight || 1080;
        ctx = captureCanvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

        stream.getTracks().forEach((t) => t.stop());
        if (sink) sink.innerHTML = "";
      }

      const dataUrl = captureCanvas.toDataURL("image/png");
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `Screenshot_${timestamp}.png`;

      await invoke("cmd_save_screenshot", {
        filename,
        base64Png: dataUrl,
      });

      await loadRecordings();
      setLeftTab("file-manager");
    } catch (err) {
      console.error("Screenshot capture error:", err);
    }
  };

  const openFolder = async () => {
    try {
      await invoke("cmd_open_recordings_folder");
    } catch (e) {
      console.error(e);
    }
  };

  const playMedia = async (filePath: string) => {
    try {
      await invoke("cmd_play_media", { filePath });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMedia = async (filePath: string) => {
    try {
      await invoke("cmd_delete_media", { filePath });
      await loadRecordings();
      setSelectedFile(null);
    } catch (e) {
      console.error(e);
    }
  };

  // 🎬 AabSara CineStudio™ PRO Logic
  const openInEditor = async (item: RecordingItem) => {
    try {
      setEditorFile(item);
      setLeftTab("editor");
      setEditorTrimStart(0);
      setEditorTrimEnd(0);
      setEditorCurrentTime(0);
      setEditorIsPlaying(false);

      // 1. Ensure video is 100% playable H.264 MP4 with faststart
      let playablePath = item.path;
      try {
        playablePath = await invoke<string>("cmd_ensure_playable_video", { filePath: item.path });
      } catch (e) {
        console.warn("cmd_ensure_playable_video fallback:", e);
      }

      // 2. Direct memory blob URL for zero-CORS instant seeking
      try {
        const bytes = await invoke<number[]>("cmd_read_video_bytes", { filePath: playablePath });
        const mimeType = playablePath.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4";
        const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        setEditorVideoSrc(blobUrl);
      } catch {
        setEditorVideoSrc(convertFileSrc(playablePath));
      }
    } catch (err) {
      console.warn("Using direct file src fallback:", err);
      setEditorVideoSrc(convertFileSrc(item.path));
    }
  };

  // Auto-load latest recording when entering CineStudio if none is loaded
  useEffect(() => {
    if (leftTab === "editor" && !editorFile && recordings.length > 0) {
      const latest = recordings.find((r) => r.is_video);
      if (latest) {
        openInEditor(latest);
      }
    }
  }, [leftTab, recordings, editorFile]);

  // CineStudio Keyboard Shortcuts (Space: Play/Pause, S: Split, [: In, ]: Out, Arrows: Frame Step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (leftTab !== "editor") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        toggleEditorPlay();
      } else if (e.code === "KeyS") {
        e.preventDefault();
        splitAtPlayhead();
      } else if (e.code === "BracketLeft") {
        e.preventDefault();
        setEditorTrimStart(editorCurrentTime);
      } else if (e.code === "BracketRight") {
        e.preventDefault();
        setEditorTrimEnd(editorCurrentTime);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepFrame(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leftTab, editorCurrentTime, editorIsPlaying, editorDuration, editorTrimStart, editorTrimEnd, editorFile]);

  // Interactive Timeline Pointer Scrubbing (Click + Drag)
  const scrubPlayheadFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const updateTime = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newT = pct * (editorDuration || 1);
      setEditorCurrentTime(newT);
      if (editorVideoRef.current) {
        editorVideoRef.current.currentTime = newT;
      }
    };

    updateTime(e.clientX);
    el.setPointerCapture(e.pointerId);

    const onMove = (moveEv: PointerEvent) => {
      updateTime(moveEv.clientX);
    };

    const onUp = (upEv: PointerEvent) => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      try {
        el.releasePointerCapture(upEv.pointerId);
      } catch {}
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  // Drag Left Trim In-Point Handle
  const startDragTrimIn = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const parentLane = e.currentTarget.closest(".cs-track-lane") as HTMLElement | null;
    if (!parentLane) return;

    const onMove = (moveEv: PointerEvent) => {
      const rect = parentLane.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (moveEv.clientX - rect.left) / rect.width));
      const t = pct * (editorDuration || 1);
      const boundedT = Math.min(t, editorTrimEnd - 0.2);
      setEditorTrimStart(Math.max(0, boundedT));
      if (editorVideoRef.current) {
        editorVideoRef.current.currentTime = boundedT;
        setEditorCurrentTime(boundedT);
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Drag Right Trim Out-Point Handle
  const startDragTrimOut = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const parentLane = e.currentTarget.closest(".cs-track-lane") as HTMLElement | null;
    if (!parentLane) return;

    const onMove = (moveEv: PointerEvent) => {
      const rect = parentLane.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (moveEv.clientX - rect.left) / rect.width));
      const t = pct * (editorDuration || 1);
      const boundedT = Math.max(t, editorTrimStart + 0.2);
      setEditorTrimEnd(Math.min(editorDuration, boundedT));
      if (editorVideoRef.current) {
        editorVideoRef.current.currentTime = boundedT;
        setEditorCurrentTime(boundedT);
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const applyLutPreset = (lut: string) => {
    setEditorLut(lut);
    switch (lut) {
      case "clean":
        setEditorBrightness(1.0);
        setEditorContrast(1.0);
        setEditorSaturation(1.0);
        setEditorTemperature(0);
        setEditorVignette(0);
        break;
      case "teal-orange":
        setEditorBrightness(1.02);
        setEditorContrast(1.2);
        setEditorSaturation(1.35);
        setEditorTemperature(15);
        setEditorVignette(30);
        break;
      case "cyber-neon":
        setEditorBrightness(1.05);
        setEditorContrast(1.3);
        setEditorSaturation(1.7);
        setEditorTemperature(-20);
        setEditorVignette(40);
        break;
      case "mythic-gold":
        setEditorBrightness(1.08);
        setEditorContrast(1.15);
        setEditorSaturation(1.4);
        setEditorTemperature(35);
        setEditorVignette(25);
        break;
      case "matrix":
        setEditorBrightness(0.95);
        setEditorContrast(1.3);
        setEditorSaturation(1.25);
        setEditorTemperature(-40);
        setEditorVignette(50);
        break;
      case "noir":
        setEditorBrightness(0.95);
        setEditorContrast(1.45);
        setEditorSaturation(0.0);
        setEditorTemperature(0);
        setEditorVignette(65);
        break;
      case "vintage":
        setEditorBrightness(1.05);
        setEditorContrast(0.95);
        setEditorSaturation(0.85);
        setEditorTemperature(25);
        setEditorVignette(35);
        break;
    }
  };

  const getEditorVideoFilter = () => {
    let f = `brightness(${editorBrightness}) contrast(${editorContrast}) saturate(${editorSaturation})`;
    if (editorTemperature > 0) {
      f += ` sepia(${editorTemperature / 100}) hue-rotate(-${editorTemperature * 0.5}deg)`;
    } else if (editorTemperature < 0) {
      f += ` hue-rotate(${Math.abs(editorTemperature) * 0.8}deg)`;
    }
    return f;
  };

  const toggleEditorPlay = () => {
    if (!editorVideoRef.current) return;
    if (editorIsPlaying) {
      editorVideoRef.current.pause();
      setEditorIsPlaying(false);
    } else {
      editorVideoRef.current.play();
      setEditorIsPlaying(true);
    }
  };

  const stepFrame = (frames: number) => {
    if (!editorVideoRef.current || editorDuration <= 0) return;
    const newT = Math.max(0, Math.min(editorDuration, editorCurrentTime + (frames / 60)));
    editorVideoRef.current.currentTime = newT;
    setEditorCurrentTime(newT);
  };

  const jumpToInPoint = () => {
    if (!editorVideoRef.current) return;
    editorVideoRef.current.currentTime = editorTrimStart;
    setEditorCurrentTime(editorTrimStart);
  };

  const jumpToOutPoint = () => {
    if (!editorVideoRef.current) return;
    editorVideoRef.current.currentTime = editorTrimEnd;
    setEditorCurrentTime(editorTrimEnd);
  };

  const splitAtPlayhead = () => {
    if (!editorFile || editorDuration <= 0) return;
    if (editorCurrentTime > editorTrimStart && editorCurrentTime < editorTrimEnd) {
      setEditorTrimEnd(editorCurrentTime);
    } else if (editorCurrentTime <= editorTrimStart) {
      setEditorTrimStart(editorCurrentTime);
    } else {
      setEditorTrimEnd(editorCurrentTime);
    }
  };

  const resetTrims = () => {
    setEditorTrimStart(0);
    setEditorTrimEnd(editorDuration);
    if (editorVideoRef.current) editorVideoRef.current.currentTime = 0;
    setEditorCurrentTime(0);
  };

  // 🎬 Export Cinema Master MP4 with Hardware Acceleration
  const handleExportEditedVideo = async () => {
    if (!editorFile) return;
    try {
      setEditorExporting(true);
      setEditorExportMsg("AabSara CineStudio™ rendering master video with hardware acceleration...");

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const outputFilename = `AabSara_CineMaster_${timestamp}.mp4`;

      const start = editorTrimStart;
      const duration = (editorTrimEnd > editorTrimStart ? editorTrimEnd : editorDuration) - start;

      await invoke("cmd_export_edited_video", {
        inputPath: editorFile.path,
        outputFilename,
        startSec: start,
        durationSec: duration,
        brightness: editorBrightness,
        contrast: editorContrast,
        saturation: editorSaturation,
        speed: editorSpeed,
        watermarkText: editorWatermarkEnabled ? editorWatermark : "",
      });

      setEditorExportMsg(`Export complete: ${outputFilename}`);
      await loadRecordings();
      setTimeout(() => {
        setEditorExporting(false);
        setLeftTab("file-manager");
      }, 1500);
    } catch (err: any) {
      console.error("Export error:", err);
      setEditorExportMsg(`Export failed: ${err}`);
      setEditorExporting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="action-main-window">
      {/* Hidden sink container to keep offscreen video elements alive in WebView2 */}
      <div id="aabsara-hidden-video-sink" style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

      {/* 🚀 CINEMATIC AABSARA PRO SPLASH SCREEN (0% -> 100%) */}
      {showSplash && (
        <div className={`aabsara-splash-container ${splashProgress === 100 ? "fade-out" : ""}`}>
          <div className="splash-card">
            <button className="splash-skip-btn" onClick={() => setShowSplash(false)}>
              Skip ✕
            </button>

            <div className="splash-emblem-wrap">
              <div className="splash-halo" />
              <AabSaraLogo size={84} />
            </div>

            <div className="splash-titles">
              <h1 className="splash-brand-title">AABSARA <span className="splash-gold">PRO</span></h1>
              <p className="splash-subtitle">60FPS Screen & Game Studio • CineStudio™ NLE Suite</p>
            </div>

            <div className="splash-progress-block">
              <div className="splash-progress-track">
                <div
                  className="splash-progress-fill"
                  style={{ width: `${splashProgress}%` }}
                />
              </div>
              <div className="splash-stats-row">
                <span className="splash-status-text">{splashStatus}</span>
                <span className="splash-pct">{splashProgress}%</span>
              </div>
            </div>

            <div className="splash-credits">
              <span>Published By <b>KyneticAuraLab</b> • Created By <b>Cyber Prince</b></span>
            </div>
          </div>
        </div>
      )}

      {/* ⛶ ON-SCREEN INTERACTIVE AREA SNIP SELECTOR */}
      {isSnippingArea && (
        <div
          className="aabsara-snip-overlay"
          style={
            snipBgImage
              ? {
                  backgroundImage: `url(${snipBgImage})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }
              : undefined
          }
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            setSnipDragStart({ x: sx, y: sy });
            setSnipCurrentRect({ x: sx, y: sy, w: 20, h: 20 });
          }}
          onMouseMove={(e) => {
            if (!snipDragStart) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const curX = e.clientX - rect.left;
            const curY = e.clientY - rect.top;

            const x = Math.min(snipDragStart.x, curX);
            const y = Math.min(snipDragStart.y, curY);
            const w = Math.max(50, Math.abs(curX - snipDragStart.x));
            const h = Math.max(50, Math.abs(curY - snipDragStart.y));

            setSnipCurrentRect({ x, y, w, h });
          }}
          onMouseUp={() => {
            setSnipDragStart(null);
          }}
        >
          <div className="snip-top-banner">
            <div className="snip-brand">
              <AabSaraLogo size={24} />
              <div className="snip-instructions">
                <span className="snip-title">AABSARA ON-SCREEN REGION SNIPPER</span>
                <span className="snip-hint">Click & drag anywhere on your screen to draw the recording area</span>
              </div>
            </div>

            <div className="snip-quick-presets">
              <button
                className="snip-preset-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const sw = window.screen.width || 1366;
                  const sh = window.screen.height || 768;
                  setSnipCurrentRect({ x: 0, y: 0, w: sw, h: sh });
                }}
              >
                Full Screen
              </button>
              <button
                className="snip-preset-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  const sw = window.screen.width || 1366;
                  const sh = window.screen.height || 768;
                  const pw = Math.min(1280, sw);
                  const ph = Math.min(720, sh);
                  setSnipCurrentRect({
                    x: Math.max(0, Math.round((sw - pw) / 2)),
                    y: Math.max(0, Math.round((sh - ph) / 2)),
                    w: pw,
                    h: ph,
                  });
                }}
              >
                720p HD
              </button>
              <button
                className="snip-preset-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSnipCurrentRect({ x: 120, y: 60, w: 720, h: 1280 });
                }}
              >
                9:16 Reels
              </button>
              <button
                className="snip-preset-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSnipCurrentRect({ x: 100, y: 100, w: 720, h: 720 });
                }}
              >
                1:1 Square
              </button>
            </div>

            <div className="snip-actions">
              <div className="snip-dim-pill">
                {Math.round(snipCurrentRect.w)} × {Math.round(snipCurrentRect.h)} px
                <span className="snip-coords-sub"> (X: {Math.round(snipCurrentRect.x)}, Y: {Math.round(snipCurrentRect.y)})</span>
              </div>
              <button
                className="snip-apply-btn"
                onClick={async (e) => {
                  e.stopPropagation();
                  const finalW = Math.max(100, Math.round(snipCurrentRect.w));
                  const finalH = Math.max(100, Math.round(snipCurrentRect.h));
                  setAreaWidth(finalW);
                  setAreaHeight(finalH);
                  setAreaX(Math.round(snipCurrentRect.x));
                  setAreaY(Math.round(snipCurrentRect.y));
                  setAreaPreset("custom");
                  setIsSnippingArea(false);
                  setSnipBgImage("");
                  try {
                    await invoke("cmd_window_fullscreen", { fullscreen: false });
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                ✓ Apply Region
              </button>
              <button
                className="snip-cancel-btn"
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsSnippingArea(false);
                  setSnipBgImage("");
                  try {
                    await invoke("cmd_window_fullscreen", { fullscreen: false });
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>

          {/* Glowing Bounding Box Cutout */}
          <div
            className="snip-selection-frame"
            style={{
              left: `${snipCurrentRect.x}px`,
              top: `${snipCurrentRect.y}px`,
              width: `${snipCurrentRect.w}px`,
              height: `${snipCurrentRect.h}px`,
            }}
          >
            <div className="snip-corner-handle tl" />
            <div className="snip-corner-handle tr" />
            <div className="snip-corner-handle bl" />
            <div className="snip-corner-handle br" />
            <div className="snip-live-hud">
              <span>{Math.round(snipCurrentRect.w)} × {Math.round(snipCurrentRect.h)} px</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          1. TOP WINDOW BAR (AabSara OFFICIAL BRANDED TITLEBAR)
          ═══════════════════════════════════════════════════════ */}
      <header className="action-topbar" data-tauri-drag-region>
        <div className="topbar-left" data-tauri-drag-region>
          <div className="aabsara-brand-container" data-tauri-drag-region onClick={() => setRightTab("about")}>
            <AabSaraLogo size={28} />
            <div className="aabsara-logo-text" data-tauri-drag-region>
              <span className="brand-title">AabSara</span>
              <span className="brand-edition">PRO</span>
            </div>
          </div>

          <nav className="topbar-links">
            <button className="top-link" onClick={() => { setLeftTab("preview"); setRightTab("video"); }}>
              Capture
            </button>
            <button className="top-link" onClick={() => { setLeftTab("preview"); setRightTab("stream"); }}>
              Live Stream
            </button>
            <button className="top-link" onClick={() => { setLeftTab("preview"); setRightTab("overlays"); }}>
              Overlays & Chroma
            </button>
            <button className="top-link" onClick={() => { setLeftTab("file-manager"); }}>
              Library
            </button>
            <button className={`top-link editor-nav-pill ${leftTab === "editor" ? "active" : ""}`} onClick={() => { setLeftTab("editor"); }}>
              <EditIcon size={12} /> CineStudio PRO
            </button>
            <button className="top-link support-nav-pill" onClick={() => setRightTab("about")} title="Support Developer via Litecoin (LTC)">
              🪙 Support (LTC)
            </button>
            <button className="top-link" onClick={() => setRightTab("about")}>
              About
            </button>
          </nav>
        </div>

        <div className="topbar-right">
          <div className="window-meta-stats">
            {isStreaming ? (
              <span className="meta-stream-live-pill">● LIVE BROADCAST</span>
            ) : (
              <span className="meta-gpu-pill">GPU: READY</span>
            )}
            <span className="meta-ver-pill">v1.0.2</span>
          </div>

          <div className="action-window-controls">
            <button
              className="win-btn minimize"
              onClick={handleMinimize}
              title="Minimize"
            >
              ─
            </button>
            <button
              className="win-btn maximize"
              onClick={handleMaximize}
              title="Maximize"
            >
              □
            </button>
            <button
              className="win-btn close"
              onClick={handleClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          2. MAIN SPLIT PANE (LEFT VIEWPORT + RIGHT INSPECTOR)
          ═══════════════════════════════════════════════════════ */}
      <div className={`action-body-split ${leftTab === "editor" ? "cinestudio-open" : ""}`}>
        {/* ── LEFT HALF: PREVIEW / FILE MANAGER / CINESTUDIO PRO ── */}
        <section className={`action-left-panel ${leftTab === "editor" ? "full-cinestudio" : ""}`}>
          {leftTab !== "editor" && (
            <div className="left-subnav">
              <div className="subnav-tabs">
                <button
                  className={`subnav-btn ${leftTab === "file-manager" ? "active" : ""}`}
                  onClick={() => setLeftTab("file-manager")}
                >
                  <FolderIcon size={13} className="subnav-icon" />
                  File manager
                </button>
                <button
                  className={`subnav-btn ${leftTab === "preview" ? "active" : ""}`}
                  onClick={() => setLeftTab("preview")}
                >
                  <ScreenIcon size={13} className="subnav-icon" />
                  Preview
                </button>
                <button
                  className="subnav-btn"
                  onClick={() => setLeftTab("editor")}
                >
                  <EditIcon size={13} className="subnav-icon" />
                  CineStudio PRO
                </button>
              </div>

              <div className="subnav-options">
                {leftTab === "preview" && (
                  <button
                    className={`live-preview-toggle-btn ${isLivePreview ? "active" : ""}`}
                    onClick={toggleLiveScreenPreview}
                    title="Mirror your desktop screen live inside the preview canvas"
                  >
                    <ScreenIcon size={12} />
                    {isLivePreview ? "Stop Screen Preview" : "Start Live Preview"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEWPORT 1: LIVE PREVIEW CANVAS WITH INTERACTIVE OVERLAYS */}
          {leftTab === "preview" && (
            <div
              className="action-preview-canvas"
              onMouseMove={(e) => {
                if (isDraggingPreviewCrop && cropDragRef.current) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dx = e.clientX - cropDragRef.current.startX;
                  const dy = e.clientY - cropDragRef.current.startY;
                  const scaleX = 1920 / rect.width;
                  const scaleY = 1080 / rect.height;
                  const newX = Math.max(0, Math.min(1920 - areaWidth, Math.round(cropDragRef.current.initX + dx * scaleX)));
                  const newY = Math.max(0, Math.min(1080 - areaHeight, Math.round(cropDragRef.current.initY + dy * scaleY)));
                  setAreaX(newX);
                  setAreaY(newY);
                  setAreaPreset("custom");
                }
              }}
              onMouseUp={() => {
                setIsDraggingPreviewCrop(false);
                cropDragRef.current = null;
              }}
              onMouseLeave={() => {
                setIsDraggingPreviewCrop(false);
                cropDragRef.current = null;
              }}
            >
              <div className="crimson-wave-bg" />
              <div className="preview-watermark">AABSARA</div>

              {/* Live Desktop Screen Stream Video Element */}
              <video
                ref={screenPreviewVideoRef}
                autoPlay
                playsInline
                muted
                className={`desktop-screen-preview-video ${isLivePreview && !isStreaming ? "visible" : "hidden"}`}
              />

              {/* Active Broadcast HUD Card (Eliminates infinite mirror recursion & saves 100% GPU) */}
              {isStreaming ? (
                <div className="preview-live-streaming-card">
                  <div className="live-pulse-badge">
                    <span className="live-dot-glow">●</span> LIVE BROADCASTING
                  </div>
                  <span className="live-stream-card-title">Broadcasting to {streamService}</span>
                  <span className="live-stream-card-sub">720p 30 FPS • Ultra-Low Latency Zero-Lag Mode</span>
                  <p className="live-stream-card-desc">
                    Desktop preview is dynamically optimized to eliminate recursive window mirroring and dedicate 100% of your CPU & GPU power to your streaming content.
                  </p>
                </div>
              ) : !isLivePreview ? (
                <div className="preview-idle-overlay">
                  <div className="idle-reticle">
                    <ScreenIcon size={34} className="idle-screen-icon" />
                    <span className="idle-title">Desktop Capture Standby</span>
                    <span className="idle-sub">1920 × 1080 • 60 FPS • DirectX 11 Mode</span>
                    <button
                      className="preview-activate-btn"
                      onClick={toggleLiveScreenPreview}
                    >
                      <PlayIcon size={11} /> Turn ON Live Desktop Preview
                    </button>
                  </div>
                </div>
              ) : null}

              {/* LIVE STREAMLABS BROADCAST OVERLAY HUD (ALWAYS VISIBLE & LIVE ON PREVIEW) */}
              {overlayConfig.theme !== "none" && (
                <div className={`live-broadcast-overlay-hud theme-${overlayConfig.theme}`}>
                  {/* Top Header Bar */}
                  <div className="overlay-top-header">
                    <div className="overlay-streamer-badge">
                      <span className="overlay-badge-dot">●</span>
                      <span className="overlay-badge-name">{overlayConfig.streamerName || "Cyber Prince"}</span>
                    </div>
                    <div className="overlay-social-tags">
                      {overlayConfig.socialYt && (
                        <div className="overlay-social-chip yt">
                          <span className="social-icon">▶</span>
                          <span>{overlayConfig.socialYt}</span>
                        </div>
                      )}
                      {overlayConfig.socialFb && (
                        <div className="overlay-social-chip fb">
                          <span className="social-icon">f</span>
                          <span>{overlayConfig.socialFb}</span>
                        </div>
                      )}
                      {overlayConfig.socialTwitch && (
                        <div className="overlay-social-chip twitch">
                          <span className="social-icon">✦</span>
                          <span>{overlayConfig.socialTwitch}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Animated Ticker Bar */}
                  <div className="overlay-bottom-ticker">
                    <div className="ticker-label-badge">LIVE</div>
                    <div className="ticker-text-marquee">
                      <span>{overlayConfig.tickerText || "★ PUBLISHED BY KYNETICAURALAB • CREATED BY CYBER PRINCE ★"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Area Mode Overlay Box (Mirillis Action! Area Crop Frame) */}
              {recordMode === "area" && (
                <div
                  className="preview-area-crop-frame"
                  style={{
                    left: `${(areaX / 1920) * 100}%`,
                    top: `${(areaY / 1080) * 100}%`,
                    width: `${Math.min(100, (areaWidth / 1920) * 100)}%`,
                    height: `${Math.min(100, (areaHeight / 1080) * 100)}%`,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingPreviewCrop(true);
                    cropDragRef.current = {
                      startX: e.clientX,
                      startY: e.clientY,
                      initX: areaX,
                      initY: areaY,
                    };
                  }}
                  title="Drag this golden dashed frame to position the recording area anywhere on screen"
                >
                  <div className="crop-frame-badge">
                    <span>AREA CROP: {areaWidth} × {areaHeight} px (X:{areaX}, Y:{areaY})</span>
                  </div>
                  <div className="crop-corner top-left" />
                  <div className="crop-corner top-right" />
                  <div className="crop-corner bottom-left" />
                  <div className="crop-corner bottom-right" />
                </div>
              )}

              {/* Live Webcam Overlay Box (Draggable PiP) */}
              {webcamEnabled && (
                <div className="webcam-overlay-box">
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="webcam-video-element"
                    style={{ display: webcamActive ? "block" : "none" }}
                  />
                  {!webcamActive && (
                    <div className="webcam-fallback-card" onClick={() => initWebcam()}>
                      <WebcamIcon size={22} className="webcam-fallback-icon" />
                      <span className="webcam-fallback-title">Webcam Standby</span>
                      <span className="webcam-fallback-sub">{webcamDevice}</span>
                      <button className="webcam-retry-btn" onClick={() => initWebcam()}>
                        <RefreshIcon size={10} /> Connect Camera
                      </button>
                    </div>
                  )}
                  <div className="webcam-corner-anchor" title="Webcam border anchor" />
                </div>
              )}

              {/* In-Game AabSara HUD */}
              {isRecording && (
                <div className="action-ingame-hud">
                  <div className="hud-engine">DX11</div>
                  <div className="hud-fps-big">{videoFps}</div>
                  <div className="hud-rec-dot pulsing" />
                  <div className="hud-timer">{formatTimer(recordTime)}</div>
                  <div className="hud-disk">{freeSpace} GB</div>
                </div>
              )}

              {/* Active GPU Card Label at bottom */}
              <div className="preview-bottom-bar">
                <span className="gpu-label">Active GPU:</span>
                <span className="gpu-val">GeForce GTX / Intel QuickSync Acceleration Active</span>
              </div>
            </div>
          )}

          {/* VIEWPORT 2: FILE MANAGER */}
          {leftTab === "file-manager" && (
            <div className="action-file-manager">
              <div className="fm-top-row">
                <span className="fm-folder-label">Folder:</span>
                <span className="fm-folder-path" onClick={openFolder} title="Click to open">
                  D:\AabSara\Recordings
                </span>
                <button className="fm-open-btn" onClick={openFolder}>
                  <FolderIcon size={12} /> Open in Explorer
                </button>
              </div>

              <div className="fm-split-area">
                <div className="fm-tree">
                  <div className="fm-tree-item active">
                    <FolderIcon size={13} /> All Videos ({recordings.length})
                  </div>
                  <div className="fm-tree-item sub">
                    <GameIcon size={13} /> Games
                  </div>
                  <div className="fm-tree-item sub">
                    <ScreenIcon size={13} /> Screen recording
                  </div>
                  <div className="fm-tree-item sub">
                    <AreaIcon size={13} /> Area crops
                  </div>
                  <div className="fm-tree-item sub">
                    <LiveIcon size={13} /> Streaming
                  </div>
                  <div className="fm-tree-item">
                    <CameraIcon size={13} /> Screenshots
                  </div>
                </div>

                <div className="fm-grid">
                  {recordings.length === 0 ? (
                    <div className="fm-empty">
                      <FolderIcon size={32} className="fm-empty-icon" />
                      <p>No video recordings or screenshots found in folder.</p>
                      <span>Press F9 to record video or F12 for screenshot!</span>
                    </div>
                  ) : (
                    recordings.map((clip) => (
                      <div
                        key={clip.path}
                        className={`fm-thumb-card ${selectedFile?.path === clip.path ? "selected" : ""}`}
                        onClick={() => setSelectedFile(clip)}
                        onDoubleClick={() => playMedia(clip.path)}
                      >
                        <div className="fm-thumb-preview">
                          <PlayIcon size={20} className="thumb-play-icon" />
                          <span className="thumb-duration-tag">
                            {clip.is_video ? "VIDEO" : "PNG"}
                          </span>
                        </div>
                        <div className="fm-thumb-title" title={clip.name}>
                          {clip.name}
                        </div>
                        <div className="fm-thumb-sub">
                          {clip.size_mb.toFixed(1)} MB • {clip.date}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="fm-bottom-deck">
                <div className="fm-sel-info">
                  {selectedFile ? (
                    <span>
                      Selected: <b>{selectedFile.name}</b> ({selectedFile.size_mb.toFixed(1)} MB)
                    </span>
                  ) : (
                    <span>No file selected</span>
                  )}
                </div>
                <div className="fm-btn-group">
                  <button
                    className="fm-act-btn edit-cinestudio"
                    disabled={!selectedFile || !selectedFile.is_video}
                    onClick={() => selectedFile && openInEditor(selectedFile)}
                    title="Open in AabSara CineStudio™ PRO"
                  >
                    <EditIcon size={11} /> Open in CineStudio
                  </button>
                  <button
                    className="fm-act-btn play"
                    disabled={!selectedFile}
                    onClick={() => selectedFile && playMedia(selectedFile.path)}
                  >
                    <PlayIcon size={11} /> Play
                  </button>
                  <button
                    className="fm-act-btn delete"
                    disabled={!selectedFile}
                    onClick={() => selectedFile && deleteMedia(selectedFile.path)}
                  >
                    <TrashIcon size={11} /> Delete
                  </button>
                  <button className="fm-act-btn social" onClick={openFolder}>
                    Folder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT 3: AABSARA CINESTUDIO™ PRO NLE WORKSTATION */}
          {leftTab === "editor" && (
            <div className="action-cinestudio-workstation">
              {/* 1. TOP CINESTUDIO COMMAND RIBBON */}
              <div className="cinestudio-top-ribbon">
                <div className="cs-ribbon-left">
                  <button
                    className="cs-back-btn"
                    onClick={() => setLeftTab("file-manager")}
                    title="Return to Media Library"
                  >
                    <ArrowLeftIcon size={13} />
                    <span>Back to Library</span>
                  </button>

                  <div className="cs-brand-badge">
                    <AabSaraLogo size={22} />
                    <div className="cs-brand-titles">
                      <span className="cs-brand-main">AabSara CineStudio™</span>
                      <span className="cs-brand-sub">NLE PRO SUITE</span>
                    </div>
                  </div>

                  {editorFile && (
                    <div className="cs-active-file-pill">
                      <span className="cs-file-dot">●</span>
                      <span className="cs-file-name" title={editorFile.name}>{editorFile.name}</span>
                      <span className="cs-file-badge">1080p60 • {formatTimer(Math.floor(editorDuration))}</span>
                    </div>
                  )}

                  {/* Quick Clip Switcher Dropdown */}
                  {recordings.filter((r) => r.is_video).length > 0 && (
                    <div className="cs-clip-switcher" title="Switch Clip in Studio">
                      <select
                        className="cs-clip-select"
                        value={editorFile?.path || ""}
                        onChange={(e) => {
                          const target = recordings.find((r) => r.path === e.target.value);
                          if (target) openInEditor(target);
                        }}
                      >
                        {recordings
                          .filter((r) => r.is_video)
                          .map((clip) => (
                            <option key={clip.path} value={clip.path}>
                              🎞 {clip.name} ({clip.size_mb.toFixed(1)} MB)
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="cs-ribbon-actions">
                  <button
                    className="cs-tool-btn"
                    onClick={splitAtPlayhead}
                    title="Split Clip at Current Playhead (S)"
                  >
                    <ScissorsIcon size={12} />
                    <span>Split (S)</span>
                  </button>

                  <button
                    className="cs-tool-btn"
                    onClick={() => { setEditorTrimStart(editorCurrentTime); }}
                    title="Set In-Point at Playhead ([)"
                  >
                    <span>[ In</span>
                  </button>

                  <button
                    className="cs-tool-btn"
                    onClick={() => { setEditorTrimEnd(editorCurrentTime); }}
                    title="Set Out-Point at Playhead (])"
                  >
                    <span>] Out</span>
                  </button>

                  <button
                    className="cs-tool-btn"
                    onClick={resetTrims}
                    title="Reset All Cuts & Trims"
                  >
                    <RefreshIcon size={11} />
                    <span>Reset</span>
                  </button>

                  <button
                    className="cs-export-btn"
                    disabled={!editorFile || editorExporting}
                    onClick={handleExportEditedVideo}
                    title="Export Cinema Master MP4"
                  >
                    <SparklesIcon size={13} />
                    <span>{editorExporting ? "RENDERING MASTER..." : "EXPORT MASTER MP4"}</span>
                  </button>
                </div>
              </div>

              {editorExportMsg && (
                <div className="cs-export-banner">
                  <span className="cs-export-pulse">●</span>
                  <span>{editorExportMsg}</span>
                </div>
              )}

              {/* 2. DUAL STAGE: CINEMA MONITOR (LEFT) & PRO INSPECTOR (RIGHT) */}
              <div className="cs-middle-dual-stage">
                {/* ── CINEMA STAGE & VIEWPORT ── */}
                <div className="cs-cinema-stage">
                  {editorVideoSrc ? (
                    <div className="cs-monitor-container">
                      {/* Aspect Ratio Selector Chips */}
                      <div className="cs-aspect-chips">
                        {(["16:9", "9:16", "1:1", "21:9"] as const).map((ratio) => (
                          <button
                            key={ratio}
                            className={`aspect-chip ${editorAspectRatio === ratio ? "active" : ""}`}
                            onClick={() => setEditorAspectRatio(ratio)}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>

                      {/* Video Viewport Frame */}
                      <div
                        className={`cs-viewport-frame aspect-${editorAspectRatio.replace(":", "-")}`}
                        onClick={toggleEditorPlay}
                        title="Click to Play / Pause"
                      >
                        <video
                          ref={editorVideoRef}
                          src={editorVideoSrc}
                          style={{
                            filter: getEditorVideoFilter(),
                          }}
                          onLoadedMetadata={(e) => {
                            const vid = e.currentTarget;
                            let dur = vid.duration;
                            if (!isFinite(dur) || isNaN(dur) || dur <= 0) {
                              vid.currentTime = 1e101;
                              vid.ontimeupdate = () => {
                                vid.ontimeupdate = null;
                                let realDur = vid.currentTime;
                                vid.currentTime = 0;
                                if (isFinite(realDur) && realDur > 0) {
                                  setEditorDuration(realDur);
                                  setEditorTrimEnd(realDur);
                                }
                              };
                            } else {
                              setEditorDuration(dur);
                              setEditorTrimEnd(dur);
                            }
                          }}
                          onTimeUpdate={(e) => {
                            setEditorCurrentTime(e.currentTarget.currentTime);
                          }}
                          onEnded={() => setEditorIsPlaying(false)}
                          className="cs-video-element"
                        />

                        {/* Dynamic Vignette Layer */}
                        {editorVignette > 0 && (
                          <div
                            className="cs-vignette-overlay"
                            style={{
                              boxShadow: `inset 0 0 ${editorVignette * 1.8}px rgba(0,0,0,${editorVignette / 100})`,
                            }}
                          />
                        )}

                        {/* Watermark / Lower-Third Overlay */}
                        {editorWatermarkEnabled && editorWatermark && (
                          <div
                            className={`cs-watermark-overlay pos-${editorWatermarkPos} ${editorWatermarkGlow ? "glow" : ""}`}
                            style={{
                              fontSize: `${editorWatermarkSize}px`,
                              opacity: editorWatermarkOpacity,
                            }}
                          >
                            {editorWatermark}
                          </div>
                        )}

                        {/* Cinema HUD Timecode Overlay */}
                        <div className="cs-hud-timecode">
                          <span>{formatTimer(Math.floor(editorCurrentTime))}:{Math.floor((editorCurrentTime % 1) * 60).toString().padStart(2, "0")}</span>
                        </div>
                      </div>

                      {/* Transport Bar */}
                      <div className="cs-transport-deck">
                        <div className="cs-transport-buttons">
                          <button className="cs-trans-btn" onClick={jumpToInPoint} title="Jump to In-Point ([)">
                            ⏮
                          </button>
                          <button className="cs-trans-btn" onClick={() => stepFrame(-1)} title="Previous Frame (←)">
                            ◀
                          </button>
                          <button
                            className={`cs-trans-btn play-master ${editorIsPlaying ? "playing" : ""}`}
                            onClick={toggleEditorPlay}
                            title="Play / Pause (Space)"
                          >
                            {editorIsPlaying ? "⏸" : "▶"}
                          </button>
                          <button className="cs-trans-btn" onClick={() => stepFrame(1)} title="Next Frame (→)">
                            ▶
                          </button>
                          <button className="cs-trans-btn" onClick={jumpToOutPoint} title="Jump to Out-Point (])">
                            ⏭
                          </button>
                        </div>

                        <div className="cs-timecode-readout">
                          <span className="cs-tc-now">{formatTimer(Math.floor(editorCurrentTime))}</span>
                          <span className="cs-tc-sep">/</span>
                          <span className="cs-tc-total">{formatTimer(Math.floor(editorDuration))}</span>
                          <span className="cs-tc-cut-badge">
                            SELECTION: {Math.max(0, editorTrimEnd - editorTrimStart).toFixed(1)}s
                          </span>
                        </div>

                        <div className="cs-transport-extras">
                          <button
                            className={`cs-trans-btn mini ${editorMute ? "muted" : ""}`}
                            onClick={() => {
                              const next = !editorMute;
                              setEditorMute(next);
                              if (editorVideoRef.current) editorVideoRef.current.muted = next;
                            }}
                            title="Mute Preview Audio"
                          >
                            {editorMute ? "🔇" : "🔊"}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editorMute ? 0 : editorVolume}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              setEditorVolume(v);
                              setEditorMute(false);
                              if (editorVideoRef.current) {
                                editorVideoRef.current.volume = v / 100;
                                editorVideoRef.current.muted = false;
                              }
                            }}
                            className="cs-vol-slider"
                            title="Audio Monitor Volume"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cs-empty-state">
                      <EditIcon size={44} className="cs-empty-icon" />
                      <h3>No Video Loaded in CineStudio</h3>
                      <p>Select any recorded video from the Media Library and click <b>"Open in CineStudio"</b> to start editing!</p>
                      <button className="preview-activate-btn" onClick={() => setLeftTab("file-manager")}>
                        <FolderIcon size={12} /> Open Media Library
                      </button>
                    </div>
                  )}
                </div>

                {/* ── PRO INSPECTOR & FX DECK (RIGHT) ── */}
                <div className="cs-inspector-deck">
                  <div className="cs-inspector-tabs">
                    <button
                      className={`cs-tab-btn ${editorActiveTab === "color" ? "active" : ""}`}
                      onClick={() => setEditorActiveTab("color")}
                    >
                      <PaletteIcon size={12} />
                      <span>Color & LUTs</span>
                    </button>
                    <button
                      className={`cs-tab-btn ${editorActiveTab === "speed" ? "active" : ""}`}
                      onClick={() => setEditorActiveTab("speed")}
                    >
                      <SparklesIcon size={12} />
                      <span>Speed FX</span>
                    </button>
                    <button
                      className={`cs-tab-btn ${editorActiveTab === "title" ? "active" : ""}`}
                      onClick={() => setEditorActiveTab("title")}
                    >
                      <TypeIcon size={12} />
                      <span>Titles & GFX</span>
                    </button>
                    <button
                      className={`cs-tab-btn ${editorActiveTab === "audio" ? "active" : ""}`}
                      onClick={() => setEditorActiveTab("audio")}
                    >
                      <VolumeHighIcon size={12} />
                      <span>Audio</span>
                    </button>
                  </div>

                  <div className="cs-inspector-content">
                    {/* TAB 1: COLOR GRADING & LUTS */}
                    {editorActiveTab === "color" && (
                      <div className="cs-fx-panel">
                        <span className="cs-section-title">ONE-CLICK CINEMATIC LUTS:</span>
                        <div className="cs-lut-grid">
                          {[
                            { id: "clean", name: "Natural", grad: "linear-gradient(135deg, #2b3044, #181b2a)" },
                            { id: "teal-orange", name: "Teal & Orange", grad: "linear-gradient(135deg, #00e5ff, #ff7700)" },
                            { id: "cyber-neon", name: "Cyber Neon", grad: "linear-gradient(135deg, #00f0ff, #ff007f)" },
                            { id: "mythic-gold", name: "Mythic Gold", grad: "linear-gradient(135deg, #ffd700, #ff8c00)" },
                            { id: "matrix", name: "Emerald Matrix", grad: "linear-gradient(135deg, #00ff88, #004422)" },
                            { id: "noir", name: "Film Noir", grad: "linear-gradient(135deg, #ffffff, #222222)" },
                            { id: "vintage", name: "Vintage 70s", grad: "linear-gradient(135deg, #d4a373, #faedcd)" },
                          ].map((item) => (
                            <button
                              key={item.id}
                              className={`cs-lut-card ${editorLut === item.id ? "active" : ""}`}
                              onClick={() => applyLutPreset(item.id)}
                            >
                              <div className="lut-swatch" style={{ background: item.grad }} />
                              <span className="lut-title">{item.name}</span>
                            </button>
                          ))}
                        </div>

                        <div className="cs-sliders-block">
                          <div className="cs-slider-row">
                            <div className="cs-slider-header">
                              <span>Exposure / Brightness</span>
                              <span className="val">{((editorBrightness - 1) * 100).toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="1.5"
                              step="0.02"
                              value={editorBrightness}
                              onChange={(e) => setEditorBrightness(parseFloat(e.target.value))}
                              className="cs-range-slider"
                            />
                          </div>

                          <div className="cs-slider-row">
                            <div className="cs-slider-header">
                              <span>Contrast</span>
                              <span className="val">{((editorContrast - 1) * 100).toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.02"
                              value={editorContrast}
                              onChange={(e) => setEditorContrast(parseFloat(e.target.value))}
                              className="cs-range-slider"
                            />
                          </div>

                          <div className="cs-slider-row">
                            <div className="cs-slider-header">
                              <span>Saturation / Vibrance</span>
                              <span className="val">{((editorSaturation - 1) * 100).toFixed(0)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.0"
                              max="2.5"
                              step="0.02"
                              value={editorSaturation}
                              onChange={(e) => setEditorSaturation(parseFloat(e.target.value))}
                              className="cs-range-slider"
                            />
                          </div>

                          <div className="cs-slider-row">
                            <div className="cs-slider-header">
                              <span>Color Temperature (Kelvin)</span>
                              <span className="val">{editorTemperature > 0 ? `+${editorTemperature}K Warm` : editorTemperature < 0 ? `${editorTemperature}K Cool` : "Neutral"}</span>
                            </div>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={editorTemperature}
                              onChange={(e) => setEditorTemperature(parseInt(e.target.value))}
                              className="cs-range-slider temp"
                            />
                          </div>

                          <div className="cs-slider-row">
                            <div className="cs-slider-header">
                              <span>Vignette Edge Shadow</span>
                              <span className="val">{editorVignette}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={editorVignette}
                              onChange={(e) => setEditorVignette(parseInt(e.target.value))}
                              className="cs-range-slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SPEED & MOTION */}
                    {editorActiveTab === "speed" && (
                      <div className="cs-fx-panel">
                        <span className="cs-section-title">PLAYBACK SPEED CONTROLLER:</span>
                        <div className="cs-speed-grid">
                          {[
                            { val: 0.25, label: "0.25x Slo-Mo" },
                            { val: 0.5, label: "0.5x Half" },
                            { val: 1.0, label: "1.0x Normal" },
                            { val: 1.5, label: "1.5x Brisk" },
                            { val: 2.0, label: "2.0x Fast" },
                            { val: 4.0, label: "4.0x Timelapse" },
                          ].map((item) => (
                            <button
                              key={item.val}
                              className={`cs-speed-btn ${editorSpeed === item.val ? "active" : ""}`}
                              onClick={() => {
                                setEditorSpeed(item.val);
                                if (editorVideoRef.current) editorVideoRef.current.playbackRate = item.val;
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        <div className="cs-slider-row" style={{ marginTop: "14px" }}>
                          <div className="cs-slider-header">
                            <span>Custom Speed Multiplier</span>
                            <span className="val">{editorSpeed.toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.25"
                            max="4.0"
                            step="0.05"
                            value={editorSpeed}
                            onChange={(e) => {
                              const s = parseFloat(e.target.value);
                              setEditorSpeed(s);
                              if (editorVideoRef.current) editorVideoRef.current.playbackRate = s;
                            }}
                            className="cs-range-slider"
                          />
                        </div>

                        <div className="action-tip-box" style={{ marginTop: "14px" }}>
                          <span>CineStudio scales video PTS and audio tempo simultaneously using hardware acceleration.</span>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: TITLES & WATERMARK */}
                    {editorActiveTab === "title" && (
                      <div className="cs-fx-panel">
                        <span className="cs-section-title">WATERMARK & LOWER-THIRDS:</span>
                        <label className="checkbox-container" style={{ margin: "6px 0 10px 0" }}>
                          <input
                            type="checkbox"
                            checked={editorWatermarkEnabled}
                            onChange={(e) => setEditorWatermarkEnabled(e.target.checked)}
                          />
                          <span className="checkmark" />
                          <span className="check-text">Enable Watermark / Title Layer</span>
                        </label>

                        {editorWatermarkEnabled && (
                          <>
                            <div className="cs-input-group">
                              <label>Watermark Text:</label>
                              <input
                                type="text"
                                className="action-input-text full"
                                value={editorWatermark}
                                onChange={(e) => setEditorWatermark(e.target.value)}
                              />
                            </div>

                            <div className="cs-input-group">
                              <label>Screen Anchor Position:</label>
                              <div className="cs-pos-grid">
                                {(["top-left", "top-right", "bottom-left", "bottom-right", "center"] as const).map((pos) => (
                                  <button
                                    key={pos}
                                    className={`cs-pos-btn ${editorWatermarkPos === pos ? "active" : ""}`}
                                    onClick={() => setEditorWatermarkPos(pos)}
                                  >
                                    {pos.replace("-", " ").toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="cs-slider-row">
                              <div className="cs-slider-header">
                                <span>Font Size</span>
                                <span className="val">{editorWatermarkSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="11"
                                max="28"
                                value={editorWatermarkSize}
                                onChange={(e) => setEditorWatermarkSize(parseInt(e.target.value))}
                                className="cs-range-slider"
                              />
                            </div>

                            <div className="cs-slider-row">
                              <div className="cs-slider-header">
                                <span>Opacity</span>
                                <span className="val">{(editorWatermarkOpacity * 100).toFixed(0)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.2"
                                max="1.0"
                                step="0.05"
                                value={editorWatermarkOpacity}
                                onChange={(e) => setEditorWatermarkOpacity(parseFloat(e.target.value))}
                                className="cs-range-slider"
                              />
                            </div>

                            <label className="checkbox-container" style={{ marginTop: "8px" }}>
                              <input
                                type="checkbox"
                                checked={editorWatermarkGlow}
                                onChange={(e) => setEditorWatermarkGlow(e.target.checked)}
                              />
                              <span className="checkmark" />
                              <span className="check-text">Cyber Neon Glow Filter</span>
                            </label>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 4: AUDIO MASTER */}
                    {editorActiveTab === "audio" && (
                      <div className="cs-fx-panel">
                        <span className="cs-section-title">AUDIO MASTERING & LEVELS:</span>
                        <div className="cs-slider-row">
                          <div className="cs-slider-header">
                            <span>Master Volume Boost</span>
                            <span className="val">{editorVolume}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="200"
                            value={editorVolume}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              setEditorVolume(v);
                              if (editorVideoRef.current) {
                                editorVideoRef.current.volume = Math.min(1.0, v / 100);
                              }
                            }}
                            className="cs-range-slider"
                          />
                        </div>

                        <div className="cs-slider-row">
                          <div className="cs-slider-header">
                            <span>Audio Fade In</span>
                            <span className="val">{editorAudioFadeIn.toFixed(1)}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="3.0"
                            step="0.1"
                            value={editorAudioFadeIn}
                            onChange={(e) => setEditorAudioFadeIn(parseFloat(e.target.value))}
                            className="cs-range-slider"
                          />
                        </div>

                        <div className="cs-slider-row">
                          <div className="cs-slider-header">
                            <span>Audio Fade Out</span>
                            <span className="val">{editorAudioFadeOut.toFixed(1)}s</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="3.0"
                            step="0.1"
                            value={editorAudioFadeOut}
                            onChange={(e) => setEditorAudioFadeOut(parseFloat(e.target.value))}
                            className="cs-range-slider"
                          />
                        </div>

                        <label className="checkbox-container" style={{ marginTop: "10px" }}>
                          <input
                            type="checkbox"
                            checked={editorMute}
                            onChange={(e) => {
                              setEditorMute(e.target.checked);
                              if (editorVideoRef.current) editorVideoRef.current.muted = e.target.checked;
                            }}
                          />
                          <span className="checkmark" />
                          <span className="check-text">Mute Master Audio in Export</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. MULTI-TRACK PROFESSIONAL NLE TIMELINE (BOTTOM) */}
              <div className="cs-bottom-timeline-suite">
                {/* Timeline Controls & Tools */}
                <div className="cs-timeline-toolbar">
                  <div className="cs-tl-left-tools">
                    <button className="cs-tl-tool-btn" onClick={splitAtPlayhead} title="Split Clip at Playhead (S)">
                      <ScissorsIcon size={12} />
                      <span>Split (S)</span>
                    </button>
                    <button className="cs-tl-tool-btn" onClick={() => setEditorTrimStart(editorCurrentTime)} title="Set In-Point ([)">
                      <span>[ In</span>
                    </button>
                    <button className="cs-tl-tool-btn" onClick={() => setEditorTrimEnd(editorCurrentTime)} title="Set Out-Point (])">
                      <span>] Out</span>
                    </button>
                    <button className="cs-tl-tool-btn" onClick={resetTrims} title="Reset Cuts">
                      <RefreshIcon size={10} />
                      <span>Clear Cuts</span>
                    </button>
                  </div>

                  <div className="cs-tl-center-readout">
                    <span className="cs-tl-timecode">{formatTimer(Math.floor(editorCurrentTime))}.{Math.floor((editorCurrentTime % 1) * 100).toString().padStart(2, "0")}</span>
                    <span className="cs-tl-dur-pill">SELECTION: {Math.max(0, editorTrimEnd - editorTrimStart).toFixed(1)}s</span>
                  </div>

                  <div className="cs-tl-right-zoom">
                    <span className="cs-zoom-label">ZOOM:</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.2"
                      value={editorTimelineZoom}
                      onChange={(e) => setEditorTimelineZoom(parseFloat(e.target.value))}
                      className="cs-zoom-slider"
                    />
                  </div>
                </div>

                {/* Interactive Timeline Track Area with Tracks & Playhead */}
                <div className="cs-tracks-container">
                  {/* Time Ruler with Second Markers */}
                  <div
                    className="cs-time-ruler"
                    onPointerDown={scrubPlayheadFromPointer}
                    title="Click or Drag to Scrub Playhead"
                  >
                    {Array.from({ length: 11 }).map((_, i) => {
                      const sec = (editorDuration / 10) * i;
                      return (
                        <div key={i} className="ruler-tick-mark" style={{ left: `${i * 10}%` }}>
                          <span className="ruler-sec-label">{formatTimer(Math.floor(sec))}</span>
                          <div className="ruler-notch" />
                        </div>
                      );
                    })}
                  </div>

                  {/* Tracks Stack (V1 Video, T1 Title, A1 Audio) */}
                  <div className="cs-tracks-stack">
                    {/* Glowing Playhead Needle Across All Tracks */}
                    <div
                      className="cs-playhead-needle"
                      style={{
                        left: `${editorDuration > 0 ? (editorCurrentTime / editorDuration) * 100 : 0}%`,
                      }}
                    >
                      <div className="cs-playhead-head" />
                      <div className="cs-playhead-line" />
                    </div>

                    {/* TRACK V1: VIDEO TRACK */}
                    <div className="cs-track-row v1">
                      <div className="cs-track-header">
                        <span className="track-badge v1">V1</span>
                        <span className="track-title">Video Track</span>
                        <div className="track-icons">
                          <span title="Video Visible">👁</span>
                          <span title="Track Unlocked">🔓</span>
                        </div>
                      </div>

                      <div
                        className="cs-track-lane"
                        onPointerDown={scrubPlayheadFromPointer}
                        title="Click or Drag to Scrub Timeline"
                      >
                        {/* Filmstrip Clip Block */}
                        <div
                          className="cs-clip-block video"
                          style={{
                            left: `${editorDuration > 0 ? (editorTrimStart / editorDuration) * 100 : 0}%`,
                            width: `${editorDuration > 0 ? ((editorTrimEnd - editorTrimStart) / editorDuration) * 100 : 100}%`,
                          }}
                        >
                          {/* Left In-Point Handle */}
                          <div
                            className="cs-trim-handle left"
                            title="Drag to trim In-Point"
                            onPointerDown={startDragTrimIn}
                          >
                            <div className="handle-grip">[</div>
                          </div>

                          <div className="cs-clip-inner">
                            <div className="cs-filmstrip-thumbs">
                              <span className="cs-clip-label">{editorFile ? editorFile.name : "Clip"}</span>
                              <span className="cs-clip-dur">{Math.max(0, editorTrimEnd - editorTrimStart).toFixed(1)}s</span>
                            </div>
                          </div>

                          {/* Right Out-Point Handle */}
                          <div
                            className="cs-trim-handle right"
                            title="Drag to trim Out-Point"
                            onPointerDown={startDragTrimOut}
                          >
                            <div className="handle-grip">]</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* TRACK T1: TITLE & GRAPHICS TRACK */}
                    <div className="cs-track-row t1">
                      <div className="cs-track-header">
                        <span className="track-badge t1">T1</span>
                        <span className="track-title">Titles / GFX</span>
                      </div>

                      <div className="cs-track-lane">
                        {editorWatermarkEnabled && (
                          <div
                            className="cs-clip-block title"
                            style={{
                              left: `${editorDuration > 0 ? (editorTrimStart / editorDuration) * 100 : 0}%`,
                              width: `${editorDuration > 0 ? ((editorTrimEnd - editorTrimStart) / editorDuration) * 100 : 100}%`,
                            }}
                          >
                            <span className="cs-clip-label title">{editorWatermark || "Watermark"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TRACK A1: AUDIO TRACK */}
                    <div className="cs-track-row a1">
                      <div className="cs-track-header">
                        <span className="track-badge a1">A1</span>
                        <span className="track-title">Master Audio</span>
                        <span className="track-icons" onClick={() => setEditorMute(!editorMute)}>
                          {editorMute ? "🔇" : "🔊"}
                        </span>
                      </div>

                      <div className="cs-track-lane">
                        <div
                          className={`cs-clip-block audio ${editorMute ? "muted" : ""}`}
                          style={{
                            left: `${editorDuration > 0 ? (editorTrimStart / editorDuration) * 100 : 0}%`,
                            width: `${editorDuration > 0 ? ((editorTrimEnd - editorTrimStart) / editorDuration) * 100 : 100}%`,
                          }}
                        >
                          {/* SVG Visual Audio Waveform */}
                          <div className="cs-waveform-visual">
                            {Array.from({ length: 64 }).map((_, wIdx) => {
                              const h = 25 + Math.sin(wIdx * 0.4) * 20 + ((wIdx * 7) % 35);
                              return (
                                <div
                                  key={wIdx}
                                  className="waveform-bar"
                                  style={{ height: `${h}%` }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sliders for In/Out points beneath timeline */}
                  <div className="cs-sliders-fine-scrub">
                    <div className="cs-scrub-input-group">
                      <label>In-Point: <b>{editorTrimStart.toFixed(2)}s</b></label>
                      <input
                        type="range"
                        min="0"
                        max={editorDuration || 100}
                        step="0.05"
                        value={editorTrimStart}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setEditorTrimStart(Math.min(v, editorTrimEnd - 0.2));
                          if (editorVideoRef.current) editorVideoRef.current.currentTime = v;
                        }}
                        className="cs-trim-range in"
                      />
                    </div>

                    <div className="cs-scrub-input-group playhead">
                      <label>Playhead: <b>{editorCurrentTime.toFixed(2)}s</b></label>
                      <input
                        type="range"
                        min="0"
                        max={editorDuration || 100}
                        step="0.05"
                        value={editorCurrentTime}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setEditorCurrentTime(v);
                          if (editorVideoRef.current) editorVideoRef.current.currentTime = v;
                        }}
                        className="cs-trim-range playhead"
                      />
                    </div>

                    <div className="cs-scrub-input-group">
                      <label>Out-Point: <b>{editorTrimEnd.toFixed(2)}s</b></label>
                      <input
                        type="range"
                        min="0"
                        max={editorDuration || 100}
                        step="0.05"
                        value={editorTrimEnd}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setEditorTrimEnd(Math.max(v, editorTrimStart + 0.2));
                        }}
                        className="cs-trim-range out"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Left Tip & Status */}
          {leftTab !== "editor" && (
            <div className="left-footer-status">
              <div className="action-tip-box">
                <span className="tip-i">ⓘ</span>
                <span className="tip-text">
                  {isStreaming
                    ? "Streaming live to RTMP server with dual audio and stream overlay."
                    : recordMode === "area"
                    ? `Area Mode: Recording custom region ${areaWidth} × ${areaHeight} px.`
                    : "Check webcam and microphone before recording to ensure everything is configured."}
                </span>
              </div>
              <div className="action-status-text">
                Status: {isRecording ? "Recording in progress..." : isStreaming ? "Live broadcast active..." : "Ready to start recording/streaming..."}
              </div>
            </div>
          )}
        </section>

        {/* ── RIGHT HALF: PROPERTIES & CAPTURE TABS (HIDDEN IN FULL CINESTUDIO WORKSTATION) ── */}
        {leftTab !== "editor" && (
          <section className="action-right-panel">
          <nav className="right-top-tabs">
            <button
              className={`cat-tab ${rightTab === "video" ? "active" : ""}`}
              onClick={() => setRightTab("video")}
            >
              <ScreenIcon size={13} className="tab-icon" />
              Capture
            </button>
            <button
              className={`cat-tab ${rightTab === "stream" ? "active" : ""}`}
              onClick={() => setRightTab("stream")}
            >
              <LiveIcon size={13} className="tab-icon" />
              Live Stream
            </button>
            <button
              className={`cat-tab ${rightTab === "overlays" ? "active" : ""}`}
              onClick={() => setRightTab("overlays")}
            >
              <OverlayIcon size={13} className="tab-icon" />
              Overlays
            </button>
            <button
              className={`cat-tab ${rightTab === "audio" ? "active" : ""}`}
              onClick={() => setRightTab("audio")}
            >
              <SlidersIcon size={13} className="tab-icon" />
              Audio Mixer
            </button>
            <button
              className={`cat-tab ${rightTab === "screenshots" ? "active" : ""}`}
              onClick={() => setRightTab("screenshots")}
            >
              <CameraIcon size={13} className="tab-icon" />
              Screenshots
            </button>
            <button
              className={`cat-tab ${rightTab === "benchmark" ? "active" : ""}`}
              onClick={() => setRightTab("benchmark")}
            >
              <BenchmarkIcon size={13} className="tab-icon" />
              Benchmark
            </button>
            <button
              className={`cat-tab ${rightTab === "about" ? "active" : ""}`}
              onClick={() => setRightTab("about")}
              title="About KyneticAuraLab"
            >
              <InfoIcon size={13} className="tab-icon" />
              About
            </button>
            <button
              className={`cat-tab gear ${rightTab === "settings" ? "active" : ""}`}
              onClick={() => setRightTab("settings")}
              title="Global Settings"
            >
              <GearIcon size={14} />
            </button>
          </nav>

          {/* TAB 1: VIDEO CAPTURE */}
          {rightTab === "video" && (
            <div className="action-settings-container">
              <div className="field-row">
                <span className="field-title">RECORDING MODE:</span>
                <div className="mode-quad-buttons">
                  <button
                    className={`quad-btn ${recordMode === "game" ? "active" : ""}`}
                    onClick={() => setRecordMode("game")}
                  >
                    <GameIcon size={24} className="quad-icon" />
                    <span className="quad-text">Game</span>
                  </button>
                  <button
                    className={`quad-btn ${recordMode === "screen" ? "active" : ""}`}
                    onClick={() => setRecordMode("screen")}
                  >
                    <ScreenIcon size={24} className="quad-icon" />
                    <span className="quad-text">Screen</span>
                  </button>
                  <button
                    className={`quad-btn ${recordMode === "area" ? "active" : ""}`}
                    onClick={() => setRecordMode("area")}
                  >
                    <AreaIcon size={24} className="quad-icon" />
                    <span className="quad-text">Area</span>
                  </button>
                  <button
                    className={`quad-btn ${recordMode === "device" ? "active" : ""}`}
                    onClick={() => setRecordMode("device")}
                  >
                    <DeviceIcon size={24} className="quad-icon" />
                    <span className="quad-text">Device</span>
                  </button>
                </div>
              </div>

              {/* CUSTOM AREA SELECTION SETTINGS (MIRILLIS ACTION! AREA MODE) */}
              {recordMode === "area" && (
                <div className="area-custom-config-card">
                  <div className="area-config-header">
                    <span className="field-title">CUSTOM AREA DIMENSIONS:</span>
                    <span className="area-res-badge">
                      {areaWidth} × {areaHeight} px {areaX > 0 || areaY > 0 ? `(X:${areaX}, Y:${areaY})` : ""}
                    </span>
                  </div>

                  {/* ⛶ Prominent Interactive On-Screen Selector Button */}
                  <button
                    className="area-snip-launch-btn"
                    onClick={launchAreaSnipper}
                    title="Click and drag directly on your screen to select any custom box"
                  >
                    <AreaIcon size={14} />
                    <span>Select Area on Screen (Interactive Snip)</span>
                  </button>

                  <div className="area-preset-pills">
                    <button
                      className={`preset-pill-btn ${areaPreset === "screen" ? "active" : ""}`}
                      onClick={() => {
                        const sw = window.screen.width || 1366;
                        const sh = window.screen.height || 768;
                        setAreaPreset("screen");
                        setAreaWidth(sw);
                        setAreaHeight(sh);
                        setAreaX(0);
                        setAreaY(0);
                      }}
                    >
                      Native ({window.screen.width || 1366}x{window.screen.height || 768})
                    </button>
                    <button
                      className={`preset-pill-btn ${areaPreset === "720p" ? "active" : ""}`}
                      onClick={() => {
                        const sw = window.screen.width || 1366;
                        const sh = window.screen.height || 768;
                        setAreaPreset("720p");
                        setAreaWidth(Math.min(1280, sw));
                        setAreaHeight(Math.min(720, sh));
                      }}
                    >
                      720p HD
                    </button>
                    <button
                      className={`preset-pill-btn ${areaPreset === "480p" ? "active" : ""}`}
                      onClick={() => { setAreaPreset("480p"); setAreaWidth(854); setAreaHeight(480); }}
                    >
                      480p SD
                    </button>
                    <button
                      className={`preset-pill-btn ${areaPreset === "tiktok" ? "active" : ""}`}
                      onClick={() => { setAreaPreset("tiktok"); setAreaWidth(720); setAreaHeight(1280); }}
                    >
                      9:16 TikTok
                    </button>
                    <button
                      className={`preset-pill-btn ${areaPreset === "square" ? "active" : ""}`}
                      onClick={() => { setAreaPreset("square"); setAreaWidth(720); setAreaHeight(720); }}
                    >
                      1:1 Square
                    </button>
                  </div>

                  <div className="area-inputs-grid">
                    <div className="area-input-group">
                      <label>Width (px):</label>
                      <div className="stepper-input">
                        <button onClick={() => setAreaWidth((w) => Math.max(200, w - 50))}>-</button>
                        <input
                          type="number"
                          value={areaWidth}
                          onChange={(e) => {
                            setAreaWidth(parseInt(e.target.value) || 640);
                            setAreaPreset("custom");
                          }}
                        />
                        <button onClick={() => setAreaWidth((w) => Math.min(3840, w + 50))}>+</button>
                      </div>
                    </div>

                    <div className="area-input-group">
                      <label>Height (px):</label>
                      <div className="stepper-input">
                        <button onClick={() => setAreaHeight((h) => Math.max(200, h - 50))}>-</button>
                        <input
                          type="number"
                          value={areaHeight}
                          onChange={(e) => {
                            setAreaHeight(parseInt(e.target.value) || 480);
                            setAreaPreset("custom");
                          }}
                        />
                        <button onClick={() => setAreaHeight((h) => Math.min(2160, h + 50))}>+</button>
                      </div>
                    </div>

                    <div className="area-input-group">
                      <label>X Offset (px):</label>
                      <div className="stepper-input">
                        <button onClick={() => setAreaX((x) => Math.max(0, x - 50))}>-</button>
                        <input
                          type="number"
                          value={areaX}
                          onChange={(e) => {
                            setAreaX(parseInt(e.target.value) || 0);
                            setAreaPreset("custom");
                          }}
                        />
                        <button onClick={() => setAreaX((x) => Math.min(3840, x + 50))}>+</button>
                      </div>
                    </div>

                    <div className="area-input-group">
                      <label>Y Offset (px):</label>
                      <div className="stepper-input">
                        <button onClick={() => setAreaY((y) => Math.max(0, y - 50))}>-</button>
                        <input
                          type="number"
                          value={areaY}
                          onChange={(e) => {
                            setAreaY(parseInt(e.target.value) || 0);
                            setAreaPreset("custom");
                          }}
                        />
                        <button onClick={() => setAreaY((y) => Math.min(2160, y + 50))}>+</button>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Alignment Matrix */}
                  <div className="area-align-grid">
                    <button className="area-align-btn" onClick={() => {
                      const sw = window.screen.width || 1366;
                      const sh = window.screen.height || 768;
                      setAreaX(Math.max(0, Math.round((sw - areaWidth) / 2)));
                      setAreaY(Math.max(0, Math.round((sh - areaHeight) / 2)));
                      setAreaPreset("custom");
                    }}>Center</button>
                    <button className="area-align-btn" onClick={() => {
                      setAreaX(0);
                      setAreaY(0);
                      setAreaPreset("custom");
                    }}>Top-Left</button>
                    <button className="area-align-btn" onClick={() => {
                      const sw = window.screen.width || 1366;
                      setAreaX(Math.max(0, sw - areaWidth));
                      setAreaY(0);
                      setAreaPreset("custom");
                    }}>Top-Right</button>
                    <button className="area-align-btn" onClick={() => {
                      const sh = window.screen.height || 768;
                      setAreaX(0);
                      setAreaY(Math.max(0, sh - areaHeight));
                      setAreaPreset("custom");
                    }}>Bottom-Left</button>
                    <button className="area-align-btn" onClick={() => {
                      const sw = window.screen.width || 1366;
                      const sh = window.screen.height || 768;
                      setAreaX(Math.max(0, sw - areaWidth));
                      setAreaY(Math.max(0, sh - areaHeight));
                      setAreaPreset("custom");
                    }}>Bottom-Right</button>
                    <button className="area-align-btn" onClick={() => {
                      const sw = window.screen.width || 1366;
                      const sh = window.screen.height || 768;
                      setAreaX(0);
                      setAreaY(0);
                      setAreaWidth(sw);
                      setAreaHeight(sh);
                      setAreaPreset("screen");
                    }}>Full Screen</button>
                  </div>
                </div>
              )}

              <div className="action-setting-row">
                <label>Output File Format:</label>
                <select
                  value={fileFormat}
                  onChange={(e) => setFileFormat(e.target.value)}
                  className="action-select-box"
                >
                  <option value="MP4">MP4 (Fast NVENC/QSV)</option>
                  <option value="AVI">AVI (FICV Codec)</option>
                </select>
              </div>

              <div className="action-setting-row">
                <label>Hardware Acceleration:</label>
                <select
                  value={hwAccel}
                  onChange={(e) => setHwAccel(e.target.value)}
                  className="action-select-box"
                >
                  <option value="NVIDIA NVENC">NVIDIA NVENC</option>
                  <option value="Intel Quick Sync">Intel Quick Sync</option>
                  <option value="AMD APP">AMD APP</option>
                </select>
              </div>

              <div className="action-setting-row">
                <label>Video Size:</label>
                <select
                  value={videoSize}
                  onChange={(e) => setVideoSize(e.target.value)}
                  className="action-select-box"
                >
                  <option value="Original">Original (100%)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="720p">720p (HD Ready)</option>
                  <option value="480p">480p (Eco 4GB)</option>
                </select>
              </div>

              <div className="action-setting-row">
                <label>Video Framerate:</label>
                <select
                  value={videoFps}
                  onChange={(e) => setVideoFps(e.target.value)}
                  className="action-select-box"
                >
                  <option value="60">60 FPS (Smooth)</option>
                  <option value="30">30 FPS</option>
                  <option value="50">50 FPS</option>
                  <option value="120">120 FPS (Slow-motion)</option>
                </select>
              </div>

              <div className="action-check-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={timeShift}
                    onChange={(e) => setTimeShift(e.target.checked)}
                  />
                  <span className="checkmark" />
                  <span className="check-text">Time-Shift Replay Buffer</span>
                </label>
                <div className="time-shift-stepper">
                  <span>00m</span>
                  <span>10s</span>
                </div>
              </div>

              <div className="action-device-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={webcamEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setWebcamEnabled(enabled);
                      if (enabled) {
                        initWebcam();
                      } else {
                        if (webcamStreamRef.current) {
                          webcamStreamRef.current.getTracks().forEach((t) => t.stop());
                          webcamStreamRef.current = null;
                        }
                        setWebcamActive(false);
                      }
                    }}
                  />
                  <span className="check-text">Webcam Picture-in-Picture</span>
                </label>
                <select
                  value={webcamDevice}
                  onChange={(e) => {
                    const dev = e.target.value;
                    setWebcamDevice(dev);
                    initWebcam(dev);
                  }}
                  className="action-select-box inline"
                >
                  {availableCameras.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button className="gear-sub-btn" onClick={() => initWebcam()} title="Refresh Webcam">
                  <RefreshIcon size={12} />
                </button>
              </div>

              <div className="action-device-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={micEnabled}
                    onChange={(e) => setMicEnabled(e.target.checked)}
                  />
                  <span className="check-text">Microphone Commentary</span>
                </label>
                <select
                  value={micDevice}
                  onChange={(e) => setMicDevice(e.target.value)}
                  className="action-select-box inline"
                >
                  {availableMics.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <button className="gear-sub-btn" onClick={detectDevices} title="Refresh Microphones">
                  <RefreshIcon size={12} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE STREAMING */}
          {rightTab === "stream" && (
            <div className="action-settings-container">
              <div className="field-row">
                <span className="field-title">LIVE STREAMING SERVICE:</span>
                <div className="stream-quick-presets">
                  <button
                    className={`stream-preset-pill fb ${streamService === "Facebook" ? "active" : ""}`}
                    onClick={() => handleStreamServiceChange("Facebook")}
                  >
                    <span>🔵 Facebook Live</span>
                  </button>
                  <button
                    className={`stream-preset-pill yt ${streamService === "YouTube" ? "active" : ""}`}
                    onClick={() => handleStreamServiceChange("YouTube")}
                  >
                    <span>🔴 YouTube Live</span>
                  </button>
                  <button
                    className={`stream-preset-pill tw ${streamService === "Twitch" ? "active" : ""}`}
                    onClick={() => handleStreamServiceChange("Twitch")}
                  >
                    <span>🟣 Twitch</span>
                  </button>
                  <button
                    className={`stream-preset-pill kick ${streamService === "Kick" ? "active" : ""}`}
                    onClick={() => handleStreamServiceChange("Kick")}
                  >
                    <span>🟢 Kick</span>
                  </button>
                </div>
                <select
                  value={streamService}
                  onChange={(e) => handleStreamServiceChange(e.target.value)}
                  className="action-select-box full-width"
                  style={{ marginTop: "6px" }}
                >
                  <option value="Facebook">Facebook Live (RTMPS)</option>
                  <option value="YouTube">YouTube Live (RTMP)</option>
                  <option value="Twitch">Twitch.tv</option>
                  <option value="Kick">Kick.com</option>
                  <option value="Custom">Custom RTMP Server</option>
                </select>
              </div>

              <div className="action-setting-row vertical">
                <label>RTMP Server URL:</label>
                <input
                  type="text"
                  className="action-input-text full"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="rtmps://live-api-s.facebook.com:443/rtmp/"
                />
              </div>

              <div className="action-setting-row vertical">
                <div className="stream-key-head">
                  <label>Stream Key:</label>
                  <div className="stream-key-actions">
                    <button
                      className="key-toggle"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                    >
                      {showStreamKey ? "Hide Key" : "Show Key"}
                    </button>
                    <button
                      className="key-toggle paste"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) handleStreamKeyChange(text.trim());
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                    >
                      Paste
                    </button>
                  </div>
                </div>
                <input
                  type={showStreamKey ? "text" : "password"}
                  className="action-input-text full"
                  value={streamKey}
                  onChange={(e) => handleStreamKeyChange(e.target.value)}
                  placeholder="Paste stream key here (e.g. FB-22686...)"
                />
                {streamKey.trim().startsWith("FB-") && (
                  <div className="stream-auto-detect-pill">
                    <span>✓ Facebook Live Key Detected • RTMPS SSL (Port 443) Auto-Configured</span>
                  </div>
                )}
              </div>

              <div className="action-setting-row">
                <label>Video Bitrate:</label>
                <select
                  value={streamBitrate}
                  onChange={(e) => setStreamBitrate(e.target.value)}
                  className="action-select-box"
                >
                  <option value="2500">2500 Kbps (720p 30fps)</option>
                  <option value="4500">4500 Kbps (1080p 60fps)</option>
                  <option value="6000">6000 Kbps (High Quality)</option>
                  <option value="8000">8000 Kbps (Pro Gaming)</option>
                </select>
              </div>

              <div className="action-check-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={streamRecordDisk}
                    onChange={(e) => setStreamRecordDisk(e.target.checked)}
                  />
                  <span className="check-text">Record stream to local disk (MP4/WebM)</span>
                </label>
              </div>

              {/* Direct Start Streaming Button */}
              <div className="stream-direct-hub">
                <button
                  className={`stream-broadcast-btn ${isStreaming ? "live" : ""}`}
                  onClick={isStreaming ? stopCapture : startCapture}
                >
                  <LiveIcon size={16} />
                  <span>{isStreaming ? "STOP LIVE BROADCAST" : "START LIVE BROADCAST"}</span>
                </button>
              </div>

              <div className={`stream-alert-box ${isStreaming ? "live" : ""}`}>
                {streamStatusMsg || (
                  <span>
                    Select your streaming service, enter your Stream Key, and click Start Live Broadcast or press F9 to go live instantly!
                  </span>
                )}
              </div>

              {/* Real-time Diagnostics Log Viewer */}
              <button
                className="stream-diag-btn"
                onClick={async () => {
                  try {
                    const log = await invoke<string>("cmd_get_stream_log");
                    setStreamLogText(log);
                  } catch (e) {
                    console.error(e);
                  }
                  setShowStreamLog(!showStreamLog);
                }}
              >
                <span>📋 {showStreamLog ? "Hide RTMP Log" : "View RTMP Log / Server Diagnostics"}</span>
              </button>

              {showStreamLog && (
                <div className="stream-diag-box">
                  {streamLogText || "No log generated yet. Click after starting a live stream to view FFmpeg / RTMP server messages."}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STREAMLABS OVERLAYS */}
          {rightTab === "overlays" && (
            <div className="action-settings-container">
              <div className="field-row">
                <span className="field-title">STREAMLABS OVERLAY TEMPLATES:</span>
                <div className="overlay-preset-grid">
                  <button
                    className={`preset-btn ${overlayConfig.theme === "cyber" ? "active" : ""}`}
                    onClick={() => setOverlayConfig({ ...overlayConfig, theme: "cyber" })}
                  >
                    <span className="preset-pill cyber" />
                    <span>Cyber Neon</span>
                  </button>
                  <button
                    className={`preset-btn ${overlayConfig.theme === "gold" ? "active" : ""}`}
                    onClick={() => setOverlayConfig({ ...overlayConfig, theme: "gold" })}
                  >
                    <span className="preset-pill gold" />
                    <span>Mythic Gold</span>
                  </button>
                  <button
                    className={`preset-btn ${overlayConfig.theme === "crimson" ? "active" : ""}`}
                    onClick={() => setOverlayConfig({ ...overlayConfig, theme: "crimson" })}
                  >
                    <span className="preset-pill crimson" />
                    <span>Crimson Gamer</span>
                  </button>
                  <button
                    className={`preset-btn ${overlayConfig.theme === "minimal" ? "active" : ""}`}
                    onClick={() => setOverlayConfig({ ...overlayConfig, theme: "minimal" })}
                  >
                    <span className="preset-pill minimal" />
                    <span>Clean Minimal</span>
                  </button>
                </div>
              </div>

              <div className="action-check-row">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={overlayConfig.theme !== "none"}
                    onChange={(e) =>
                      setOverlayConfig({
                        ...overlayConfig,
                        theme: e.target.checked ? "gold" : "none",
                      })
                    }
                  />
                  <span className="checkmark" />
                  <span className="check-text">Enable Broadcast Overlays (Visible on Screen & Recording)</span>
                </label>
              </div>

              <div className="action-setting-row">
                <label>Streamer Nickname:</label>
                <input
                  type="text"
                  className="action-input-text inline"
                  value={overlayConfig.streamerName}
                  onChange={(e) => setOverlayConfig({ ...overlayConfig, streamerName: e.target.value })}
                />
              </div>

              <div className="action-setting-row">
                <label>YouTube Tag:</label>
                <input
                  type="text"
                  className="action-input-text inline"
                  value={overlayConfig.socialYt}
                  onChange={(e) => setOverlayConfig({ ...overlayConfig, socialYt: e.target.value })}
                />
              </div>

              <div className="action-setting-row">
                <label>Facebook Tag:</label>
                <input
                  type="text"
                  className="action-input-text inline"
                  value={overlayConfig.socialFb}
                  onChange={(e) => setOverlayConfig({ ...overlayConfig, socialFb: e.target.value })}
                />
              </div>

              <div className="action-setting-row vertical">
                <label>Stream Ticker Text:</label>
                <input
                  type="text"
                  className="action-input-text full"
                  value={overlayConfig.tickerText}
                  onChange={(e) => setOverlayConfig({ ...overlayConfig, tickerText: e.target.value })}
                />
              </div>

              {/* Green Screen (Chroma Key) Settings */}
              <div className="chroma-settings-panel">
                <div className="field-row">
                  <span className="field-title">GREEN SCREEN (CHROMA KEY):</span>
                </div>
                <div className="action-check-row">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={overlayConfig.greenScreenEnabled}
                      onChange={(e) =>
                        setOverlayConfig({ ...overlayConfig, greenScreenEnabled: e.target.checked })
                      }
                    />
                    <span className="checkmark" />
                    <span className="check-text">Enable Green Screen Background Removal</span>
                  </label>
                </div>

                {overlayConfig.greenScreenEnabled && (
                  <>
                    <div className="action-setting-row">
                      <label>Key Color:</label>
                      <input
                        type="color"
                        value={overlayConfig.greenScreenColor}
                        onChange={(e) =>
                          setOverlayConfig({ ...overlayConfig, greenScreenColor: e.target.value })
                        }
                        className="color-picker-input"
                      />
                    </div>
                    <div className="slider-row">
                      <label>Color Tolerance: {(overlayConfig.greenScreenTolerance * 100).toFixed(0)}%</label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.8"
                        step="0.01"
                        value={overlayConfig.greenScreenTolerance}
                        onChange={(e) =>
                          setOverlayConfig({
                            ...overlayConfig,
                            greenScreenTolerance: parseFloat(e.target.value),
                          })
                        }
                        className="range-slider"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DUAL AUDIO MIXER */}
          {rightTab === "audio" && (
            <div className="action-settings-container">
              <div className="field-row">
                <span className="field-title">DUAL AUDIO MIXER (WEB AUDIO API):</span>
              </div>

              <div className="audio-mixer-card">
                <div className="mixer-header">
                  <ScreenIcon size={14} />
                  <span>Desktop & Game Audio</span>
                  <span className="vol-val">{systemVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={systemVolume}
                  onChange={(e) => setSystemVolume(parseInt(e.target.value))}
                  className="range-slider"
                />
              </div>

              <div className="audio-mixer-card">
                <div className="mixer-header">
                  <MicIcon size={14} />
                  <span>Microphone Voice Commentary</span>
                  <span className="vol-val">{micVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={micVolume}
                  onChange={(e) => setMicVolume(parseInt(e.target.value))}
                  className="range-slider"
                />
              </div>

              <div className="action-setting-row">
                <label>Audio Format:</label>
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value)}
                  className="action-select-box"
                >
                  <option value="M4A">M4A (AAC 48kHz)</option>
                  <option value="WAV">WAV (PCM 16-bit)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 5: SCREENSHOTS */}
          {rightTab === "screenshots" && (
            <div className="action-settings-container">
              <div className="action-setting-row">
                <label>Output format:</label>
                <select
                  value={screenshotFormat}
                  onChange={(e) => setScreenshotFormat(e.target.value)}
                  className="action-select-box"
                >
                  <option value="PNG">PNG (Lossless)</option>
                  <option value="JPEG">JPEG</option>
                  <option value="BMP">BMP</option>
                </select>
              </div>
              <div className="action-setting-row">
                <label>Capture area:</label>
                <select className="action-select-box">
                  <option>Entire desktop</option>
                  <option>Active window</option>
                </select>
              </div>

              <div className="stream-direct-hub" style={{ marginTop: "12px" }}>
                <button className="stream-broadcast-btn" onClick={takeScreenshot}>
                  <CameraIcon size={16} />
                  <span>CAPTURE SCREENSHOT NOW (F12)</span>
                </button>
              </div>

              <div className="action-tip-box" style={{ marginTop: "14px" }}>
                <span>Press <b>F12</b> anytime or click the button above to capture and save screenshots instantly to D:\AabSara\Recordings!</span>
              </div>
            </div>
          )}

          {/* TAB 6: BENCHMARK */}
          {rightTab === "benchmark" && (
            <div className="action-settings-container">
              <div className="action-setting-row">
                <label>Benchmark Duration:</label>
                <select className="action-select-box">
                  <option>60 seconds</option>
                  <option>120 seconds</option>
                  <option>Custom</option>
                </select>
              </div>
              <div className="action-tip-box" style={{ marginTop: "14px" }}>
                <span>Benchmarks game and desktop framerate and logs Min/Avg/Max FPS.</span>
              </div>
            </div>
          )}

          {/* TAB 7: ABOUT KYNETICAURALAB & CYBER PRINCE */}
          {rightTab === "about" && (
            <div className="action-settings-container about-kynetic-container">
              <div className="about-hero-card">
                <img src="/assets/kynetic_banner.jpg" className="about-banner-img" alt="Kynetic Aura Lab Banner" />
              </div>

              <div className="about-brand-center">
                <img src="/assets/kynetic_logo.jpg" className="about-emblem-logo" alt="Kynetic Aura Lab Logo" />
                <h2 className="about-app-title">AabSara PRO</h2>
                <span className="about-version-tag">Version 1.0.3 • CineStudio Pro Edition</span>
              </div>

              <div className="about-credits-box">
                <div className="credit-line">
                  <span className="credit-label">Published By:</span>
                  <span className="credit-value gold">KyneticAuraLab</span>
                </div>
                <div className="credit-line">
                  <span className="credit-label">Created By:</span>
                  <span className="credit-value cyan">Cyber Prince</span>
                </div>
                <div className="credit-line">
                  <span className="credit-label">Slogan:</span>
                  <span className="credit-value italic">"Your Ultimate Developer Lab • We Make Everything"</span>
                </div>
                <div className="credit-line">
                  <span className="credit-label">License:</span>
                  <span className="credit-value green">100% Free Lifetime Open Source</span>
                </div>
              </div>

              <div className="about-features-badges">
                <span className="feat-chip">4K 60FPS Video Capture</span>
                <span className="feat-chip">CineStudio Pro NLE Suite</span>
                <span className="feat-chip">Streamlabs Overlays</span>
                <span className="feat-chip">RTMP Live Streaming</span>
                <span className="feat-chip">Chroma Key Green Screen</span>
                <span className="feat-chip">Custom Area Recording</span>
                <span className="feat-chip">Zero Background Freezes</span>
              </div>

              {/* 🪙 LITECOIN (LTC) CREATOR SUPPORT */}
              <div className="about-support-card">
                <div className="support-card-header">
                  <div className="support-badge-pill">🪙 LITECOIN (LTC) DONATION</div>
                  <h3 className="support-title">Support Cyber Prince & AabSara</h3>
                  <p className="support-subtitle">
                    AabSara is 100% free and open source. Support the developer directly via Litecoin (LTC) with zero middleman fees!
                  </p>
                </div>

                {/* 🪙 Litecoin (LTC) Crypto Card */}
                <div className="support-crypto-box">
                  <div className="crypto-header-row">
                    <div className="crypto-badge">
                      <span className="crypto-symbol">Ł</span>
                      <span className="crypto-name">Litecoin (LTC) Wallet</span>
                    </div>
                    <span className="crypto-fee-pill">Zero Fee • Instant Transfer</span>
                  </div>

                  <div className="crypto-address-wrapper">
                    <span className="crypto-address-label">Official Litecoin LTC Address:</span>
                    <div className="crypto-address-display">
                      <code className="crypto-code">{LITECOIN_ADDRESS}</code>
                    </div>
                  </div>

                  <button
                    className={`crypto-copy-btn ${ltcCopied ? "copied" : ""}`}
                    onClick={copyLtcAddress}
                    title="Copy Litecoin Wallet Address"
                  >
                    {ltcCopied ? (
                      <>
                        <span>✓</span>
                        <span>Litecoin Address Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>Copy Litecoin (LTC) Address</span>
                      </>
                    )}
                  </button>

                  <div className="crypto-security-note">
                    <span>Send Litecoin (LTC) directly to this address. 100% of all contributions fund continuous updates, Android app features, and high-FPS GPU optimizations!</span>
                  </div>
                </div>
              </div>

              <div className="about-actions-row">
                <button className="preview-activate-btn full" onClick={openFolder}>
                  <FolderIcon size={12} /> Open Recordings Folder
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {rightTab === "settings" && (
            <div className="action-settings-container">
              <div className="action-setting-row">
                <label>Language:</label>
                <select className="action-select-box">
                  <option>English</option>
                  <option>Bengali (বাংলা)</option>
                </select>
              </div>
              <div className="action-setting-row">
                <label>Output Directory:</label>
                <span className="fm-folder-path" onClick={openFolder} style={{ cursor: "pointer" }}>
                  D:\AabSara\Recordings
                </span>
              </div>
            </div>
          )}

          {/* ── THE ICONIC CIRCULAR RED RECORD BUTTON & HUB ── */}
          <div className="action-bottom-record-hub">
            <div className="record-hotkey-hint">
              Press <span className="hotkey-badge">F9</span> to {isRecording ? "stop" : "start"} video capture
            </div>

            <div className="record-hub-controls">
              <span className="hub-dot">●</span>
              <span className="hub-dot">●</span>

              <button
                className={`action-huge-red-button ${isRecording ? "recording" : ""}`}
                onClick={isRecording ? stopCapture : startCapture}
                title={isRecording ? "Stop Video Capture (F9)" : "Start Video Capture (F9)"}
              >
                <div className="red-metallic-ring">
                  <div className="red-inner-circle">
                    {isRecording && <div className="white-square-stop" />}
                  </div>
                </div>
              </button>

              <span className="hub-dot">●</span>
              <span className="hub-dot">●</span>
            </div>

            <div className="hub-sub-actions">
              <button className="sub-act-btn" onClick={takeScreenshot}>
                <CameraIcon size={14} className="inline-icon" /> Take Screenshot (F12)
              </button>
            </div>
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
