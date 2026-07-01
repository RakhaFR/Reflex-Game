// ============================================================
// POPUPS.JS — di-load PALING TERAKHIR di game.html
// Semua handler tombol result popup dipusatkan di sini.
// ============================================================

// ============================================================
// RESULT POPUP — VICTORY MUSIC
// ============================================================
// Musik yang diputar setiap kali popup "Akhir Permainan" muncul
// (baik dari basic mode maupun NOM mode).
let resultMusicEl = null;

function playResultMusic() {
  if (!resultMusicEl) {
    resultMusicEl = document.getElementById("resultMusic");
    if (!resultMusicEl) {
      resultMusicEl = document.createElement("audio");
      resultMusicEl.id = "resultMusic";
      resultMusicEl.src = "assets/music/PixelCoinDash(hasil).mp3";
      resultMusicEl.preload = "auto";
      document.body.appendChild(resultMusicEl);
    }
  }
  resultMusicEl.currentTime = 0;
  resultMusicEl.volume = typeof profile !== "undefined"
    ? ((profile.settings?.masterVolume ?? 100) / 100) * 0.7
    : 0.7;
  resultMusicEl.play().catch(() => {});
}

function stopResultMusic() {
  if (resultMusicEl) {
    resultMusicEl.pause();
    resultMusicEl.currentTime = 0;
  }
}

// ============================================================
// RESULT POPUP — POPULATE FIELDS (design baru comic-arcade)
// ============================================================
// Menghitung & mengisi semua field tambahan yang dibutuhkan
// design baru: accuracy %, rank huruf, XP gained, album art,
// track subtitle, dan tape kesulitan.
function rpCalcRank(accuracyPct) {
  if (accuracyPct >= 98) return "S+";
  if (accuracyPct >= 95) return "S";
  if (accuracyPct >= 90) return "A";
  if (accuracyPct >= 80) return "B";
  if (accuracyPct >= 65) return "C";
  return "D";
}

function populateResultPopup({ mode, finalScore, finalCombo, clicks, wrongClicks, track, diffKey }) {
  // Accuracy
  const totalClicks = clicks ?? 0;
  const wrong = wrongClicks ?? 0;
  const correct = Math.max(0, totalClicks - wrong);
  const accuracyPct = totalClicks > 0 ? (correct / totalClicks) * 100 : 0;
  const accuracyEl = document.getElementById("rpAccuracy");
  if (accuracyEl) accuracyEl.textContent = accuracyPct.toFixed(1) + "%";

  // Rank
  const rankEl = document.getElementById("rpRank");
  if (rankEl) rankEl.textContent = rpCalcRank(accuracyPct);

  // XP — formula sederhana: skor/10 + bonus combo + bonus akurasi
  const xp = Math.round((finalScore / 10) + (finalCombo * 2) + (accuracyPct * 3));
  const xpEl = document.getElementById("rpXpGained");
  if (xpEl) xpEl.textContent = "+" + xp.toLocaleString() + " XP";

  // Track info
  const trackNameEl = document.getElementById("basicFinalTrack");
  const trackSubEl  = document.getElementById("rpTrackSub");
  const tapeEl       = document.getElementById("rpDiffTape");
  const artEl        = document.getElementById("rpAlbumArt");

  if (track) {
    if (trackNameEl) trackNameEl.textContent = track.title || "—";
    if (trackSubEl)  trackSubEl.textContent  = track.artist || track.subtitle || "";
    if (artEl && track.art) artEl.src = track.art;
    if (tapeEl) {
      const diffLabel = (diffKey || "normal").toUpperCase();
      const bpm = track.bpm ? " · BPM " + track.bpm : "";
      tapeEl.textContent = diffLabel + bpm;
    }
  } else {
    if (trackNameEl) trackNameEl.textContent = mode === "notoriginal" ? "Not Original Mode" : "Basic Mode";
    if (trackSubEl)  trackSubEl.textContent  = "";
  }

  // Combo display — format "×N" sesuai design baru
  const comboEl = document.getElementById("basicFinalCombo");
  if (comboEl) comboEl.textContent = "×" + (finalCombo ?? 0);

  // Score — angka biasa, formatting locale
  const scoreEl = document.getElementById("basicFinalScore");
  if (scoreEl) scoreEl.textContent = (finalScore ?? 0).toLocaleString();
}

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

document.getElementById("quitNoBtn")?.addEventListener("click", () => {
  playSound(); closeQuitConfirm();
});

document.getElementById("quitYesBtn")?.addEventListener("click", () => {
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
    const finalScore = window.score ?? 0;
    const finalCombo = window.basicBestCombo ?? 0;
    if (typeof statRecordGameEnd === "function")
      statRecordGameEnd("basic", finalScore, finalCombo);

    const popup = document.getElementById("basicResultPopup");
    if (popup) {
      const track = typeof BM_TRACKS !== "undefined" && typeof bmTrackIdx !== "undefined"
        ? BM_TRACKS[bmTrackIdx] : null;
      const clicks = (typeof profile !== "undefined" && profile.stats?.basic)
        ? profile.stats.basic.clicks : 0;
      const wrongClicks = (typeof profile !== "undefined" && profile.stats?.basic)
        ? profile.stats.basic.wrongClicks : 0;

      populateResultPopup({
        mode: "basic",
        finalScore,
        finalCombo,
        clicks,
        wrongClicks,
        track,
        diffKey: typeof bmDiffKey !== "undefined" ? bmDiffKey : "normal",
      });

      window._nomResultActive = false;
      popup.classList.add("active");
      playResultMusic();
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
      const track = typeof NOM_TRACKS !== "undefined" ? NOM_TRACKS[finalTrackIdx] : null;
      const clicks = (typeof profile !== "undefined" && profile.stats?.notoriginal)
        ? profile.stats.notoriginal.clicks : 0;
      const wrongClicks = (typeof profile !== "undefined" && profile.stats?.notoriginal)
        ? profile.stats.notoriginal.wrongClicks : 0;

      populateResultPopup({
        mode: "notoriginal",
        finalScore,
        finalCombo,
        clicks,
        wrongClicks,
        track,
        diffKey: typeof nomDiffKey !== "undefined" ? nomDiffKey : "normal",
      });

      window._nomResultActive = true;
      popup.classList.add("active");
      playResultMusic();
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
      stopResultMusic();
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
      stopResultMusic();
      document.getElementById("basicResultPopup")?.classList.remove("active");

      if (window._nomResultActive) {
        window._nomResultActive = false;
        if (typeof rrNavigate === "function") { rrNavigate("lobby.html?mode=notoriginal"); } else { window.location.href = "lobby.html?mode=notoriginal"; };
      } else {
        if (typeof rrNavigate === "function") { rrNavigate("lobby.html"); } else { window.location.href = "lobby.html"; };
      }
    });
  }
})();