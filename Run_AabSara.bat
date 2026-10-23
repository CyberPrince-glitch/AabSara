@echo off
title AabSara PRO Launcher
cd /d D:\AabSara

if exist "AabSara_Release\AabSara_Portable.exe" (
    echo Starting AabSara PRO Standalone Portable Executable...
    start "" "AabSara_Release\AabSara_Portable.exe"
    exit
)

if exist "src-tauri\target\release\aabsara.exe" (
    echo Starting AabSara PRO Release Executable...
    start "" "src-tauri\target\release\aabsara.exe"
    exit
)

echo Starting AabSara PRO Development Mode...
npm run tauri dev
pause
