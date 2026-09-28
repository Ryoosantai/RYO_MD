const jimpPkg = require('jimp');
const Jimp = jimpPkg.Jimp || jimpPkg;
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const FormData = require('form-data');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec, execFile } = require('child_process');

const TMP_DIR = path.join(__dirname, 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const log = console;
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 Ryo Assistant Web Server Active v8.6.5 AI Toolkit Update!');
});

app.listen(PORT, () => {
console.log(`🌐 Server berjalan di port ${PORT}`);
});

const startTime = Date.now();
const PHONE_NUMBER = "6283829451488";

const MENU_BANNER = "https://files.catbox.moe/nchrg7.png";

const BANNERS = {
    tt: "https://files.catbox.moe/b08wpx.jpg",
    ig: "https://files.catbox.moe/b08wpx.jpg",
    fb: "https://files.catbox.moe/b08wpx.jpg",
    x: "https://files.catbox.moe/z29jsl.jpg",
    yt: "https://files.catbox.moe/2y6yc8.jpg",
    pin: "https://files.catbox.moe/kbfw6f.jpg",
    ai: "https://files.catbox.moe/72cpsm.jpg",
    persona: "https://files.catbox.moe/33nx2u.jpg",
    code: "https://files.catbox.moe/mn8mnt.jpg",
    tr: "https://files.catbox.moe/r7ulto.jpg",
    essay: "https://files.catbox.moe/xac3pc.jpg",
    rangkum: "https://files.catbox.moe/yw9gvy.jpg",
    grammar: "https://files.catbox.moe/rag4f7.jpg",
    gambar: "https://files.catbox.moe/m9l92u.jpg",
    anime: "https://files.catbox.moe/ah7gkp.jpg",
    threed: "https://files.catbox.moe/a8gnlk.jpg",
    pixel: "https://files.catbox.moe/s96fsf.jpeg",
    logo: "https://files.catbox.moe/rhc68p.jpg",
    cyberpunk: "https://files.catbox.moe/19icsx.jpeg",
    sketch: "https://files.catbox.moe/xu6dzx.jpg",
    status: "https://files.catbox.moe/kbfw6f.jpg",
    media: "https://files.catbox.moe/2y6yc8.jpg",
    group: "https://files.catbox.moe/kbfw6f.jpg",
    profile: "https://files.catbox.moe/33nx2u.jpg",
    shop: "https://files.catbox.moe/72cpsm.jpg"
};

const PERSONA_BANNERS = {
    santai: "https://files.catbox.moe/oaa0gb.jpg",
    pemarah: "https://files.catbox.moe/o2wpwh.jpg",
    pendiam: "https://files.catbox.moe/ykxozq.jpg"
};

const PERSONA_FILE = path.join(__dirname, 'personas.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const { handleEntertainment } = require('./entertainment');

class ImageQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    add(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;
        const { task, resolve, reject } = this.queue.shift();
        try {
            const result = await task();
            resolve(result);
        } catch (err) {
            reject(err);
        } finally {
            setTimeout(() => {
                this.isProcessing = false;
                this.process();
            }, 1000);
        }
    }

    size() {
        return this.queue.length;
    }
}

const imgQueue = new ImageQueue();

function getPersona(jid) {
    if (!jid || typeof jid !== 'string') return 'santai';
    try {
        if (!fs.existsSync(PERSONA_FILE)) return 'santai';
        const data = JSON.parse(fs.readFileSync(PERSONA_FILE, 'utf8'));
        return data[jid] || 'santai';
    } catch {
        return 'santai';
    }
}

function setPersona(jid, persona) {
    if (!jid || typeof jid !== 'string') return;
    let data = {};
    try {
        if (fs.existsSync(PERSONA_FILE)) {
            data = JSON.parse(fs.readFileSync(PERSONA_FILE, 'utf8'));
        }
    } catch {}
    data[jid] = persona;
    fs.writeFileSync(PERSONA_FILE, JSON.stringify(data, null, 2));
}

function getUsersData() {
    try {
        if (!fs.existsSync(USERS_FILE)) return {};
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return {};
    }
}

function saveUsersData(data) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
    } catch {}
}

function addExpAndStat(jid, commandType = 'cmd') {
    if (!jid) return;
    let db = getUsersData();
    if (!db[jid]) {
        db[jid] = {
            exp: 0,
            level: 1,
            coins: 500,
            lastDaily: 0,
            totalCmd: 0,
            aiCount: 0,
            stickerCount: 0,
            downloadCount: 0,
            badges: ['Newbie 🌱'],
            todos: []
        };
    }

    if (db[jid].coins === undefined) db[jid].coins = 500;
    if (db[jid].lastDaily === undefined) db[jid].lastDaily = 0;
    if (db[jid].aiDailyCount === undefined) db[jid].aiDailyCount = 0;
    if (db[jid].aiDailyDate === undefined) db[jid].aiDailyDate = getJakartaDateKey();
    if (!db[jid].todos) db[jid].todos = [];

    db[jid].exp += 15;
    db[jid].totalCmd += 1;
    db[jid].coins += 10;

    if (commandType === 'ai') db[jid].aiCount += 1;
    if (commandType === 'sticker') db[jid].stickerCount += 1;
    if (commandType === 'download') db[jid].downloadCount += 1;

    const requiredExp = db[jid].level * 100;
    if (db[jid].exp >= requiredExp) {
        db[jid].level += 1;
        db[jid].exp -= requiredExp;
        db[jid].coins += 250;
    }

    let badges = ['Newbie 🌱'];
    if (db[jid].level >= 3) badges.push('Active User ⚡');
    if (db[jid].level >= 5) badges.push('Ryo Elite 🔥');
    if (db[jid].level >= 10) badges.push('Master Alchemist 👑');
    if (db[jid].aiCount >= 10) badges.push('AI Whisperer 🧠');
    if (db[jid].stickerCount >= 10) badges.push('Sticker Lord 🎨');
    if (db[jid].downloadCount >= 10) badges.push('Media Hunter 📥');
    if (db[jid].coins >= 5000) badges.push('Sultan 💰');

    db[jid].badges = Array.from(new Set(badges));
    saveUsersData(db);
}

const DAILY_MESSAGE_LIMITS = {
    1: 10,
    2: 20,
    3: 35,
    4: 55,
    5: 80,
    6: 110,
    7: 145,
    8: 185
};
const DAILY_MESSAGE_MAX = 200;

function getDailyMessageLimit(level = 1) {
    const safeLevel = Math.max(1, Number(level) || 1);
    return DAILY_MESSAGE_LIMITS[safeLevel] || DAILY_MESSAGE_MAX;
}

function normalizeNumber(value = '') {
    const raw = String(value).split(':')[0].split('@')[0];
    if (!raw) return '';
    return raw.startsWith('0') ? `62${raw.slice(1)}` : raw;
}

async function checkDailyQuota({ jid, sock }) {
    const ownerNumber = '6283829451488';
    const senderNumber = normalizeNumber(jid);
    const botNumber = normalizeNumber(sock?.user?.id || '');

    let isOwnerOrBot = senderNumber === ownerNumber || (botNumber && senderNumber === botNumber);

    try {
        if (!isOwnerOrBot && jid?.endsWith('@lid')) {
            const lidMapping = sock?.signalRepository?.lidMapping;
            if (lidMapping) {
                const mappedPN = await lidMapping.getPNForLID(jid);
                isOwnerOrBot = normalizeNumber(mappedPN) === ownerNumber || normalizeNumber(mappedPN) === botNumber;
            }
        }
    } catch (e) {
        console.log(`[DAILY QUOTA] LID mapping error: ${e.message}`);
    }

    if (isOwnerOrBot) {
        return { allowed: true, unlimited: true, limit: Infinity, used: 0, remaining: Infinity, level: Infinity };
    }

    const db = getUsersData();
    if (!db[jid]) {
        db[jid] = {
            exp: 0, level: 1, coins: 500, lastDaily: 0, totalCmd: 0,
            aiCount: 0, aiDailyCount: 0, aiDailyDate: getJakartaDateKey(),
            dailyMessageCount: 0, dailyMessageDate: getJakartaDateKey(),
            stickerCount: 0, downloadCount: 0, badges: ['Newbie 🌱'], todos: []
        };
    }

    const today = getJakartaDateKey();
    if (db[jid].dailyMessageDate !== today) {
        db[jid].dailyMessageDate = today;
        db[jid].dailyMessageCount = 0;
    }

    const level = Math.max(1, Number(db[jid].level) || 1);
    const limit = getDailyMessageLimit(level);
    const used = Math.max(0, Number(db[jid].dailyMessageCount) || 0);

    if (used >= limit) {
        saveUsersData(db);
        return { allowed: false, unlimited: false, limit, used, remaining: 0, level };
    }

    db[jid].dailyMessageCount = used + 1;
    db[jid].dailyMessageDate = today;
    saveUsersData(db);

    return { allowed: true, unlimited: false, limit, used: used + 1, remaining: limit - used - 1, level };
}

function getDailyQuotaText(quota) {
    if (quota?.unlimited) return '♾️ Pesan/Fitur Harian: *UNLIMITED*';
    return `📨 Pesan/Fitur Hari Ini: *${quota.used}/${quota.limit}*\n📈 Level: *${quota.level}*\n🎁 Sisa: *${quota.remaining}*`;
}

function getUserRank(jid) {
    let db = getUsersData();
    let users = Object.keys(db).map(k => ({
        jid: k,
        score: (db[k].level * 1000) + db[k].exp + db[k].totalCmd
    }));
    users.sort((a, b) => b.score - a.score);
    let rankIndex = users.findIndex(u => u.jid === jid);
    return rankIndex !== -1 ? rankIndex + 1 : users.length + 1;
}

function formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getTargetUser(msg, args) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    if (contextInfo?.mentionedJid?.length > 0) return contextInfo.mentionedJid[0];
    if (contextInfo?.participant) return contextInfo.participant;
    if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '');
        if (num) return `${num}@s.whatsapp.net`;
    }
    return null;
}

async function sendSmartMessage(sock, jid, payload, options = {}) {
    try {
        return await sock.sendMessage(jid, payload, options);
    } catch (err) {
        if (payload.image && payload.caption) {
            return await sock.sendMessage(jid, { text: payload.caption }, options);
        } else if (payload.video && payload.caption) {
            return await sock.sendMessage(jid, { text: payload.caption + '\n\n*(Catatan: Video gagal dikirim karena ukuran terlalu besar)*' }, options);
        } else if (payload.image && !payload.caption) {
            return await sock.sendMessage(jid, { text: '❌ [Media gagal dimuat oleh server]' }, options);
        }
    }
}

async function callAI(systemPrompt, userPrompt) {
    try {
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
        const encodedPrompt = encodeURIComponent(fullPrompt);
        const response = await axios.get(`https://text.pollinations.ai/${encodedPrompt}?model=openai`, {
            timeout: 30000
        });
        if (response.data) {
            return typeof response.data === 'string' ? response.data.trim() : JSON.stringify(response.data);
        }
    } catch (err) {}
    return "❌ Waduh, koneksi AI lagi terganggu nih. Coba sebentar lagi ya!";
}

async function askAI(query, persona) {
    let systemPrompt = "Kamu adalah Ryo, asisten AI WhatsApp yang santai, ramah, dan asik berbahasa Indonesia.";
    if (persona === 'pemarah') {
        systemPrompt = "Kamu adalah Ryo, asisten AI WhatsApp yang pemarah, gampang emosi, ngegas, dan ketus, tapi tetap menjawab pertanyaan dalam bahasa Indonesia.";
    } else if (persona === 'pendiam') {
        systemPrompt = "Kamu adalah Ryo, asisten AI WhatsApp yang pendiam, irit kata, jawab sangat singkat dan padat dalam bahasa Indonesia.";
    }
    return await callAI(systemPrompt, query);
}

function isValidImageBuffer(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 500) return false;
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x37) return true;
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x48) return true;
    return false;
}

async function uploadMedia(mediaBuffer, filename = 'image.jpg') {
    if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) return null;
    try {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', mediaBuffer, filename);
        const res = await axios.post('https://catbox.moe/user/api.php', formData, {
            headers: formData.getHeaders(),
            timeout: 60000
        });
        return res.data ? res.data.trim() : null;
    } catch (err) {
        return null;
    }
}

async function autoFixFace(mediaBuffer) {
    try {
        const uploadedUrl = await uploadMedia(mediaBuffer, 'image.jpg');
        if (!uploadedUrl) return mediaBuffer;

        const apis = [
            `https://widipe.com/remini?url=${encodeURIComponent(uploadedUrl)}`,
            `https://itzpire.site/tools/remini?url=${encodeURIComponent(uploadedUrl)}`,
            `https://api.siputzx.my.id/api/tools/remini?url=${encodeURIComponent(uploadedUrl)}`
        ];

        for (const api of apis) {
            try {
                const res = await axios.get(api, { timeout: 25000 });
                const resultUrl = res.data?.url || res.data?.result || res.data?.data || res.data?.image;
                if (resultUrl && typeof resultUrl === 'string' && resultUrl.startsWith('http')) {
                    const dlRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 25000 });
                    if (isValidImageBuffer(Buffer.from(dlRes.data))) {
                        return Buffer.from(dlRes.data);
                    }
                }
            } catch (e) {
                continue;
            }
        }
    } catch (e) {}
    return mediaBuffer;
}

async function generateCleanImageBuffer(prompt, style = 'flux', width = 1080, height = 1920) {
    const isFullBody = /full|ful|badan|seluruh|berdiri|panjang|kaki|body/i.test(prompt);

    let baseStyleModifier = "";
    if (style === 'anime') {
        baseStyleModifier = "masterpiece anime style, clear clean lines, high resolution portrait, crisp 4k, no watermark";
    } else if (style === '3d') {
        baseStyleModifier = "3d render style, smooth cinematic lighting, highly detailed features, no watermark";
    } else if (style === 'pixel') {
        baseStyleModifier = "clean 16-bit retro pixel art, well-defined character, no watermark";
    } else if (style === 'logo') {
        baseStyleModifier = "vector logo design, minimalist, clean lines, no watermark";
    } else if (style === 'cyberpunk') {
        baseStyleModifier = "neon lighting, highly detailed futuristic attire, sharp details, no watermark";
    } else if (style === 'sketch') {
        baseStyleModifier = "pencil sketch drawing, high definition shading, no watermark";
    } else {
        baseStyleModifier = "realistic photo quality, 8k resolution, photorealistic, sharp focus, no watermark";
    }

    let finalPrompt = "";
    if (isFullBody) {
        finalPrompt = `full body shot, full length shot, complete body visible from head to toe, standing posture, wide angle shot, ${prompt}, ${baseStyleModifier}, detailed clear symmetrical face features`;
    } else {
        finalPrompt = `close-up portrait, ultra detailed face, perfectly proportioned eyes, sharp facial features, ${prompt}, ${baseStyleModifier}`;
    }

    const encodedPrompt = encodeURIComponent(finalPrompt);
    const seed = Math.floor(Math.random() * 9999999);
    const aiModel = style === 'anime' ? 'anime' : 'flux';

    const CROP_SIZE = 120;
    const requestHeight = height + CROP_SIZE;

    const api = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${requestHeight}&seed=${seed}&nologo=true&enhance=true&model=${aiModel}`;

    let rawBuffer = null;
    let retries = 3;

    while (retries > 0 && !rawBuffer) {
        try {
            const response = await axios.get(api, { responseType: 'arraybuffer', timeout: 60000 });
            if (response.data && isValidImageBuffer(Buffer.from(response.data))) {
                rawBuffer = Buffer.from(response.data);
                break;
            }
        } catch (e) {
            retries--;
            if (retries === 0) break;
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    if (!rawBuffer) throw new Error('Server AI sedang sibuk.');

    let croppedBuffer = rawBuffer;

    try {
        const image = await Jimp.read(rawBuffer);
        const w = image.bitmap ? image.bitmap.width : image.width;
        const h = image.bitmap ? image.bitmap.height : image.height;

        if (h > 200) {
            const targetH = h - CROP_SIZE;
            try {
                image.crop({ x: 0, y: 0, w: w, h: targetH });
            } catch (err1) {
                if (typeof image.crop === 'function') image.crop(0, 0, w, targetH);
            }
        }

        if (typeof image.getBufferAsync === 'function') {
            croppedBuffer = await image.getBufferAsync('image/jpeg');
        } else {
            try {
                const resBuf = image.getBuffer('image/jpeg');
                if (resBuf instanceof Promise) croppedBuffer = await resBuf;
                else croppedBuffer = await new Promise((res) => image.getBuffer('image/jpeg', (e, b) => res(b || rawBuffer)));
            } catch(err2) { croppedBuffer = rawBuffer; }
        }
    } catch (e) {}

    const repairedBuffer = await autoFixFace(croppedBuffer || rawBuffer);
    return repairedBuffer || croppedBuffer || rawBuffer;
}

async function processHDImage(imageUrl, mediaBuffer) {
    if (imageUrl) {
        const apis = [
            `https://widipe.com/remini?url=${encodeURIComponent(imageUrl)}`,
            `https://itzpire.site/tools/remini?url=${encodeURIComponent(imageUrl)}`
        ];

        for (const api of apis) {
            try {
                const res = await axios.get(api, { timeout: 20000 });
                const resultUrl = res.data?.url || res.data?.result || res.data?.data || res.data?.image;
                if (resultUrl && typeof resultUrl === 'string' && resultUrl.startsWith('http')) {
                    const dlRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 20000 });
                    if (isValidImageBuffer(Buffer.from(dlRes.data))) {
                        return { buffer: Buffer.from(dlRes.data), mode: 'AI Online' };
                    }
                }
            } catch (e) {
                continue;
            }
        }
    }

    if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) return null;
    try {
        const image = await Jimp.read(mediaBuffer);
        if (typeof image.scale === 'function') image.scale(2);
        let localBuffer;
        if (typeof image.getBufferAsync === 'function') localBuffer = await image.getBufferAsync('image/jpeg');
        else localBuffer = await image.getBuffer('image/jpeg');
        return { buffer: localBuffer, mode: 'Mesin Lokal Termux' };
    } catch (err) {
        return null;
    }
}


function cleanPinterestUrl(url) {
    if (!url || typeof url !== 'string') return null;

    return url
        .replace(/\\u002F/g, '/')
        .replace(/\\\//g, '/')
        .replace(/\\u003D/g, '=')
        .replace(/\\u0026/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/"/g, '')
        .trim();
}

async function fetchPinterestPage(url) {
    try {
        const response = await axios.get(url, {
            timeout: 30000,
            maxRedirects: 8,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const html = typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data);

        const finalUrl =
            response?.request?.res?.responseUrl ||
            response?.request?._redirectable?._currentUrl ||
            url;

        return { html, finalUrl };
    } catch (err) {
        return null;
    }
}

function extractPinterestMedia(html) {
    if (!html) return null;

    const candidates = [];

    const addCandidate = (url, typeHint = null, score = 0) => {
        url = cleanPinterestUrl(url);
        if (!url || !/^https?:\/\//i.test(url)) return;

        if (
            !url.includes('pinimg.com') &&
            !url.match(/\.(jpg|jpeg|png|webp|gif|mp4)(\?|$)/i)
        ) {
            return;
        }

        candidates.push({ url, typeHint, score });
    };

    // Video MP4 Pinterest CDN
    const videoRegexes = [
        /https?:\\?\/\\?\/[^"'\\\s]+?pinimg\.com[^"'\\\s]+?\.mp4(?:\?[^"'\\\s]*)?/gi,
        /https?:\\?\/\\?\/[^"'\\\s]*v\d+\.pinimg\.com[^"'\\\s]*\.mp4(?:\?[^"'\\\s]*)?/gi,
        /https?:\\?\/\\?\/[^"'\\\s]*pinimg\.com\/videos\/[^"'\\\s]+/gi
    ];

    for (const regex of videoRegexes) {
        const matches = html.match(regex) || [];
        for (const u of matches) addCandidate(u, 'video', 100);
    }

    // Gambar / GIF asli
    const imageRegexes = [
        /https?:\\?\/\\?\/i\.pinimg\.com\/originals\/[^"'\\\s]+/gi,
        /https?:\\?\/\\?\/i\.pinimg\.com\/[^"'\\\s]+?\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"'\\\s]*)?/gi
    ];

    for (const regex of imageRegexes) {
        const matches = html.match(regex) || [];
        for (const u of matches) {
            const lower = cleanPinterestUrl(u).toLowerCase();
            const type = /\.gif(?:\?|$)/i.test(lower) ? 'gif' : 'image';
            addCandidate(u, type, /\.originals\//i.test(lower) ? 90 : 70);
        }
    }

    // JSON fields yang sering dipakai Pinterest
    const jsonPatterns = [
        /"url"\s*:\s*"(https?:\\\/\\\/[^"]+)"/gi,
        /"contentUrl"\s*:\s*"(https?:\\\/\\\/[^"]+)"/gi,
        /"image"\s*:\s*"(https?:\\\/\\\/[^"]+)"/gi,
        /"videoUrl"\s*:\s*"(https?:\\\/\\\/[^"]+)"/gi
    ];

    for (const regex of jsonPatterns) {
        let m;
        while ((m = regex.exec(html)) !== null) {
            const raw = cleanPinterestUrl(m[1]);
            if (!raw) continue;

            const lower = raw.toLowerCase();

            if (lower.includes('pinimg.com/videos/') || /\.mp4(?:\?|$)/i.test(lower)) {
                addCandidate(raw, 'video', 95);
            } else if (/\.gif(?:\?|$)/i.test(lower)) {
                addCandidate(raw, 'gif', 85);
            } else if (
                lower.includes('i.pinimg.com') &&
                /\.(jpg|jpeg|png|webp)(?:\?|$)/i.test(lower)
            ) {
                addCandidate(raw, 'image', 75);
            }
        }
    }

    if (!candidates.length) return null;

    // Buang duplikat
    const unique = [];
    const seen = new Set();

    for (const item of candidates) {
        const key = item.url;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
    }

    unique.sort((a, b) => b.score - a.score);

    // Utamakan video
    const video = unique.find(x => x.typeHint === 'video');
    if (video) return video;

    // Lalu GIF
    const gif = unique.find(x => x.typeHint === 'gif');
    if (gif) return gif;

    // Lalu gambar original
    const image = unique.find(x => x.typeHint === 'image');
    if (image) return image;

    return unique[0];
}

async function downloadPinterestMedia(pinUrl) {
    try {
        const page = await fetchPinterestPage(pinUrl);
        if (!page) return null;

        let media = extractPinterestMedia(page.html);

        // Jika short link gagal diekstrak langsung, coba final URL redirect.
        if (!media && page.finalUrl && page.finalUrl !== pinUrl) {
            const second = await fetchPinterestPage(page.finalUrl);
            if (second) media = extractPinterestMedia(second.html);
        }

        if (!media) return null;

        const mediaRes = await axios.get(media.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://www.pinterest.com/'
            }
        });

        const buffer = Buffer.from(mediaRes.data);

        if (!buffer || buffer.length < 500) return null;

        let type = media.typeHint || 'image';
        const ct = String(mediaRes.headers?.['content-type'] || '').toLowerCase();

        if (ct.includes('video') || /\.mp4(?:\?|$)/i.test(media.url)) {
            type = 'video';
        } else if (ct.includes('gif') || /\.gif(?:\?|$)/i.test(media.url)) {
            type = 'gif';
        } else if (ct.includes('image')) {
            type = 'image';
        }

        return {
            buffer,
            type,
            url: media.url,
            finalUrl: page.finalUrl
        };
    } catch (err) {
        return null;
    }
}


function isInstagramUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /^https?:\/\/(?:www\.)?instagram\.com\//i.test(url) ||
           /^https?:\/\/(?:www\.)?instagr\.am\//i.test(url);
}

function normalizeMediaUrl(url) {
    if (!url || typeof url !== 'string') return null;

    return url
        .replace(/\\u0026/g, '&')
        .replace(/\\u003D/g, '=')
        .replace(/\\u002F/g, '/')
        .replace(/\\\//g, '/')
        .replace(/&amp;/g, '&')
        .replace(/^\s+|\s+$/g, '');
}

function collectInstagramMedia(data, output = [], contextKey = '', depth = 0) {
    if (data === null || data === undefined || depth > 20) return output;

    const key = String(contextKey || '').toLowerCase();

    if (typeof data === 'string') {
        let url = normalizeMediaUrl(data);

        if (!url || !/^https?:\/\//i.test(url)) {
            return output;
        }

        // Tentukan tipe berdasarkan nama field dan ekstensi URL.
        let type = 'image';
        let score = 30;

        const looksVideo =
            /video|mp4|video_url|video_versions|playback|download_url/i.test(key) ||
            /\.mp4(?:\?|$)/i.test(url) ||
            /\.mov(?:\?|$)/i.test(url);

        const looksGif =
            /gif/i.test(key) ||
            /\.gif(?:\?|$)/i.test(url);

        const looksImage =
            /image|photo|picture|display_url|image_url|thumbnail/i.test(key) ||
            /\.(jpg|jpeg|png|webp)(?:\?|$)/i.test(url);

        if (looksVideo) {
            type = 'video';
            score = 120;
        } else if (looksGif) {
            type = 'gif';
            score = 110;
        } else if (looksImage) {
            type = 'image';
            score = 90;
        }

        // URL media langsung dari CDN/platform.
        const isMediaHost =
            /pinimg|instagram|cdninstagram|fbcdn|scontent|akamai|cloudfront|media/i.test(url);

        // Jangan membuang URL hanya karena hostname-nya berbeda.
        // Banyak API downloader mengembalikan URL proxy/CDN sendiri.
        if (
            isMediaHost ||
            looksVideo ||
            looksGif ||
            looksImage ||
            /\.(mp4|mov|jpg|jpeg|png|webp|gif)(?:\?|$)/i.test(url)
        ) {
            output.push({
                url,
                type,
                score: score + (isMediaHost ? 20 : 0)
            });
        }

        return output;
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            collectInstagramMedia(
                item,
                output,
                contextKey,
                depth + 1
            );
        }
        return output;
    }

    if (typeof data === 'object') {
        for (const [keyName, value] of Object.entries(data)) {
            const lower = String(keyName).toLowerCase();

            let nextScoreKey = lower;

            if (
                lower.includes('video') ||
                lower.includes('mp4') ||
                lower.includes('playback')
            ) {
                nextScoreKey += ' video';
            }

            if (
                lower.includes('image') ||
                lower.includes('photo') ||
                lower.includes('picture') ||
                lower.includes('display_url')
            ) {
                nextScoreKey += ' image';
            }

            collectInstagramMedia(
                value,
                output,
                nextScoreKey,
                depth + 1
            );
        }
    }

    return output;
}


function uniqueInstagramMedia(items) {
    const seen = new Set();
    const result = [];

    for (const item of items) {
        if (!item?.url) continue;

        const key = item.url;
        if (seen.has(key)) continue;

        seen.add(key);
        result.push(item);
    }

    // Utamakan video/gif lalu gambar.
    result.sort((a, b) => {
        const typeScore = {
            video: 3,
            gif: 2,
            image: 1
        };

        return (
            (typeScore[b.type] || 0) - (typeScore[a.type] || 0)
            || (b.score || 0) - (a.score || 0)
        );
    });

    return result;
}


async function getInstagramFromPage(url) {
    try {
        const res = await axios.get(url, {
            timeout: 30000,
            maxRedirects: 8,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/136.0.0.0 Mobile Safari/537.36',
                'Accept':
                    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            }
        });

        const html = String(res.data || '');
        const found = [];

        function add(urlValue, type, score) {
            const u = normalizeMediaUrl(urlValue);
            if (!u || !/^https?:\/\//i.test(u)) return;

            found.push({
                url: u,
                type,
                score
            });
        }

        // Open Graph
        let m;

        const ogVideo =
            /<meta[^>]+property=["']og:video(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi;

        while ((m = ogVideo.exec(html)) !== null) {
            add(m[1], 'video', 150);
        }

        const ogImage =
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;

        while ((m = ogImage.exec(html)) !== null) {
            add(m[1], 'image', 100);
        }

        // JSON/embedded data Instagram
        const videoPatterns = [
            /"video_url"\s*:\s*"([^"]+)"/gi,
            /"video_versions"\s*:\s*\[[\s\S]*?"url"\s*:\s*"([^"]+)"/gi,
            /"playback_url"\s*:\s*"([^"]+)"/gi,
            /"videoUrl"\s*:\s*"(https?:\\\/\\\/[^"]+)"/gi
        ];

        for (const regex of videoPatterns) {
            while ((m = regex.exec(html)) !== null) {
                add(m[1], 'video', 140);
            }
        }

        const imagePatterns = [
            /"display_url"\s*:\s*"([^"]+)"/gi,
            /"image_versions2"\s*:\s*\{[\s\S]*?"url"\s*:\s*"([^"]+)"/gi,
            /"image_url"\s*:\s*"([^"]+)"/gi
        ];

        for (const regex of imagePatterns) {
            while ((m = regex.exec(html)) !== null) {
                add(m[1], 'image', 100);
            }
        }

        return uniqueInstagramMedia(found);
    } catch (e) {
        return [];
    }
}

async function getInstagramFromApi(url) {
    const stamp = `ig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const outputTemplate = path.join(TMP_DIR, `${stamp}.%(ext)s`);

    try {
        log.info(`[Instagram yt-dlp] Mengunduh: ${url}`);

        await execFileAsync('yt-dlp', [
            '--no-warnings',
            '--format', 'bestvideo*+bestaudio/best',
            '--merge-output-format', 'mp4',
            '--no-playlist',
            '--max-filesize', '100M',
            '-o', outputTemplate,
            url
        ], {
            timeout: 180000,
            maxBuffer: 10 * 1024 * 1024
        });

        const files = fs.readdirSync(TMP_DIR)
            .filter(name => name.startsWith(stamp + '.'))
            .map(name => path.join(TMP_DIR, name))
            .filter(file => /\.(mp4|mkv|webm|mov)$/i.test(file));

        if (!files.length) {
            log.error('[Instagram yt-dlp] File hasil tidak ditemukan.');
            return [];
        }

        return files.map(file => ({
            url: `file://${file}`,
            type: 'video'
        }));

    } catch (err) {
        log.error(
            `[Instagram yt-dlp] ${err.stderr || err.message || err}`
        );
        return [];
    }
}

async function downloadInstagramBuffer(item) {
    try {
        if (item?.url?.startsWith('file://')) {
            const filePath = item.url.slice('file://'.length);

            if (!fs.existsSync(filePath)) {
                log.error(`[Instagram] File tidak ditemukan: ${filePath}`);
                return null;
            }

            const stat = fs.statSync(filePath);

            if (stat.size < 500) {
                return null;
            }

            if (stat.size > 100 * 1024 * 1024) {
                log.error('[Instagram] File melebihi batas 100 MB.');
                return null;
            }

            const buffer = fs.readFileSync(filePath);

            return {
                buffer,
                type: 'video',
                filePath
            };
        }

        const res = await axios.get(item.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: 100 * 1024 * 1024,
            maxBodyLength: 100 * 1024 * 1024,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
                'Referer': 'https://www.instagram.com/'
            }
        });

        const buffer = Buffer.from(res.data);

        if (!buffer || buffer.length < 500) {
            return null;
        }

        const contentType = String(
            res.headers?.['content-type'] || ''
        ).toLowerCase();

        let type = item.type || 'image';

        if (
            contentType.includes('video') ||
            /\.mp4(\?|$)/i.test(item.url) ||
            /\.mov(\?|$)/i.test(item.url)
        ) {
            type = 'video';
        } else if (
            contentType.includes('gif') ||
            /\.gif(\?|$)/i.test(item.url)
        ) {
            type = 'gif';
        } else if (contentType.includes('image')) {
            type = 'image';
        }

        return {
            buffer,
            type
        };

    } catch (err) {
        log.error(`[Instagram Download] ${err.message}`);
        return null;
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04']
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        console.log('⏳ Meminta kode pairing...');
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(PHONE_NUMBER);
                console.log(`\n🔑 KODE PAIRING ANDA: ${code}\n`);
            } catch (err) {}
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`🔴 Koneksi terputus. Restart via PM2...`);
            if (reason === DisconnectReason.loggedOut) {
                fs.rmSync('./auth', { recursive: true, force: true });
            }
            process.exit(1);
        } else if (connection === 'open') {
            console.log('✅ RYO ASSISTANT READY (v8.6.7 GLOBAL MESSAGE LEVEL SYSTEM)!');
        }
    });

    sock.ev.on('group-participants.update', async (anu) => {
        try {
            const metadata = await sock.groupMetadata(anu.id);
            const participants = anu.participants;
            for (let num of participants) {
                const userTag = `@${num.split('@')[0]}`;
                if (anu.action === 'add') {
                    const welcomeText = `👋 *Selamat Datang ${userTag}!*\n\nSelamat bergabung di grup *${metadata.subject}*.\nSemoga betah dan jangan lupa baca deskripsi grup ya!`;
                    await sock.sendMessage(anu.id, { text: welcomeText, mentions: [num] });
                } else if (anu.action === 'remove') {
                    const goodbyeText = `👋 *Selamat Tinggal ${userTag}!*\n\nTelah keluar dari grup *${metadata.subject}*. Sampai jumpa lagi!`;
                    await sock.sendMessage(anu.id, { text: goodbyeText, mentions: [num] });
                }
            }
        } catch (err) {}
    });

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg || !msg.message) return;

            const from = msg.key.remoteJid;
            if (!from) return;

            const body = msg.message.conversation ||
                         msg.message.extendedTextMessage?.text ||
                         msg.message.imageMessage?.caption ||
                         msg.message.videoMessage?.caption || '';

            const command = body.trim().split(' ')[0].toLowerCase();
            const args = body.trim().split(' ').slice(1);
            const text = args.join(' ');
            const currentPersona = getPersona(from);

            const senderJid = msg.key.participant || msg.participant || from;

            const isGroup = from.endsWith('@g.us');
            let groupMetadata = null;
            let groupMembers = [];
            let groupAdmins = [];
            let isUserAdmin = false;

            if (isGroup) {
                try {
                    groupMetadata = await sock.groupMetadata(from);
                    groupMembers = groupMetadata ? groupMetadata.participants : [];
                    groupAdmins = groupMembers.filter(m => m.admin !== null).map(m => m.id);
                    
                    const senderNum = senderJid.split('@')[0].split(':')[0];
                    isUserAdmin = groupAdmins.some(a => a.split('@')[0].split(':')[0] === senderNum);
                } catch (e) {}
            }

            const isQuotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            const isDirectImage = msg.message?.imageMessage;
            const isImage = isDirectImage || isQuotedImage;

            // Global daily feature/message quota. Menu/help and quota-check commands are free.
            const quotaCommand = ['.limit', '.quota', '.sisa'];
            const isQuotaTracked = body.trim().startsWith('@') || (command.startsWith('.') && !quotaCommand.includes(command) && command !== '.menu' && command !== '.help');
            if (isQuotaTracked) {
                const dailyQuota = await checkDailyQuota({ jid: senderJid, sock });
                if (!dailyQuota.allowed) {
                    return await sock.sendMessage(from, { text: `🚫 *BATAS HARIAN TERCAPAI*\n\n📈 Level kamu: *${dailyQuota.level}*\n📨 Batas hari ini: *${dailyQuota.limit} pesan/fitur*\n📊 Sudah digunakan: *${dailyQuota.used}*\n\n⬆️ Naik level untuk membuka lebih banyak penggunaan besok.\n💡 Cek kuota dengan \`.limit\`.` }, { quoted: msg });
                }
            }

            if (command === '.limit' || command === '.quota' || command === '.sisa') {
                const dailyQuota = await checkDailyQuota({ jid: senderJid, sock });
                return await sock.sendMessage(from, { text: `╭━━〔 📊 RYO DAILY LIMIT 〕\n┊ ${getDailyQuotaText(dailyQuota)}\n┊\n┊ Level berikutnya akan membuka batas yang lebih besar.\n╰━━━━━━━━━━━━━━━━━━━━━━━` }, { quoted: msg });
            }

            if (command === '.menu' || command === '.help') {
                addExpAndStat(senderJid, 'cmd');
                
                // Reaksi cepat untuk menandai menu sedang dimuat
                try {
                    await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
                } catch (e) {}

                const uptime = formatUptime(Date.now() - startTime);
                const menuText = `╭━━━〔 RYO ASSISTANT 〕━━━
│ 
│ 🤖 Engine: v8.6.7 Global Message Level System
│ ⏱️ Uptime: ${uptime}
│ 🎭 AI Persona: ${currentPersona.toUpperCase()}
│ 👥 Chat Type: ${isGroup ? 'Group Chat' : 'Private Chat'}
│ ⚡ Status: Online 24/7
│ ⏱️ Pesan menu terhapus otomatis (5 menit)
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 🛠️ TOOLS & QR CODE 〕
┊ • \`.qr <teks/link>\` : Buat QR Code dari teks/link
┊ • \`.qr\` (kirim/reply foto/video) : Buat QR Code dari media
┊ • \`.calc <ekspresi>\` : Kalkulator matematika
┊ • \`.jam\` atau \`.waktu\` : Cek zona waktu (WIB/WITA/WIT)
┊ • \`.pass [panjang]\` : Generator Password Aman
┊ • \`.todo add <teks>\` : Tambah catatan/tugas
┊ • \`.todo list\` : Lihat daftar todo/catatan
┊ • \`.todo del <no>\` : Hapus catatan/todo
┊ • \`.limit\` / \`.quota\` : Cek batas penggunaan harian
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 🎮 RYO ENTERTAINMENT 〕
┊
┊ • \`.tebakangka\` : Tebak angka 1–100
┊ • \`.tebakkata\` : Tebak kata acak
┊ • \`.suit <batu|gunting|kertas>\` : Suit lawan Ryo
┊ • \`.coinflip\` : Lempar koin
┊ • \`.dadu\` : Lempar dadu
┊ • \`.mathgame\` : Tebak hasil matematika
┊ • \`.quote\` : Quote random
┊ • \`.motivasi\` : Motivasi random
┊ • \`.joke\` : Joke random
┊ • \`.8ball <pertanyaan>\` : Magic 8 Ball
┊ • \`.truth\` : Truth random
┊ • \`.dare\` : Dare random
┊ • \`.rate <teks>\` : Skor hiburan random
┊ • \`.ship @user1 @user2\` : Skor ship random
┊ • \`.work\` : Kerja & dapat RC
┊ • \`.give @user <jml>\` : Beri RC
┊ • \`.rob @user\` : Rob ekonomi virtual
┊ • \`.rank\` / \`.level\` : Cek level & rank
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 💰 ECONOMY & SULTAN STORE 〕
┊ • \`.daily\` atau \`.klaim\` : Klaim bonus koin harian
┊ • \`.balance\` atau \`.saldo\` : Cek dompet & koin RC
┊ • \`.transfer @user <jml>\` : Kirim koin ke teman
┊ • \`.shop\` atau \`.toko\` : Belanja item eksklusif
┊ • \`.buy <item>\` : Membeli item dari toko
┊ • \`.topcoin\` : Papan peringkat orang terkaya
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 👤 USER PROFILE & SYSTEM 〕
┊ • \`.profryo\` atau \`.profil\` : Cek Level, EXP, Rank & Badge
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 👥 GROUP MANAGEMENT 〕
┊ • \`.t <pesan>\` : Tagall / Mention semua
┊ • \`.h <pesan>\` : Hidetag / Tag tersembunyi
┊ • \`.i\` : Informasi grup
┊ • \`.l\` : Ambil link grup (Admin)
┊ • \`.g <buka|tutup>\` : Buka / tutup chat (Admin)
┊ • \`.k @user\` : Kick member (Admin)
┊ • \`.a <no>\` : Tambah member (Admin)
┊ • \`.p @user\` : Naikkan admin (Admin)
┊ • \`.d @user\` : Turunkan admin (Admin)
┊ • \`.sn <nama>\` : Ganti nama grup (Admin)
┊ • \`.sd <deskripsi>\` : Ganti deskripsi grup (Admin)
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 📥 MEDIA & DOWNLOADER 〕
┊ • \`.sw\` : Unduh Status WA (Bot/Owner)
┊ • \`.svonce\` : Ambil Foto, Video & Pesan Suara Sekali Lihat
┊ • \`.tt <url>\` : TikTok Downloader
┊ • \`.ig <url>\` : Download IG Video / Gambar / GIF
┊ • \`.igdl <url>\` : Instagram Downloader
┊ • Mendukung Reels, Post & Carousel
┊ • \`.fb <url>\` : Facebook Video
┊ • \`.x <url>\` : Twitter / X Downloader
┊ • \`.yt <url>\` : YouTube Video (MP4)
┊ • \`.pin [jml] <query>\` : Cari gambar/media Pinterest
┊ • \`.pin <link>\` : Download gambar/video/GIF Pinterest
┊ • \`.pindl <link>\` : Pinterest Downloader
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 🧠 AI & PERSONA 〕
┊ • \`.ps <santai|pemarah|pendiam>\` : Persona
┊ • \`@<teks>\` : Obrolan AI Ryo
┊ • \`.ai <teks>\` : Tanya AI umum
┊ • \`.chat <teks>\` : Chat dengan Ryo
┊ • \`.ask <teks>\` : Tanya & jawab AI
┊ • \`.deepthink <teks>\` : Analisis mendalam
┊ • \`.explain <teks>\` : Jelaskan topik
┊ • \`.summarize <teks>\` : Ringkas teks
┊ • \`.rewrite <teks>\` : Tulis ulang teks
┊ • \`.expand <teks>\` : Kembangkan teks
┊ • \`.shorten <teks>\` : Persingkat teks
┊ • \`.grammar <teks>\` : Cek grammar
┊ • \`.translate <kode> <teks>\` : Terjemahkan
┊ • \`.detectlang <teks>\` : Deteksi bahasa
┊ • \`.factcheck <klaim>\` : Analisis fakta
┊ • \`.compare <A> vs <B>\` : Bandingkan
┊ • \`.analyze <teks>\` : Analisis teks
┊ • \`.brainstorm <topik>\` : Cari ide
┊ • \`.idea <topik>\` : Generator ide
┊ • \`.advice <masalah>\` : Minta saran
┊ • \`.plan <tujuan>\` : Buat rencana
┊ • \`.tutor <materi>\` : Mode tutor
┊ • \`.cd <permintaan>\` : AI Programmer
┊ • \`.tr <kode> <teks>\` : Translate Teks
┊ • \`.es <topik>\` : Pembuat Esai
┊ • \`.rg <teks>\` : Meringkas Teks
┊ • \`.gm <kalimat>\` : Cek & Perbaiki Kalimat
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 🖼️ CONVERTER & REPAIR 〕
┊ • \`.s\` : Buat Stiker
┊ • \`.hd\` : Penjernih Foto
┊ • \`.wr\` : Hapus Watermark
┊ • \`.bg\` : Perbaiki Foto Rusak
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 🎨 AI ART GENERATOR 〕
┊ • Rasio: 1:1, 16:9, 9:16, 4:3, 3:4
┊ • \`.gb [rasio] <prompt>\` : Realistic HD
┊ • \`.an [rasio] <prompt>\` : Anime Masterpiece
┊ • \`.3d [rasio] <prompt>\` : Octane 3D Render
┊ • \`.px [rasio] <prompt>\` : Retro 16-bit
┊ • \`.lg [rasio] <prompt>\` : Vector Logo
┊ • \`.cp [rasio] <prompt>\` : Neon Cyberpunk
┊ • \`.sk [rasio] <prompt>\` : Pencil Sketch
╰━━━━━━━━━━━━━━━━━━━━━━━

╭━━〔 ⚙️ SYSTEM & INFO 〕
┊ • \`.rt\` : Cek Kecepatan Bot
┊ • \`.info\` : Aturan & Informasi Bot
╰━━━━━━━━━━━━━━━━━━━━━━━`;

                const sentMsg = await sendSmartMessage(sock, from, { image: { url: MENU_BANNER }, caption: menuText }, { quoted: msg });
                
                // Ubah reaksi ke centang hijau setelah menu terkirim
                try {
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                } catch (e) {}

                if (sentMsg?.key) {
                    setTimeout(async () => {
                        try {
                            await sock.sendMessage(from, { delete: sentMsg.key });
                        } catch (e) {}
                    }, 300000); // Otomatis hapus dalam 5 menit (300.000 ms)
                }
                return;
            }

            // ============================================================
            // RYO DEVELOPER CONTROL CENTER v1
            // ============================================================
            if (['.dev', '.developer', '.ryodev'].includes(command)) {
                try {
                    // Nomor Developer Ryo
                    const DEVELOPER_NUMBER = '6283829451488';

                    const senderRaw = senderJid
                        .split(':')[0]
                        .split('@')[0];

                    const senderNumber = senderRaw
                        .replace(/^0/, '62');

                    const developerJid = `${DEVELOPER_NUMBER}@s.whatsapp.net`;

                    let mappedDeveloperLid = null;
                    let senderMappedPN = null;

                    try {
                        const lidMapping = sock.signalRepository?.lidMapping;

                        if (lidMapping) {
                            mappedDeveloperLid =
                                await lidMapping.getLIDForPN(developerJid);

                            if (senderJid.endsWith('@lid')) {
                                senderMappedPN =
                                    await lidMapping.getPNForLID(senderJid);
                            }
                        }
                    } catch (e) {
                        console.log(`[DEV AUTH] LID mapping error: ${e.message}`);
                    }

                    const isDeveloper =
                        senderNumber === DEVELOPER_NUMBER ||
                        senderJid === mappedDeveloperLid ||
                        senderMappedPN === developerJid ||
                        senderMappedPN === DEVELOPER_NUMBER + '@s.whatsapp.net';

                    const botJid = sock.user?.id || '';
                    const botNumber = botJid
                        .split(':')[0]
                        .split('@')[0];

                    if (!isDeveloper) {
                        return await sock.sendMessage(
                            from,
                            {
                                text: '⛔ Akses ditolak. Menu Developer hanya dapat digunakan oleh Developer Ryo.'
                            },
                            { quoted: msg }
                        );
                    }

                    const sub = (args[0] || '').toLowerCase();

                    // .dev
                    if (!sub || sub === 'menu' || sub === 'help') {
                        const devMenu =
`╭━━〔 🛠️ RYO DEVELOPER 〕
┊
┊ 🧩 *.dev plugins*
┊ 📜 *.dev logs*
┊ 🔄 *.dev reload*
┊ 🔑 *.dev api*
┊ ❤️ *.dev health*
┊ 💾 *.dev backup*
┊
╰━━━━━━━━━━━━━━━━━━━━━━━
⚡ Ryo Developer Control Center`;

                        return await sock.sendMessage(
                            from,
                            { text: devMenu },
                            { quoted: msg }
                        );
                    }

                    // .dev plugins
                    if (sub === 'plugins') {
                        const pluginDir = path.join(__dirname, 'plugins');
                        let pluginText = '🧩 *PLUGIN MANAGER*\n\n';

                        if (!fs.existsSync(pluginDir)) {
                            pluginText +=
                                '📁 Folder `plugins/` belum dibuat.\n\n' +
                                'Mode saat ini: *Index Handler*';
                        } else {
                            const files = fs.readdirSync(pluginDir)
                                .filter(f => /\.(js|cjs)$/i.test(f));

                            pluginText += files.length
                                ? files.map((f, i) =>
                                    `${i + 1}. ${f} ✅`
                                  ).join('\n')
                                : 'Belum ada plugin.';

                            pluginText +=
                                '\n\n📌 Plugin Manager v1 hanya memonitor plugin.';
                        }

                        return await sock.sendMessage(
                            from,
                            { text: pluginText },
                            { quoted: msg }
                        );
                    }

                    // .dev logs
                    if (sub === 'logs') {
                        const logDir = path.join(
                            process.env.HOME || __dirname,
                            '.pm2',
                            'logs'
                        );

                        let output = '📜 *RYO LOG MONITOR*\n\n';

                        try {
                            const files = fs.existsSync(logDir)
                                ? fs.readdirSync(logDir)
                                    .filter(f => f.startsWith('ryo-'))
                                : [];

                            output += files.length
                                ? files.map(f => `• ${f}`).join('\n')
                                : 'Log PM2 tidak ditemukan.';

                            output +=
                                '\n\n💡 Gunakan `pm2 logs ryo` di Termux untuk log lengkap.';
                        } catch (logErr) {
                            output += `❌ ${logErr.message}`;
                        }

                        return await sock.sendMessage(
                            from,
                            { text: output },
                            { quoted: msg }
                        );
                    }

                    // .dev reload
                    if (sub === 'reload') {
                        await sock.sendMessage(
                            from,
                            {
                                text: '🔄 *RELOAD*\n\nRyo akan direstart melalui PM2 setelah pesan ini.'
                            },
                            { quoted: msg }
                        );

                        setTimeout(() => {
                            process.exit(0);
                        }, 1000);

                        return;
                    }

                    // .dev api
                    if (sub === 'api') {
                        const envKeys = Object.keys(process.env)
                            .filter(k =>
                                /API|KEY|TOKEN|SECRET/i.test(k)
                            );

                        const apiText =
`🔑 *API MANAGER*

📦 API environment terdeteksi: ${envKeys.length}

${envKeys.length
    ? envKeys.map(k => `• ${k} ✅`).join('\n')
    : '• Tidak ada API key environment yang terdeteksi.'}

🔒 Nilai API key tidak ditampilkan demi keamanan.`;

                        return await sock.sendMessage(
                            from,
                            { text: apiText },
                            { quoted: msg }
                        );
                    }

                    // .dev health
                    if (sub === 'health') {
                        const mem = process.memoryUsage();

                        const uptimeSec = Math.floor(process.uptime());
                        const hours = Math.floor(uptimeSec / 3600);
                        const minutes = Math.floor(
                            (uptimeSec % 3600) / 60
                        );
                        const seconds = uptimeSec % 60;

                        const healthText =
`❤️ *RYO HEALTH MONITOR*

🟢 Status: ONLINE
⏱️ Uptime: ${hours}j ${minutes}m ${seconds}d
🧠 RAM: ${(mem.rss / 1024 / 1024).toFixed(1)} MB
💾 Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} / ${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB
🟩 Node.js: ${process.version}
📱 Bot: ${botNumber}
⚙️ PID: ${process.pid}
📡 Connection: ACTIVE`;

                        return await sock.sendMessage(
                            from,
                            { text: healthText },
                            { quoted: msg }
                        );
                    }

                    // .dev backup
                    if (sub === 'backup') {
                        const backupDir = path.join(
                            __dirname,
                            'backup'
                        );

                        if (!fs.existsSync(backupDir)) {
                            fs.mkdirSync(backupDir, {
                                recursive: true
                            });
                        }

                        const backupFile = path.join(
                            backupDir,
                            'index-dev-current.js'
                        );

                        fs.copyFileSync(
                            path.join(__dirname, 'index.js'),
                            backupFile
                        );

                        return await sock.sendMessage(
                            from,
                            {
                                text:
`💾 *BACKUP BERHASIL*

📁 File:
\`backup/index-dev-current.js\`

✅ index.js saat ini sudah dicadangkan.`
                            },
                            { quoted: msg }
                        );
                    }

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`❓ Subcommand Developer tidak dikenal.

Gunakan:
*.dev*
*.dev plugins*
*.dev logs*
*.dev reload*
*.dev api*
*.dev health*
*.dev backup*`
                        },
                        { quoted: msg }
                    );

                } catch (devErr) {
                    log.error(`[Developer Manager] ${devErr.message}`);

                    return await sock.sendMessage(
                        from,
                        {
                            text: `❌ Developer Manager error: ${devErr.message}`
                        },
                        { quoted: msg }
                    );
                }
            }

            if (['.qr', '.qrcode'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                let qrData = text;
                let targetMsg = msg;
                const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
                const quotedMsg = contextInfo?.quotedMessage;
                
                const isQuotedVideo = quotedMsg?.videoMessage;
                const isDirectVideo = msg.message?.videoMessage;
                const isQuotedImage = quotedMsg?.imageMessage;
                const isDirectImage = msg.message?.imageMessage;

                const hasMedia = isQuotedVideo || isDirectVideo || isQuotedImage || isDirectImage;

                if (hasMedia && !text) {
                    await sock.sendMessage(from, { text: '⏳ *Sedang mengunggah media & membuat QR Code...*' }, { quoted: msg });
                    
                    let filename = 'image.jpg';
                    if (isQuotedVideo || isDirectVideo) {
                        filename = 'video.mp4';
                    }

                    if (isQuotedVideo || isQuotedImage) {
                        targetMsg = {
                            key: {
                                remoteJid: contextInfo.remoteJid || from,
                                id: contextInfo.stanzaId,
                                participant: contextInfo.participant
                            },
                            message: quotedMsg
                        };
                    }

                    const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    if (mediaBuffer) {
                        const mediaUrl = await uploadMedia(mediaBuffer, filename);
                        if (mediaUrl) {
                            qrData = mediaUrl;
                        }
                    }
                }

                if (!qrData) {
                    return await sendSmartMessage(sock, from, { 
                        image: { url: BANNERS.media }, 
                        caption: `⚠️ *Format QR Code Salah!*\n\n1. Ketik teks/link: \`.qr https://google.com\`\n2. Atau *kirim/reply foto & video* dengan caption \`.qr\` untuk membuat QR Code dari media tersebut!` 
                    }, { quoted: msg });
                }

                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
                return await sendSmartMessage(sock, from, { 
                    image: { url: qrUrl }, 
                    caption: `✅ *QR Code Berhasil Dibuat!*\n🔗 *Data / Link Media:* ${qrData}` 
                }, { quoted: msg });
            }

            if (['.calc', '.math', '.kalkulator'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!text) return await sock.sendMessage(from, { text: '⚠️ Masukkan ekspresi matematika!\nContoh: `.calc 50 * 2 + 100`' }, { quoted: msg });
                try {
                    const sanitized = text.replace(/[^0-9+\-*/().% ]/g, '');
                    if (!sanitized) throw new Error();
                    const result = Function(`'use strict'; return (${sanitized})`)();
                    return await sock.sendMessage(from, { text: `🧮 *KALKULATOR*\n\n📝 *Soal:* ${text}\n✨ *Hasil:* ${result}` }, { quoted: msg });
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Format matematika tidak valid! Gunakan angka dan operator dasar (+, -, *, /, %).' }, { quoted: msg });
                }
            }

            if (['.jam', '.time', '.waktu'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const now = new Date();
                const optionsWIB = { timeZone: 'Asia/Jakarta', hour12: false, dateStyle: 'full', timeStyle: 'medium' };
                const optionsWITA = { timeZone: 'Asia/Makassar', hour12: false, timeStyle: 'medium' };
                const optionsWIT = { timeZone: 'Asia/Jayapura', hour12: false, timeStyle: 'medium' };
                
                const timeWIB = new Intl.DateTimeFormat('id-ID', optionsWIB).format(now);
                const timeWITA = new Intl.DateTimeFormat('id-ID', optionsWITA).format(now);
                const timeWIT = new Intl.DateTimeFormat('id-ID', optionsWIT).format(now);

                const timeText = `🕒 WAKTU & ZONA WAKTU INDONESIA\n\n📅 Tanggal & WIB: ${timeWIB}\n🌅 WITA: ${timeWITA}\n☀️ WIT: ${timeWIT}`;
                return await sendSmartMessage(sock, from, { image: { url: BANNERS.status }, caption: timeText }, { quoted: msg });
            }

            if (['.pass', '.password'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                let length = parseInt(args[0]) || 12;
                length = Math.max(6, Math.min(length, 64));
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
                let password = '';
                for (let i = 0; i < length; i++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                const passText = `🔐 PASSWORD GENERATOR\n\n✨ Panjang: ${length} Karakter\n🔑 Password: \`${password}\`\n\nSimpan password ini di tempat yang aman!`;
                return await sock.sendMessage(from, { text: passText }, { quoted: msg });
            }

            if (['.todo', '.catatan', '.tugas'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                let db = getUsersData();
                let uData = db[senderJid] || { coins: 500, todos: [] };
                if (!uData.todos) uData.todos = [];

                const subCmd = args[0]?.toLowerCase();
                const todoText = args.slice(1).join(' ');

                if (subCmd === 'add' || subCmd === 'tambah') {
                    if (!todoText) return await sock.sendMessage(from, { text: '⚠️ Masukkan isi catatan/todo!\nContoh: `.todo add Belajar Node.js`' }, { quoted: msg });
                    uData.todos.push({ text: todoText, done: false, date: new Date().toLocaleDateString('id-ID') });
                    db[senderJid] = uData;
                    saveUsersData(db);
                    return await sock.sendMessage(from, { text: `✅ *Todo Berhasil Ditambahkan!*\n📝 "${todoText}"\nKetik \`.todo list\` untuk melihat daftar.` }, { quoted: msg });
                } else if (subCmd === 'del' || subCmd === 'hapus') {
                    const index = parseInt(args[1]) - 1;
                    if (isNaN(index) || index < 0 || index >= uData.todos.length) {
                        return await sock.sendMessage(from, { text: '⚠️ Nomor todo tidak valid! Ketik `.todo list` untuk melihat nomor.' }, { quoted: msg });
                    }
                    const removed = uData.todos.splice(index, 1);
                    db[senderJid] = uData;
                    saveUsersData(db);
                    return await sock.sendMessage(from, { text: `🗑️ Berhasil menghapus todo: "${removed[0].text}"` }, { quoted: msg });
                } else {
                    if (uData.todos.length === 0) {
                        return await sock.sendMessage(from, { text: '📋 *Daftar Todo Kamu Kosong*\n\nTambah catatan dengan cara:\n`.todo add <pesan>`' }, { quoted: msg });
                    }
                    let listStr = '📋 *DAFTAR TODO / CATATAN KAMU*\n\n';
                    uData.todos.forEach((item, idx) => {
                        let status = item.done ? '✅' : '⏳';
                        listStr += `${idx + 1}. ${status} ${item.text} _(${item.date})_\n`;
                    });
                    listStr += `\n💡 Kelola dengan: \`.todo add <teks>\` atau \`.todo del <no>\``;
                    return await sock.sendMessage(from, { text: listStr }, { quoted: msg });
                }
            }

            if (command.startsWith('.')) {
                const entertainmentResult = await handleEntertainment({
                    command,
                    args,
                    text,
                    from,
                    senderJid,
                    msg,
                    sock,
                    getUsersData,
                    saveUsersData,
                    addExpAndStat,
                    getUserRank,
                    getTargetUser
                });

                if (entertainmentResult) return entertainmentResult;
            }

            if (['.daily', '.klaim'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                let db = getUsersData();
                let uData = db[senderJid] || { coins: 500, lastDaily: 0, level: 1, exp: 0 };
                
                const now = Date.now();
                const cooldown = 24 * 60 * 60 * 1000;
                const timeDiff = now - (uData.lastDaily || 0);

                if (timeDiff < cooldown) {
                    const remaining = cooldown - timeDiff;
                    const hours = Math.floor(remaining / (1000 * 60 * 60));
                    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
                    return await sock.sendMessage(from, { text: `⏳ *Kamu sudah mengambil koin harian!*\n\nSilakan tunggu *${hours} jam ${minutes} menit* lagi untuk klaim berikutnya.` }, { quoted: msg });
                }

                const rewardCoins = 2500;
                const rewardExp = 100;
                uData.coins = (uData.coins || 500) + rewardCoins;
                uData.exp = (uData.exp || 0) + rewardExp;
                uData.lastDaily = now;
                db[senderJid] = uData;
                saveUsersData(db);

                const claimText = `🎉 KLAIM HARIAN BERHASIL!\n\n🎁 Kamu mendapatkan:\n• 💰 +${rewardCoins} Ryo Coins (RC)\n• ✨ +${rewardExp} EXP\n\nTotal Saldo Sekarang: 💰 ${uData.coins} RC\nDatang kembali besok untuk klaim lagi ya!`;

                return await sock.sendMessage(from, { text: claimText }, { quoted: msg });
            }

            if (['.balance', '.saldo', '.dompet'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const targetUser = getTargetUser(msg, args) || senderJid;
                let db = getUsersData();
                let uData = db[targetUser] || { coins: 500, level: 1, exp: 0, totalCmd: 0 };
                
                const userRank = getUserRank(targetUser);
                const userNum = targetUser.split('@')[0];

                const balanceText = `╭━━━〔 *💰 RYO WALLET & SALDO* 〕━━━\n│ \n│ 📌 *Pengguna:* @${userNum}\n│ 💰 *Ryo Coins:* ${uData.coins || 500} RC\n│ 🏆 *Peringkat Kekayaan:* #${userRank}\n│ ⚡ *Level / EXP:* Level ${uData.level} (${uData.exp} EXP)\n│ ╰━━━━━━━━━━━━━━━━━━━━━━━`;

                return await sendSmartMessage(sock, from, { image: { url: BANNERS.profile }, caption: balanceText }, { quoted: msg, mentions: [targetUser] });
            }

            if (['.transfer', '.tf'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const target = getTargetUser(msg, args);
                const amount = parseInt(args[args.length - 1]);

                if (!target || isNaN(amount) || amount <= 0) {
                    return await sock.sendMessage(from, { text: '⚠️ Format salah!\nContoh: `.transfer @user 1000` atau `.tf 628xxx 500`' }, { quoted: msg });
                }

                if (target === senderJid) {
                    return await sock.sendMessage(from, { text: '❌ Tidak bisa mentransfer koin ke diri sendiri!' }, { quoted: msg });
                }

                let db = getUsersData();
                let senderData = db[senderJid] || { coins: 500 };
                let targetData = db[target] || { coins: 500, level: 1, exp: 0 };

                if ((senderData.coins || 500) < amount) {
                    return await sock.sendMessage(from, { text: `❌ Saldo koin kamu tidak cukup! Saldo saat ini: *${senderData.coins || 500} RC*.` }, { quoted: msg });
                }

                senderData.coins -= amount;
                targetData.coins = (targetData.coins || 500) + amount;

                db[senderJid] = senderData;
                db[target] = targetData;
                saveUsersData(db);

                const targetNum = target.split('@')[0];
                return await sock.sendMessage(from, { text: `✅ *TRANSFER BERHASIL!*\n\nBerhasil mengirim *${amount} RC* ke @${targetNum}.\nSisa saldo kamu: *${senderData.coins} RC*.`, mentions: [target] }, { quoted: msg });
            }

            if (['.shop', '.toko'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const shopText = `╭━━━〔 *🛒 RYO SULTAN SHOP* 〕━━━\n│ \n│ Selamat datang di Toko Resmi Ryo!\n│ Tukarkan koinmu dengan item spesial:\n│ \n│ 1️⃣ *potion* (Exp Potion +300 EXP)\n│    🏷️ Harga: *1500 RC*\n│    💻 Ketik: \`.buy potion\`\n│ \n│ 2️⃣ *badge* (Gelar Elite "Sultan 💰")\n│    🏷️ Harga: 5000 RC\n│    💻 Ketik: \`.buy badge\`\n│ \n│ 3️⃣ *shield* (Tiket Anti-Kick Group 1x)\n│    🏷️ Harga: 3000 RC\n│    💻 Ketik: \`.buy shield\`\n│ \n╰━━━━━━━━━━━━━━━━━━━━━━━`;

                return await sendSmartMessage(sock, from, { image: { url: BANNERS.shop }, caption: shopText }, { quoted: msg });
            }

            if (command === '.buy') {
                addExpAndStat(senderJid, 'cmd');
                const item = args[0]?.toLowerCase();
                if (!item) return await sock.sendMessage(from, { text: '⚠️ Masukkan nama item yang ingin dibeli!\nContoh: `.buy potion` atau `.buy badge`' }, { quoted: msg });

                let db = getUsersData();
                let uData = db[senderJid] || { coins: 500, level: 1, exp: 0, badges: ['Newbie 🌱'] };
                let userCoins = uData.coins || 500;

                let prices = {
                    'potion': 1500,
                    'badge': 5000,
                    'shield': 3000
                };

                if (!prices[item]) {
                    return await sock.sendMessage(from, { text: '❌ Item tidak ditemukan di toko! Ketik `.shop` untuk melihat daftar item.' }, { quoted: msg });
                }

                let cost = prices[item];
                if (userCoins < cost) {
                    return await sock.sendMessage(from, { text: `❌ Saldo koin tidak cukup! Kamu butuh *${cost} RC*, tapi saldo kamu saat ini *${userCoins} RC*.` }, { quoted: msg });
                }

                uData.coins -= cost;

                if (item === 'potion') {
                    uData.exp += 300;
                    while (uData.exp >= (uData.level * 100)) {
                        uData.exp -= (uData.level * 100);
                        uData.level += 1;
                    }
                    db[senderJid] = uData;
                    saveUsersData(db);
                    return await sock.sendMessage(from, { text: `✅ *PEMBELIAN BERHASIL!*\n\nKamu membeli *Exp Potion* (-${cost} RC).\n✨ +300 EXP ditambahkan! Level kamu sekarang Level *${uData.level}*.` }, { quoted: msg });
                } else if (item === 'badge') {
                    if (!uData.badges.includes('Sultan 💰')) uData.badges.push('Sultan 💰');
                    db[senderJid] = uData;
                    saveUsersData(db);
                    return await sock.sendMessage(from, { text: `✅ *PEMBELIAN BERHASIL!*\n\nKamu membeli Gelar Elite *Sultan 💰* (-${cost} RC).\nBadge resmi ditambahkan ke profilmu!` }, { quoted: msg });
                } else if (item === 'shield') {
                    if (!uData.badges.includes('Shield Holder 🛡️')) uData.badges.push('Shield Holder 🛡️');
                    db[senderJid] = uData;
                    saveUsersData(db);
                    return await sock.sendMessage(from, { text: `✅ *PEMBELIAN BERHASIL!*\n\nKamu membeli *Shield Anti-Kick* (-${cost} RC).\nStatus pelindung aktif di akunmu!` }, { quoted: msg });
                }
            }

            if (['.topcoin', '.richest', '.leaderboard'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                let db = getUsersData();
                let users = Object.keys(db).map(k => ({
                    jid: k,
                    coins: db[k].coins || 500,
                    level: db[k].level || 1
                }));

                users.sort((a, b) => b.coins - a.coins);
                let topUsers = users.slice(0, 10);

                let topText = `🏆 *PAPAN PERINGKAT KAYA (TOP 10 SULTAN)* 🏆\n\n`;
                topUsers.forEach((u, idx) => {
                    let medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `📍 ${idx + 1}.`;
                    topText += `${medal} @${u.jid.split('@')[0]}\n   💰 *${u.coins} RC* | ⚡ Level ${u.level}\n\n`;
                });

                return await sock.sendMessage(from, { text: topText, mentions: topUsers.map(u => u.jid) }, { quoted: msg });
            }

            if (['.profryo', '.profil', '.profile'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const targetUser = getTargetUser(msg, args) || senderJid;
                let db = getUsersData();
                
                let uData = db[targetUser] || {
                    exp: 0,
                    level: 1,
                    coins: 500,
                    totalCmd: 0,
                    aiCount: 0,
                    stickerCount: 0,
                    downloadCount: 0,
                    badges: ['Newbie 🌱']
                };

                const userRank = getUserRank(targetUser);
                const userNum = targetUser.split('@')[0];
                const nextLevelExp = uData.level * 100;
                const badgesList = uData.badges.join(', ');

                const profileText = `╭━━━〔 *👤 RYO USER PROFILE* 〕━━━\n│ \n│ 📌 *Pengguna:* @${userNum}\n│ 💰 *Ryo Coins:* ${uData.coins || 500} RC\n│ 🏆 *Peringkat (Rank):* #${userRank}\n│ ⚡ *Level:* ${uData.level}\n│ ✨ *EXP:* ${uData.exp} / ${nextLevelExp}\n│ ├━━〔 📊 *STATISTIK PENGGUNA* 〕\n│ • Total Perintah: ${uData.totalCmd}x\n│ • Chat AI Ryo: ${uData.aiCount}x\n│ • Pembuatan Stiker: ${uData.stickerCount}x\n│ • Unduhan Media: ${uData.downloadCount}x\n│ ├━━〔 🏅 *BADGE & LENCANA* 〕\n│ ${badgesList}\n│ ╰━━━━━━━━━━━━━━━━━━━━━━━`;

                return await sendSmartMessage(sock, from, { image: { url: BANNERS.profile }, caption: profileText }, { quoted: msg, mentions: [targetUser] });
            }

            if (['.t', '.tagall'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                
                let teks = `📣 *TAG ALL / MENTION MEMBER*\n📝 *Pesan:* ${text || 'Tidak ada pesan'}\n\n`;
                for (let mem of groupMembers) {
                    teks += `├ @${mem.id.split('@')[0]}\n`;
                }
                teks += `└━〔 *RYO ASSISTANT* 〕`;
                return await sock.sendMessage(from, { text: teks, mentions: groupMembers.map(m => m.id) }, { quoted: msg });
            }

            if (['.h', '.hidetag'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                const hideMsg = text || (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ? 'Pemberitahuan penting!' : 'Pemberitahuan!');
                return await sock.sendMessage(from, { text: hideMsg, mentions: groupMembers.map(m => m.id) });
            }

            if (['.i', '.groupinfo', '.infogrup', '.gcinfo'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                const owner = groupMetadata.owner ? `@${groupMetadata.owner.split('@')[0]}` : 'Tidak diketahui';
                const creation = groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleDateString('id-ID') : '-';
                
                const infoText = `👥 INFORMASI GRUP\n\n📌 Nama Grup: ${groupMetadata.subject}\n👑 Pembuat: ${owner}\n📅 Dibuat Pada: ${creation}\n👥 Jumlah Member: ${groupMembers.length} Anggota\n🛡️ Jumlah Admin: ${groupAdmins.length} Admin\n📝 Deskripsi:\n${groupMetadata.desc ? groupMetadata.desc.toString() : 'Tidak ada deskripsi.'}`;

                return await sendSmartMessage(sock, from, { image: { url: BANNERS.group }, caption: infoText }, { quoted: msg, mentions: groupMetadata.owner ? [groupMetadata.owner] : [] });
            }

            if (['.l', '.linkgc', '.linkgroup'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                try {
                    const code = await sock.groupInviteCode(from);
                    return await sock.sendMessage(from, { text: `🔗 *Link Tautan Grup (${groupMetadata?.subject || 'Grup'}):*\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
                } catch (err) {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengambil link grup! Pastikan bot/akun kamu adalah Admin Grup.' }, { quoted: msg });
                }
            }

            if (['.g', '.grup', '.group'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });

                const action = args[0]?.toLowerCase();
                try {
                    if (action === 'buka' || action === 'open') {
                        await sock.groupSettingUpdate(from, 'not_announcement');
                        return await sock.sendMessage(from, { text: '🔓 *Chat grup berhasil dibuka!* Semua anggota sekarang bisa mengirim pesan.' }, { quoted: msg });
                    } else if (action === 'tutup' || action === 'close') {
                        await sock.groupSettingUpdate(from, 'announcement');
                        return await sock.sendMessage(from, { text: '🔒 *Chat grup berhasil ditutup!* Hanya admin yang bisa mengirim pesan.' }, { quoted: msg });
                    } else {
                        return await sock.sendMessage(from, { text: '⚠️ Format salah! Gunakan: `.g buka` atau `.g tutup`' }, { quoted: msg });
                    }
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengubah setelan grup. Pastikan akun kamu adalah Admin Grup.' }, { quoted: msg });
                }
            }

            if (['.k', '.kick'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });

                const target = getTargetUser(msg, args);
                if (!target) return await sock.sendMessage(from, { text: '⚠️ Tag user atau reply pesan user yang ingin dikeluarkan!\nContoh: `.k @user`' }, { quoted: msg });

                try {
                    await sock.groupParticipantsUpdate(from, [target], 'remove');
                    return await sock.sendMessage(from, { text: `✅ Berhasil mengeluarkan @${target.split('@')[0]} dari grup.` }, { quoted: msg, mentions: [target] });
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengeluarkan anggota. Pastikan kamu adalah Admin Grup.' }, { quoted: msg });
                }
            }

            if (['.a', '.add'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });

                let num = args[0]?.replace(/[^0-9]/g, '');
                if (!num) return await sock.sendMessage(from, { text: '⚠️ Masukkan nomor telepon!\nContoh: `.a 6281234567890`' }, { quoted: msg });

                try {
                    const target = `${num}@s.whatsapp.net`;
                    await sock.groupParticipantsUpdate(from, [target], 'add');
                    return await sock.sendMessage(from, { text: `✅ Berhasil menambahkan @${num} ke grup.` }, { quoted: msg });
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Gagal menambahkan anggota.' }, { quoted: msg });
                }
            }

            if (['.p', '.promote'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });

                const target = getTargetUser(msg, args);
                if (!target) return await sock.sendMessage(from, { text: '⚠️ Tag user atau reply pesan user yang ingin dijadikan admin!\nContoh: `.p @user`' }, { quoted: msg });

                try {
                    await sock.groupParticipantsUpdate(from, [target], 'promote');
                    return await sock.sendMessage(from, { text: `👑 @${target.split('@')[0]} sekarang resmi menjadi Admin Grup!` }, { quoted: msg, mentions: [target] });
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Gagal menaikkan jabatan admin.' }, { quoted: msg });
                }
            }

            if (['.d', '.demote'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });

                const target = getTargetUser(msg, args);
                if (!target) return await sock.sendMessage(from, { text: '⚠️ Tag user atau reply pesan admin yang ingin diturunkan jabatannya!\nContoh: `.d @user`' }, { quoted: msg });

                try {
                    await sock.groupParticipantsUpdate(from, [target], 'demote');
                    return await sock.sendMessage(from, { text: `✅ @${target.split('@')[0]} telah diturunkan menjadi anggota biasa.` }, { quoted: msg, mentions: [target] });
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Gagal menurunkan jabatan admin.' }, { quoted: msg });
                }
            }

            if (['.sn', '.setname'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                if (!text) return await sock.sendMessage(from, { text: '⚠️ Masukkan nama grup baru! Contoh: `.sn Grup Santai`' }, { quoted: msg });

                try {
                    await sock.groupUpdateSubject(from, text);
                    return await sock.sendMessage(from, { text: `✅ Nama grup berhasil diubah menjadi: *${text}*` }, { quoted: msg });
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengubah nama grup.' }, { quoted: msg });
                }
            }

            if (['.sd', '.setdesc'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isGroup) return await sock.sendMessage(from, { text: '⚠️ Fitur ini hanya bisa digunakan di dalam grup!' }, { quoted: msg });
                if (!text) return await sock.sendMessage(from, { text: '⚠️ Masukkan deskripsi grup baru! Contoh: `.sd Harap patuhi aturan grup`' }, { quoted: msg });

                try {
                    await sock.groupUpdateDescription(from, text);
                    return await sock.sendMessage(from, { text: '✅ Deskripsi grup berhasil diperbarui!' }, { quoted: msg });
                } catch (e) {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengubah deskripsi grup.' }, { quoted: msg });
                }
            }

            if (['.sw', '.status', '.savestatus', '.downloadsw'].includes(command)) {
                addExpAndStat(senderJid, 'download');
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

                if (!quoted) {
                    return await sendSmartMessage(sock, from, { 
                        image: { url: BANNERS.status }, 
                        caption: `⚠️ *CARA DOWNLOAD STATUS WHATSAPP*\n\n📌 *Catatan:* Fitur ini *KHUSUS NOMOR BOT / OWNER* (karena batasan privasi sistem WhatsApp).\n\n1. Buka Status/Story WhatsApp milik temanmu.\n2. Klik *Balas / Reply* pada status tersebut.\n3. Ketik *.sw* atau *.status* lalu kirim.\n\n✨ Bot akan mengunduh media/teks status tersebut secara otomatis!` 
                    }, { quoted: msg });
                }

                try {
                    await sock.sendMessage(from, { text: '⏳ *Sedang mengunduh Status WhatsApp...*' }, { quoted: msg });

                    const targetMsg = {
                        key: {
                            remoteJid: contextInfo.remoteJid || 'status@broadcast',
                            id: contextInfo.stanzaId,
                            participant: contextInfo.participant
                        },
                        message: quoted
                    };

                    const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: pino({ level: 'silent' }) });

                    if (!mediaBuffer) throw new Error('Gagal mendownload media status.');

                    const isQuotedImg = quoted.imageMessage;
                    const isQuotedVid = quoted.videoMessage;
                    const isQuotedAud = quoted.audioMessage;
                    const quotedCaption = quoted.imageMessage?.caption || quoted.videoMessage?.caption || '';

                    const senderNumber = contextInfo.participant ? contextInfo.participant.split('@')[0] : 'Unknown';

                    if (isQuotedImg) {
                        return await sendSmartMessage(sock, from, { 
                            image: mediaBuffer, 
                            caption: `✅ *Status WhatsApp Berhasil Diunduh!*\n👤 *Pemilik:* @${senderNumber}\n📝 *Caption:* ${quotedCaption || '-'}` 
                        }, { quoted: msg, mentions: [contextInfo.participant] });
                    } else if (isQuotedVid) {
                        return await sendSmartMessage(sock, from, { 
                            video: mediaBuffer, 
                            caption: `✅ *Status WhatsApp Berhasil Diunduh!*\n👤 *Pemilik:* @${senderNumber}\n📝 *Caption:* ${quotedCaption || '-'}` 
                        }, { quoted: msg, mentions: [contextInfo.participant] });
                    } else if (isQuotedAud) {
                        return await sendSmartMessage(sock, from, { 
                            audio: mediaBuffer, 
                            mimetype: 'audio/mp4',
                            ptt: true 
                        }, { quoted: msg });
                    } else {
                        return await sock.sendMessage(from, { text: '❌ Tipe media status tidak didukung.' }, { quoted: msg });
                    }
                } catch (err) {
                    const textStatus = quoted.conversation || quoted.extendedTextMessage?.text;
                    const senderNumber = contextInfo?.participant ? contextInfo.participant.split('@')[0] : 'Unknown';

                    if (textStatus) {
                        return await sock.sendMessage(from, { 
                            text: `📝 *Teks Status WhatsApp (@${senderNumber}):*\n\n${textStatus}` 
                        }, { quoted: msg, mentions: [contextInfo.participant] });
                    }
                    return await sock.sendMessage(from, { text: '❌ Gagal mengunduh status. Pastikan status belum terhapus / kadaluarsa!' }, { quoted: msg });
                }
            }

            if (['.svonce', '.vonce', '.getvonce'].includes(command)) {
                addExpAndStat(senderJid, 'download');
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

                if (!quoted) {
                    return await sendSmartMessage(sock, from, { 
                        image: { url: BANNERS.media }, 
                        caption: `⚠️ *CARA MENGAMBIL PESAN SEKALI LIHAT (VIEW ONCE)*\n\n1. *Reply/Balas* pesan foto, video, atau *pesan suara (voice note)* *Sekali Lihat* yang dikirim oleh teman.\n2. Ketik perintah: \`.svonce\`\n3. Bot akan membongkar dan mengirim ulang media/pesan suara tersebut ke chat kamu secara permanen!` 
                    }, { quoted: msg });
                }

                try {
                    await sock.sendMessage(from, { text: '⏳ *Sedang membongkar pesan Sekali Lihat...*' }, { quoted: msg });

                    let innerMsg = quoted;
                    if (quoted.viewOnceMessage?.message) {
                        innerMsg = quoted.viewOnceMessage.message;
                    } else if (quoted.viewOnceMessageV2?.message) {
                        innerMsg = quoted.viewOnceMessageV2.message;
                    } else if (quoted.viewOnceMessageV2Extension?.message) {
                        innerMsg = quoted.viewOnceMessageV2Extension.message;
                    }

                    const targetMsg = {
                        key: {
                            remoteJid: contextInfo.remoteJid || from,
                            id: contextInfo.stanzaId,
                            participant: contextInfo.participant
                        },
                        message: innerMsg
                    };

                    const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    if (!mediaBuffer) throw new Error('Gagal mendownload media view once.');

                    if (innerMsg.imageMessage) {
                        return await sendSmartMessage(sock, from, { 
                            image: mediaBuffer, 
                            caption: `✅ *Berhasil Mengambil Foto Sekali Lihat!*\n📝 *Caption:* ${innerMsg.imageMessage.caption || '-'}` 
                        }, { quoted: msg });
                    } else if (innerMsg.videoMessage) {
                        return await sendSmartMessage(sock, from, { 
                            video: mediaBuffer, 
                            caption: `✅ *Berhasil Mengambil Video Sekali Lihat!*\n📝 *Caption:* ${innerMsg.videoMessage.caption || '-'}` 
                        }, { quoted: msg });
                    } else if (innerMsg.audioMessage) {
                        return await sendSmartMessage(sock, from, { 
                            audio: mediaBuffer, 
                            mimetype: innerMsg.audioMessage.mimetype || 'audio/mp4', 
                            ptt: true 
                        }, { quoted: msg });
                    } else {
                        return await sock.sendMessage(from, { text: '❌ Format pesan sekali lihat tidak didukung.' }, { quoted: msg });
                    }
                } catch (err) {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengunduh pesan sekali lihat. Pastikan kamu mereply pesan View Once yang valid dan belum kedaluwarsa!' }, { quoted: msg });
                }
            }

            if (['.rt', '.ping', '.runtime', '.speed'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const startPing = Date.now();
                const uptime = formatUptime(Date.now() - startTime);
                const speed = Date.now() - startPing;
                const statusText = `⚡ RYO ASSISTANT BOT STATUS\n\n⏱️ Uptime: ${uptime}\n🚀 Response Speed: ${speed}ms\n📡 Server: Online 24/7 (Node.js & PM2)\n🎭 Current Persona: ${currentPersona.toUpperCase()}\n📬 Queue Active: ${imgQueue.size()} tugas dalam antrean`;
                return await sendSmartMessage(sock, from, { image: { url: BANNERS.status }, caption: statusText }, { quoted: msg });
            }

            if (['.info', '.rules', '.about'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const infoText = `ℹ️ INFORMASI & ATURAN RYO ASSISTANT\n\n• Dilarang melakukan spam command berlebihan.\n• Bot dilengkapi Media QR Code Generator (MP4 Fix), Economy, & Group Manager.\n• Fitur .sw khusus untuk nomor bot / owner.\n• Nikmati fitur bot dengan bijak!`;
                return await sendSmartMessage(sock, from, { image: { url: BANNERS.media }, caption: infoText }, { quoted: msg });
            }

            if (['.ps', '.persona'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                const selectedPersona = text.toLowerCase();
                if (!['santai', 'pemarah', 'pendiam'].includes(selectedPersona)) {
                    return await sendSmartMessage(sock, from, { image: { url: BANNERS.persona }, caption: '⚠️ Pilih persona: `.ps santai`, `.ps pemarah`, atau `.ps pendiam`.' }, { quoted: msg });
                }
                setPersona(from, selectedPersona);
                const personaBanner = PERSONA_BANNERS[selectedPersona] || BANNERS.persona;
                return await sendSmartMessage(sock, from, { 
                    image: { url: personaBanner }, 
                    caption: `✅ *Persona AI Ryo Berhasil Diubah!*\n\n🎭 *Persona Saat Ini:* ${selectedPersona.toUpperCase()}\n💡 Ketik \`@<teks>\` untuk mengobrol dengan AI.` 
                }, { quoted: msg });
            }

            if (command === '.sticker' || command === '.s') {
                addExpAndStat(senderJid, 'sticker');
                if (!isImage) return await sendSmartMessage(sock, from, { image: { url: BANNERS.media }, caption: '⚠️ Fitur ini membutuhkan *1 foto*! Kirim foto langsung atau *reply* foto dengan caption `.s`.' }, { quoted: msg });
                try {
                    await sock.sendMessage(from, { text: '⏳ *Sedang memproses stiker...*' }, { quoted: msg });
                    let targetMsg = msg;
                    if (isQuotedImage) {
                        targetMsg = { key: msg.key, message: msg.message.extendedTextMessage.contextInfo.quotedMessage };
                    }
                    const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    if (!mediaBuffer) throw new Error('Gagal mengambil gambar.');
                    const tmpIn = path.join(__dirname, `tmp_${Date.now()}.jpg`);
                    const tmpOut = path.join(__dirname, `tmp_${Date.now()}.webp`);
                    fs.writeFileSync(tmpIn, mediaBuffer);
                    exec(`ffmpeg -i "${tmpIn}" -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-ih)/2:(oh-ih)/2:color=#00000000" "${tmpOut}"`, async (err) => {
                        if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn);
                        if (err) return await sock.sendMessage(from, { text: '❌ Gagal membuat stiker.' }, { quoted: msg });
                        const webpBuffer = fs.readFileSync(tmpOut);
                        await sock.sendMessage(from, { sticker: webpBuffer }, { quoted: msg });
                        if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
                    });
                } catch (err) {
                    return await sock.sendMessage(from, { text: `❌ Gagal membuat stiker.` }, { quoted: msg });
                }
            }

            if (['.wr', '.watermark'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isImage) return await sendSmartMessage(sock, from, { image: { url: BANNERS.media }, caption: '⚠️ Fitur `.wr` membutuhkan *1 foto*!\nKirim foto langsung atau *reply* foto yang ada watermark-nya lalu ketik `.wr`.' }, { quoted: msg });
                try {
                    await sock.sendMessage(from, { text: '🛡️ *Membersihkan Watermark...*' }, { quoted: msg });
                    let targetMsg = msg;
                    if (isQuotedImage) targetMsg = { key: msg.key, message: msg.message.extendedTextMessage.contextInfo.quotedMessage };
                    const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: pino({ level: 'silent' }) });

                    const image = await Jimp.read(mediaBuffer);
                    const w = image.bitmap ? image.bitmap.width : image.width;
                    const h = image.bitmap ? image.bitmap.height : image.height;
                    if (h > 100) {
                        if (typeof image.crop === 'function') {
                            image.crop(0, 0, w, h - 60);
                        }
                    }
                    let cleanBuffer;
                    if (typeof image.getBufferAsync === 'function') cleanBuffer = await image.getBufferAsync('image/jpeg');
                    else cleanBuffer = await new Promise(res => image.getBuffer('image/jpeg', (e, b) => res(b || mediaBuffer)));

                    return await sendSmartMessage(sock, from, { image: cleanBuffer, caption: '✅ *Berhasil! Watermark dibersihkan total.*' }, { quoted: msg });
                } catch (err) {
                    return await sock.sendMessage(from, { text: '❌ Gagal memproses fitur .wr.' }, { quoted: msg });
                }
            }

            if (['.hd', '.remini', '.bg', '.benergambar'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!isImage) return await sendSmartMessage(sock, from, { image: { url: BANNERS.media }, caption: '⚠️ Fitur ini membutuhkan *1 foto*! Kirim foto langsung atau *reply* foto dengan caption `.hd` atau `.bg`.' }, { quoted: msg });
                try {
                    await sock.sendMessage(from, { text: '✨ *Sedang memperbaiki & menjernihkan foto...*' }, { quoted: msg });
                    let targetMsg = msg;
                    if (isQuotedImage) targetMsg = { key: msg.key, message: msg.message.extendedTextMessage.contextInfo.quotedMessage };
                    const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: pino({ level: 'silent' }) });
                    const imageUrl = await uploadMedia(mediaBuffer, 'image.jpg');
                    const result = await processHDImage(imageUrl, mediaBuffer);
                    if (result?.buffer) return await sendSmartMessage(sock, from, { image: result.buffer, caption: `✨ *Berhasil Diperbaiki & Dijernihkan!*` }, { quoted: msg });
                    else return await sock.sendMessage(from, { text: '❌ Gagal memproses gambar.' }, { quoted: msg });
                } catch (err) {
                    return await sock.sendMessage(from, { text: `❌ Gagal memproses perbaikan foto.` }, { quoted: msg });
                }
            }

            const artStyles = {
                '.gb': { style: 'flux', banner: BANNERS.gambar },
                '.gambar': { style: 'flux', banner: BANNERS.gambar },
                '.an': { style: 'anime', banner: BANNERS.anime },
                '.anime': { style: 'anime', banner: BANNERS.anime },
                '.3d': { style: '3d', banner: BANNERS.threed },
                '.px': { style: 'pixel', banner: BANNERS.pixel },
                '.pixel': { style: 'pixel', banner: BANNERS.pixel },
                '.lg': { style: 'logo', banner: BANNERS.logo },
                '.logo': { style: 'logo', banner: BANNERS.logo },
                '.cp': { style: 'cyberpunk', banner: BANNERS.cyberpunk },
                '.cyberpunk': { style: 'cyberpunk', banner: BANNERS.cyberpunk },
                '.sk': { style: 'sketch', banner: BANNERS.sketch },
                '.sketch': { style: 'sketch', banner: BANNERS.sketch }
            };

            const ratioMap = {
                '1:1': { w: 1024, h: 1024 },
                '16:9': { w: 1920, h: 1080 },
                '9:16': { w: 1080, h: 1920 },
                '4:3': { w: 1440, h: 1080 },
                '3:4': { w: 1080, h: 1440 }
            };

            if (artStyles[command]) {
                addExpAndStat(senderJid, 'cmd');
                const config = artStyles[command];
                if (!text) return await sendSmartMessage(sock, from, { image: { url: config.banner }, caption: `⚠️ Masukkan prompt!\n\nContoh Rasio 9:16:\n${command} 9:16 wanita berhijab pink memakai gamis panjang full body` }, { quoted: msg });

                let imgCount = 1;
                let targetWidth = 1080;
                let targetHeight = 1920;
                let ratioStr = '9:16';
                let currentIndex = 0;

                if (args.length > 0 && !isNaN(args[0]) && !args[0].includes(':')) {
                    imgCount = Math.min(parseInt(args[0]), 5);
                    currentIndex++;
                }

                if (args.length > currentIndex && args[currentIndex].includes(':')) {
                    const r = args[currentIndex].toLowerCase();
                    if (ratioMap[r]) {
                        ratioStr = r;
                        targetWidth = ratioMap[r].w;
                        targetHeight = ratioMap[r].h;
                        currentIndex++;
                    }
                }

                const promptText = args.slice(currentIndex).join(' ');
                if (!promptText) return await sendSmartMessage(sock, from, { image: { url: config.banner }, caption: `⚠️ Masukkan teks prompt setelah rasio!` }, { quoted: msg });

                const queuePos = imgQueue.size() + 1;
                await sendSmartMessage(sock, from, { image: { url: config.banner }, caption: `⏳ *Masuk Antrean Full-Body Render (Posisi: ${queuePos})*\n📐 Rasio: ${ratioStr} | Gaya: ${config.style.toUpperCase()}` }, { quoted: msg });

                try {
                    for (let i = 0; i < imgCount; i++) {
                        const cleanImageBuffer = await imgQueue.add(() => generateCleanImageBuffer(promptText, config.style, targetWidth, targetHeight));
                        await sock.sendMessage(from, { 
                            image: cleanImageBuffer,
                            caption: `✅ *AI Art Full-Body Master Lock | Rasio: ${ratioStr} [${i + 1}/${imgCount}]*\n📝 Prompt: ${promptText}` 
                        }, { quoted: msg });
                    }
                    return;
                } catch (err) {
                    return await sock.sendMessage(from, { text: '❌ Server AI sedang padat. Coba lagi dalam beberapa saat!' }, { quoted: msg });
                }
            }

            const aiToolkitPrompts = {
                '.ai': 'Kamu adalah Ryo, asisten AI serbaguna. Jawab pertanyaan pengguna secara akurat, jelas, ramah, dan dalam bahasa pengguna.',
                '.chat': 'Kamu adalah Ryo dalam mode chat. Balas secara natural, santai, relevan, dan tidak bertele-tele.',
                '.ask': 'Kamu adalah asisten tanya jawab. Jawab pertanyaan pengguna secara langsung dan jelaskan bila diperlukan.',
                '.deepthink': 'Analisis permintaan secara mendalam. Pecah masalah menjadi bagian-bagian, jelaskan asumsi, pertimbangkan alternatif, lalu berikan kesimpulan yang jelas. Jangan tampilkan proses berpikir internal; berikan hanya ringkasan alasan yang dapat dipahami pengguna.',
                '.explain': 'Jelaskan topik berikut dari dasar sampai mudah dipahami. Gunakan contoh sederhana jika membantu.',
                '.summarize': 'Ringkas teks berikut menjadi inti yang padat, jelas, dan mudah dibaca. Gunakan poin jika cocok.',
                '.rewrite': 'Tulis ulang teks berikut agar lebih natural, jelas, rapi, dan tetap mempertahankan maksud aslinya.',
                '.expand': 'Kembangkan teks atau ide berikut menjadi lebih lengkap, terstruktur, dan informatif tanpa mengubah maksud utamanya.',
                '.shorten': 'Persingkat teks berikut tanpa menghilangkan informasi penting dan maksud utamanya.',
                '.grammar': 'Periksa dan perbaiki ejaan, tata bahasa, tanda baca, serta kejelasan teks berikut. Tampilkan versi yang sudah diperbaiki dan catatan singkat bila ada perubahan penting.',
                '.detectlang': 'Deteksi bahasa teks berikut. Jawab dengan nama bahasa dan kode bahasa ISO jika dapat ditentukan, lalu berikan tingkat keyakinan secara singkat.',
                '.factcheck': 'Evaluasi klaim berikut secara hati-hati. Bedakan fakta yang dapat didukung, hal yang belum dapat dipastikan, dan informasi yang membutuhkan verifikasi. Jangan mengarang sumber.',
                '.compare': 'Bandingkan dua atau lebih hal berikut secara objektif. Susun persamaan, perbedaan, kelebihan/keterbatasan yang relevan, lalu simpulkan perbedaan utamanya tanpa membuat peringkat subjektif.',
                '.analyze': 'Analisis teks atau masalah berikut secara terstruktur. Identifikasi poin utama, pola, masalah, dan implikasi yang relevan.',
                '.brainstorm': 'Lakukan brainstorming untuk topik berikut. Berikan banyak ide yang beragam dan praktis, lalu kelompokkan berdasarkan kategori.',
                '.idea': 'Berikan ide-ide kreatif dan realistis untuk topik berikut. Prioritaskan variasi ide dan jelaskan singkat masing-masing.',
                '.advice': 'Berikan saran yang praktis, aman, dan realistis untuk situasi berikut. Sebutkan beberapa opsi dan pertimbangan penting.',
                '.plan': 'Buat rencana langkah demi langkah untuk mencapai tujuan berikut. Sertakan urutan, prioritas, dan hasil yang diharapkan.',
                '.tutor': 'Bertindak sebagai tutor yang sabar. Ajarkan materi berikut secara bertahap dengan penjelasan sederhana, contoh, dan pertanyaan latihan singkat bila sesuai.'
            };

            const aiToolkitCommands = [...Object.keys(aiToolkitPrompts), '.translate'];
            if (aiToolkitCommands.includes(command)) {
                const quotedMsgObj = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const quotedText = quotedMsgObj?.conversation ||
                                   quotedMsgObj?.extendedTextMessage?.text ||
                                   quotedMsgObj?.imageMessage?.caption ||
                                   quotedMsgObj?.videoMessage?.caption || '';
                let aiInput = text || quotedText;

                if (!aiInput && command !== '.translate') {
                    const examples = {
                        '.ai': '`.ai apa itu kecerdasan buatan?`',
                        '.chat': '`.chat halo Ryo`',
                        '.deepthink': '`.deepthink bagaimana cara belajar coding?`',
                        '.summarize': 'reply teks lalu `.summarize`',
                        '.rewrite': '`.rewrite buat kalimat ini lebih formal: ...`',
                        '.factcheck': '`.factcheck bumi mengelilingi matahari`',
                        '.plan': '`.plan belajar JavaScript 30 hari`',
                        '.tutor': '`.tutor jelaskan pecahan untuk pemula`'
                    };
                    return await sock.sendMessage(from, { text: `⚠️ Masukkan teks atau reply pesan yang ingin diproses.\nContoh: ${examples[command] || `\`${command} <teks>\``}` }, { quoted: msg });
                }

                addExpAndStat(senderJid, 'ai');

                if (command === '.translate') {
                    const targetLang = args[0];
                    aiInput = args.slice(1).join(' ') || quotedText;
                    if (!targetLang || !aiInput) {
                        return await sock.sendMessage(from, { text: '⚠️ Format: `.translate <kode_bahasa> <teks>`\nContoh: `.translate en Halo apa kabar`\nAtau reply teks lalu gunakan `.translate en`' }, { quoted: msg });
                    }
                    const result = await callAI(`Kamu adalah penerjemah profesional. Terjemahkan teks ke bahasa dengan kode "${targetLang}". Jawab hanya hasil terjemahan.`, aiInput);
                    return await sock.sendMessage(from, { text: `🌐 *TERJEMAHAN (${targetLang.toUpperCase()})*\n\n${result}` }, { quoted: msg });
                }

                await sock.sendMessage(from, { text: `⏳ *Ryo sedang memproses ${command}...*` }, { quoted: msg });
                const result = await callAI(aiToolkitPrompts[command], aiInput);
                const labels = {
                    '.ai': '🤖 AI', '.chat': '💬 CHAT', '.ask': '❓ ASK', '.deepthink': '🧠 DEEP THINK',
                    '.explain': '📚 EXPLAIN', '.summarize': '📋 SUMMARY', '.rewrite': '✍️ REWRITE',
                    '.expand': '➕ EXPAND', '.shorten': '✂️ SHORTEN', '.grammar': '📝 GRAMMAR',
                    '.detectlang': '🌐 LANGUAGE', '.factcheck': '🔎 FACT CHECK', '.compare': '⚖️ COMPARE',
                    '.analyze': '📊 ANALYZE', '.brainstorm': '💡 BRAINSTORM', '.idea': '💡 IDEA',
                    '.advice': '🗣️ ADVICE', '.plan': '🗺️ PLAN', '.tutor': '🎓 TUTOR'
                };
                return await sock.sendMessage(from, { text: `*${labels[command] || '🤖 AI'}*\n\n${result}` }, { quoted: msg });
            }

            if (command === '.tr') {
                addExpAndStat(senderJid, 'cmd');
                const targetLang = args[0];
                let toTranslate = args.slice(1).join(' ');

                const quotedMsgObj = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const quotedText = quotedMsgObj?.conversation || 
                                   quotedMsgObj?.extendedTextMessage?.text || 
                                   quotedMsgObj?.imageMessage?.caption || 
                                   quotedMsgObj?.videoMessage?.caption;

                if (!targetLang) {
                    return await sendSmartMessage(sock, from, { 
                        image: { url: BANNERS.tr }, 
                        caption: '⚠️ *Format Penerjemah Tidak Lengkap!*\n\nCara pakai:\n1. Ketik langsung: `.tr <kode_bhs> <teks>`\n2. Atau *reply* pesan lalu ketik: `.tr <kode_bhs>`\n\nContoh: `.tr en Halo apa kabar`' 
                    }, { quoted: msg });
                }

                if (!toTranslate && quotedText) toTranslate = quotedText;
                if (!toTranslate) return await sendSmartMessage(sock, from, { image: { url: BANNERS.tr }, caption: `⚠️ Teks tidak ditemukan!` }, { quoted: msg });

                await sendSmartMessage(sock, from, { image: { url: BANNERS.tr }, caption: '🌐 *Menerjemahkan teks...*' }, { quoted: msg });
                const result = await callAI(`Kamu adalah penerjemah profesional. Terjemahkan teks berikut ke bahasa dengan kode "${targetLang}". Jawab HANYA dengan hasil terjemahan, tanpa penjelasan tambahan.`, toTranslate);

                const translationText = `🌐 HASIL TERJEMAHAN (${targetLang.toUpperCase()})\n\n📝 Teks Asli:\n${toTranslate}\n\n✨ Terjemahan:\n${result}`;

                return await sock.sendMessage(from, { text: translationText }, { quoted: msg });
            }

            if (['.es', '.essay'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!text) return await sendSmartMessage(sock, from, { image: { url: BANNERS.essay }, caption: '⚠️ Masukkan topik esai! Contoh: `.es pentingnya pendidikan`' }, { quoted: msg });
                await sendSmartMessage(sock, from, { image: { url: BANNERS.essay }, caption: '✍️ *Sedang menulis esai...*' }, { quoted: msg });
                const result = await callAI('Kamu adalah penulis esai profesional berbahasa Indonesia. Tulis esai terstruktur (pembukaan, isi, penutup) sekitar 300-400 kata.', text);
                return await sock.sendMessage(from, { text: `📄 *Esai: ${text}*\n\n${result}` }, { quoted: msg });
            }

            if (['.rg', '.rangkum'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!text) return await sendSmartMessage(sock, from, { image: { url: BANNERS.rangkum }, caption: '⚠️ Masukkan atau *reply* teks yang mau dirangkum!' }, { quoted: msg });
                await sendSmartMessage(sock, from, { image: { url: BANNERS.rangkum }, caption: '📋 *Merangkum teks...*' }, { quoted: msg });
                const result = await callAI('Kamu adalah asisten yang meringkas teks menjadi poin-poin singkat dan jelas dalam bahasa Indonesia.', text);
                return await sock.sendMessage(from, { text: `📋 *Ringkasan*\n\n${result}` }, { quoted: msg });
            }

            if (['.gm', '.grammar'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!text) return await sendSmartMessage(sock, from, { image: { url: BANNERS.grammar }, caption: '⚠️ Masukkan kalimat yang mau dicek!' }, { quoted: msg });
                await sendSmartMessage(sock, from, { image: { url: BANNERS.grammar }, caption: '📝 *Mengecek grammar...*' }, { quoted: msg });
                const result = await callAI('Kamu adalah editor bahasa. Perbaiki ejaan, tata bahasa, dan kejelasan kalimat berikut.', text);
                return await sock.sendMessage(from, { text: result }, { quoted: msg });
            }

            if (['.cd', '.code'].includes(command)) {
                addExpAndStat(senderJid, 'cmd');
                if (!text) return await sendSmartMessage(sock, from, { image: { url: BANNERS.code }, caption: '⚠️ Masukkan permintaan kode! Contoh: `.cd buat fungsi fibonacci di javascript`' }, { quoted: msg });
                await sendSmartMessage(sock, from, { image: { url: BANNERS.code }, caption: '💻 *Sedang ngoding...*' }, { quoted: msg });
                const result = await callAI('Kamu adalah asisten programmer ahli. Berikan kode yang rapi dan benar.', text);
                return await sock.sendMessage(from, { text: result }, { quoted: msg });
            }

            if (['.tt', '.tiktok'].includes(command)) {
                addExpAndStat(senderJid, 'download');
                if (!text) return await sendSmartMessage(sock, from, { image: { url: BANNERS.tt }, caption: '⚠️ Masukkan link TikTok!' }, { quoted: msg });
                await sendSmartMessage(sock, from, { image: { url: BANNERS.tt }, caption: '⏳ *Sedang memproses video TikTok...*' }, { quoted: msg });

                const apis = [
                    async () => {
                        const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}`, { timeout: 15000 });
                        if (res.data?.data?.play) return { videoUrl: res.data.data.play };
                        return null;
                    },
                    async () => {
                        const res = await axios.get(`https://itzpire.site/download/tiktok?url=${encodeURIComponent(text)}`, { timeout: 15000 });
                        const video = res.data?.data?.video || res.data?.data?.no_watermark;
                        if (video) return { videoUrl: video };
                        return null;
                    }
                ];

                let videoData = null;
                for (const api of apis) {
                    try {
                        videoData = await api();
                        if (videoData?.videoUrl) break;
                    } catch (e) { continue; }
                }

                if (videoData?.videoUrl) {
                    try {
                        return await sock.sendMessage(from, { video: { url: videoData.videoUrl }, caption: `✅ *TikTok Downloader (No WM)*` }, { quoted: msg });
                    } catch (err) {
                        return await sock.sendMessage(from, { text: '❌ Video berhasil didapat, tapi ukurannya terlalu besar untuk dikirimkan via WhatsApp.' }, { quoted: msg });
                    }
                } else {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengunduh! Server sedang diblokir atau ini adalah postingan foto (slide).' }, { quoted: msg });
                }
            }

            if (
                ['.ig', '.instagram', '.igdl', '.igdown', '.instadl'].includes(command)
            ) {
                addExpAndStat(senderJid, 'download');

                if (!text) {
                    return await sendSmartMessage(
                        sock,
                        from,
                        {
                            image: { url: BANNERS.ig },
                            caption:
`📸 *INSTAGRAM DOWNLOADER*

Mendukung:
🎬 Video / Reels
🖼️ Gambar / Post
🎞️ GIF
🖼️ Carousel / Multiple Media

Contoh:
\`.ig https://www.instagram.com/reel/xxxxx/\`
\`.igdl https://www.instagram.com/p/xxxxx/\``
                        },
                        { quoted: msg }
                    );
                }

                if (!isInstagramUrl(text)) {
                    return await sock.sendMessage(
                        from,
                        {
                            text:
`⚠️ *Link Instagram tidak valid!*

Contoh:
https://www.instagram.com/reel/xxxxx/
https://www.instagram.com/p/xxxxx/`
                        },
                        { quoted: msg }
                    );
                }

                await sendSmartMessage(
                    sock,
                    from,
                    {
                        image: { url: BANNERS.ig },
                        caption:
`⏳ *Sedang memproses Instagram...*

🔎 Mencari video / gambar / GIF...
📥 Menyiapkan media untuk dikirim...`
                    },
                    { quoted: msg }
                );

                try {
                    const mediaItems = await getInstagramFromApi(text);

                    if (!mediaItems.length) {
                        return await sock.sendMessage(
                            from,
                            {
                                text:
`❌ *Media Instagram tidak ditemukan.*

Kemungkinan:
• Postingan bersifat privat
• Link sudah tidak aktif
• Server downloader sedang bermasalah
• Instagram membatasi akses media tersebut`
                            },
                            { quoted: msg }
                        );
                    }

                    const limitedItems = mediaItems.slice(0, 10);
                    let sentCount = 0;

                    for (let i = 0; i < limitedItems.length; i++) {
                        const media = await downloadInstagramBuffer(
                            limitedItems[i]
                        );

                        if (!media) continue;

                        try {
                            if (media.type === 'video') {
                                if (media.buffer.length > 60 * 1024 * 1024) {
                                    await sock.sendMessage(
                                        from,
                                        {
                                            document: media.buffer,
                                            mimetype: 'video/mp4',
                                            fileName: `instagram-video-${i + 1}.mp4`,
                                            caption:
                                                `✅ *Instagram Video [${i + 1}/${limitedItems.length}]*`
                                        },
                                        { quoted: msg }
                                    );
                                } else {
                                    await sock.sendMessage(
                                        from,
                                        {
                                            video: media.buffer,
                                            mimetype: 'video/mp4',
                                            caption:
                                                `✅ *Instagram Video/Reels [${i + 1}/${limitedItems.length}]*`
                                        },
                                        { quoted: msg }
                                    );
                                }

                                sentCount++;
                                continue;
                            }

                            if (media.type === 'gif') {
                                if (media.buffer.length > 50 * 1024 * 1024) {
                                    await sock.sendMessage(
                                        from,
                                        {
                                            document: media.buffer,
                                            mimetype: 'image/gif',
                                            fileName: `instagram-${i + 1}.gif`,
                                            caption:
                                                `✅ *Instagram GIF [${i + 1}/${limitedItems.length}]*`
                                        },
                                        { quoted: msg }
                                    );
                                } else {
                                    await sock.sendMessage(
                                        from,
                                        {
                                            video: media.buffer,
                                            mimetype: 'image/gif',
                                            gifPlayback: true,
                                            caption:
                                                `✅ *Instagram GIF [${i + 1}/${limitedItems.length}]*`
                                        },
                                        { quoted: msg }
                                    );
                                }

                                sentCount++;
                                continue;
                            }

                            // IMAGE
                            if (media.buffer.length > 50 * 1024 * 1024) {
                                await sock.sendMessage(
                                    from,
                                    {
                                        document: media.buffer,
                                        mimetype: 'image/jpeg',
                                        fileName: `instagram-image-${i + 1}.jpg`,
                                        caption:
                                            `✅ *Instagram Gambar [${i + 1}/${limitedItems.length}]*`
                                    },
                                    { quoted: msg }
                                );
                            } else {
                                await sock.sendMessage(
                                    from,
                                    {
                                        image: media.buffer,
                                        caption:
                                            `✅ *Instagram Gambar [${i + 1}/${limitedItems.length}]*`
                                    },
                                    { quoted: msg }
                                );
                            }

                            sentCount++;
                        } catch (sendErr) {
                            // Fallback terakhir: kirim sebagai dokumen.
                            try {
                                let mime = 'image/jpeg';
                                let filename = `instagram-${i + 1}.jpg`;

                                if (media.type === 'video') {
                                    mime = 'video/mp4';
                                    filename = `instagram-${i + 1}.mp4`;
                                } else if (media.type === 'gif') {
                                    mime = 'image/gif';
                                    filename = `instagram-${i + 1}.gif`;
                                }

                                await sock.sendMessage(
                                    from,
                                    {
                                        document: media.buffer,
                                        mimetype: mime,
                                        fileName: filename,
                                        caption:
                                            `✅ *Instagram ${media.type.toUpperCase()} [${i + 1}/${limitedItems.length}]*`
                                    },
                                    { quoted: msg }
                                );

                                sentCount++;
                            } catch (fallbackErr) {}
                        }
                    }

                    if (sentCount === 0) {
                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    '❌ Media ditemukan, tetapi gagal dikirim ke WhatsApp.'
                            },
                            { quoted: msg }
                        );
                    }

                    if (limitedItems.length > sentCount) {
                        await sock.sendMessage(
                            from,
                            {
                                text:
`ℹ️ *Instagram selesai diproses.*
Berhasil dikirim: ${sentCount}/${limitedItems.length} media.`
                            },
                            { quoted: msg }
                        );
                    }

                    return;
                } catch (err) {
                    console.error('[Instagram ERROR]', err);
                    console.error('[Instagram ERROR STACK]', err?.stack || err);

                    return await sock.sendMessage(
                        from,
                        {
                            text:
`❌ *Gagal memproses Instagram.*

Error: ${err?.message || 'Unknown error'}`
                        },
                        { quoted: msg }
                    );
                }
            }
            if (['.yt', '.youtube'].includes(command)) {
                if (!text) {
                    return await sendSmartMessage(
                        sock,
                        from,
                        {
                            image: { url: BANNERS.yt },
                            caption: '⚠️ Masukkan link YouTube!'
                        },
                        { quoted: msg }
                    );
                }

                await sendSmartMessage(
                    sock,
                    from,
                    {
                        image: { url: BANNERS.yt },
                        caption: '⏳ *Sedang mengambil YouTube MP4...*'
                    },
                    { quoted: msg }
                );

                const ytSource = path.join(
                    TMP_DIR,
                    `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-source.mp4`
                );

                const ytOutput = path.join(
                    TMP_DIR,
                    `yt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-h264.mp4`
                );

                try {
                    log.info(`[YouTube yt-dlp] Mengunduh: ${text}`);

                    await execFileAsync(
                        'yt-dlp',
                        [
                            '--no-playlist',
                            '--no-warnings',
                            '--quiet',
                            '-f',
                            'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best',
                            '--merge-output-format',
                            'mp4',
                            '-o',
                            ytSource,
                            text
                        ],
                        { timeout: 180000 }
                    );

                    if (!fs.existsSync(ytSource)) {
                        throw new Error('File YouTube hasil download tidak ditemukan.');
                    }

                    const sourceStat = fs.statSync(ytSource);

                    if (!sourceStat.size) {
                        throw new Error('File YouTube kosong.');
                    }

                    log.info(`[YouTube yt-dlp] Source: ${sourceStat.size} bytes`);

                    log.info(`[YouTube FFmpeg] Konversi ke H264: ${ytOutput}`);

                    await execFileAsync(
                        'ffmpeg',
                        [
                            '-y',
                            '-i',
                            ytSource,
                            '-c:v',
                            'libx264',
                            '-preset',
                            'veryfast',
                            '-crf',
                            '23',
                            '-pix_fmt',
                            'yuv420p',
                            '-profile:v',
                            'high',
                            '-level',
                            '4.0',
                            '-c:a',
                            'aac',
                            '-b:a',
                            '128k',
                            '-movflags',
                            '+faststart',
                            ytOutput
                        ],
                        { timeout: 180000 }
                    );

                    if (!fs.existsSync(ytOutput)) {
                        throw new Error('File H264 YouTube tidak berhasil dibuat.');
                    }

                    const outputStat = fs.statSync(ytOutput);

                    if (!outputStat.size) {
                        throw new Error('File H264 YouTube kosong.');
                    }

                    log.info(`[YouTube FFmpeg] H264 siap: ${ytOutput} (${outputStat.size} bytes)`);

                    await sock.sendMessage(
                        from,
                        {
                            video: { url: ytOutput },
                            mimetype: 'video/mp4',
                            fileName: 'youtube-video.mp4',
                            caption: '✅ *YouTube Downloader*'
                        },
                        { quoted: msg }
                    );

                    log.info('[YouTube] Video H264 berhasil dikirim.');
                    return;
                } catch (err) {
                    log.error(
                        `[YouTube] ${err.stderr || err.message || err}`
                    );

                    await sock.sendMessage(
                        from,
                        {
                            text: `❌ *Gagal mengambil video YouTube.*\n\n${err.message || 'Terjadi kesalahan.'}`
                        },
                        { quoted: msg }
                    );
                } finally {
                    setTimeout(() => {
                        for (const file of [ytSource, ytOutput]) {
                            try {
                                if (fs.existsSync(file)) {
                                    fs.unlinkSync(file);
                                    log.info(`[YouTube] File temporary dihapus: ${file}`);
                                }
                            } catch (cleanupErr) {
                                log.error(
                                    `[YouTube] Gagal menghapus temporary: ${cleanupErr.message}`
                                );
                            }
                        }
                    }, 5000);
                }

                return;
            }

            if (['.fb', '.facebook'].includes(command)) {
                    addExpAndStat(senderJid, 'download');

                    if (!text) {
                        return await sendSmartMessage(
                            sock,
                            from,
                            {
                                image: { url: BANNERS.fb },
                                caption: '⚠️ Masukkan link Facebook!'
                            },
                            { quoted: msg }
                        );
                    }

                    await sendSmartMessage(
                        sock,
                        from,
                        {
                            image: { url: BANNERS.fb },
                            caption: '⏳ *Mengunduh & memproses video Facebook...*'
                        },
                        { quoted: msg }
                    );

                    const fbId =
                        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                    const sourceFile = path.join(
                        TMP_DIR,
                        `fb-${fbId}-source.mp4`
                    );

                    const outputFile = path.join(
                        TMP_DIR,
                        `fb-${fbId}-h264.mp4`
                    );

                    try {
                        log.info(`[Facebook yt-dlp] Mengunduh: ${text}`);

                        await execFileAsync(
                            'yt-dlp',
                            [
                                '--no-playlist',
                                '--no-warnings',
                                '--quiet',
                                '--merge-output-format', 'mp4',
                                '-f',
                                'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                                '-o',
                                sourceFile,
                                text
                            ],
                            { timeout: 120000 }
                        );

                        if (!fs.existsSync(sourceFile)) {
                            throw new Error(
                                'File Facebook tidak ditemukan setelah download'
                            );
                        }

                        const sourceStat = fs.statSync(sourceFile);

                        if (!sourceStat.size) {
                            throw new Error('File Facebook kosong');
                        }

                        log.info(
                            `[Facebook yt-dlp] Source: ${sourceStat.size} bytes`
                        );

                        log.info(
                            `[Facebook FFmpeg] Mengubah ke H264: ${sourceFile}`
                        );

                        await execFileAsync(
                            'ffmpeg',
                            [
                                '-y',
                                '-i',
                                sourceFile,
                                '-map',
                                '0:v:0',
                                '-map',
                                '0:a:0?',
                                '-c:v',
                                'libx264',
                                '-preset',
                                'veryfast',
                                '-crf',
                                '23',
                                '-pix_fmt',
                                'yuv420p',
                                '-c:a',
                                'aac',
                                '-b:a',
                                '128k',
                                '-movflags',
                                '+faststart',
                                outputFile
                            ],
                            { timeout: 180000 }
                        );

                        if (!fs.existsSync(outputFile)) {
                            throw new Error(
                                'File H264 tidak ditemukan setelah FFmpeg'
                            );
                        }

                        const outputStat = fs.statSync(outputFile);

                        if (!outputStat.size) {
                            throw new Error(
                                'File H264 hasil FFmpeg kosong'
                            );
                        }

                        log.info(
                            `[Facebook FFmpeg] H264 siap: ${outputFile} (${outputStat.size} bytes)`
                        );

                        await sock.sendMessage(
                            from,
                            {
                                video: {
                                    url: outputFile
                                },
                                mimetype: 'video/mp4',
                                fileName: 'facebook-video.mp4',
                                caption: '✅ *Facebook Downloader*'
                            },
                            { quoted: msg }
                        );

                        log.info(
                            '[Facebook] Video H264 berhasil dikirim.'
                        );

                        return;

                    } catch (err) {
                        log.error(
                            `[Facebook] Gagal: ${err.stderr || err.message || err}`
                        );

                        try {
                            if (fs.existsSync(sourceFile)) {
                                fs.unlinkSync(sourceFile);
                            }
                        } catch {}

                        try {
                            if (fs.existsSync(outputFile)) {
                                fs.unlinkSync(outputFile);
                            }
                        } catch {}

                        return await sock.sendMessage(
                            from,
                            {
                                text:
                                    '❌ Gagal mengunduh/memproses video Facebook.\n\n' +
                                    'Pastikan link Facebook bersifat publik.'
                            },
                            { quoted: msg }
                        );

                    } finally {
                        setTimeout(() => {
                            for (const file of [sourceFile, outputFile]) {
                                try {
                                    if (fs.existsSync(file)) {
                                        fs.unlinkSync(file);
                                        log.info(
                                            `[Facebook] Temporary dihapus: ${file}`
                                        );
                                    }
                                } catch {}
                            }
                        }, 30000);
                    }
                }

                if (['.x', '.twitter'].includes(command)) {
                addExpAndStat(senderJid, 'download');
                if (!text) return await sendSmartMessage(sock, from, { image: { url: BANNERS.x }, caption: '⚠️ Masukkan link Twitter/X!' }, { quoted: msg });
                await sendSmartMessage(sock, from, { image: { url: BANNERS.x }, caption: '⏳ *Sedang mengambil media Twitter/X...*' }, { quoted: msg });
                try {
                    const res = await axios.get(`https://widipe.com/download/twitter?url=${encodeURIComponent(text)}`, { timeout: 20000 });
                    const videoUrl = res.data?.result?.hd || res.data?.result?.sd;
                    if (videoUrl) return await sock.sendMessage(from, { video: { url: videoUrl }, caption: '✅ *Twitter/X Downloader*' }, { quoted: msg });
                    throw new Error();
                } catch (err) {
                    return await sock.sendMessage(from, { text: '❌ Gagal mengambil media Twitter/X.' }, { quoted: msg });
                }
            }

            if (
                command === '.pin' ||
                command === '.pindl' ||
                command === '.pinterest' ||
                command === '.pindownload'
            ) {
                addExpAndStat(senderJid, 'download');

                if (!text) {
                    return await sendSmartMessage(
                        sock,
                        from,
                        {
                            image: { url: BANNERS.pin },
                            caption:
`📌 *PINTEREST DOWNLOADER & SEARCH*

*Download Pin:*
• \`.pindl <link Pinterest>\`
• \`.pinterest <link Pinterest>\`
• \`.pin <link Pinterest>\`

Mendukung:
🖼️ Gambar
🎬 Video MP4
🎞️ GIF

*Cari gambar:*
• \`.pin <jumlah> <kata kunci>\`

Contoh:
\`.pindl https://pin.it/xxxxx\`
\`.pin 5 anime wallpaper\``
                        },
                        { quoted: msg }
                    );
                }

                const looksLikePinterestUrl =
                    /^https?:\/\/(?:www\.)?pinterest\.[^/\s]+/i.test(text) ||
                    /^https?:\/\/pin\.it\//i.test(text) ||
                    /^https?:\/\/i\.pinimg\.com\//i.test(text) ||
                    /^https?:\/\/v\d+\.pinimg\.com\//i.test(text);

                // =========================================
                // DOWNLOAD DARI LINK PINTEREST
                // =========================================
                if (looksLikePinterestUrl) {
                    await sendSmartMessage(
                        sock,
                        from,
                        {
                            image: { url: BANNERS.pin },
                            caption: '⏳ *Sedang mengambil media Pinterest...*\n\n🔎 Mendeteksi gambar / video / GIF...'
                        },
                        { quoted: msg }
                    );

                    const result = await downloadPinterestMedia(text);

                    if (!result) {
                        return await sock.sendMessage(
                            from,
                            {
                                text:
`❌ *Gagal mengambil media Pinterest.*

Pastikan:
• Link berasal dari Pin publik
• Link masih aktif
• Bukan konten privat / terbatas

Contoh:
.pindl https://pin.it/xxxxx`
                            },
                            { quoted: msg }
                        );
                    }

                    try {
                        if (result.type === 'video') {
                            if (result.buffer.length > 60 * 1024 * 1024) {
                                return await sock.sendMessage(
                                    from,
                                    {
                                        document: result.buffer,
                                        mimetype: 'video/mp4',
                                        fileName: 'pinterest-video.mp4',
                                        caption: '✅ *Pinterest Video Berhasil Diambil!*'
                                    },
                                    { quoted: msg }
                                );
                            }

                            return await sock.sendMessage(
                                from,
                                {
                                    video: result.buffer,
                                    mimetype: 'video/mp4',
                                    caption: '✅ *Pinterest Video Berhasil Diambil!*'
                                },
                                { quoted: msg }
                            );
                        }

                        if (result.type === 'gif') {
                            if (result.buffer.length > 50 * 1024 * 1024) {
                                return await sock.sendMessage(
                                    from,
                                    {
                                        document: result.buffer,
                                        mimetype: 'image/gif',
                                        fileName: 'pinterest.gif',
                                        caption: '✅ *Pinterest GIF Berhasil Diambil!*'
                                    },
                                    { quoted: msg }
                                );
                            }

                            return await sock.sendMessage(
                                from,
                                {
                                    video: result.buffer,
                                    mimetype: 'image/gif',
                                    gifPlayback: true,
                                    caption: '✅ *Pinterest GIF Berhasil Diambil!*'
                                },
                                { quoted: msg }
                            );
                        }

                        return await sock.sendMessage(
                            from,
                            {
                                image: result.buffer,
                                caption: '✅ *Pinterest Gambar Berhasil Diambil!*'
                            },
                            { quoted: msg }
                        );
                    } catch (sendErr) {
                        return await sock.sendMessage(
                            from,
                            {
                                document: result.buffer,
                                mimetype:
                                    result.type === 'video'
                                        ? 'video/mp4'
                                        : result.type === 'gif'
                                            ? 'image/gif'
                                            : 'image/jpeg',
                                fileName:
                                    result.type === 'video'
                                        ? 'pinterest-video.mp4'
                                        : result.type === 'gif'
                                            ? 'pinterest.gif'
                                            : 'pinterest-image.jpg',
                                caption: `✅ *Pinterest ${result.type.toUpperCase()} Berhasil Diambil!*`
                            },
                            { quoted: msg }
                        );
                    }
                }

                // =========================================
                // SEARCH PINTEREST LAMA
                // =========================================
                let pinCount = 5;
                let query = text;
                const firstWord = args[0];

                if (!isNaN(firstWord) && parseInt(firstWord) > 0) {
                    pinCount = Math.min(parseInt(firstWord), 10);
                    query = args.slice(1).join(' ');
                }

                if (!query) {
                    return await sendSmartMessage(
                        sock,
                        from,
                        {
                            image: { url: BANNERS.pin },
                            caption: '⚠️ Masukkan kata kunci pencarian Pinterest!'
                        },
                        { quoted: msg }
                    );
                }

                await sendSmartMessage(
                    sock,
                    from,
                    {
                        image: { url: BANNERS.pin },
                        caption: `🔍 *Mencari ${pinCount} media Pinterest...*\n\n📝 Query: ${query}`
                    },
                    { quoted: msg }
                );

                try {
                    const res = await axios.get(
                        `https://widipe.com/search/pinterest?q=${encodeURIComponent(query)}`,
                        { timeout: 20000 }
                    );

                    const results = res.data?.result || [];

                    if (!results.length) throw new Error('Tidak ada hasil.');

                    const picks = results.slice(0, pinCount);

                    let sentCount = 0;

                    for (let i = 0; i < picks.length; i++) {
                        const item = picks[i];

                        const url =
                            item.url ||
                            item.image ||
                            item.video ||
                            item.media ||
                            item.src ||
                            item;

                        if (typeof url !== 'string' || !url.startsWith('http')) {
                            continue;
                        }

                        try {
                            const mediaRes = await axios.get(url, {
                                responseType: 'arraybuffer',
                                timeout: 30000,
                                maxContentLength: 50 * 1024 * 1024
                            });

                            const buffer = Buffer.from(mediaRes.data);
                            const contentType =
                                String(mediaRes.headers?.['content-type'] || '').toLowerCase();

                            if (
                                contentType.includes('video') ||
                                /\.mp4(?:\?|$)/i.test(url)
                            ) {
                                await sock.sendMessage(
                                    from,
                                    {
                                        video: buffer,
                                        mimetype: 'video/mp4',
                                        caption: `📌 *Pinterest Video [${i + 1}/${picks.length}]*`
                                    },
                                    { quoted: msg }
                                );
                            } else if (
                                contentType.includes('gif') ||
                                /\.gif(?:\?|$)/i.test(url)
                            ) {
                                await sock.sendMessage(
                                    from,
                                    {
                                        video: buffer,
                                        mimetype: 'image/gif',
                                        gifPlayback: true,
                                        caption: `🎞️ *Pinterest GIF [${i + 1}/${picks.length}]*`
                                    },
                                    { quoted: msg }
                                );
                            } else {
                                await sock.sendMessage(
                                    from,
                                    {
                                        image: buffer,
                                        caption: `📌 *Pinterest [${i + 1}/${picks.length}]*`
                                    },
                                    { quoted: msg }
                                );
                            }

                            sentCount++;
                        } catch (mediaErr) {
                            // Lewati hasil yang gagal dikirim
                        }
                    }

                    if (sentCount === 0) {
                        return await sock.sendMessage(
                            from,
                            {
                                text: '❌ Hasil Pinterest ditemukan, tetapi media gagal dikirim.'
                            },
                            { quoted: msg }
                        );
                    }

                    return;
                } catch (err) {
                    return await sock.sendMessage(
                        from,
                        {
                            text:
`❌ *Gagal mencari Pinterest.*

Coba:
• kata kunci lain
• \`.pindl <link Pinterest>\` untuk download langsung`
                        },
                        { quoted: msg }
                    );
                }
            }

            if (body.startsWith('@')) {
                const query = body.slice(1).trim();
                if (!query) return;

                addExpAndStat(senderJid, 'ai');

                try {
                    await sock.sendMessage(from, { react: { text: '🧠', key: msg.key } });
                } catch (e) {}

                const aiResponse = await askAI(query, currentPersona);
                return await sock.sendMessage(from, { text: aiResponse }, { quoted: msg });
            }
        } catch (err) {
            console.error('Error handling message:', err);
        }
    });
}

startBot();
