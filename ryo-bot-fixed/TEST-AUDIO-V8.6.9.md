# Ryo Assistant V8.6.9 — Audio Test Report

## Static checks
- `node --check index.js`: PASS
- Required audio commands present: PASS
- Old V8.6.8/V8.6.5 references in `index.js`: none
- `package.json` version: 8.6.9
- `package-lock.json` root version: 8.6.9

## FFmpeg media checks
Tested with a generated 5-second sample audio:
- Audio → Voice Note (Opus OGG): PASS
- Potong Audio: PASS
- Audio → OGG/M4A/FLAC conversion: PASS
- Audio → Video sederhana (H.264/AAC MP4): PASS
- Video → Audio (MP3): PASS

## Runtime requirements
- `ffmpeg` must be installed and available in PATH.
- `yt-dlp` must be installed and available in PATH for `!play`, `!song`, `!music`, and `!ytmp3`.
- `GEMINI_API_KEY` must be configured for `!stt` / `!transcribe`.

Note: direct YouTube live download was not executed in the build environment because `yt-dlp` is not installed there; the bot code reuses the same `yt-dlp` runtime already used by Ryo's existing YouTube/Instagram download features.
