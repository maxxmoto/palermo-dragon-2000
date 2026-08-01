let state = JSON.parse(localStorage.getItem('palermo_sh_pycharm')) || { cash: 100000, portfolio: {} };
let uHp, bHp, tLeft, ayCnt, battleActive = false, rClicks, rTime, rInt, akCount, akTime, akInt, akSpawn, activeB;
let tracks = ['assets/trd.mp3', 'assets/utro.mp3', 'assets/rap.mp3'], curTrk = 0, player = new Audio();
let audioCtx;

function initAudio() { if(!audioCtx) audioCtx = new AudioContext(); }

// ПЛЕЕР
player.volume = 0.5;
document.getElementById('volume-slider').oninput = function() { player.volume = this.value; };
function togglePlay() {
    if(player.paused) { player.src = tracks[curTrk]; player.play(); document.getElementById('play-btn').innerText = 'PAUSE'; }
    else { player.pause(); document.getElementById('play-btn').innerText = 'PLAY'; }
    document.getElementById('track-name').innerText = tracks[curTrk].split('/').pop().toUpperCase();
}
function changeTrack(v) { curTrk = (curTrk + v + tracks.length) % tracks.length; player.src = tracks[curTrk]; player.play(); togglePlay(); togglePlay(); }

// РЕКЛАМА MAXXMOTO (раз в минуту)
setInterval(() => { document.getElementById('ad-overlay').style.display = 'flex'; }, 60000);
function closeAd() { document.getElementById('ad-overlay').style.display = 'none'; notify("ПРАВИЛЬНЫЙ ВЫБОР!"); }

// ЧЕН ПУКАЕТ (раз в 30 сек)
setInterval(() => {
    if(audioCtx) { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(80, audioCtx.currentTime); g.gain.setValueAtTime(0.2, audioCtx.currentTime); o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.6); }
    document.getElementById('gas-cloud').style.display = 'block';
    const t = document.getElementById('main-ticker'); t.style.color = 'red'; t.innerText = "!!! ВНИМАНИЕ! ЧЕН ПУКНУЛ! ВСЕ В УКРЫТИЕ!!! !!!";
    t.classList.add('ticker-fart');
    setTimeout(() => { document.getElementById('gas-cloud').style.display = 'none'; t.style.color = '#39ff14'; t.innerText = "+++ КУРС ЮАНЯ СТАБИЛЕН! --- БЕЙ ХРЫЧА ЗА КЭШ! --- "; t.classList.remove('ticker-fart'); }, 5000);
}, 30000);

// БИТВА С ХРЫЧЕМ
function openBattle() {
    battleActive = true; uHp = 200; bHp = 100; tLeft = 30; ayCnt = 0;
    document.getElementById('boss-modal').style.display='flex';
    document.getElementById('bomb-timer').className = ''; document.getElementById('win-btn').style.display = 'none';
    updateBUI();
    tInt = setInterval(() => {
        tLeft--; document.getElementById('bomb-timer').innerText = "00:" + (tLeft < 10 ? '0'+tLeft : tLeft);
        if(tLeft <= 10) document.getElementById('bomb-timer').classList.add('timer-panic');
        if(tLeft <= 0) { clearInterval(tInt); startBossAttack(); }
        if(!battleActive) clearInterval(tInt);
    }, 1000);
}
function hitBoss() {
    if(!battleActive || bHp <= 0) return;
    bHp -= 2; playHit();
    if(Math.random() > 0.7 && ayCnt < 4) { ayCnt++; let m = new SpeechSynthesisUtterance("Ай!"); m.pitch=0.1; m.rate=0.5; window.speechSynthesis.speak(m); }
    updateBUI(); if(bHp <= 0) { battleActive = false; document.getElementById('boss-img').src = "assets/dedpobeda.jfif"; document.getElementById('win-btn').style.display='block'; }
}
function startBossAttack() {
    bInt = setInterval(() => {
        if(uHp > 0 && battleActive) {
            uHp -= 20; playHit(); document.body.classList.add('shake'); setTimeout(() => document.body.classList.remove('shake'), 100);
            updateBUI(); if(uHp <= 0) { clearInterval(bInt); notify("ПОРАЖЕНИЕ!"); location.reload(); }
        } else clearInterval(bInt);
    }, 1000);
}
function winCash() { state.cash += 10000; updateUI(); document.getElementById('boss-modal').style.display = 'none'; notify("ВЫБИЛ 10К!"); }

// МИНИ-ИГРА РАМЕН
function startRamenGame() {
    document.getElementById('gus-window').style.display = 'none'; document.getElementById('ramen-modal').style.display = 'flex';
    rClicks = 0; rTime = 40; document.getElementById('gus-scare').style.left = "-300px";
    rInt = setInterval(() => {
        rTime--; document.getElementById('r-timer').innerText = rTime;
        if(rTime <= 15) document.getElementById('gus-scare').style.left = "10px";
        if(rTime <= 0) { clearInterval(rInt); location.reload(); }
    }, 1000);
}
function eatRamen() {
    rClicks++; document.getElementById('r-fill').style.width = (100 - (rClicks * 2)) + "%";
    if(rClicks >= 50) { clearInterval(rInt); document.getElementById('ramen-modal').style.display='none'; state.cash += 5000; updateUI(); notify("ПОБЕДА! +5К"); }
}

// МИНИ-ИГРА АК-47
function startAkGame() {
    document.getElementById('kim-window').style.display='none'; document.getElementById('ak-modal').style.display='flex';
    akCount = 0; akTime = 40; document.getElementById('ak-area').innerHTML = '';
    akInt = setInterval(() => { akTime--; document.getElementById('ak-label').innerText = akCount+"/10 | "+akTime; if(akTime <= 0) location.reload(); }, 1000);
    akSpawn = setInterval(spawnAk, 1500);
}
function spawnAk() {
    let ak = document.createElement('img'); ak.src = 'assets/ak47.png'; ak.style.cssText = `position:absolute; width:70px; left:${Math.random()*80}%; top:-100px; cursor:pointer;`;
    document.getElementById('ak-area').appendChild(ak);
    let p = -100; let anim = setInterval(() => { p += 4; ak.style.top = p + 'px'; if(p > 600) { clearInterval(anim); ak.remove(); } }, 20);
    ak.onclick = () => { akCount++; ak.remove(); if(akCount >= 10) { clearInterval(akInt); clearInterval(akSpawn); document.getElementById('ak-modal').style.display='none'; state.cash += 7000; updateUI(); notify("СЛУЖУ КОРЕЕ! +7К"); } };
}

// ТРЕЙДИНГ
function openTrade(b) { activeB = b; document.getElementById('trade-name').innerText = b.name; document.getElementById('trade-price-label').innerText = b.price + " ¥"; document.getElementById('trade-qty').value = 1; document.getElementById('trade-modal').style.display = 'flex'; }
function closeTrade() { document.getElementById('trade-modal').style.display = 'none'; }
function changeQty(v) { let i = document.getElementById('trade-qty'); i.value = Math.max(1, parseInt(i.value) + v); }
function confirmTrade() {
    let q = parseInt(document.getElementById('trade-qty').value);
    if(state.cash >= activeB.price * q) { state.cash -= activeB.price * q; state.portfolio[activeB.name] = (state.portfolio[activeB.name] || 0) + q; updateUI(); closeTrade(); notify("КУПЛЕНО!"); }
    else notify("МАЛО ЮАНЕЙ!");
}

// ВСПОМОГАТЕЛЬНЫЕ
function openWin(id) { closeWin('chat-window'); closeWin('gus-window'); closeWin('kim-window'); document.getElementById(id).style.display = 'flex'; }
function closeWin(id) { document.getElementById(id).style.display = 'none'; }
function notify(txt) { const b = document.getElementById('notify-box'); const t = document.createElement('div'); t.className = 'toast'; t.innerText = txt; b.appendChild(t); setTimeout(() => t.remove(), 3000); }
function updateUI() { document.getElementById('cash-val').innerText = state.cash.toLocaleString() + " ¥"; localStorage.setItem('palermo_sh_pycharm', JSON.stringify(state)); renderPortfolio(); }
function renderPortfolio() { document.getElementById('port-sec').innerHTML = Object.keys(state.portfolio).map(k => `<div class="bond-card"><b>${k}</b><br>${state.portfolio[k]} шт.</div>`).join(''); }
function tab(id, btn) { document.querySelectorAll('.content-area').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
function buyJoke() { if(state.cash >= 2000) { state.cash -= 2000; updateUI(); document.getElementById('chat-log').innerHTML += `<p style='border-bottom:1px dashed #444; padding:5px;'>👲: Облигации - как рис, если передержать, дефолтнутся! Ха-ха!</p>`; } }
function playHit() { const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain(); o.type='square'; o.frequency.value=100; g.gain.value=0.2; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime+0.1); }
function updateBUI() { document.getElementById('u-hp').style.width = (uHp/2) + "%"; document.getElementById('b-hp').style.width = bHp + "%"; }

function init() {
    const m = document.getElementById('market-sec');
    for(let i=0; i<30; i++) {
        let b = { name: "BULD-"+(100+i), price: 500+i*20 };
        m.innerHTML += `<div class="bond-card" onclick='openTrade(${JSON.stringify(b)})'><b>${b.name}</b><br><span style="color:lime">${b.price} ¥</span></div>`;
    }
    updateUI();
}
init();
