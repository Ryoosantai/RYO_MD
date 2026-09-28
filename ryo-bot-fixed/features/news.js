const fs = require('fs');
const path = require('path');
let axios;
function getAxios() {
    if (!axios) axios = require('axios');
    return axios;
}

const DATA_DIR = path.join(__dirname, '..');
const NEWS_STATE_FILE = path.join(DATA_DIR, 'news-state.json');
const NEWS_TARGETS_FILE = path.join(DATA_DIR, 'news-targets.json');

const OWNER_NUMBER = process.env.RYO_OWNER_NUMBER || '6283829451488';
const NEWS_MAX_ITEMS = Math.max(4, Math.min(Number(process.env.RYO_NEWS_MAX_ITEMS) || 8, 12));
const NEWS_TIMEOUT = Math.max(5000, Math.min(Number(process.env.RYO_NEWS_TIMEOUT_MS) || 20000, 60000));

const FEEDS = [
    {
        name: 'Dunia',
        url: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=id&gl=ID&ceid=ID:id'
    },
    {
        name: 'Indonesia',
        url: 'https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id'
    },
    {
        name: 'Teknologi',
        url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=id&gl=ID&ceid=ID:id'
    }
];

function ownerJid() {
    return `${OWNER_NUMBER}@s.whatsapp.net`;
}

function readJson(file, fallback) {
    try {
        if (!fs.existsSync(file)) return fallback;
        const value = JSON.parse(fs.readFileSync(file, 'utf8'));
        return value ?? fallback;
    } catch {
        return fallback;
    }
}

function writeJson(file, data) {
    const temp = `${file}.tmp`;
    try {
        fs.writeFileSync(temp, JSON.stringify(data, null, 2));
        fs.renameSync(temp, file);
        return true;
    } catch {
        try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch {}
        return false;
    }
}

function ensureState() {
    const state = readJson(NEWS_STATE_FILE, {});
    if (!Array.isArray(state.targets)) state.targets = [ownerJid()];
    if (!state.lastSentDate) state.lastSentDate = null;
    writeJson(NEWS_STATE_FILE, state);
    return state;
}

function normalizeTargetJid(jid) {
    if (!jid || typeof jid !== 'string') return null;
    const clean = jid.trim();
    if (clean.endsWith('@g.us') || clean.endsWith('@s.whatsapp.net') || clean.endsWith('@lid')) return clean;
    return null;
}

function getTargets() {
    const state = ensureState();
    const extra = readJson(NEWS_TARGETS_FILE, { targets: [] });
    const targets = [
        ...state.targets,
        ...(Array.isArray(extra.targets) ? extra.targets : [])
    ]
        .map(normalizeTargetJid)
        .filter(Boolean);
    return [...new Set(targets)];
}

function setTarget(jid, enabled) {
    const normalized = normalizeTargetJid(jid);
    if (!normalized) return { ok: false, reason: 'invalid_jid' };

    const state = ensureState();
    const targets = new Set(getTargets());
    if (enabled) targets.add(normalized);
    else if (normalized !== ownerJid()) targets.delete(normalized);

    const next = { ...state, targets: [...targets] };
    writeJson(NEWS_STATE_FILE, next);
    return { ok: true, enabled: targets.has(normalized), targets: [...targets] };
}

function resetTarget(jid) {
    return setTarget(jid, false);
}

function decodeXmlEntities(value = '') {
    const named = {
        amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
        nbsp: ' ', ensp: ' ', emsp: ' ', hellip: '…', ndash: '–', mdash: '—'
    };
    return String(value)
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&([a-z]+);/gi, (_, n) => named[n.toLowerCase()] ?? `&${n};`)
        .replace(/\s+/g, ' ')
        .trim();
}

function tagValue(block, tag) {
    const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = block.match(re);
    return match ? decodeXmlEntities(match[1]) : '';
}

function parseRss(xml, category) {
    const items = [];
    const blocks = String(xml || '').match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];
    for (const block of blocks) {
        const title = tagValue(block, 'title');
        const link = tagValue(block, 'link');
        const pubDate = tagValue(block, 'pubDate');
        const source = tagValue(block, 'source') || category;
        if (!title || !link) continue;
        const parsedDate = pubDate ? new Date(pubDate) : null;
        items.push({
            title,
            link,
            pubDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
            source,
            category
        });
    }
    return items;
}

function dedupeItems(items) {
    const seen = new Set();
    const output = [];
    for (const item of items) {
        const key = item.title
            .toLowerCase()
            .replace(/[^a-z0-9\u00C0-\uFFFF]+/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        output.push(item);
    }
    return output;
}

async function fetchFeed(feed) {
    try {
        const response = await getAxios().get(feed.url, {
            timeout: NEWS_TIMEOUT,
            responseType: 'text',
            headers: { 'User-Agent': 'Ryo-Assistant-News/8.7.0' },
            maxContentLength: 3 * 1024 * 1024
        });
        return parseRss(response.data, feed.name);
    } catch (error) {
        return [];
    }
}

function formatWib(date = new Date()) {
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        dateStyle: 'full',
        timeStyle: 'short'
    }).format(date);
}

async function getDailyNews() {
    const batches = await Promise.all(FEEDS.map(fetchFeed));
    const cutoff = Date.now() - 36 * 60 * 60 * 1000;
    const merged = dedupeItems(batches.flat())
        .filter(item => !item.pubDate || item.pubDate.getTime() >= cutoff)
        .sort((a, b) => (b.pubDate?.getTime() || 0) - (a.pubDate?.getTime() || 0))
        .slice(0, NEWS_MAX_ITEMS);

    if (!merged.length) {
        throw new Error('Feed berita sedang tidak tersedia.');
    }

    return merged;
}

async function buildDailyNewsMessage() {
    const items = await getDailyNews();
    const header = [
        '╭━━〔 🌐 RYO WORLD UPDATE 〕━━╮',
        `│ 📅 ${formatWib(new Date())}`,
        '│ 🛰️ Sumber: Google News RSS',
        '│ ⚡ Ringkasan headline terbaru',
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
        ''
    ];

    const lines = [...header];
    items.forEach((item, index) => {
        const stamp = item.pubDate ? new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit'
        }).format(item.pubDate) : '--:--';
        lines.push(`┌─ *${index + 1}. ${item.title}*`);
        lines.push(`│ 🗞️ ${item.source} · ${stamp} WIB`);
        lines.push(`│ 🔗 ${item.link}`);
        lines.push('└──────────────────────────');
    });

    lines.push('', '💡 Ketik *.newsinfo* untuk mengambil berita terbaru kapan saja.');
    return lines.join('\n');
}

function getJakartaParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: Number(parts.hour),
        minute: Number(parts.minute)
    };
}

function dateKey(parts) {
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function markSent(date) {
    const state = ensureState();
    state.lastSentDate = date;
    writeJson(NEWS_STATE_FILE, state);
}

async function dispatchDailyNews(sock) {
    const targets = getTargets();
    if (!targets.length) return { sent: 0, failed: 0, skipped: false };

    let message;
    try {
        message = await buildDailyNewsMessage();
    } catch (error) {
        return { sent: 0, failed: targets.length, skipped: false, error };
    }

    let sent = 0;
    let failed = 0;
    for (const jid of targets) {
        try {
            await sock.sendMessage(jid, { text: message });
            sent += 1;
        } catch {
            failed += 1;
        }
    }
    return { sent, failed, skipped: false };
}

function startDailyNewsScheduler(sock) {
    let busy = false;
    const tick = async () => {
        if (busy) return;
        const parts = getJakartaParts(new Date());
        const today = dateKey(parts);
        const state = ensureState();
        if (state.lastSentDate === today) return;

        // Small delivery window prevents duplicate send while tolerating process latency/restart.
        if (parts.hour !== 7 || parts.minute > 4) return;

        busy = true;
        try {
            const result = await dispatchDailyNews(sock);
            if (result.sent > 0) markSent(today);
        } finally {
            busy = false;
        }
    };

    const interval = setInterval(() => {
        tick().catch(() => {});
    }, 20 * 1000);
    if (typeof interval.unref === 'function') interval.unref();
    tick().catch(() => {});
    return () => clearInterval(interval);
}

module.exports = {
    ownerJid,
    getTargets,
    setTarget,
    resetTarget,
    getDailyNews,
    buildDailyNewsMessage,
    startDailyNewsScheduler,
    _test: { parseRss, decodeXmlEntities, getJakartaParts }
};
