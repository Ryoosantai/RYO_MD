const assert = require('assert');
const fs = require('fs');

const news = require('../features/news');
const meme = require('../features/auto-meme');
const voice = require('../features/ai-voice');

const sampleRss = `<?xml version="1.0"?><rss><channel><item><title><![CDATA[Headline &amp; One]]></title><link>https://example.com/one</link><pubDate>Sun, 27 Sep 2026 06:00:00 GMT</pubDate><source>Example</source></item><item><title>Headline Two</title><link>https://example.com/two</link><pubDate>Sun, 27 Sep 2026 05:00:00 GMT</pubDate></item></channel></rss>`;
const parsed = news._test.parseRss(sampleRss, 'Test');
assert.strictEqual(parsed.length, 2);
assert.strictEqual(parsed[0].title, 'Headline & One');
assert.strictEqual(parsed[0].source, 'Example');
assert.strictEqual(meme.shouldTrigger('wkwk ini lucu 😂'), true);
assert.strictEqual(meme.shouldTrigger('saya sedang belajar javascript'), false);
assert.strictEqual(news._test.decodeXmlEntities('&amp; &#169; &#x1F602;'), '& © 😂');
const wib = news._test.getJakartaParts(new Date('2026-09-27T00:00:00Z'));
assert.strictEqual(wib.hour, 7);
assert.strictEqual(wib.minute, 0);
assert.strictEqual(typeof voice.generateAiVoiceNode, 'function');
assert.ok(fs.existsSync(require.resolve('../features/news')));
console.log('✅ Ryo Assistant 8.7.0 smoke test passed');
