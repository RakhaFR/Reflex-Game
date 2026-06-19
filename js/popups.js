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
    // OSU engine — stop semua, tampilkan result
    if (typeof bmStopEngine === "function") bmStopEngine();
    if (typeof statRecordGameEnd === "function")
      statRecordGameEnd("basic", window.score ?? 0, window.basicBestCombo ?? 0);

    const popup = document.getElementById("basicResultPopup");
    if (popup) {
      document.getElementById("basicFinalScore").textContent =
        (window.score ?? 0).toLocaleString();
      document.getElementById("basicFinalCombo").textContent =
        "Best Combo: x" + (window.basicBestCombo ?? 0);
      popup.classList.add("active");
    }

  } else if (quitTargetMode === "versus") {
    if (typeof vsMainTimer !== "undefined" && vsMainTimer) {
      clearInterval(vsMainTimer); vsMainTimer = null;
    }
    if (typeof vsClearAllTimers === "function") vsClearAllTimers();
    if (typeof vsHideAllButtons === "function") vsHideAllButtons();
    if (typeof vsStopCountdown  === "function") vsStopCountdown();
    if (typeof vsP1FreezeTimeout !== "undefined" && vsP1FreezeTimeout) {
      clearTimeout(vsP1FreezeTimeout); vsP1FreezeTimeout = null;
    }
    if (typeof vsP2FreezeTimeout !== "undefined" && vsP2FreezeTimeout) {
      clearTimeout(vsP2FreezeTimeout); vsP2FreezeTimeout = null;
    }
    if (typeof vsP1FreezeTick !== "undefined" && vsP1FreezeTick) {
      clearInterval(vsP1FreezeTick); vsP1FreezeTick = null;
    }
    if (typeof vsP2FreezeTick !== "undefined" && vsP2FreezeTick) {
      clearInterval(vsP2FreezeTick); vsP2FreezeTick = null;
    }
    if (typeof vsP1Frozen !== "undefined") vsP1Frozen = false;
    if (typeof vsP2Frozen !== "undefined") vsP2Frozen = false;
    if (typeof vsP1FreezeSecondsLeft !== "undefined") vsP1FreezeSecondsLeft = 0;
    if (typeof vsP2FreezeSecondsLeft !== "undefined") vsP2FreezeSecondsLeft = 0;
    if (typeof vsKeyHandler === "function")
      document.removeEventListener("keydown", vsKeyHandler);
    document.getElementById("versusGame")?.classList.remove("active");
    document.getElementById("home")?.classList.add("active");
    quitTargetMode = null;
    return;

  } else if (quitTargetMode === "timeattack") {
    if (typeof taMainTimer !== "undefined" && taMainTimer) {
      clearInterval(taMainTimer); taMainTimer = null;
    }
    if (typeof taClearAllTimers === "function") taClearAllTimers();
    if (typeof taHideAllButtons === "function") taHideAllButtons();
    if (typeof taStopCountdown  === "function") taStopCountdown();
    if (typeof taFreezeTimeout !== "undefined" && taFreezeTimeout) {
      clearTimeout(taFreezeTimeout); taFreezeTimeout = null;
    }
    if (typeof taFrozen      !== "undefined") taFrozen = false;
    if (typeof taFreezeCooldown !== "undefined") taFreezeCooldown = false;
    if (typeof statRecordGameEnd === "function")
      statRecordGameEnd("ta", typeof taScore !== "undefined" ? taScore : 0,
                               typeof taBestCombo !== "undefined" ? taBestCombo : 0);

    const finalScore = document.getElementById("finalScore");
    const finalCombo = document.getElementById("finalCombo");
    if (finalScore) finalScore.textContent = typeof taScore !== "undefined" ? taScore : 0;
    if (finalCombo) finalCombo.textContent = "Best Combo: x" + (typeof taBestCombo !== "undefined" ? taBestCombo : 0);
    document.getElementById("gameOverPopup")?.classList.add("active");
  }

  quitTargetMode = null;
});

// ── Time Attack result popup ──
document.getElementById("taPlayAgainBtn")?.addEventListener("click", () => {
  playSound();
  document.getElementById("gameOverPopup")?.classList.remove("active");
  if (typeof openDurationPopup === "function") openDurationPopup();
});

document.getElementById("taGoHomeBtn")?.addEventListener("click", () => {
  playSound();
  if (typeof exitTimeAttackMode === "function") exitTimeAttackMode();
});