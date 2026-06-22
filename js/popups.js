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

  // ==========================================================================
  // LOGIC UNTUK MODE BARU (NOT ORIGINAL MODE) — TEMPORARY COMMENTED
  // ==========================================================================
  } else if (quitTargetMode === "notoriginal") {
    // Nanti kalau engine notoriginal udah jadi, tinggal uncomment baris di bawah ini:
    /*
    if (typeof stopNotOriginalEngine === "function") stopNotOriginalEngine();
    
    if (typeof statRecordGameEnd === "function")
      statRecordGameEnd("notoriginal", window.score ?? 0, window.notOriginalBestCombo ?? 0);

    // Contoh pemicu popup result khusus mode ini (jika ada):
    const popup = document.getElementById("notOriginalResultPopup");
    if (popup) {
      document.getElementById("notOriginalFinalScore").textContent = (window.score ?? 0).toLocaleString();
      document.getElementById("notOriginalFinalCombo").textContent = "Best Combo: x" + (window.notOriginalBestCombo ?? 0);
      popup.classList.add("active");
    }
    */
    
    // Fallback sementara biar gak stuck pas testing quit di mode notoriginal:
    console.log("Quit dipicu dari mode: notoriginal. Mengembalikan state ke lobby/home.");
    // Jika belum ada pop-up result, bisa langsung lempar ke home/lobby:
    // document.getElementById("home")?.classList.add("active");
  }

  quitTargetMode = null;
});