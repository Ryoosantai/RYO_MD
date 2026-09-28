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
const TMP_DIR = path.join(__dirname, '..', 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

const DEFAULT_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
const DEFAULT_VOICE = process.env.RYO_TTS_VOICE || 'Kore';
const DEFAULT_STYLE = process.env.RYO_TTS_STYLE || 'cheerful, warm, natural Indonesian WhatsApp assistant';

function getApiKey() {
    return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

function validateText(text) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) throw new Error('Teks untuk voice note belum ada.');
    if (clean.length > 4000) throw new Error('Teks terlalu panjang. Maksimal 4000 karakter per voice note.');
    return clean;
}

async function requestGeminiTts(text, model, voice, style) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('GEMINI_API_KEY belum diset untuk fitur AI Voice.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await getAxios().post(url, {
        contents: [{
            role: 'user',
            parts: [{
                text,
                speech_metadata: { style }
            }]
        }],
        generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    voice
                },
                languageCode: 'id-ID'
            }
        }
    }, {
        timeout: 120000,
        maxContentLength: 20 * 1024 * 1024,
        maxBodyLength: 20 * 1024 * 1024,
        headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json'
        }
    });

    const part = response.data?.candidates?.[0]?.content?.parts?.find(
        p => p?.inlineData?.data || p?.inline_data?.data
    );
    const inline = part?.inlineData || part?.inline_data;
    const encoded = inline?.data;
    if (!encoded) {
        const blockReason = response.data?.promptFeedback?.blockReason;
        const finishReason = response.data?.candidates?.[0]?.finishReason;
        throw new Error(
            `Gemini TTS tidak mengembalikan audio (${model})` +
            `${blockReason ? `; blockReason=${blockReason}` : ''}` +
            `${finishReason ? `; finishReason=${finishReason}` : ''}`
        );
    }
    const buffer = Buffer.from(encoded, 'base64');
    if (!buffer.length) throw new Error(`Data audio Gemini kosong (${model}).`);
    return buffer;
}

async function generateAiVoiceNode(text, options = {}) {
    const clean = validateText(text);
    const voice = options.voice || DEFAULT_VOICE;
    const style = options.style || DEFAULT_STYLE;
    const models = [DEFAULT_MODEL];
    const legacyFallback = 'gemini-2.5-flash-preview-tts';
    if (!models.includes(legacyFallback)) models.push(legacyFallback);

    let lastError = null;
    for (const model of models) {
        try {
            const wav = await requestGeminiTts(clean, model, voice, style);
            const opus = await wavToOpus(wav);
            return { buffer: opus, mime: 'audio/ogg; codecs=opus', voice, model };
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error('AI Voice gagal diproses.');
}

async function wavToOpus(wavBuffer) {
    if (!Buffer.isBuffer(wavBuffer) || wavBuffer.length < 256) {
        throw new Error('Data audio dari Gemini tidak valid.');
    }

    const stamp = `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const input = path.join(TMP_DIR, `${stamp}.wav`);
    const output = path.join(TMP_DIR, `${stamp}.ogg`);
    fs.writeFileSync(input, wavBuffer);
    try {
        await execFileAsync('ffmpeg', [
            '-hide_banner', '-loglevel', 'error', '-y',
            '-i', input,
            '-vn', '-ac', '1', '-ar', '48000',
            '-c:a', 'libopus', '-b:a', '32k',
            '-application', 'voip',
            output
        ], { timeout: 90000, maxBuffer: 4 * 1024 * 1024 });
        const result = fs.readFileSync(output);
        if (!result.length) throw new Error('Konversi AI Voice menghasilkan audio kosong.');
        return result;
    } finally {
        for (const file of [input, output]) {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch {}
        }
    }
}

module.exports = {
    generateAiVoiceNode,
    wavToOpus,
    getApiKey,
    DEFAULT_MODEL,
    DEFAULT_VOICE
};
