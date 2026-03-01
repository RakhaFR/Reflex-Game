// ============================================
// QUIT CONFIRM POPUP
// ============================================
let quitTargetMode = null;

function showQuitConfirm(mode) {
  quitTargetMode = mode;
  document.getElementById("quitConfirmPopup").classList.add("active");
}

function closeQuitConfirm() {
  document.getElementById("quitConfirmPopup").classList.remove("active");
  quitTargetMode = null;
}

document.getElementById("quitNoBtn").addEventListener("click", () => {
  playSound(); closeQuitConfirm();
});

document.getElementById("quitYesBtn").addEventListener("click", () => {
  playSound();
  document.getElementById("quitConfirmPopup").classList.remove("active");

  if (quitTargetMode === "basic") {
    clearAllTimers(); hideAllButtons(); stopCountdown();
    if (typeof statRecordGameEnd === "function") statRecordGameEnd("basic", score, basicBestCombo);
    document.getElementById("basicFinalScore").textContent = score;
    document.getElementById("basicFinalCombo").textContent = "Best Combo: x" + basicBestCombo;
    document.getElementById("basicResultPopup").classList.add("active");

  } else if (quitTargetMode === "versus") {
    if (vsMainTimer) { clearInterval(vsMainTimer); vsMainTimer = null; }
    vsClearAllTimers();
    vsHideAllButtons();
    vsStopCountdown();
    if (vsP1FreezeTimeout) { clearTimeout(vsP1FreezeTimeout); vsP1FreezeTimeout = null; }
    if (vsP2FreezeTimeout) { clearTimeout(vsP2FreezeTimeout); vsP2FreezeTimeout = null; }
    vsP1Frozen = false;
    vsP2Frozen = false;
    document.removeEventListener("keydown", vsKeyHandler);
    document.getElementById("versusGame").classList.remove("active");
    document.getElementById("home").classList.add("active");
    quitTargetMode = null;
    return;

  } else if (quitTargetMode === "timeattack") {
    if (taMainTimer) { clearInterval(taMainTimer); taMainTimer = null; }
    taClearAllTimers(); taHideAllButtons(); taStopCountdown();
    if (taFreezeTimeout) { clearTimeout(taFreezeTimeout); taFreezeTimeout = null; }
    taFrozen = false; taFreezeCooldown = false;
    if (typeof statRecordGameEnd === "function") statRecordGameEnd("ta", taScore, taBestCombo);
    document.getElementById("finalScore").textContent = taScore;
    document.getElementById("finalCombo").textContent = "Best Combo: x" + taBestCombo;
    document.getElementById("gameOverPopup").classList.add("active");
  }
  quitTargetMode = null;
});

// Basic result popup
document.getElementById("basicPlayAgainBtn").addEventListener("click", () => {
  playSound();
  document.getElementById("basicResultPopup").classList.remove("active");
  basicBestCombo = 0;
  openDifficultyPopup("basic");
});

document.getElementById("basicGoHomeBtn").addEventListener("click", () => {
  playSound();
  document.getElementById("basicResultPopup").classList.remove("active");
  document.getElementById("basicGame").classList.remove("active");
  document.getElementById("home").classList.add("active");
  combo = 0; basicBestCombo = 0;
  document.getElementById("combo").textContent = "x0";
  document.getElementById("comboContainer").classList.remove("show", "combo-big", "combo-glow");
  document.getElementById("comboContainer").style.opacity = 0;
});

// Time Attack result popup
document.getElementById("taPlayAgainBtn").addEventListener("click", () => {
  playSound();
  document.getElementById("gameOverPopup").classList.remove("active");
  openDifficultyPopup("timeattack");
});

document.getElementById("taGoHomeBtn").addEventListener("click", () => {
  playSound();
  exitTimeAttackMode();
});