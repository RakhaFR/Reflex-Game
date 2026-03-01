// ============================================
// TIME ATTACK — STATE
// ============================================
let taScore = 0, taCombo = 0, taBestCombo = 0;
let taSpawning = false;
let taPenaltyTimer = null, taHoldTimer = null;
let taCountdownInterval = null;
let taTotalSeconds = 0, taSecondsLeft = 0;
let taMainTimer = null;
let taFrozen = false, taFreezeCooldown = false;
let taFreezeTimeout = null;
const taButtons = ["taGreenBtn", "taRedBtn", "taBonusBtn"];

// ============================================
// TIME ATTACK — DURATION POPUP
// ============================================
function openDurationPopup()  { document.getElementById("durationPopup").classList.add("active"); }
function closeDurationPopup() { document.getElementById("durationPopup").classList.remove("active"); }

document.getElementById("playTimeAttackBtn").addEventListener("click", () => {
  playSound();
  openDifficultyPopup("timeattack");
});

// ============================================
// TIME ATTACK — START
// ============================================
function startTimeAttack(minutes) {
  playSound();
  closeDurationPopup();

  taScore = 0; taCombo = 0; taBestCombo = 0;
  taSpawning = false; taFrozen = false; taFreezeCooldown = false;
  taTotalSeconds = minutes * 60;
  taSecondsLeft  = taTotalSeconds;

  document.getElementById("taScore").textContent = 0;
  document.getElementById("taCombo").textContent = "x0";
  document.getElementById("taComboContainer").style.opacity = 0;
  document.getElementById("taComboContainer").className = "";
  document.getElementById("timerBarFill").style.width = "100%";
  document.getElementById("timerBarFill").className = "";
  updateTimerLabel(taSecondsLeft);

  document.getElementById("taFreezeBtn").disabled = false;
  document.getElementById("freezeCooldownLabel").textContent = "";
  document.getElementById("lobby").classList.remove("active");
  document.getElementById("timeAttackGame").classList.add("active");

  taClearAllTimers();
  taHideAllButtons();
  showCountdownThen(() => { taSpawnRandomButton(); startMainTimer(); });
}

// ============================================
// TIME ATTACK — TIMER
// ============================================
function startMainTimer() {
  if (taMainTimer) clearInterval(taMainTimer);
  taMainTimer = setInterval(() => {
    if (taFrozen) return;
    taSecondsLeft--;
    updateTimerLabel(taSecondsLeft);
    updateTimerBar();
    if (taSecondsLeft <= 0) { clearInterval(taMainTimer); taMainTimer = null; timeAttackGameOver(); }
  }, 1000);
}

function updateTimerLabel(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  document.getElementById("timerLabel").textContent = m + ":" + String(s).padStart(2, "0");
}

function updateTimerBar() {
  const pct  = (taSecondsLeft / taTotalSeconds) * 100;
  const fill = document.getElementById("timerBarFill");
  fill.style.width = pct + "%";
  if (!taFrozen) {
    if (pct <= 25) { fill.classList.add("warning"); fill.classList.remove("frozen"); }
    else           { fill.classList.remove("warning"); }
  }
}

// ============================================
// TIME ATTACK — FREEZE
// ============================================
function activateFreeze() {
  if (taFreezeCooldown || taFrozen) return;

  const snd = document.getElementById("soundFreeze");
  if (snd) { snd.currentTime = 0; snd.play().catch(() => {}); }

  const freezeBtn = document.getElementById("taFreezeBtn");
  triggerFreezeEffect(freezeBtn);

  taFrozen = true; taFreezeCooldown = true;
  if (typeof statRecordFreeze === "function") statRecordFreeze();
  const fill = document.getElementById("timerBarFill");
  fill.classList.add("frozen"); fill.classList.remove("warning");
  freezeBtn.disabled = true;

  let freezeLeft = 5;
  document.getElementById("freezeCooldownLabel").textContent = "❄️ " + freezeLeft + "s";
  const freezeTick = setInterval(() => {
    freezeLeft--;
    if (freezeLeft <= 0) { clearInterval(freezeTick); }
    else { document.getElementById("freezeCooldownLabel").textContent = "❄️ " + freezeLeft + "s"; }
  }, 1000);

  taFreezeTimeout = setTimeout(() => {
    taFrozen = false;
    fill.classList.remove("frozen");
    updateTimerBar();
    let cdLeft = 20;
    document.getElementById("freezeCooldownLabel").textContent = "⏳ " + cdLeft + "s";
    const cdTick = setInterval(() => {
      cdLeft--;
      if (cdLeft <= 0) {
        clearInterval(cdTick); taFreezeCooldown = false; freezeBtn.disabled = false;
        document.getElementById("freezeCooldownLabel").textContent = "";
      } else {
        document.getElementById("freezeCooldownLabel").textContent = "⏳ " + cdLeft + "s";
      }
    }, 1000);
  }, 5000);
}

// ============================================
// TIME ATTACK — GAME OVER / EXIT
// ============================================
function timeAttackGameOver() {
  taClearAllTimers(); taHideAllButtons();
  if (taFreezeTimeout) { clearTimeout(taFreezeTimeout); taFreezeTimeout = null; }
  taFrozen = false;
  if (typeof statRecordGameEnd === "function") statRecordGameEnd("ta", taScore, taBestCombo);
  document.getElementById("finalScore").textContent = taScore;
  document.getElementById("finalCombo").textContent = "Best Combo: x" + taBestCombo;
  document.getElementById("gameOverPopup").classList.add("active");
}

function exitTimeAttackMode() {
  if (taMainTimer) { clearInterval(taMainTimer); taMainTimer = null; }
  taClearAllTimers(); taHideAllButtons();
  if (taFreezeTimeout) { clearTimeout(taFreezeTimeout); taFreezeTimeout = null; }
  taFrozen = false; taFreezeCooldown = false;
  document.getElementById("gameOverPopup").classList.remove("active");
  document.getElementById("timeAttackGame").classList.remove("active");
  document.getElementById("home").classList.add("active");
}

document.getElementById("exitTimeAttackBtn").addEventListener("click", () => {
  playSound();
  showQuitConfirm("timeattack");
});

// ============================================
// TIME ATTACK — SPAWN LOGIC
// ============================================
function taStartCountdown(duration, spanId, onEnd) {
  const span = document.getElementById(spanId);
  let timeLeft = duration;
  span.textContent = Math.ceil(timeLeft);
  if (taCountdownInterval) clearInterval(taCountdownInterval);
  taCountdownInterval = setInterval(() => {
    timeLeft--;
    span.textContent = Math.max(0, Math.ceil(timeLeft));
    if (timeLeft <= 0) {
      clearInterval(taCountdownInterval);
      span.textContent = "";
      if (onEnd) onEnd();
    }
  }, 1000);
}

function taStopCountdown() {
  if (taCountdownInterval) clearInterval(taCountdownInterval);
  document.querySelectorAll("#taGameArea .countdown").forEach((el) => (el.textContent = ""));
}

function taUpdateScore(val) { taScore += val; document.getElementById("taScore").textContent = taScore; }

function taHideAllButtons() {
  ["taGreenBtn", "taRedBtn", "taBonusBtn", "taHoldBtn"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
}

function taClearAllTimers() {
  if (taPenaltyTimer) { clearTimeout(taPenaltyTimer); taPenaltyTimer = null; }
  if (taHoldTimer)    { clearTimeout(taHoldTimer);    taHoldTimer = null;    }
  taSpawning = false;
}

function taSpawnRandomButton() {
  if (taSpawning) return;
  taSpawning = true;
  taHideAllButtons(); taStopCountdown();

  const diff  = getDiff();
  const randId = taButtons[Math.floor(Math.random() * taButtons.length)];
  document.getElementById(randId).style.display = "block";

  if (randId === "taGreenBtn") {
    taPenaltyTimer = setTimeout(() => {
      taUpdateScore(-1); taUpdateCombo("reset");
      document.getElementById("soundRed").currentTime = 0;
      document.getElementById("soundRed").play();
      taNextWithHold();
    }, diff.greenTime * 1000);
    taStartCountdown(diff.greenTime, "taCdGreen");
  } else if (randId === "taBonusBtn") {
    taPenaltyTimer = setTimeout(() => {
      taUpdateScore(-1); taUpdateCombo("reset");
      document.getElementById("soundRed").currentTime = 0;
      document.getElementById("soundRed").play();
      taNextWithHold();
    }, diff.bonusTime * 1000);
    taStartCountdown(diff.bonusTime, "taCdBonus");
  } else if (randId === "taRedBtn") {
    taPenaltyTimer = setTimeout(() => { taNextWithHold(); }, diff.redTime * 1000);
    taStartCountdown(diff.redTime, "taCdRed");
  }
}

function taNextWithHold() {
  if (taPenaltyTimer) { clearTimeout(taPenaltyTimer); taPenaltyTimer = null; }
  taHideAllButtons(); taStopCountdown();
  if (taSecondsLeft <= 0) return;

  document.getElementById("taHoldBtn").style.display = "block";
  taStartCountdown(2, "taCdHold");

  if (taHoldTimer) { clearTimeout(taHoldTimer); taHoldTimer = null; }
  taHoldTimer = setTimeout(() => {
    taHideAllButtons(); taSpawning = false; taHoldTimer = null; taStopCountdown();
    if (taSecondsLeft > 0) taSpawnRandomButton();
  }, 2000);
}

// ============================================
// TIME ATTACK — BUTTON EVENTS
// ============================================
document.getElementById("taGreenBtn").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  taUpdateScore(1);
  triggerEffects("soundGreen", "green", "timeAttackGame", btn);
  taUpdateCombo(1);
  if (typeof statRecordClick === "function") statRecordClick("ta");
  if (taPenaltyTimer) { clearTimeout(taPenaltyTimer); taPenaltyTimer = null; }
  taNextWithHold();
});
document.getElementById("taRedBtn").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  taUpdateScore(-1);
  triggerEffects("soundRed", "red", "timeAttackGame", btn);
  taUpdateCombo("reset");
  if (typeof statRecordClick === "function") { statRecordClick("ta"); statRecordWrongClick("ta"); }
  if (taPenaltyTimer) { clearTimeout(taPenaltyTimer); taPenaltyTimer = null; }
  taNextWithHold();
});
document.getElementById("taBonusBtn").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  taUpdateScore(3);
  triggerEffects("soundBonus", "bonus", "timeAttackGame", btn);
  taUpdateCombo(1);
  if (typeof statRecordClick === "function") { statRecordClick("ta"); statRecordBonus(); }
  if (taPenaltyTimer) { clearTimeout(taPenaltyTimer); taPenaltyTimer = null; }
  taNextWithHold();
});

function taUpdateCombo(change) {
  const comboText = document.getElementById("taCombo");
  const comboBox  = document.getElementById("taComboContainer");
  if (change === "reset") {
    taCombo = 0; comboText.textContent = "x0";
    comboBox.classList.remove("pop", "combo-big", "combo-glow");
    comboBox.classList.add("show");
    setTimeout(() => { comboBox.classList.remove("show"); comboBox.style.opacity = 0; }, 200);
  } else {
    taCombo += change;
    if (taCombo > taBestCombo) taBestCombo = taCombo;
    comboText.textContent = "x" + taCombo;
    comboBox.style.opacity = 1;
    comboBox.classList.add("pop"); comboBox.classList.remove("show");
    if (taCombo >= 5)  comboBox.classList.add("combo-big");
    if (taCombo >= 10) comboBox.classList.add("combo-glow");
    setTimeout(() => { comboBox.classList.remove("pop"); comboBox.classList.add("show"); }, 300);
  }
}