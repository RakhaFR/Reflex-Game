// ============================================
// BASIC MODE — STATE
// ============================================
let score = 0;
let penaltyTimer = null;
let holdTimer = null;
let spawning = false;
let countdownInterval = null;
let combo = 0;
let basicBestCombo = 0;
const buttons = ["greenBtn", "redBtn", "bonusBtn"];

// ============================================
// BASIC MODE — HELPERS
// ============================================
function startCountdown(duration, spanId, onEnd) {
  const span = document.getElementById(spanId);
  let timeLeft = duration;
  span.textContent = timeLeft;
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    timeLeft--;
    span.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      span.textContent = "";
      if (onEnd) onEnd();
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  document.querySelectorAll("#gameArea .countdown").forEach((el) => (el.textContent = ""));
}

function updateScore(val) {
  score += val;
  document.getElementById("score").textContent = score;
}

function hideAllButtons() {
  ["greenBtn", "redBtn", "bonusBtn", "holdBtn"].forEach((id) => {
    document.getElementById(id).style.display = "none";
  });
}

function clearAllTimers() {
  if (penaltyTimer) { clearTimeout(penaltyTimer); penaltyTimer = null; }
  if (holdTimer)    { clearTimeout(holdTimer);    holdTimer = null;    }
  spawning = false;
}

function updateCombo(change) {
  const comboText = document.getElementById("combo");
  const comboBox  = document.getElementById("comboContainer");

  if (change === "reset") {
    combo = 0;
    comboText.textContent = "x0";
    comboBox.classList.remove("pop", "combo-big", "combo-glow");
    comboBox.classList.add("show");
    setTimeout(() => { comboBox.classList.remove("show"); comboBox.style.opacity = 0; }, 200);
  } else {
    combo += change;
    if (combo > basicBestCombo) basicBestCombo = combo;
    comboText.textContent = "x" + combo;
    comboBox.style.opacity = 1;
    comboBox.classList.add("pop");
    comboBox.classList.remove("show");
    if (combo >= 5)  comboBox.classList.add("combo-big");
    if (combo >= 10) comboBox.classList.add("combo-glow");
    setTimeout(() => { comboBox.classList.remove("pop"); comboBox.classList.add("show"); }, 300);
  }
}

// ============================================
// BASIC MODE — SPAWN LOGIC
// ============================================
function spawnRandomButton() {
  if (spawning) return;
  spawning = true;
  hideAllButtons();
  stopCountdown();

  const randId = buttons[Math.floor(Math.random() * buttons.length)];
  document.getElementById(randId).style.display = "block";

  if (randId === "greenBtn" || randId === "bonusBtn") {
    penaltyTimer = setTimeout(() => {
      updateScore(-1); updateCombo("reset");
      document.getElementById("soundRed").currentTime = 0;
      document.getElementById("soundRed").play();
      nextWithHold();
    }, 5000);
    startCountdown(5, randId === "greenBtn" ? "cdGreen" : "cdBonus");
  }
  if (randId === "redBtn") {
    penaltyTimer = setTimeout(() => { nextWithHold(); }, 3000);
    startCountdown(3, "cdRed");
  }
}

function nextWithHold() {
  if (penaltyTimer) { clearTimeout(penaltyTimer); penaltyTimer = null; }
  hideAllButtons();
  stopCountdown();

  document.getElementById("holdBtn").style.display = "block";
  startCountdown(2, "cdHold");

  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  holdTimer = setTimeout(() => {
    hideAllButtons(); spawning = false; holdTimer = null; stopCountdown();
    spawnRandomButton();
  }, 2000);
}

// ============================================
// BASIC MODE — START / EXIT
// ============================================
function startBasicMode() {
  clearAllTimers();
  spawning = false;
  document.getElementById("lobby").classList.remove("active");
  document.getElementById("basicGame").classList.add("active");

  score = 0; combo = 0; basicBestCombo = 0;
  document.getElementById("score").textContent = 0;
  document.getElementById("combo").textContent = "x0";
  document.getElementById("comboContainer").style.opacity = 0;
  document.getElementById("comboContainer").className = "";

  hideAllButtons();
  showCountdownThen(() => { spawnRandomButton(); });
}

function exitBasicMode() {
  clearAllTimers();
  hideAllButtons();
  combo = 0;
  document.getElementById("combo").textContent = "x0";
  document.getElementById("comboContainer").classList.remove("show", "combo-big", "combo-glow");
  document.getElementById("comboContainer").style.opacity = 0;
  document.getElementById("basicGame").classList.remove("active");
  document.getElementById("home").classList.add("active");
}

// ============================================
// BASIC MODE — EVENT LISTENERS
// ============================================
document.getElementById("playBasicBtn").addEventListener("click", () => { playSound(); startBasicMode(); });
document.getElementById("exitBasicBtn").addEventListener("click", () => { playSound(); showQuitConfirm("basic"); });

document.getElementById("greenBtn").addEventListener("click", () => {
  updateScore(1); triggerEffects("soundGreen", "green", "basicGame"); updateCombo(1);
  if (penaltyTimer) { clearTimeout(penaltyTimer); penaltyTimer = null; }
  nextWithHold();
});
document.getElementById("redBtn").addEventListener("click", () => {
  updateScore(-1); triggerEffects("soundRed", "red", "basicGame"); updateCombo("reset");
  if (penaltyTimer) { clearTimeout(penaltyTimer); penaltyTimer = null; }
  nextWithHold();
});
document.getElementById("bonusBtn").addEventListener("click", () => {
  updateScore(3); triggerEffects("soundBonus", "bonus", "basicGame"); updateCombo(1);
  if (penaltyTimer) { clearTimeout(penaltyTimer); penaltyTimer = null; }
  nextWithHold();
});
