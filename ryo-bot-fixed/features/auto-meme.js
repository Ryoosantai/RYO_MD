const fs = require('fs');
const path = require('path');
let axios;
function getAxios() {
    if (!axios) axios = require('axios');
    return axios;
}
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const DATA_DIR = path.join(__dirname, '..');
const SETTINGS_FILE = path.join(DATA_DIR, 'auto-meme.json');
const TMP_DIR = path.join(DATA_DIR, 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const DEFAULT_ON = String(process.env.RYO_AUTOMEME_DEFAULT_ON || 'true').toLowerCase() !== 'false';
const PROBABILITY = Math.max(0.01, Math.min(Number(process.env.RYO_AUTOMEME_PROBABILITY) || 0.06, 0.25));
const COOLDOWN_MS = Math.max(5 * 60 * 1000, (Number(process.env.RYO_AUTOMEME_COOLDOWN_MINUTES) || 45) * 60 * 1000);
const MAX_MEDIA = 6 * 1024 * 1024;

const TRIGGER_RE = /(?:wkwk|wk\b|haha+|hehe+|hihi+|ngakak|kocak|lucu|lol|lmao|anjir|anjay|buset|gila|waduh|astaga|😂|🤣|😭|💀|😹|😆|😹)/iu;

function readSettings() {
    try {
        if (!fs.existsSync(SETTINGS_FILE)) return {};
        const value = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
        return value && typeof value === 'object' ? value : {};
    } catch {
        return {};
    }
}

function writeSettings(settings) {
    const temp = `${SETTINGS_FILE}.tmp`;
    try {
        fs.writeFileSync(temp, JSON.stringify(settings, null, 2));
        fs.renameSync(temp, SETTINGS_FILE);
    } catch {
        try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch {}
    }
}

function getSetting(jid) {
    const settings = readSettings();
    if (!settings[jid]) {
        settings[jid] = { enabled: DEFAULT_ON, lastSentAt: 0 };
        writeSettings(settings);
    }
    return settings[jid];
}

function setEnabled(jid, enabled) {
    const settings = readSettings();
    const current = settings[jid] || { enabled: DEFAULT_ON, lastSentAt: 0 };
    settings[jid] = { ...current, enabled: Boolean(enabled) };
    writeSettings(settings);
    return settings[jid];
}

function randomUrl() {
    // Wholesome source keeps the automatic channel safer than the unrestricted endpoint.
    const endpoints = [
        'https://meme-api.com/gimme/wholesomememes',
        'https://meme-api.com/gimme/memes'
    ];
    return endpoints[Math.floor(Math.random() * endpoints.length)];
}

function isSupportedImage(url, contentType) {
    const type = String(contentType || '').toLowerCase();
    if (type.includes('gif')) return false;
    if (type.includes('image/')) return true;
    return /\.(?:jpe?g|png|webp)(?:\?|$)/i.test(url || '');
}

async function fetchRandomMeme() {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await getAxios().get(randomUrl(), {
                timeout: 15000,
                headers: { 'User-Agent': 'Ryo-Assistant-AutoMeme/8.7.0' },
                maxContentLength: 512 * 1024
            });
            const item = response.data || {};
            if (item.nsfw || item.spoiler || !item.url) continue;
            const media = await getAxios().get(item.url, {
                responseType: 'arraybuffer',
                timeout: 20000,
                maxContentLength: MAX_MEDIA,
                maxBodyLength: MAX_MEDIA,
                headers: { 'User-Agent': 'Ryo-Assistant-AutoMeme/8.7.0' }
            });
            const buffer = Buffer.from(media.data);
            if (!buffer.length || buffer.length > MAX_MEDIA) continue;
            if (!isSupportedImage(item.url, media.headers?.['content-type'])) continue;
            return { buffer, title: item.title || 'Ryo Meme', source: item.postLink || '' };
        } catch {}
    }
    return null;
}

async function imageToSticker(buffer) {
    const stamp = `automeme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const input = path.join(TMP_DIR, `${stamp}.img`);
    const output = path.join(TMP_DIR, `${stamp}.webp`);
    fs.writeFileSync(input, buffer);
    try {
        await execFileAsync('ffmpeg', [
            '-hide_banner', '-loglevel', 'error', '-y',
            '-i', input,
            '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white',
            '-vcodec', 'libwebp', '-q:v', '72', '-compression_level', '6',
            '-preset', 'picture', '-loop', '0',
            output
        ], { timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
        if (!fs.existsSync(output)) return null;
        const result = fs.readFileSync(output);
        return result.length >= 256 ? result : null;
    } catch {
        return null;
    } finally {
        for (const file of [input, output]) {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {}
        }
    }
}

function shouldTrigger(body) {
    return Boolean(body && TRIGGER_RE.test(body));
}

async function getRandomMemeSticker() {
    const meme = await fetchRandomMeme();
    if (!meme) return null;
    return { ...meme, sticker: await imageToSticker(meme.buffer) };
}

async function maybeSendAutomaticMeme({ sock, from, body, msg }) {
    if (!sock || !from || !body || !msg || msg.key?.fromMe) return false;
    if (body.length < 2 || body.length > 1200) return false;
    if (body.startsWith('.') || body.startsWith('!') || body.startsWith('/')) return false;
    if (!shouldTrigger(body)) return false;
    if (Math.random() > PROBABILITY) return false;

    const setting = getSetting(from);
    if (!setting.enabled) return false;
    if (Date.now() - Number(setting.lastSentAt || 0) < COOLDOWN_MS) return false;

    const meme = await fetchRandomMeme();
    if (!meme) return false;
    const sticker = await imageToSticker(meme.buffer);
    if (!sticker) return false;

    try {
        await sock.sendMessage(from, { sticker }, { quoted: msg });
        const settings = readSettings();
        settings[from] = { ...(settings[from] || setting), lastSentAt: Date.now() };
        writeSettings(settings);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    getSetting,
    setEnabled,
    shouldTrigger,
    maybeSendAutomaticMeme,
    getRandomMemeSticker,
    PROBABILITY,
    COOLDOWN_MS,
    _test: { readSettings }
};
