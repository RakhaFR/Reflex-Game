// ============================================================
// POPUPS.JS — di-load PALING TERAKHIR di game.html
// Semua handler tombol result popup dipusatkan di sini.
// ============================================================

// ============================================================
// QUIT CONFIRM POPUP
// ============================================================
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

  // Safety override: kalau NOM masih running saat konfirmasi quit,
  // paksa mode ke "notoriginal" — antisipasi exitBasicBtn yang masih
  // memanggil bmTriggerQuit() jika basic-mode.js versi lama dipakai.
  if (typeof nomRunning !== "undefined" && nomRunning) {
    quitTargetMode = "notoriginal";
  }

  if (quitTargetMode === "basic") {
    if (typeof bmStopEngine === "function") bmStopEngine();
    if (typeof statRecordGameEnd === "function")
      statRecordGameEnd("basic", window.score ?? 0, window.basicBestCombo ?? 0);

    const popup = document.getElementById("basicResultPopup");
    if (popup) {
      document.getElementById("basicFinalScore").textContent =
        (window.score ?? 0).toLocaleString();
      document.getElementById("basicFinalCombo").textContent =
        "Best Combo: x" + (window.basicBestCombo ?? 0);
      window._nomResultActive = false;
      popup.classList.add("active");
    }

  } else if (quitTargetMode === "notoriginal") {
    // PENTING: baca nilai skor SEBELUM nomStopEngine() dipanggil.
    // nomStopEngine() tidak reset nomScore/nomBestCombo, tapi untuk keamanan
    // kita snapshot dulu agar tidak ada race condition apapun.
    const finalScore   = window.nomScore   ?? 0;
    const finalCombo   = window.nomBestCombo ?? 0;
    const finalTrackIdx = window.nomTrackIdx ?? 0;

    // Stop engine SETELAH baca nilai — urutan ini penting!
    if (typeof nomStopEngine === "function") nomStopEngine();

    if (typeof statRecordGameEnd === "function")
      statRecordGameEnd("notoriginal", finalScore, finalCombo);

    const popup = document.getElementById("basicResultPopup");
    if (popup) {
      document.getElementById("basicFinalScore").textContent =
        finalScore.toLocaleString();
      document.getElementById("basicFinalCombo").textContent =
        "Best Combo: x" + finalCombo;
      const trackEl = document.getElementById("basicFinalTrack");
      if (trackEl) {
        const track = typeof NOM_TRACKS !== "undefined"
          ? NOM_TRACKS[finalTrackIdx] : null;
        trackEl.textContent = track ? track.title : "";
      }
      window._nomResultActive = true;
      popup.classList.add("active");
    }
  }

  quitTargetMode = null;
});

// ============================================================
// RESULT POPUP BUTTONS — handler terpusat
// Dipasang langsung (bukan DOMContentLoaded) karena popups.js
// di-load di bottom body — DOM sudah siap saat script ini jalan.
// replaceBtn() flush listener lama dari basic-mode.js yang
// juga attach ke tombol yang sama.
// ============================================================
(function setupResultButtons() {
  function replaceBtn(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  const playAgainBtn = replaceBtn("basicPlayAgainBtn");
  const goHomeBtn    = replaceBtn("basicGoHomeBtn");

  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      playSound();
      document.getElementById("basicResultPopup")?.classList.remove("active");

      if (window._nomResultActive) {
        // FIX VIDEO BUG: nomStopEngine() HARUS dipanggil LEBIH DULU sebelum
        // bmStopEngine(). Urutan ini penting karena:
        // 1. nomStopEngine() sekarang eksplisit pause + clear src video (bmBgVideo).
        // 2. bmStopEngine() setelahnya tidak akan salah override video yang sudah bersih.
        // 3. Kalau bmStopEngine() duluan: ia tidak tahu konteks video NOM, potensi
        //    timer/state dari BM yang stale bisa trigger side-effect ke video element.
        if (typeof nomStopEngine === "function") nomStopEngine();
        if (typeof bmStopEngine === "function") bmStopEngine();
        // PENTING: _nomResultActive di-reset SETELAH startNotOriginalEngine()
        // supaya guard di basic-mode.js DOMContentLoaded listener masih bisa
        // membaca flag true dan skip — mencegah startBasicMode() ikut terpanggil
        // yang akan override video NOM dengan video basic.
        if (typeof startNotOriginalEngine === "function") startNotOriginalEngine();
        window._nomResultActive = false;
      } else {
        if (typeof bmStopEngine === "function") bmStopEngine();
        if (typeof startBasicMode === "function") startBasicMode();
      }
    });
  }

  if (goHomeBtn) {
    goHomeBtn.addEventListener("click", () => {
      playSound();
      document.getElementById("basicResultPopup")?.classList.remove("active");

      if (window._nomResultActive) {
        window._nomResultActive = false;
        window.location.href = "lobby.html?mode=notoriginal";
      } else {
        window.location.href = "lobby.html";
      }
    });
  }
})();