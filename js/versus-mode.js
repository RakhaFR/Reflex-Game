// ============================================
// VERSUS MODE — STATE
// ============================================
let vsP1Score = 0;
let vsP2Score = 0;
let vsSpawning = false;
let vsPenaltyTimer = null;
let vsHoldTimer = null;
let vsCountdownInterval = null;
let vsCombo1 = 0;
let vsCombo2 = 0;

// Freeze state — siapa yang sedang difreeze
let vsP1Frozen = false;
let vsP2Frozen = false;
let vsP1FreezeTimeout = null;
let vsP2FreezeTimeout = null;

// Timer state
let vsTotalSeconds = 0;
let vsSecondsLeft = 0;
let vsMainTimer = null;

// Current active button type
let vsCurrentBtn = null;

// Keyboard bindings
const VS_KEY_P1 = "a";
const VS_KEY_P2 = "l";


// ============================================
// VERSUS MODE — DURATION POPUP
// ============================================
function openVsDurationPopup()  { document.getElementById("vsDurationPopup").classList.add("active"); }
function closeVsDurationPopup() { document.getElementById("vsDurationPopup").classList.remove("active"); }

// Pool tombol acak — freeze masuk di sini dengan bobot lebih rendah
// format: setiap entry = satu kemunculan di pool (bisa duplikat untuk bobot)
const vsButtonPool = ["green", "green", "red", "red", "bonus", "freeze"];

// ============================================
// VERSUS MODE — TIMER
// ============================================
function vsStartMainTimer() {
  if (vsMainTimer) clearInterval(vsMainTimer);
  vsMainTimer = setInterval(() => {
    vsSecondsLeft--;
    vsUpdateTimerLabel(vsSecondsLeft);
    vsUpdateTimerBar();
    if (vsSecondsLeft <= 0) {
      clearInterval(vsMainTimer);
      vsMainTimer = null;
      versusGameOver();
    }
  }, 1000);
}

function vsUpdateTimerLabel(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  document.getElementById("vsTimerLabel").textContent = m + ":" + String(s).padStart(2, "0");
}

function vsUpdateTimerBar() {
  const pct  = (vsSecondsLeft / vsTotalSeconds) * 100;
  const fill = document.getElementById("vsTimerBarFill");
  fill.style.width = pct + "%";
  if (pct <= 25) fill.classList.add("warning");
  else fill.classList.remove("warning");
}

// ============================================
// VERSUS MODE — GAME OVER
// ============================================
function versusGameOver() {
  vsClearAllTimers();
  vsHideAllButtons();
  vsStopCountdown();
  if (vsP1FreezeTimeout) { clearTimeout(vsP1FreezeTimeout); vsP1FreezeTimeout = null; }
  if (vsP2FreezeTimeout) { clearTimeout(vsP2FreezeTimeout); vsP2FreezeTimeout = null; }
  document.removeEventListener("keydown", vsKeyHandler);

  let winnerText = "";
  if (vsP1Score > vsP2Score)       winnerText = "🏆 Player 1 Menang!";
  else if (vsP2Score > vsP1Score)  winnerText = "🏆 Player 2 Menang!";
  else                              winnerText = "🤝 Seri!";

  document.getElementById("vsWinnerText").textContent = winnerText;
  document.getElementById("vsResultP1").textContent = "Player 1: " + vsP1Score + " poin";
  document.getElementById("vsResultP2").textContent = "Player 2: " + vsP2Score + " poin";
  document.getElementById("vsResultPopup").classList.add("active");
}

// ============================================
// VERSUS MODE — TUTORIAL NOTIFICATION
// ============================================
function showVsTutorialNotif(callback) {
  const notif = document.getElementById("vsTutorialNotif");
  const msgEl = document.getElementById("vsTutorialMsg");

  // Detect mobile/tablet
  const isMobile = window.matchMedia("(max-width: 768px)").matches || ('ontouchstart' in window);

  if (isMobile) {
    msgEl.innerHTML = `Persiapkan diri untuk menekan tombol <span class="btn-blue">🔵 Biru</span> dan <span class="btn-red">🔴 Merah</span> — bukan yang di tengah layar.<br><br>Skor paling banyak yang didapatkan maka itu pemenangnya!`;
  } else {
    msgEl.innerHTML = `Persiapkan posisimu!<br>Player kiri tekan <span class="p1-key">A</span> &nbsp;·&nbsp; Player kanan tekan <span class="p2-key">L</span><br><br>Skor paling banyak yang didapatkan maka itu pemenangnya!`;
  }

  // Slide in
  notif.classList.remove("hide");
  notif.classList.add("show");

  // Slide out after 4s then call callback
  setTimeout(() => {
    notif.classList.remove("show");
    notif.classList.add("hide");
    setTimeout(() => {
      notif.classList.remove("hide");
      if (callback) callback();
    }, 450);
  }, 4000);
}


function vsStartCountdown(duration, onEnd) {
  let timeLeft = duration;
  document.querySelectorAll(".vs-cd-active").forEach(el => el.textContent = timeLeft);
  if (vsCountdownInterval) clearInterval(vsCountdownInterval);
  vsCountdownInterval = setInterval(() => {
    timeLeft--;
    document.querySelectorAll(".vs-cd-active").forEach(el => el.textContent = timeLeft);
    if (timeLeft <= 0) {
      clearInterval(vsCountdownInterval);
      document.querySelectorAll(".vs-cd-active").forEach(el => el.textContent = "");
      if (onEnd) onEnd();
    }
  }, 1000);
}

function vsStopCountdown() {
  if (vsCountdownInterval) clearInterval(vsCountdownInterval);
  document.querySelectorAll(".vs-countdown").forEach(el => el.textContent = "");
}

function vsUpdateScores() {
  document.getElementById("vsP1Score").textContent = vsP1Score;
  document.getElementById("vsP2Score").textContent = vsP2Score;
}

function vsHideAllButtons() {
  ["vsGreenBtn", "vsRedBtn", "vsBonusBtn", "vsFreezeBtn", "vsHoldBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  // Reset semua countdown span ke class biasa (hapus vs-cd-active)
  document.querySelectorAll(".vs-cd-active").forEach(el => {
    el.classList.remove("vs-cd-active");
    el.textContent = "";
  });
}

function vsClearAllTimers() {
  if (vsPenaltyTimer) { clearTimeout(vsPenaltyTimer); vsPenaltyTimer = null; }
  if (vsHoldTimer)    { clearTimeout(vsHoldTimer);    vsHoldTimer = null;    }
  vsSpawning = false;
  vsCurrentBtn = null;
}

function vsUpdateCombo(player, change) {
  const isP1    = player === 1;
  const comboEl  = document.getElementById(isP1 ? "vsCombo1" : "vsCombo2");
  const comboBox = document.getElementById(isP1 ? "vsComboBox1" : "vsComboBox2");
  let comboVal   = isP1 ? vsCombo1 : vsCombo2;

  if (change === "reset") {
    if (isP1) vsCombo1 = 0; else vsCombo2 = 0;
    comboEl.textContent = "x0";
    comboBox.classList.remove("pop", "combo-big", "combo-glow");
    setTimeout(() => { comboBox.style.opacity = 0; }, 200);
  } else {
    comboVal += change;
    if (isP1) vsCombo1 = comboVal; else vsCombo2 = comboVal;
    comboEl.textContent = "x" + comboVal;
    comboBox.style.opacity = 1;
    comboBox.classList.add("pop");
    if (comboVal >= 5)  comboBox.classList.add("combo-big");
    if (comboVal >= 10) comboBox.classList.add("combo-glow");
    setTimeout(() => { comboBox.classList.remove("pop"); }, 300);
  }
}

// ============================================
// VERSUS MODE — FREEZE (dipanggil saat tombol freeze diklik)
// Freeze LAWAN dari player yang klik
// ============================================
function vsApplyFreeze(clickerPlayer) {
  const targetPlayer = clickerPlayer === 1 ? 2 : 1;
  const isTargetP1   = targetPlayer === 1;

  // Kalau target sudah frozen, tidak perlu apa-apa (tetap lanjut ke hold)
  const snd = document.getElementById("soundFreeze");
  if (snd) { snd.currentTime = 0; snd.play().catch(() => {}); }

  // Tandai visual sisi player yang difreeze
  const sideId = isTargetP1 ? "vsP1Side" : "vsP2Side";
  const sideEl = document.getElementById(sideId);
  sideEl.classList.add("frozen-side");

  // Tunjukkan label freeze di sisi yang difreeze
  const frozenLabelId = isTargetP1 ? "vsFrozenLabel1" : "vsFrozenLabel2";
  const frozenLabel   = document.getElementById(frozenLabelId);

  if (isTargetP1) {
    // Kalau sudah ada freeze sebelumnya, clear dulu
    if (vsP1FreezeTimeout) { clearTimeout(vsP1FreezeTimeout); vsP1FreezeTimeout = null; }
    vsP1Frozen = true;
  } else {
    if (vsP2FreezeTimeout) { clearTimeout(vsP2FreezeTimeout); vsP2FreezeTimeout = null; }
    vsP2Frozen = true;
  }

  // Countdown label 5 detik
  let freezeLeft = 5;
  if (frozenLabel) frozenLabel.textContent = "❄️ " + freezeLeft + "s";

  const freezeTick = setInterval(() => {
    freezeLeft--;
    if (freezeLeft <= 0) {
      clearInterval(freezeTick);
      if (frozenLabel) frozenLabel.textContent = "";
    } else {
      if (frozenLabel) frozenLabel.textContent = "❄️ " + freezeLeft + "s";
    }
  }, 1000);

  const ft = setTimeout(() => {
    if (isTargetP1) { vsP1Frozen = false; vsP1FreezeTimeout = null; }
    else            { vsP2Frozen = false; vsP2FreezeTimeout = null; }
    sideEl.classList.remove("frozen-side");
    if (frozenLabel) frozenLabel.textContent = "";
  }, 5000);

  if (isTargetP1) vsP1FreezeTimeout = ft;
  else            vsP2FreezeTimeout = ft;
}

// ============================================
// VERSUS MODE — SPAWN LOGIC
// ============================================
function vsSpawnRandomButton() {
  if (vsSpawning) return;
  vsSpawning = true;
  vsHideAllButtons();
  vsStopCountdown();

  const type = vsButtonPool[Math.floor(Math.random() * vsButtonPool.length)];
  vsCurrentBtn = type;

  // Tampilkan tombol yang sesuai
  const btnMap = {
    green:  "vsGreenBtn",
    red:    "vsRedBtn",
    bonus:  "vsBonusBtn",
    freeze: "vsFreezeBtn"
  };
  const btnEl = document.getElementById(btnMap[type]);
  if (btnEl) {
    btnEl.style.display = "flex";
    // Aktifkan countdown span di dalam tombol ini
    btnEl.querySelectorAll(".vs-countdown").forEach(el => el.classList.add("vs-cd-active"));
  }

  // Durasi & penalty
  if (type === "green" || type === "bonus") {
    vsPenaltyTimer = setTimeout(() => {
      // Timeout: kedua player kena -1, combo reset
      vsP1Score = Math.max(0, vsP1Score - 1);
      vsP2Score = Math.max(0, vsP2Score - 1);
      vsUpdateScores();
      vsUpdateCombo(1, "reset");
      vsUpdateCombo(2, "reset");
      document.getElementById("soundRed").currentTime = 0;
      document.getElementById("soundRed").play();
      vsNextWithHold();
    }, 5000);
    vsStartCountdown(5);
  }

  if (type === "red") {
    vsPenaltyTimer = setTimeout(() => { vsNextWithHold(); }, 3000);
    vsStartCountdown(3);
  }

  if (type === "freeze") {
    // Freeze timeout 5 detik — kalau tidak diklik, langsung hold
    vsPenaltyTimer = setTimeout(() => { vsNextWithHold(); }, 5000);
    vsStartCountdown(5);
  }
}

function vsNextWithHold() {
  if (vsPenaltyTimer) { clearTimeout(vsPenaltyTimer); vsPenaltyTimer = null; }
  vsHideAllButtons();
  vsStopCountdown();
  vsCurrentBtn = null;

  const holdEl = document.getElementById("vsHoldBtn");
  if (holdEl) {
    holdEl.style.display = "flex";
    holdEl.querySelectorAll(".vs-countdown").forEach(el => el.classList.add("vs-cd-active"));
  }
  vsStartCountdown(2);

  if (vsHoldTimer) { clearTimeout(vsHoldTimer); vsHoldTimer = null; }
  vsHoldTimer = setTimeout(() => {
    vsHideAllButtons();
    vsSpawning = false;
    vsHoldTimer = null;
    vsStopCountdown();
    vsSpawnRandomButton();
  }, 2000);
}

// ============================================
// VERSUS MODE — PLAYER ACTION
// ============================================
function vsPlayerClick(player) {
  if (!vsCurrentBtn) return;

  const isP1 = player === 1;

  // Cek frozen
  if (isP1 && vsP1Frozen) return;
  if (!isP1 && vsP2Frozen) return;

  const type = vsCurrentBtn;

  // Lock tombol agar tidak bisa diklik dua kali
  vsCurrentBtn = null;
  if (vsPenaltyTimer) { clearTimeout(vsPenaltyTimer); vsPenaltyTimer = null; }

  if (type === "green") {
    if (isP1) vsP1Score += 1; else vsP2Score += 1;
    vsUpdateScores();
    vsUpdateCombo(player, 1);
    vsUpdateCombo(player === 1 ? 2 : 1, "reset");
    triggerEffects("soundGreen", "green", "versusGame");
    vsNextWithHold();

  } else if (type === "bonus") {
    if (isP1) vsP1Score += 3; else vsP2Score += 3;
    vsUpdateScores();
    vsUpdateCombo(player, 1);
    vsUpdateCombo(player === 1 ? 2 : 1, "reset");
    triggerEffects("soundBonus", "bonus", "versusGame");
    vsNextWithHold();

  } else if (type === "red") {
    if (isP1) vsP1Score = Math.max(0, vsP1Score - 1);
    else      vsP2Score = Math.max(0, vsP2Score - 1);
    vsUpdateScores();
    vsUpdateCombo(player, "reset");
    triggerEffects("soundRed", "red", "versusGame");
    vsNextWithHold();

  } else if (type === "freeze") {
    // Siapa yang klik duluan, dia freeze LAWAN
    vsApplyFreeze(player);
    // Flash biru
    const flash = document.getElementById("flashOverlay");
    flash.className = "";
    flash.classList.add("active", "blue");
    setTimeout(() => flash.classList.remove("active", "blue"), 200);
    vsNextWithHold();
  }
}

// ============================================
// VERSUS MODE — KEYBOARD CONTROL
// ============================================
function vsKeyHandler(e) {
  const key = e.key.toLowerCase();
  if (key === VS_KEY_P1) vsPlayerClick(1);
  if (key === VS_KEY_P2) vsPlayerClick(2);
}

// ============================================
// VERSUS MODE — START / EXIT
// ============================================
function startVersusMode(minutes) {
  closeVsDurationPopup();

  vsTotalSeconds = (minutes || 3) * 60;
  vsSecondsLeft  = vsTotalSeconds;

  vsP1Score = 0; vsP2Score = 0;
  vsCombo1 = 0;  vsCombo2 = 0;
  vsSpawning = false;
  vsCurrentBtn = null;
  vsP1Frozen = false; vsP2Frozen = false;
  if (vsP1FreezeTimeout) { clearTimeout(vsP1FreezeTimeout); vsP1FreezeTimeout = null; }
  if (vsP2FreezeTimeout) { clearTimeout(vsP2FreezeTimeout); vsP2FreezeTimeout = null; }
  if (vsMainTimer) { clearInterval(vsMainTimer); vsMainTimer = null; }

  vsUpdateScores();
  document.getElementById("vsCombo1").textContent = "x0";
  document.getElementById("vsCombo2").textContent = "x0";
  document.getElementById("vsComboBox1").style.opacity = 0;
  document.getElementById("vsComboBox2").style.opacity = 0;
  document.getElementById("vsP1Side").classList.remove("frozen-side");
  document.getElementById("vsP2Side").classList.remove("frozen-side");
  document.getElementById("vsTimerBarFill").style.width = "100%";
  document.getElementById("vsTimerBarFill").className = "";
  vsUpdateTimerLabel(vsSecondsLeft);

  const fl1 = document.getElementById("vsFrozenLabel1");
  const fl2 = document.getElementById("vsFrozenLabel2");
  if (fl1) fl1.textContent = "";
  if (fl2) fl2.textContent = "";

  vsClearAllTimers();
  vsHideAllButtons();

  document.getElementById("lobby").classList.remove("active");
  document.getElementById("versusGame").classList.add("active");

  // Tampilkan tutorial notif dulu, baru countdown
  showVsTutorialNotif(() => {
    document.addEventListener("keydown", vsKeyHandler);
    showCountdownThen(() => {
      vsSpawnRandomButton();
      vsStartMainTimer();
    });
  });
}

function exitVersusMode() {
  if (vsMainTimer) { clearInterval(vsMainTimer); vsMainTimer = null; }
  vsClearAllTimers();
  vsHideAllButtons();
  vsStopCountdown();
  if (vsP1FreezeTimeout) { clearTimeout(vsP1FreezeTimeout); vsP1FreezeTimeout = null; }
  if (vsP2FreezeTimeout) { clearTimeout(vsP2FreezeTimeout); vsP2FreezeTimeout = null; }
  vsP1Frozen = false; vsP2Frozen = false;
  document.removeEventListener("keydown", vsKeyHandler);
  document.getElementById("vsResultPopup").classList.remove("active");
  document.getElementById("versusGame").classList.remove("active");
  document.getElementById("home").classList.add("active");
}

// ============================================
// VERSUS MODE — EVENT LISTENERS
// ============================================
document.getElementById("playVersusBtn").addEventListener("click", () => { playSound(); openVsDurationPopup(); });
document.getElementById("exitVersusBtn").addEventListener("click", () => { playSound(); showQuitConfirm("versus"); });

document.getElementById("vsP1ClickBtn").addEventListener("click", () => { vsPlayerClick(1); });
document.getElementById("vsP2ClickBtn").addEventListener("click", () => { vsPlayerClick(2); });

document.getElementById("vsPlayAgainBtn").addEventListener("click", () => {
  playSound();
  document.getElementById("vsResultPopup").classList.remove("active");
  document.getElementById("versusGame").classList.remove("active");
  document.getElementById("lobby").classList.add("active");
  openVsDurationPopup();
});
document.getElementById("vsGoHomeBtn").addEventListener("click", () => {
  playSound();
  exitVersusMode();
});