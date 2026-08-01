// ========== PALERMO DRAGON 2000: LEGEND v2 ==========
// --- СОСТОЯНИЕ ---
let S = JSON.parse(localStorage.getItem('pdm_dragon_v3')) || {
    cash: 100000, portfolio: {}, vip: {},
    achievements: { farts: 0, battles: 0, ramenClicks: 0, akKills: 0 },
    businesses: { stall: 0, workshop: 0, factory: 0 },
    stats: { totalEarned: 100000, totalSpent: 0, gamesPlayed: 0 },
    liHistory: []
};

let uh, hh, bl, btInt, bhInt, bAct = false;
let rck, rt, ri, rCombo = 0, rComboTimer;
let akc, akt, ai, as, akLost = false;
let ct = 0, bribe = false, fartFreq = 90000, muted = false, audioReady = false;
let pop = 1567890123, sneak = 0;
let liBusy = false, liOnline = true, liChecked = false;

const TRACKS = ['assets/utro.mp3', 'assets/rap.mp3', 'assets/trd.mp3'];
const TNAMES = { 'utro.mp3': 'УТРО', 'rap.mp3': 'РЭП', 'trd.mp3': 'КИТАЙСКАЯ КЛАССИКА' };
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';

let player, eatSound, akSound, fartSound, audioCtx;

// --- БИЗНЕСЫ ---
const BIZ = [
    { id: 'stall', name: 'ЛАРЁК', icon: '🏪', price: 5000, income: 2, desc: 'Продажа риса с лотка' },
    { id: 'workshop', name: 'ЦЕХ', icon: '🏭', price: 25000, income: 10, desc: 'Подпольный цех кроссовок' },
    { id: 'factory', name: 'ЗАВОД', icon: '🏗️', price: 100000, income: 50, desc: 'Промышленный масштаб' }
];

const ACHIEVEMENTS = [
    { id: 'farts10', name: 'Выживший', desc: 'Пережить 10 пуков Чена', cond: () => S.achievements.farts >= 10, icon: '🏆' },
    { id: 'farts50', name: 'Противогаз', desc: 'Пережить 50 пуков Чена', cond: () => S.achievements.farts >= 50, icon: '☣️' },
    { id: 'battles5', name: 'Боец', desc: 'Выиграть 5 битв', cond: () => S.achievements.battles >= 5, icon: '⚔️' },
    { id: 'battles20', name: 'Гладиатор', desc: 'Выиграть 20 битв', cond: () => S.achievements.battles >= 20, icon: '🗡️' },
    { id: 'ramen100', name: 'Обжора', desc: '100 кликов рамена', cond: () => S.achievements.ramenClicks >= 100, icon: '🍜' },
    { id: 'ak50', name: 'Снайпер', desc: 'Подстрелить 50 АК', cond: () => S.achievements.akKills >= 50, icon: '🎯' },
    { id: 'million', name: 'Миллионер', desc: 'Накопить 1,000,000 ¥', cond: () => S.cash >= 1000000, icon: '💎' },
    { id: 'biz10', name: 'Бизнесмен', desc: 'Купить 10 бизнесов', cond: () => totalBiz() >= 10, icon: '📈' },
    { id: 'biz50', name: 'Магнат', desc: 'Купить 50 бизнесов', cond: () => totalBiz() >= 50, icon: '🏰' },
    { id: 'allVip', name: 'VIP-персона', desc: 'Купить все VIP-предметы', cond: () => Object.keys(S.vip).length >= 5, icon: '👑' }
];

const VIP_ITEMS = [
    { id: 'parfum', name: 'Парфюм', price: 50000, desc: 'Чен пукает реже (x2)', apply: () => { fartFreq = 180000; }, icon: '🧴' },
    { id: 'circ', name: 'Циркуль', price: 75000, desc: 'АК падают медленнее', apply: () => {}, icon: '📐' },
    { id: 'gloves', name: 'Боксёрки', price: 40000, desc: '+50% урона в битве', apply: () => {}, icon: '🥊' },
    { id: 'chop', name: 'Палочки', price: 30000, desc: 'Рамен +20% скорости', apply: () => {}, icon: '🥢' },
    { id: 'amulet', name: 'Амулет', price: 120000, desc: '+20% к случайному доходу', apply: () => {}, icon: '🔮' }
];

// ========== АУДИО СИСТЕМА ==========
function unlockAudio() {
    if (audioReady) return;
    audioReady = true;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* no audio context */ }
    player = new Audio();
    player.volume = 0.5;
    eatSound = new Audio('assets/eat.mp3'); eatSound.volume = 0.4;
    akSound = new Audio('assets/ak.mp3'); akSound.volume = 1.0;
    fartSound = new Audio('assets/chen.mp3'); fartSound.volume = 0.2;
    preloadTracks();
    document.getElementById('audio-overlay').style.display = 'none';
    document.getElementById('vol').oninput = function(e) { if (player) player.volume = parseFloat(e.target.value); };
    document.getElementById('vol').value = 0.5;
    msg("ДОБРО ПОЖАЛОВАТЬ!");
    setTimeout(() => fartLoop(), 30000);
}

function preloadTracks() {
    TRACKS.forEach(t => { let a = new Audio(); a.src = t; a.load(); });
    if (eatSound) eatSound.load();
    if (akSound) akSound.load();
    if (fartSound) fartSound.load();
}

function safePlay(audio) {
    if (!audioReady || !audio || muted) return;
    let p = audio.play();
    if (p) p.catch(() => {});
}

// --- УВЕДОМЛЕНИЯ ---
function msg(t) {
    const box = document.getElementById('notify-box');
    const n = document.createElement('div');
    n.className = 'toast';
    n.innerText = t;
    box.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// --- МУЗЫКА ---
function toggleMute() {
    muted = !muted;
    if (player) player.muted = muted;
    if (eatSound) eatSound.muted = muted;
    if (akSound) akSound.muted = muted;
    if (fartSound) fartSound.muted = muted;
    document.getElementById('mute-btn').innerHTML = muted ? '🔇' : '🔊';
}

function tglPl() {
    if (!player) { msg("Кликни в центр экрана!"); return; }
    if (player.paused || player.ended) {
        player.src = TRACKS[ct]; player.load();
        safePlay(player);
        document.getElementById('pl-btn').innerHTML = '⏸';
    } else {
        player.pause();
        document.getElementById('pl-btn').innerHTML = '▶';
    }
    const f = TRACKS[ct].split('/').pop();
    document.getElementById('t-name').innerText = TNAMES[f] || f.toUpperCase();
}

function chTrk(v) {
    ct = (ct + v + TRACKS.length) % TRACKS.length;
    if (player) { player.src = TRACKS[ct]; player.load(); safePlay(player); }
    document.getElementById('pl-btn').innerHTML = '⏸';
    const f = TRACKS[ct].split('/').pop();
    document.getElementById('t-name').innerText = TNAMES[f] || f.toUpperCase();
}

// --- ТАБЫ ---
function tab(id, btn) {
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.n-btn').forEach(b => b.classList.remove('act'));
    btn.classList.add('act');
    if (id === 'biz') renderBiz();
    if (id === 'ach') renderAch();
}

// --- ОКНА ГЕРОЕВ ---
function showW(id) {
    ['w-li', 'w-dice', 'w-gs', 'w-km'].forEach(w => {
        document.getElementById(w).style.display = 'none';
    });
    document.getElementById(id).style.display = 'flex';
    if (id === 'w-li') {
        setTimeout(() => {
            let c = document.getElementById('li-chat');
            c.scrollTop = c.scrollHeight;
            document.getElementById('li-input').focus();
            if (!liChecked) { liChecked = true; checkLiOnline(); } else updateLiStatus();
        }, 100);
    }
}

function hideW(id) { document.getElementById(id).style.display = 'none'; }

// ========== ЛИ AI-ЧАТ ==========
function addLiMsg(text, cls) {
    const chat = document.getElementById('li-chat');
    const m = document.createElement('div');
    m.className = 'li-msg ' + (cls || 'li-msg-bot');
    m.innerText = text;
    chat.appendChild(m);
    chat.scrollTop = chat.scrollHeight;
}

function setLiTyping(show) {
    document.getElementById('li-typing').style.display = show ? 'block' : 'none';
    let c = document.getElementById('li-chat');
    c.scrollTop = c.scrollHeight;
}

const LI_PERSONA = `Ты — старик Ли (老李), китаец 70 лет, бывший торговец из Шанхая. Живёшь при дворе Чена.

ТВОЙ ХАРАКТЕР:
- Говоришь на ломаном русском с китайским акцентом
- Вставляешь китайские слова: "лаовай" (иностранец), "сейхо" (хорошо), "пухао" (плохо), "сесе" (спасибо), "цянь" (деньги)
- Любишь шутить про рис, юани, бизнес, старый Шанхай
- Уважаешь Чена (он главный), недолюбливаешь Хрыча, дружишь с Гасом
- Даёшь мудрые но смешные советы, часто с подковыркой
- Отвечай коротко — 1-3 предложения максимум

КОНТЕКСТ: Ты находишься в игре "PALERMO DRAGON 2000". Вокруг тебя: Чен (босс), Гас (толстый, любит рамен), Тад (кореец с АК-47), Хрыч (старый враг), Маг (гадалка). Игрок — твой друг лаовай, пришёл к тебе поговорить.`;

async function callHF(prompt) {
    if (!liChecked) { liChecked = true; checkLiOnline(); }
    if (!liOnline) return null;
    try {
        let fullPrompt = `<s>[INST] ${LI_PERSONA}\n\n${prompt} [/INST]`;
        let ctrl = new AbortController();
        let to = setTimeout(() => ctrl.abort(), 8000);
        let resp = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inputs: fullPrompt,
                parameters: { max_new_tokens: 120, temperature: 0.85, top_p: 0.9, return_full_text: false },
                options: { wait_for_model: true }
            }),
            signal: ctrl.signal
        });
        clearTimeout(to);
        if (resp.status === 503) return null;
        if (!resp.ok) throw new Error('status ' + resp.status);
        let data = await resp.json();
        let text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
        if (text) { liOnline = true; updateLiStatus(); }
        return text ? text.trim() : null;
    } catch (e) {
        liOnline = false; updateLiStatus();
        return null;
    }
}

async function checkLiOnline() {
    try {
        let ctrl = new AbortController();
        let to = setTimeout(() => { ctrl.abort(); liOnline = false; updateLiStatus(); }, 5000);
        await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: 'hi', parameters: { max_new_tokens: 1 } }),
            signal: ctrl.signal
        });
        clearTimeout(to);
        liOnline = true;
    } catch (e) {
        liOnline = false;
    }
    updateLiStatus();
}

function updateLiStatus() {
    let s = document.getElementById('li-status');
    if (s) {
        if (liOnline) { s.innerText = 'AI-МУДРЕЦ: онлайн'; s.className = 'li-status'; }
        else { s.innerText = 'AI: офлайн (локальный режим)'; s.className = 'li-status offline'; }
    }
}

function getFallbackResponse(type, userMsg) {
    const jokes = [
        'Ха! Рис сегодня как курс юаня — то вверх, то вниз, а в итоге всё равно к ужину подгорел. Сейхо шутка, да?',
        'Слушай, почему юань круглый? Чтобы катился от тебя подальше! Но ты не плачь — у Ли есть запасной.',
        'В Шанхае говорили: лучше сто юаней в руке, чем тысяча в мечтах. А ты и ста не держал, лаовай!',
        'Знаешь, почему Чен всегда впереди? Ветер дует ему в спину. А тебе — прямо в лицо. Но это закаляет!',
        'Однажды я купил акции, а они упали. Потом купил рис — он сгорел. Теперь покупаю только лапшу. Надёжно.',
        'Лаовай, твои деньги как вода в Янцзы — текут, текут, и нет их. Но ты не грусти — у Чена всегда можно занять!',
        'Старая китайская мудрость: если у тебя нет юаня — ты бедный. Если у тебя есть юань — ты тоже бедный, но весёлый.'
    ];
    const stories = [
        'В 1985 я торговал рисом на набережной Вайтань. Пришёл американец — хотел купить весь склад за доллары. Я сказал: "Лаовай, рис не продаётся, рис — это душа!" На следующий день рис подорожал вдвое. Американец вернулся с чемоданом денег — я продал. Бизнес есть бизнес.',
        'Мой дед говорил: "Ли, деньги как облака над Шанхаем — сегодня густые, завтра рассеялись." Я не понимал. Потом он проиграл всё в маджонг — и я понял.',
        'Хрыч однажды пытался обмануть Чена — поставил фальшивые весы для риса. Чен улыбнулся, ничего не сказал. На следующий день лавка Хрыча принадлежала Чену. За копейки. Вот так ведётся бизнес в Шанхае.',
        'Гас в молодости был худым. Потом открыл лапшичную. Теперь он — два человека. Лапша меняет судьбу, лаовай.',
        'Тад приехал из Кореи с одним АК-47 и мечтой. Теперь у него два АК-47. Мечта сбылась.',
        'В 1992 я видел, как Чен пукнул на переговорах с якудза. Все замолчали. Чен сказал: "Это аргумент." Сделка прошла успешно.'
    ];
    const bribes = [
        'Ох, лаовай, хорошая взятка. Ли будет молчать как рыба в мутной воде. Никто не узнает.',
        'Цянь любит тишину. А тишина стоит денег. Ты заплатил — теперь тишина.',
        'С такими деньгами ты не лаовай — ты почти китаец! Почти.',
        'Ли уважает щедрых людей. Теперь я расскажу тебе секрет... но за дополнительные 5 тысяч.',
        'Взятка принята. Если кто спросит — ты был со мной весь вечер. Мы ели рис и обсуждали философию.'
    ];
    const chatReplies = [
        (m) => m.includes('рис') ? 'Рис — это не просто еда, это валюта. Когда юань падает, рис растёт. Инвестируй с умом, лаовай.' : null,
        (m) => m.match(/деньги|юан|кэш|бабл|зарабо/i) ? 'Деньги как птица — сегодня здесь, завтра улетела. Надо строить клетку. Клетка — это бизнес.' : null,
        (m) => m.match(/чен|босс/i) ? 'Чен — великий человек. Его пук стоит дороже, чем твоя месячная зарплата. Уважай Чена.' : null,
        (m) => m.match(/хрыч|дед|враг/i) ? 'Хрыч? Ха! Этот старый пень думает, что он конкурент. Но ветер дует не в его сторону. Чен всё решит.' : null,
        (m) => m.match(/гас|рамен|лапш/i) ? 'Гас — хороший человек. Толстый, но хороший. Его рамен — лучшее вложение после риса.' : null,
        (m) => m.match(/привет|здрав|хай|hi/i) ? 'Здравствуй, лаовай. Ли рад тебя видеть. Принёс деньги или просто поболтать?' : null,
        (m) => m.match(/как дела/i) ? 'Дела как юань на бирже — скачут. Но Ли не жалуется. Ли философ.' : null,
        (m) => m.match(/что купить|инвести|совет/i) ? 'Покупай рис, когда он дёшев. Продавай, когда дорог. Но никогда не продавай душу — она неликвидная.' : null,
        (m) => m.match(/спасибо|благодар/i) ? 'Сесе, лаовай. Благодарность — лучшая валюта. После юаня, конечно.' : null,
        (m) => m.match(/пока|прощай|ухожу/i) ? 'Иди с миром, лаовай. И помни: удача любит тех, кто делится с Ли.' : null
    ];

    if (type === 'joke') return jokes[Math.floor(Math.random() * jokes.length)];
    if (type === 'story') return stories[Math.floor(Math.random() * stories.length)];
    if (type === 'bribe') return bribes[Math.floor(Math.random() * bribes.length)];
    if (userMsg) {
        for (let r of chatReplies) {
            let res = r(userMsg);
            if (res) return res;
        }
        const generic = [
            'Ли понимает. Но не до конца. Объясни как для старого китайца.',
            'Мудрые слова, лаовай. Но мудрость без денег — просто слова.',
            'Хм, интересно. Но в Шанхае мы говорим: меньше слов — больше юаней.',
            'Ли задумался. Это бывает редко, значит ты сказал что-то важное.',
            'Твои слова как шёлк — гладкие и дорогие. Но что под ними?'
        ];
        return generic[Math.floor(Math.random() * generic.length)];
    }
    return 'Ли не понял, но это не страшно. Ли и не обязан всё понимать — он просто мудрый.';
}

async function sendLi() {
    if (liBusy) return;
    let inp = document.getElementById('li-input');
    let text = inp.value.trim();
    if (!text) return;
    liBusy = true;
    inp.value = '';
    addLiMsg('Вы: ' + text, 'li-msg-user');
    setLiTyping(true);

    let prompt = `Игрок говорит: "${text}". Ответь в стиле старого китайского мудреца, коротко, 1-3 предложения.`;
    let reply = await callHF(prompt);
    setLiTyping(false);

    if (reply) {
        addLiMsg('👲: ' + reply, 'li-msg-bot');
    } else {
        addLiMsg('👲: ' + getFallbackResponse('chat', text.toLowerCase()), 'li-msg-bot');
    }
    S.liHistory = (S.liHistory || []).slice(-20);
    S.liHistory.push({ user: text, bot: reply || '' });
    localStorage.setItem('pdm_dragon_v3', JSON.stringify(S));
    liBusy = false;
    inp.focus();
}

async function quickLi(type) {
    if (liBusy) return;
    liBusy = true;
    setLiTyping(true);

    let prompt, cost = 0;
    if (type === 'joke') {
        if (S.cash < 2000) { setLiTyping(false); liBusy = false; msg("МАЛО ¥!"); return; }
        cost = 2000;
        prompt = 'Расскажи смешную короткую шутку на тему денег, риса или Китая. Одно предложение.';
    } else if (type === 'story') {
        prompt = 'Расскажи короткую историю из твоей жизни в Шанхае про бизнес или Чена. 2-3 предложения.';
    } else {
        if (S.cash < 10000) { setLiTyping(false); liBusy = false; msg("МАЛО ¥!"); return; }
        cost = 10000; bribe = true;
        prompt = 'Тебе дали взятку. Поблагодари игрока в своём стиле. Одно предложение.';
    }

    let reply = await callHF(prompt);
    setLiTyping(false);

    if (reply) {
        addLiMsg('👲: ' + reply, 'li-msg-bot');
    } else {
        addLiMsg('👲: ' + getFallbackResponse(type), 'li-msg-bot');
    }

    if (cost > 0) { S.cash -= cost; S.stats.totalSpent += cost; }
    up();
    liBusy = false;
}

// --- КОСТИ ---
function playDice(n) {
    if (S.cash < 5000) { msg("МАЛО ¥!"); return; }
    let win = Math.floor(Math.random() * 3) + 1;
    let chance = bribe ? 0.8 : 0.35;
    if (Math.random() < chance) win = n;
    if (n === win) {
        S.cash += 15000; S.stats.totalEarned += 15000;
        document.getElementById('dice-res').innerText = "ПОБЕДА! +15к"; bribe = false;
    } else {
        S.cash -= 5000; S.stats.totalSpent += 5000;
        document.getElementById('dice-res').innerText = "ПРОИГРЫШ!";
    }
    up();
}

// ========== БИТВА ==========
function openBattle() {
    bAct = true; uh = 200; hh = 100; bl = 30;
    document.getElementById('m-btl').style.display = 'flex';
    document.getElementById('b-win-scr').classList.remove('show');
    document.getElementById('b-lose-scr').classList.remove('show');
    document.getElementById('b-img').style.display = 'block';
    document.getElementById('b-img').src = 'assets/dedbitva.jpg';
    document.getElementById('b-timer').style.color = '#f00';
    updateBUI();
    btInt = setInterval(() => {
        if (!bAct) { clearInterval(btInt); return; }
        bl--;
        document.getElementById('b-timer').innerText = "00:" + (bl < 10 ? '0' + bl : bl);
        if (bl <= 10) document.getElementById('b-timer').style.color = '#ff0';
        if (bl <= 0) { clearInterval(btInt); atkH(); }
    }, 1000);
    S.stats.gamesPlayed++;
}

function hitH() {
    if (!bAct || hh <= 0) return;
    let dmg = S.vip['gloves'] ? 3 : 2;
    hh -= dmg;
    if (Math.random() > 0.7) {
        try { let m = new SpeechSynthesisUtterance("Ай!"); m.pitch = 0.1; m.rate = 0.5; window.speechSynthesis.speak(m); } catch(e){}
    }
    updateBUI();
    if (hh <= 0) {
        bAct = false;
        document.getElementById('b-img').style.display = 'none';
        document.getElementById('b-img').src = 'assets/dedpobeda.jfif';
        document.getElementById('b-win-scr').classList.add('show');
        document.getElementById('b-bonus-text').innerText = 'Награда: 10,000 ¥';
        S.achievements.battles++;
    }
}

function atkH() {
    if (!bAct) return;
    bhInt = setInterval(() => {
        if (uh > 0 && bAct) {
            uh -= 20; document.body.classList.add('shk');
            setTimeout(() => document.body.classList.remove('shk'), 100);
            updateBUI();
            if (uh <= 0) { bAct = false; clearInterval(bhInt); document.getElementById('b-img').style.display = 'none'; document.getElementById('b-lose-scr').classList.add('show'); }
        } else clearInterval(bhInt);
    }, 1000);
}

function updateBUI() {
    document.getElementById('u-hp-fill').style.width = Math.max(0, uh / 200 * 100) + "%";
    document.getElementById('h-hp-fill').style.width = Math.max(0, hh / 100 * 100) + "%";
    document.getElementById('u-hp-text').innerText = Math.max(0, uh);
    document.getElementById('h-hp-text').innerText = Math.max(0, hh);
}

function getB() { S.cash += 10000; S.stats.totalEarned += 10000; up(); closeBattle(); msg("+10,000 ¥"); }
function retryBattle() { closeBattle(); setTimeout(openBattle, 200); }
function closeBattle() { bAct = false; clearInterval(btInt); clearInterval(bhInt); document.getElementById('m-btl').style.display = 'none'; }

// ========== РАМЕН ==========
function gameR() {
    hideW('w-gs'); document.getElementById('m-ram').style.display = 'flex';
    rck = 0; rt = 40; rCombo = 0;
    document.getElementById('gs-sc').style.left = "-300px";
    document.getElementById('r-win-scr').classList.remove('show');
    document.getElementById('r-f').style.width = '100%';
    document.getElementById('r-t').innerText = rt; document.getElementById('r-combo').innerText = '';
    document.getElementById('r-bonus-text').innerText = '';
    ri = setInterval(() => {
        rt--; document.getElementById('r-t').innerText = rt;
        if (rt <= 15) document.getElementById('gs-sc').style.left = "10px";
        if (rt <= 0) { clearInterval(ri); closeRamen(); msg("ВРЕМЯ ВЫШЛО!"); }
    }, 1000);
}

function eatR(e) {
    if (eatSound) { eatSound.pause(); eatSound.currentTime = 0; safePlay(eatSound); }
    document.body.classList.add('shk'); setTimeout(() => document.body.classList.remove('shk'), 100);
    for (let i = 0; i < 3 + Math.floor(rCombo / 5); i++) {
        let p = document.createElement('div'); p.className = 'noodle';
        p.style.left = (e.clientX + Math.random() * 30 - 15) + 'px';
        p.style.top = (e.clientY + Math.random() * 10) + 'px';
        document.body.appendChild(p); setTimeout(() => p.remove(), 700);
    }
    let clicks = S.vip['chop'] ? 1.2 : 1;
    rck += clicks; S.achievements.ramenClicks++; rCombo++;
    clearTimeout(rComboTimer);
    rComboTimer = setTimeout(() => { rCombo = 0; document.getElementById('r-combo').innerText = ''; }, 1500);
    if (rCombo > 5) document.getElementById('r-combo').innerText = 'COMBO x' + rCombo + '!';
    document.getElementById('r-f').style.width = Math.max(0, 100 - rck * 2) + "%";
    if (rck >= 50) {
        clearInterval(ri);
        let bonus = rCombo > 15 ? 2000 : 1000;
        S.cash += 5000 + bonus; S.stats.totalEarned += 5000 + bonus;
        document.getElementById('r-bonus-text').innerText = 'Комбо-бонус: +' + bonus.toLocaleString() + ' ¥';
        document.getElementById('r-win-scr').classList.add('show'); up();
    }
}
function getR() { document.getElementById('m-ram').style.display = 'none'; document.getElementById('r-win-scr').classList.remove('show'); msg("+5,000 ¥"); }
function closeRamen() { clearInterval(ri); document.getElementById('m-ram').style.display = 'none'; document.getElementById('r-win-scr').classList.remove('show'); }

// ========== АК-47 ==========
function gameA() {
    hideW('w-km'); document.getElementById('m-ak').style.display = 'flex';
    akc = 0; akt = 40; akLost = false;
    document.getElementById('ak-z').innerHTML = '';
    document.getElementById('ak-win-scr').classList.remove('show');
    document.getElementById('ak-lose-scr').classList.remove('show');
    document.getElementById('ak-c').innerText = '0'; document.getElementById('ak-t').innerText = akt;
    ai = setInterval(() => { akt--; document.getElementById('ak-t').innerText = akt; if (akt <= 0) { closeAk(); msg("ВРЕМЯ ВЫШЛО!"); } }, 1000);
    as = setInterval(spawnObj, S.vip['circ'] ? 1500 : 1000);
}

function spawnObj() {
    if (akLost) return;
    let isBomb = Math.random() > 0.7;
    let o = document.createElement('img');
    o.src = isBomb ? 'assets/bomb.png' : 'assets/ak47.png';
    o.className = isBomb ? 'bomb-obj' : 'ak-obj';
    o.style.left = Math.random() * 80 + '%'; o.style.top = '-100px';
    document.getElementById('ak-z').appendChild(o);
    let py = -100;
    let anim = setInterval(() => { py += 5; o.style.top = py + 'px'; if (py > 600) { clearInterval(anim); o.remove(); } }, 20);
    o.onclick = () => {
        if (akLost) return;
        if (isBomb) {
            akLost = true; clearInterval(ai); clearInterval(as); o.remove();
            document.getElementById('ak-lose-scr').classList.add('show');
        } else {
            if (akSound) { akSound.currentTime = 0; safePlay(akSound); }
            akc++; S.achievements.akKills++; o.remove();
            document.getElementById('ak-c').innerText = akc;
            if (akc >= 10) { clearInterval(ai); clearInterval(as); document.getElementById('ak-win-scr').classList.add('show'); }
        }
    };
}

function getAk() { S.cash += 7000; S.stats.totalEarned += 7000; up(); closeAk(); msg("+7,000 ¥"); }
function retryAk() { closeAk(); setTimeout(gameA, 200); }
function closeAk() { clearInterval(ai); clearInterval(as); document.getElementById('m-ak').style.display = 'none'; document.getElementById('ak-win-scr').classList.remove('show'); document.getElementById('ak-lose-scr').classList.remove('show'); }

// ========== ТОРГОВЛЯ ==========
let activeBond;
function opTr(b) { activeBond = b; document.getElementById('tr-n').innerText = b.n; document.getElementById('tr-p').innerText = b.p.toLocaleString() + " ¥"; document.getElementById('tr-q').value = 1; document.getElementById('m-trd').style.display = 'flex'; }
function chQ(v) { let q = document.getElementById('tr-q'); q.value = Math.max(1, parseInt(q.value) + v); }
function confT() {
    let q = parseInt(document.getElementById('tr-q').value), total = activeBond.p * q;
    if (S.cash >= total) { S.cash -= total; S.stats.totalSpent += total; S.portfolio[activeBond.n] = (S.portfolio[activeBond.n] || 0) + q; up(); closeTrade(); } else msg("МАЛО ¥!");
}
function closeTrade() { document.getElementById('m-trd').style.display = 'none'; }

// ========== БИЗНЕС ==========
let activeBiz;
function renderBiz() {
    document.getElementById('biz').innerHTML = BIZ.map(b => {
        let owned = S.businesses[b.id] || 0;
        return `<div class="biz-card" onclick="openBiz('${b.id}')"><div class="biz-icon">${b.icon}</div><div class="biz-name">${b.name}</div><div style="color:#0f0">${b.price.toLocaleString()} ¥</div><div class="biz-num">Доход: ${b.income}/с | Владею: ${owned}</div></div>`;
    }).join('');
}
function openBiz(id) { let b = BIZ.find(x => x.id === id); activeBiz = b; document.getElementById('biz-name').innerText = b.name + ' ' + b.icon; document.getElementById('biz-desc').innerText = b.desc; document.getElementById('biz-income').innerText = 'Доход: ' + b.income + ' ¥/сек'; document.getElementById('biz-owned').innerText = 'Владею: ' + (S.businesses[id] || 0); document.getElementById('biz-qty').value = 1; document.getElementById('m-biz').style.display = 'flex'; }
function chBizQ(v) { let q = document.getElementById('biz-qty'); q.value = Math.max(1, parseInt(q.value) + v); }
function confirmBiz() { let q = parseInt(document.getElementById('biz-qty').value), total = activeBiz.price * q; if (S.cash >= total) { S.cash -= total; S.stats.totalSpent += total; S.businesses[activeBiz.id] = (S.businesses[activeBiz.id] || 0) + q; up(); closeBiz(); msg("КУПЛЕНО!"); } else msg("МАЛО ¥!"); }
function closeBiz() { document.getElementById('m-biz').style.display = 'none'; }
function totalBiz() { return Object.values(S.businesses).reduce((a, b) => a + b, 0); }
function incomePerSec() { return BIZ.reduce((sum, b) => sum + b.income * (S.businesses[b.id] || 0), 0); }

// ========== VIP ==========
function renderVip() {
    document.getElementById('vip').innerHTML = VIP_ITEMS.map(x => {
        let owned = S.vip[x.id];
        return `<div class="card ${owned ? 'earned' : ''}" onclick="buyVip('${x.id}',${x.price})" style="${owned?'cursor:default':''}"><b>${x.icon||'⭐'} ${x.name}</b><br><span style="font-size:11px">${x.desc}</span><br><span style="color:${owned?'#888':'lime'}">${owned?'КУПЛЕНО':x.price.toLocaleString()+' ¥'}</span></div>`;
    }).join('');
}
function buyVip(id, price) { if (S.vip[id]) return; if (S.cash >= price) { S.cash -= price; S.stats.totalSpent += price; S.vip[id] = true; let item = VIP_ITEMS.find(x => x.id === id); if (item && item.apply) item.apply(); up(); msg("КУПЛЕНО!"); } else msg("МАЛО ¥!"); }

// ========== ДОСТИЖЕНИЯ ==========
function renderAch() {
    document.getElementById('ach').innerHTML = ACHIEVEMENTS.map(a => {
        let earned = a.cond();
        return `<div class="card ${earned ? 'earned' : 'locked'}"><b>${a.icon} ${a.name}</b><br><span style="font-size:11px">${a.desc}</span><br><span style="color:${earned?'lime':'#888'}">${earned?'ПОЛУЧЕНО':'ЗАКРЫТО'}</span></div>`;
    }).join('');
}

// ========== UI ==========
function up() {
    document.getElementById('cash').innerText = S.cash.toLocaleString() + " ¥";
    document.getElementById('i-rate').innerText = incomePerSec().toLocaleString();
    localStorage.setItem('pdm_dragon_v3', JSON.stringify(S));
    document.getElementById('inv').innerHTML = Object.keys(S.portfolio).map(k => `<div class="card"><b>${k}</b><br>${S.portfolio[k]} шт</div>`).join('');
    renderVip();
}

// ========== СОБЫТИЯ ==========
setInterval(() => {
    if (!audioReady) return;
    const ev = ['RAIN', 'POLICE', 'SMOG']; const e = ev[Math.floor(Math.random() * ev.length)];
    if (e === 'RAIN') { let b = Math.floor(S.cash * 0.2); if (S.vip['amulet']) b = Math.floor(b * 1.2); S.cash += b; up(); msg("ЗОЛОТОЙ ДОЖДЬ! +" + b.toLocaleString()); }
    if (e === 'POLICE') { let l = Math.floor(S.cash * 0.1); S.cash = Math.max(0, S.cash - l); up(); msg("ОБЛАВА! -" + l.toLocaleString()); }
    if (e === 'SMOG') { msg("ВЕЛИКИЙ СМОГ!"); document.getElementById('smog-overlay').style.background = 'rgba(120,120,120,0.8)'; setTimeout(() => { document.getElementById('smog-overlay').style.background = 'transparent'; }, 15000); }
}, 150000);

function fartLoop() {
    if (!audioReady) return;
    if (fartSound) { fartSound.volume = 0.2; fartSound.currentTime = 0; safePlay(fartSound); }
    document.getElementById('gas-cloud').style.display = 'block';
    S.achievements.farts++;
    setTimeout(() => { document.getElementById('gas-cloud').style.display = 'none'; }, 5000);
    setTimeout(fartLoop, fartFreq);
}

// ПАССИВНЫЙ ДОХОД
setInterval(() => {
    if (!audioReady) return;
    let inc = incomePerSec();
    if (inc > 0) { S.cash += inc; S.stats.totalEarned += inc; document.getElementById('cash').innerText = S.cash.toLocaleString() + " ¥"; localStorage.setItem('pdm_dragon_v3', JSON.stringify(S)); }
}, 1000);

// СЧЁТЧИКИ
setInterval(() => { pop += 3; document.getElementById('p-cnt').innerText = pop.toLocaleString(); }, 2000);
setInterval(() => { sneak += 102; document.getElementById('s-cnt').innerText = sneak.toLocaleString(); }, 5000);

// ========== ХОТКЕИ ==========
document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
        case '1': tab('mkt', document.querySelectorAll('.n-btn')[0]); break;
        case '2': tab('vip', document.querySelectorAll('.n-btn')[1]); break;
        case '3': tab('inv', document.querySelectorAll('.n-btn')[2]); break;
        case '4': tab('ach', document.querySelectorAll('.n-btn')[3]); break;
        case '5': tab('biz', document.querySelectorAll('.n-btn')[4]); break;
        case 'b': openBattle(); break;
        case 'm': tglPl(); break;
        case 'Escape': closeBattle(); closeRamen(); closeAk(); closeTrade(); closeBiz(); break;
    }
});

// ========== ИНИЦИАЛИЗАЦИЯ ==========
(function init() {
    const mkt = document.getElementById('mkt');
    for (let i = 0; i < 30; i++) {
        let b = { n: "BULD-" + (100 + i), p: 500 + i * 25 };
        mkt.innerHTML += `<div class="card" onclick='opTr(${JSON.stringify(b)})'><b>${b.n}</b><br><span style="color:lime">${b.p.toLocaleString()} ¥</span></div>`;
    }
    up();
})();
