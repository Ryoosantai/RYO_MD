const activeGames = new Map();

const WORDS = [
    'komputer',
    'internet',
    'programmer',
    'whatsapp',
    'javascript',
    'robot',
    'keyboard',
    'teknologi',
    'android',
    'sekolah'
];

const QUOTES = [
    'Jangan menunggu sempurna untuk mulai. Mulai dulu, lalu perbaiki.',
    'Sedikit kemajuan setiap hari tetaplah kemajuan.',
    'Kesalahan adalah bagian dari proses belajar.',
    'Fokus pada proses, hasil akan mengikuti.',
    'Kalau belum berhasil, coba lagi dengan cara berbeda.'
];

const MOTIVASI = [
    '🔥 Tetap semangat! Satu langkah kecil tetap membawa kamu maju.',
    '⚡ Jangan menyerah hanya karena prosesnya belum selesai.',
    '🚀 Kamu tidak harus langsung hebat. Terus berkembang.',
    '💪 Istirahat boleh, menyerah jangan.',
    '🌟 Hari ini adalah kesempatan baru untuk berkembang.'
];

const JOKES = [
    '😂 Kenapa programmer suka kopi? Karena debugging lebih mudah sambil ngopi.',
    '🤣 Bug itu seperti hantu. Tidak kelihatan, tapi bikin panik.',
    '😆 Programmer kalau ditanya sudah makan: sudah, tadi makan error.',
    '😂 WiFi mati sebentar, satu rumah langsung menjadi tim investigasi.'
];

const TRUTH = [
    'Apa skill yang ingin kamu kuasai tahun ini?',
    'Apa kebiasaan kecil yang ingin kamu ubah?',
    'Apa game favoritmu?',
    'Apa target yang sedang kamu kejar?',
    'Apa hal paling produktif yang pernah kamu lakukan?'
];

const DARE = [
    'Kirim stiker paling random yang kamu punya.',
    'Tulis satu kalimat motivasi versi kamu sendiri.',
    'Kirim satu fakta menarik yang kamu tahu.',
    'Sebutkan tiga makanan favoritmu.',
    'Tulis nama hewan favoritmu menggunakan emoji.'
];

const JOBS = [
    ['💻 Menjadi programmer freelance', 450],
    ['📦 Membantu mengurus paket', 350],
    ['🎨 Membuat desain sederhana', 400],
    ['🛠️ Membantu memperbaiki komputer', 500],
    ['📚 Membantu mengajar', 375]
];

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function gameKey(from, jid, type) {
    return `${from}:${jid}:${type}`;
}

function getUser(db, jid) {
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

    const u = db[jid];

    if (u.coins === undefined) u.coins = 500;
    if (u.exp === undefined) u.exp = 0;
    if (u.level === undefined) u.level = 1;
    if (u.totalCmd === undefined) u.totalCmd = 0;
    if (!Array.isArray(u.badges)) u.badges = ['Newbie 🌱'];

    return u;
}

function reward(u, coins, exp) {
    u.coins += coins;
    u.exp += exp;

    while (u.exp >= u.level * 100) {
        u.exp -= u.level * 100;
        u.level++;
    }
}

function timeoutGame(key, value, ms) {
    setTimeout(() => {
        const game = activeGames.get(key);

        if (game && game.value === value) {
            activeGames.delete(key);
        }
    }, ms);
}

async function handleEntertainment({
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
}) {
    const send = async (message, extra = {}) => {
        return sock.sendMessage(
            from,
            { text: message, ...extra },
            { quoted: msg }
        );
    };

    // TEBAK ANGKA
    if (command === '.tebakangka') {
        addExpAndStat(senderJid, 'cmd');

        const k = gameKey(from, senderJid, 'angka');
        let game = activeGames.get(k);

        if (!game) {
            const answer = Math.floor(Math.random() * 100) + 1;

            game = {
                value: answer,
                attempts: 0
            };

            activeGames.set(k, game);
            timeoutGame(k, answer, 5 * 60 * 1000);

            return send(
                '🎯 *TEBAK ANGKA RYO*\n\n' +
                'Aku memilih angka dari *1–100*.\n\n' +
                'Kirim:\n' +
                '*.tebakangka <angka>*\n\n' +
                '💰 Hadiah: *500 RC*\n' +
                '✨ EXP: *50*\n' +
                '⏱️ Waktu: 5 menit'
            );
        }

        const guess = Number(args[0]);

        if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
            return send(
                '⚠️ Masukkan angka 1–100.\nContoh: `.tebakangka 50`'
            );
        }

        game.attempts++;

        if (guess === game.value) {
            activeGames.delete(k);

            const db = getUsersData();
            const u = getUser(db, senderJid);

            reward(u, 500, 50);
            saveUsersData(db);

            return send(
                '🎉 *BENAR!*\n\n' +
                `🎯 Angka: *${game.value}*\n` +
                `🔢 Percobaan: *${game.attempts}x*\n\n` +
                '💰 +500 RC\n' +
                '✨ +50 EXP\n' +
                `⚡ Level: *${u.level}*`
            );
        }

        return send(
            guess < game.value
                ? '❌ Terlalu kecil! ⬆️\nCoba lagi.'
                : '❌ Terlalu besar! ⬇️\nCoba lagi.'
        );
    }

    // TEBAK KATA
    if (command === '.tebakkata') {
        addExpAndStat(senderJid, 'cmd');

        const k = gameKey(from, senderJid, 'kata');
        let game = activeGames.get(k);

        if (!game) {
            const answer = randomItem(WORDS);
            const shuffled = answer
                .split('')
                .sort(() => Math.random() - 0.5)
                .join('');

            game = { value: answer };

            activeGames.set(k, game);
            timeoutGame(k, answer, 5 * 60 * 1000);

            return send(
                '🧩 *TEBAK KATA*\n\n' +
                'Susun huruf:\n\n' +
                `🔤 *${shuffled}*\n\n` +
                'Jawab:\n' +
                '*.tebakkata <jawaban>*\n\n' +
                '💰 Hadiah: *400 RC*\n' +
                '✨ EXP: *40*'
            );
        }

        const answer = text.trim().toLowerCase();

        if (!answer) {
            return send('⚠️ Masukkan jawaban.');
        }

        if (answer === game.value) {
            activeGames.delete(k);

            const db = getUsersData();
            const u = getUser(db, senderJid);

            reward(u, 400, 40);
            saveUsersData(db);

            return send(
                '🎉 *JAWABAN BENAR!*\n\n' +
                `🧩 Kata: *${game.value}*\n` +
                '💰 +400 RC\n' +
                '✨ +40 EXP\n' +
                `⚡ Level: *${u.level}*`
            );
        }

        return send('❌ Belum tepat. Coba lagi!');
    }

    // SUIT
    if (command === '.suit') {
        addExpAndStat(senderJid, 'cmd');

        const choice = args[0]?.toLowerCase();

        if (!['batu', 'gunting', 'kertas'].includes(choice)) {
            return send(
                '✊ *SUIT RYO*\n\n' +
                '• `.suit batu`\n' +
                '• `.suit gunting`\n' +
                '• `.suit kertas`'
            );
        }

        const bot = randomItem(['batu', 'gunting', 'kertas']);

        const win =
            (choice === 'batu' && bot === 'gunting') ||
            (choice === 'gunting' && bot === 'kertas') ||
            (choice === 'kertas' && bot === 'batu');

        if (win) {
            const db = getUsersData();
            const u = getUser(db, senderJid);

            reward(u, 150, 20);
            saveUsersData(db);

            return send(
                '✊ *HASIL SUIT*\n\n' +
                `👤 Kamu: *${choice}*\n` +
                `🤖 Ryo: *${bot}*\n\n` +
                '🎉 *KAMU MENANG!*\n' +
                '💰 +150 RC\n' +
                '✨ +20 EXP'
            );
        }

        return send(
            '✊ *HASIL SUIT*\n\n' +
            `👤 Kamu: *${choice}*\n` +
            `🤖 Ryo: *${bot}*\n\n` +
            (choice === bot ? '🤝 SERI!' : '😆 Ryo menang!')
        );
    }

    // COIN FLIP
    if (command === '.coinflip') {
        addExpAndStat(senderJid, 'cmd');

        return send(
            '🪙 *COIN FLIP*\n\n' +
            'Koin dilempar...\n\n' +
            `*${randomItem(['HEADS 🪙', 'TAILS 🪙'])}*`
        );
    }

    // DADU
    if (command === '.dadu') {
        addExpAndStat(senderJid, 'cmd');

        return send(
            '🎲 *DADU RYO*\n\n' +
            'Hasil:\n' +
            `🎲 *${Math.floor(Math.random() * 6) + 1}*`
        );
    }

    // MATH GAME
    if (command === '.mathgame') {
        addExpAndStat(senderJid, 'cmd');

        const k = gameKey(from, senderJid, 'math');
        let game = activeGames.get(k);

        if (!game) {
            const a = Math.floor(Math.random() * 20) + 5;
            const b = Math.floor(Math.random() * 20) + 1;
            const op = randomItem(['+', '-', '*']);

            let answer;

            if (op === '+') answer = a + b;
            if (op === '-') answer = a - b;
            if (op === '*') answer = a * b;

            game = {
                value: answer
            };

            activeGames.set(k, game);
            timeoutGame(k, answer, 2 * 60 * 1000);

            return send(
                '🧮 *MATH GAME*\n\n' +
                'Berapa hasil:\n\n' +
                `*${a} ${op} ${b} = ?*\n\n` +
                '*.mathgame <jawaban>*\n\n' +
                '💰 Hadiah: *300 RC*\n' +
                '✨ EXP: *30*'
            );
        }

        const answer = Number(args[0]);

        if (!Number.isFinite(answer)) {
            return send(
                '⚠️ Masukkan jawaban angka.\nContoh: `.mathgame 25`'
            );
        }

        if (answer === game.value) {
            activeGames.delete(k);

            const db = getUsersData();
            const u = getUser(db, senderJid);

            reward(u, 300, 30);
            saveUsersData(db);

            return send(
                '🎉 *BENAR!*\n\n' +
                '💰 +300 RC\n' +
                '✨ +30 EXP\n' +
                `⚡ Level: *${u.level}*`
            );
        }

        return send('❌ Jawaban salah. Coba lagi!');
    }

    // QUOTE
    if (command === '.quote') {
        addExpAndStat(senderJid, 'cmd');

        return send(
            `💬 *QUOTE RYO*\n\n"${randomItem(QUOTES)}"\n\n— Ryo Assistant`
        );
    }

    // MOTIVASI
    if (command === '.motivasi') {
        addExpAndStat(senderJid, 'cmd');
        return send(`💪 *MOTIVASI*\n\n${randomItem(MOTIVASI)}`);
    }

    // JOKE
    if (command === '.joke') {
        addExpAndStat(senderJid, 'cmd');
        return send(`😂 *JOKE RYO*\n\n${randomItem(JOKES)}`);
    }

    // 8 BALL
    if (command === '.8ball') {
        addExpAndStat(senderJid, 'cmd');

        if (!text) {
            return send('🔮 Contoh: `.8ball apakah hari ini hoki?`');
        }

        const answers = [
            'Kemungkinan besar iya.',
            'Sepertinya iya.',
            'Bisa jadi.',
            'Belum bisa dipastikan.',
            'Sepertinya tidak.',
            'Coba tanyakan lagi nanti.',
            'Ryo menyarankan tetap berusaha 😎'
        ];

        return send(
            `🔮 *RYO 8 BALL*\n\n❓ ${text}\n\n🎱 ${randomItem(answers)}`
        );
    }

    // TRUTH
    if (command === '.truth') {
        addExpAndStat(senderJid, 'cmd');
        return send(`🧐 *TRUTH*\n\n${randomItem(TRUTH)}`);
    }

    // DARE
    if (command === '.dare') {
        addExpAndStat(senderJid, 'cmd');
        return send(`🎯 *DARE*\n\n${randomItem(DARE)}`);
    }

    // RATE - hiburan saja, bukan fisik
    if (command === '.rate') {
        addExpAndStat(senderJid, 'cmd');

        if (!text) {
            return send('⭐ Contoh: `.rate javascript`');
        }

        const value = Math.floor(Math.random() * 101);

        return send(
            `⭐ *RYO RATE*\n\n📌 ${text}\n📊 Skor hiburan: *${value}/100*`
        );
    }

    // SHIP
    if (command === '.ship') {
        addExpAndStat(senderJid, 'cmd');

        const mentions =
            msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentions.length < 2) {
            return send('💞 Gunakan `.ship @user1 @user2`');
        }

        const value = Math.floor(Math.random() * 101);

        return send(
            `💞 *RYO SHIP*\n\n` +
            `👤 @${mentions[0].split('@')[0]}\n` +
            `👤 @${mentions[1].split('@')[0]}\n\n` +
            `📊 Skor hiburan: *${value}%*`,
            { mentions }
        );
    }

    // WORK
    if (command === '.work') {
        addExpAndStat(senderJid, 'cmd');

        const db = getUsersData();
        const u = getUser(db, senderJid);

        const now = Date.now();
        const cooldown = 60 * 60 * 1000;
        const diff = now - (u.lastWork || 0);

        if (diff < cooldown) {
            const mins = Math.ceil((cooldown - diff) / 60000);

            return send(
                `⏳ Kamu masih lelah bekerja!\n\nCoba lagi dalam *${mins} menit*.`
            );
        }

        const job = randomItem(JOBS);
        const coins = job[1] + Math.floor(Math.random() * 201);

        u.coins += coins;
        u.exp += 25;
        u.lastWork = now;

        while (u.exp >= u.level * 100) {
            u.exp -= u.level * 100;
            u.level++;
        }

        db[senderJid] = u;
        saveUsersData(db);

        return send(
            '💼 *WORK BERHASIL*\n\n' +
            `${job[0]}\n\n` +
            `💰 Penghasilan: *+${coins} RC*\n` +
            '✨ +25 EXP\n' +
            `💳 Saldo: *${u.coins} RC*\n` +
            `⚡ Level: *${u.level}*\n\n` +
            '⏱️ Bisa bekerja lagi dalam 1 jam.'
        );
    }

    // GIVE
    if (command === '.give') {
        addExpAndStat(senderJid, 'cmd');

        const target = getTargetUser(msg, args);
        const amount = parseInt(args[args.length - 1]);

        if (!target || !Number.isInteger(amount) || amount <= 0) {
            return send('⚠️ Format: `.give @user <jumlah>`');
        }

        if (target === senderJid) {
            return send('⚠️ Tidak bisa memberi ke diri sendiri.');
        }

        const db = getUsersData();
        const u = getUser(db, senderJid);
        const targetData = getUser(db, target);

        if (u.coins < amount) {
            return send(`❌ RC tidak cukup.\n\nSaldo: *${u.coins} RC*`);
        }

        u.coins -= amount;
        targetData.coins += amount;

        saveUsersData(db);

        return send(
            '🎁 *GIVE BERHASIL!*\n\n' +
            `💰 Kamu memberikan *${amount} RC*\n` +
            `kepada @${target.split('@')[0]}.\n\n` +
            `💳 Sisa saldo: *${u.coins} RC*`,
            { mentions: [target] }
        );
    }

    // ROB - ekonomi virtual Ryo
    if (command === '.rob') {
        addExpAndStat(senderJid, 'cmd');

        const target = getTargetUser(msg, args);

        if (!target) {
            return send('⚠️ Gunakan `.rob @user`');
        }

        if (target === senderJid) {
            return send('😂 Tidak bisa merampok diri sendiri.');
        }

        const k = gameKey(from, senderJid, 'rob');
        const last = activeGames.get(k) || 0;
        const cooldown = 30 * 60 * 1000;
        const diff = Date.now() - last;

        if (diff < cooldown) {
            const mins = Math.ceil((cooldown - diff) / 60000);

            return send(
                `⏳ Tunggu *${mins} menit* sebelum mencoba lagi.`
            );
        }

        activeGames.set(k, Date.now());

        const db = getUsersData();
        const u = getUser(db, senderJid);
        const targetData = getUser(db, target);

        if (targetData.coins < 100) {
            return send('😂 Target terlalu miskin untuk dirampok!');
        }

        if (Math.random() < 0.45) {
            const amount = Math.min(
                Math.floor(Math.random() * 401) + 100,
                targetData.coins
            );

            targetData.coins -= amount;
            u.coins += amount;

            saveUsersData(db);

            return send(
                '🥷 *ROBBERY BERHASIL!*\n\n' +
                `💰 Mendapatkan *${amount} RC* dari @${target.split('@')[0]}.\n\n` +
                `💳 Saldo: *${u.coins} RC*`,
                { mentions: [target] }
            );
        }

        return send(
            `🚨 *ROBBERY GAGAL!*\n\n@${target.split('@')[0]} berhasil kabur! 😂`,
            { mentions: [target] }
        );
    }

    // RANK / LEVEL
    if (['.rank', '.level'].includes(command)) {
        addExpAndStat(senderJid, 'cmd');

        const target = getTargetUser(msg, args) || senderJid;
        const db = getUsersData();
        const u = getUser(db, target);
        const rank = getUserRank(target);

        return send(
            '⚡ *RYO LEVEL CARD*\n\n' +
            `👤 @${target.split('@')[0]}\n\n` +
            `⚡ Level: *${u.level}*\n` +
            `✨ EXP: *${u.exp} / ${u.level * 100}*\n` +
            `🏆 Rank: *#${rank}*\n` +
            `💰 Coins: *${u.coins} RC*\n` +
            `📊 Command: *${u.totalCmd || 0}x*`,
            { mentions: [target] }
        );
    }

    return false;
}

module.exports = {
    handleEntertainment
};
