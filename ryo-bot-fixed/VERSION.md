# Ryo Assistant V8.7.1

## V8.7.0 Update
- Mempertahankan handler fitur V8.6.9 yang sudah ada.
- Menu utama diperbarui dengan tampilan lebih aesthetic dan elegan.
- AI Voice Node baru: `.aivoice`, `.aivn`, `.aichatv`.
- AI aliases: `.aichat`, `.aichatt`, `.aiimage`, `.aiimage2`.
- Legacy aliases: `.stiker`, `.wm`, `.tovn`, `.toaudio`, `.tomp3`.
- Auto Meme Sticker: random sticker pada momen chat tertentu, dengan cooldown dan toggle per-chat.
- World News Update: `.news` / `.newsinfo` untuk headline terbaru.
- Scheduled News: pukul 07:00 WIB; default dikirim ke Owner, grup dapat opt-in dengan `.newsauto on`.
- News state dan auto-meme state disimpan atomik agar lebih aman saat restart.
- Smoke test untuk modul fitur baru ditambahkan.

## AI Voice
- Menggunakan Gemini TTS melalui REST API.
- Model default: `gemini-3.8-flash-tts`.
- Fallback: `gemini-2.5-flash-preview-tts`.
- Output dikonversi FFmpeg menjadi Opus/voice note WhatsApp.
- Membutuhkan `GEMINI_API_KEY` dan `ffmpeg`.

## World News
- Mengambil RSS Google News edition Indonesia (Dunia, Indonesia, Teknologi).
- Headline dideduplikasi dan dibatasi agar aman dikirim ke WhatsApp.
- Pengiriman otomatis berjalan berdasarkan zona waktu `Asia/Jakarta` dan mencegah pengiriman ganda per tanggal.

## Auto Meme
- Sumber utama: Meme API dengan subreddit `wholesomememes`; fallback ke endpoint memes.
- Hanya media gambar non-GIF dan hasil berukuran terbatas yang diproses menjadi WebP sticker.
- Trigger berdasarkan kata/emoji momen lucu, probabilitas default 6%, cooldown default 45 menit.

## Runtime requirement
- Node.js 20+ direkomendasikan.
- `ffmpeg`
- `yt-dlp` untuk fitur audio YouTube yang sudah ada.
- `GEMINI_API_KEY` untuk STT dan AI Voice.

## Baileys
- Paket proyek tetap menggunakan `@whiskeysockets/baileys` dari lockfile proyek.
- Jangan menampilkan `baileysv2@9.0.2` sebagai versi faktual tanpa paket yang benar-benar terpasang.
