// ============================================================
// REFLEXRYTHM — BASIC MODE (OSU-STYLE ENGINE v2)
// Musik-driven: game berakhir saat lagu habis
// Keyboard-only: tiap note dapat key dari keybind pool
// Timing scoring: Perfect / Good / Early / Miss
// Difficulty: 1–4 note simultan, dikonfigurasi per diff
// ============================================================

// ============================================================
// A. TRACK LIST — tambah musik baru di sini
// ============================================================
// PENTING: tiap track butuh `id` yang UNIK (jangan sama persis
// dengan track lain). Itu aja — list di lobby (song-item + diff-panel)
// di-render OTOMATIS dari array ini oleh bmRenderTrackList() (lihat
// bagian P di bawah). Gak perlu edit lobby.html sama sekali lagi.
const BM_TRACKS = [
  // Tambah track baru di sini — pastikan `id` unik & beda dari track lain:
  {
    id: "PIXEL_PANIC", // ← WAJIB UNIK
    title: "PIXEL PANIC",
    artist: "REFLEXRYTHM",
    bpm: 120,
    src: "assets/music/Pixel_Panic.mp3",
    duration: 60,
    bg: "assets/video/kamia-live2d.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["normal", "medium", "hard"],
    color: "#ff2d78", // tiap track boleh punya warna aksen sendiri-sendiri
    role: "// BASIC MODE — KEYBOARD REFLEX",
    titleClass: "title-basic",
    desc: "120 BPM Groove Santai. Cocok untuk mengasah akurasi ketukan dan membangun ritme permainanmu.",
  },
  {
    id: "pixel_panic",
    title: "PIXEL PANIC PARTY",
    artist: "REFLEXRYTHM",
    bpm: 140,
    src: "assets/music/Pixel_Panic_Party.mp3",
    duration: 60, // detik — fallback jika audio metadata belum load
    bg: "assets/video/ocean-live2d.mp4",
    art: "assets/picture/new-logo.png", // album art thumbnail (opsional)
    difficulties: ["medium", "hard"],
    color: "#00e5ff", // warna aksen song-item ini saat ke-select
    role: "// BASIC MODE — KEYBOARD REFLEX",
    titleClass: "title-basic",
    desc: "140 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
];

// ============================================================
// B. DIFFICULTY CONFIG
// ============================================================
const BM_DIFF = {
  normal: {
    label: "NORMAL",
    color: "#00ff88",
    noteCount: 1,
    windowMs: 3800,
    perfectMs: 500,
    goodMs: 1000,
    spawnIntervalMs: 1800,
  },
  medium: {
    label: "MEDIUM",
    color: "#ffe500",
    noteCount: 2,
    windowMs: 2600,
    perfectMs: 350,
    goodMs: 700,
    spawnIntervalMs: 1300,
  },
  hard: {
    label: "HARD",
    color: "#ff6644",
    noteCount: 3,
    windowMs: 1700,
    perfectMs: 220,
    goodMs: 480,
    spawnIntervalMs: 950,
  },
  extreme: {
    label: "EXTREME",
    color: "#ff00ff",
    noteCount: 4,
    windowMs: 1100,
    perfectMs: 130,
    goodMs: 280,
    spawnIntervalMs: 650,
  },
};

// ============================================================
// C. NOTE TYPES
// ============================================================
const BM_NOTE_TYPES = [
  {
    id: "hit",
    color: "#00ff88",
    ring: "rgba(0,255,136,0.65)",
    scoreBase: 100,
    weight: 5,
  },
  {
    id: "avoid",
    color: "#ff4444",
    ring: "rgba(255,68,68,0.65)",
    scoreBase: 0,
    weight: 3,
  },
  {
    id: "bonus",
    color: "#ffe500",
    ring: "rgba(255,229,0,0.65)",
    scoreBase: 300,
    weight: 2,
  },
];

function bmPickNoteType() {
  const total = BM_NOTE_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of BM_NOTE_TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return BM_NOTE_TYPES[0];
}

// ============================================================
// D. SPAWN ZONES — 12 posisi dalam % (left, top)
// ============================================================
const BM_ZONES = [
  { x: 14, y: 18 },
  { x: 38, y: 13 },
  { x: 62, y: 18 },
  { x: 84, y: 16 },
  { x: 10, y: 46 },
  { x: 33, y: 50 },
  { x: 57, y: 45 },
  { x: 80, y: 48 },
  { x: 17, y: 73 },
  { x: 43, y: 76 },
  { x: 67, y: 72 },
  { x: 87, y: 70 },
];

// ============================================================
// E. KEYBIND SYSTEM
// ============================================================
const BM_DEFAULT_KEYS = ["q", "w", "e", "r"];

function bmGetKeys() {
  if (
    typeof profile !== "undefined" &&
    Array.isArray(profile?.settings?.keybinds) &&
    profile.settings.keybinds.length >= 4
  ) {
    // Ambil tepat 4 key pertama, lowercase
    return profile.settings.keybinds.slice(0, 4).map((k) => k.toLowerCase());
  }
  return BM_DEFAULT_KEYS;
}

// ============================================================
// F. STATE
// ============================================================
let bmScore = 0;
let bmCombo = 0;
let bmBestCombo = 0;
let bmActiveNotes = [];
let bmSpawnTimer = null;
let bmMusicTimer = null; // countdown timer interval (1s tick)
let bmRunning = false;
let bmDiffKey = "normal";
let bmTrackIdx = 0;
let bmKeyHandler   = null;
let bmMouseHandler = null;
let bmTouchHandler = null;
let bmMusicEl = null; // <audio> element untuk track aktif
let bmTimeLeft = 0; // detik tersisa
let bmBgVideo = null; // <video> background element

// ============================================================
// G. DOM REFS
// ============================================================
let bmArena,
  bmScoreEl,
  bmComboEl,
  bmComboBox,
  bmJudgeEl,
  bmTimerEl,
  bmTrackTitleEl,
  bmKeyLegendEl;

function bmInitRefs() {
  bmArena = document.getElementById("bmArena");
  bmScoreEl = document.getElementById("bmScore");
  bmComboEl = document.getElementById("bmComboText");
  bmComboBox = document.getElementById("bmComboContainer");
  bmJudgeEl = document.getElementById("bmJudgeText");
  bmTimerEl = document.getElementById("bmMusicTimer");
  bmTrackTitleEl = document.getElementById("bmTrackTitle");
  bmKeyLegendEl = document.getElementById("bmKeyLegend");
}

// ============================================================
// H. KEY LEGEND (baris chip keyboard di bawah layar)
// ============================================================
function bmRenderKeyLegend() {
  if (!bmKeyLegendEl) return;

  // Sembunyikan legend di touch device — tidak relevan tanpa keyboard
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) {
    bmKeyLegendEl.style.display = "none";
    // Arena perlu lebih lebar karena legend bar hilang
    if (bmArena) bmArena.style.bottom = "0";
    return;
  }

  const keys = bmGetKeys(); // selalu 4 key
  bmKeyLegendEl.innerHTML = "";
  keys.forEach((k) => {
    const chip = document.createElement("div");
    chip.className = "bm-key-chip";
    chip.id = "bmChip-" + k;
    chip.textContent = k.toUpperCase();
    bmKeyLegendEl.appendChild(chip);
  });
}

function bmFlashKey(k) {
  const chip = document.getElementById("bmChip-" + k);
  if (!chip) return;
  chip.classList.add("pressed");
  setTimeout(() => chip.classList.remove("pressed"), 120);
}

// ============================================================
// I. SPAWN LOGIC
// ============================================================
function bmSpawnWave() {
  if (!bmRunning) return;
  const diff = BM_DIFF[bmDiffKey];
  const keys = bmGetKeys();
  const usedK = bmActiveNotes.map((n) => n.key);
  const freeK = keys.filter((k) => !usedK.includes(k));
  const zones = [...BM_ZONES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < diff.noteCount && i < freeK.length; i++) {
    bmSpawnNote(zones[i], bmPickNoteType(), freeK[i], diff);
  }
}

function bmSpawnNote(zone, type, key, diff) {
  if (!bmArena) return;
  const id = "bm-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
  const el = document.createElement("div");
  el.className = "bm-note";
  el.id = id;
  el.style.cssText = `left:${zone.x}%;top:${zone.y}%;`;

  // Warna note via CSS variable
  el.style.setProperty("--nc", type.color);
  el.style.setProperty("--rc", type.ring);
  el.style.setProperty("--dur", diff.windowMs + "ms");

  // Key label
  const kl = document.createElement("span");
  kl.className = "bm-key-label";
  kl.textContent = key.toUpperCase();
  el.appendChild(kl);

  // Shrink ring
  const ring = document.createElement("div");
  ring.className = "bm-ring";
  el.appendChild(ring);

  // Sembunyikan key label di touch device
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) kl.style.display = "none";

  bmArena.appendChild(el);

  const noteData = {
    id,
    key,
    type,
    el,
    spawnedAt: Date.now(),
    windowMs: diff.windowMs,
    perfectMs: diff.perfectMs,
    goodMs: diff.goodMs,
    hit: false,
    expireTimer: setTimeout(() => bmExpire(noteData), diff.windowMs),
  };
  bmActiveNotes.push(noteData);
  // Touch: ditangani global di bmStartEngine via bmHandleTouch — bukan per-note
}

function bmExpire(nd) {
  if (nd.hit) return;
  nd.hit = true;
  // Merah expired = avoid berhasil → NICE
  if (nd.type.id === "avoid") {
    bmResult("NICE!", 50, true);
    if (typeof triggerEffects === "function") triggerEffects(null, "green", "basicMode", nd.el);
  } else {
    bmResult("MISS", 0, false);
    if (typeof triggerEffects === "function") triggerEffects(null, "red", "basicMode", nd.el);
  }
  bmRemoveNote(nd);
}

function bmRemoveNote(nd) {
  clearTimeout(nd.expireTimer);
  nd.el.classList.add("bm-note-exit");
  setTimeout(() => nd.el?.remove(), 200);
  bmActiveNotes = bmActiveNotes.filter((n) => n.id !== nd.id);
}

// ============================================================
// J. KEY HANDLER
// ============================================================
function bmOnKey(e) {
  if (!bmRunning) return;
  const k = e.key.toLowerCase();
  // ESC = quit
  if (k === "escape") {
    bmTriggerQuit();
    return;
  }

  const nd = bmActiveNotes.find((n) => n.key === k && !n.hit);
  if (!nd) return;
  e.preventDefault();

  nd.hit = true;
  clearTimeout(nd.expireTimer);
  bmFlashKey(k);

  const elapsed = Date.now() - nd.spawnedAt;
  const remaining = nd.windowMs - elapsed;

  if (nd.type.id === "avoid") {
    bmResult("WRONG!", 0, false);
    if (typeof triggerEffects === "function") triggerEffects(null, "red", "basicMode", nd.el);
  } else {
    let judge, pts;
    const base = nd.type.scoreBase;
    if (remaining <= 0) {
      judge = "MISS";
      pts = 0;
    } else if (remaining <= nd.perfectMs) {
      judge = "PERFECT!";
      pts = Math.round(base * 2 * (1 + bmCombo * 0.05));
    } else if (remaining <= nd.goodMs) {
      judge = "GOOD";
      pts = Math.round(base * 1.2 * (1 + bmCombo * 0.03));
    } else if (elapsed / nd.windowMs < 0.2) {
      judge = "EARLY";
      pts = Math.round(base * 0.5);
    } else {
      judge = "GOOD";
      pts = Math.round(base * (1 + bmCombo * 0.03));
    }
    let flashColor = (judge === "MISS") ? "red" : (nd.type.id === "bonus" ? "bonus" : "green");
    
    bmResult(judge, pts, judge !== "MISS", nd.type.id);
    if (typeof triggerEffects === "function") triggerEffects(null, flashColor, "basicMode", nd.el);
  }
  bmRemoveNote(nd);
}

// ============================================================
// J2. MOUSE CLICK HANDLER
// Klik mouse mana saja trigger note pertama yang tersedia.
// context menu (klik kanan) di-prevent supaya tidak muncul popup browser.
// ============================================================
function bmOnMouse(e) {
  if (!bmRunning) return;
  // Cegah context menu saat klik kanan
  if (e.type === "contextmenu") { e.preventDefault(); return; }
  e.preventDefault();

  // Ambil note pertama yang belum di-hit (FIFO)
  const nd = bmActiveNotes.find((n) => !n.hit);
  if (!nd) return;

  // Simulasikan keydown event dengan key yang sama
  const fakeEvent = { key: nd.key, preventDefault: () => {} };
  bmOnKey(fakeEvent);
}

// ============================================================
// K. RESULT + HUD UPDATE (FIXED BONUS TRACKER)
// ============================================================
function bmResult(judge, pts, combo, noteType = null) {
  if (pts > 0) {
    bmScore += pts;
    if (bmScoreEl) bmScoreEl.textContent = bmScore.toLocaleString();
  }
  if (combo) {
    bmCombo++;
    if (bmCombo > bmBestCombo) bmBestCombo = bmCombo;
  } else bmCombo = 0;

  if (bmComboEl) bmComboEl.textContent = "x" + bmCombo;
  if (bmComboBox) {
    bmComboBox.style.opacity = "1";
    void bmComboBox.offsetWidth;
    bmComboBox.classList.toggle("bm-fire", bmCombo >= 10);
    
    const sets = typeof getSettings === "function" ? getSettings() : null;
    if (!sets || sets.comboAnimationEnabled !== false) {
      bmComboBox.classList.add("bm-pop");
      setTimeout(() => bmComboBox.classList.remove("bm-pop"), 220);
    }
  }
  if (bmJudgeEl) {
    const cls = "bm-j-" + judge.replace(/[^a-z]/gi, "").toLowerCase();
    bmJudgeEl.className = "bm-judge " + cls;
    bmJudgeEl.textContent = judge;
    void bmJudgeEl.offsetWidth;
    bmJudgeEl.classList.add("bm-j-pop");
  }

  // Ambil ID mode aktif saat ini (misal: "basic" atau "notoriginal")
  const currentModeId = BM_GAME_MODES[bmGameModeIdx]?.id || "basic";

  // 1. Rekam klik biasa/salah ke profile
  if (typeof statRecordClick === "function") statRecordClick(currentModeId);
  if (judge === "WRONG!" && typeof statRecordWrongClick === "function")
    statRecordWrongClick(currentModeId);

  // 2. FIXED: Rekam bonus jika tipe note yang dipukul adalah "bonus" DAN hit-nya berhasil (bukan MISS/WRONG)
  if (pts > 0 && typeof statRecordBonus === "function") {
    if (noteType === "bonus" || judge === "PERFECT!") {
      statRecordBonus();
      // Paksa UI langsung sinkron saat itu juga jika fungsi updater tersedia
      if (typeof triggerLobbyDOMUpdate === "function") triggerLobbyDOMUpdate();
    }
  }
}

// ============================================================
// L. MUSIC TIMER
// ============================================================
function bmFmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

function bmStartMusicTimer(duration) {
  bmTimeLeft = duration;
  if (bmTimerEl) bmTimerEl.textContent = bmFmtTime(bmTimeLeft);

  bmMusicTimer = setInterval(() => {
    bmTimeLeft--;
    if (bmTimerEl) {
      bmTimerEl.textContent = bmFmtTime(bmTimeLeft);
      // Warna merah saat <10 detik
      bmTimerEl.style.color = bmTimeLeft <= 10 ? "#ff4444" : "#fff";
      if (bmTimeLeft <= 10)
        bmTimerEl.style.textShadow = "0 0 16px rgba(255,68,68,0.8)";
      else bmTimerEl.style.textShadow = "0 0 16px rgba(0,240,255,0.5)";
    }
    if (bmTimeLeft <= 0) bmGameOver();
  }, 1000);
}

// ============================================================
// M. GAME OVER
// ============================================================
function bmGameOver() {
  bmStopEngine();

  if (typeof statRecordGameEnd === "function")
    statRecordGameEnd("basic", bmScore, bmBestCombo);

  const popup = document.getElementById("basicResultPopup");
  if (popup) {
    const scoreEl = document.getElementById("basicFinalScore");
    const comboEl = document.getElementById("basicFinalCombo");
    const trackEl = document.getElementById("basicFinalTrack");
    if (scoreEl) scoreEl.textContent = bmScore.toLocaleString();
    if (comboEl) comboEl.textContent = "Best Combo: x" + bmBestCombo;
    if (trackEl) {
      const track = BM_TRACKS[bmTrackIdx];
      trackEl.textContent = track ? track.title : "";
    }
    popup.classList.add("active");
  }
}

// ============================================================
// GLOBAL MULTI-TOUCH HANDLER
// Satu listener handle semua simultaneous touches — dua jari
// bisa hit dua note berbeda sekaligus (multi-touch support).
// ============================================================
function bmHandleTouch(e) {
  if (!bmRunning) return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Cari note aktif terdekat dari touch point ini
    let closestNote = null;
    let closestDist = Infinity;
    const HIT_RADIUS = 60; // px toleransi — sesuai ukuran note 50-72px

    for (const nd of bmActiveNotes) {
      if (nd.hit) continue;
      const rect = nd.el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dist = Math.hypot(touchX - cx, touchY - cy);
      if (dist < HIT_RADIUS && dist < closestDist) {
        closestDist = dist;
        closestNote = nd;
      }
    }

    if (closestNote) {
      const fakeEvent = { key: closestNote.key, preventDefault: () => {} };
      bmOnKey(fakeEvent);
    }
  }
}

// ============================================================
// N. START / STOP
// ============================================================
function startBasicMode() {
  // SAFETY: Jika URL menunjukkan mode notoriginal, jangan jalankan basic mode.
  // Ini mencegah video basic menimpa video NOM saat "Main Lagi" di NOM mode.
  const urlParams = new URLSearchParams(window.location.search);
  const urlMode = urlParams.get("mode");
  if (urlMode === "notoriginal") {
    console.warn("startBasicMode() dipanggil saat mode=notoriginal, skip ke NOM.");
    if (typeof startNotOriginalEngine === "function") startNotOriginalEngine();
    return;
  }

  // Kalau kita masih di lobby.html → redirect ke game.html dengan params
  if (document.getElementById("lobbyProfileWidget") !== null) {
    const activeDiffBtn =
      document.querySelector(
        ".diff-panel:not([style*='display: none']) .diff-btn.active",
      ) || document.querySelector(".diff-btn.active");
    const diff = activeDiffBtn
      ? activeDiffBtn.getAttribute("data-diff")
      : bmDiffKey || "normal";
    const track = bmTrackIdx ?? 0;

    // Ambil ID mode aktif langsung dari array konfigurasi baru
    const currentModeId = BM_GAME_MODES[bmGameModeIdx]?.id || "basic";

    // Redirect menggunakan ID mode dinamis (?mode=basic atau ?mode=notoriginal)
    if (typeof rrNavigate === "function") { rrNavigate(`game.html?mode=${currentModeId}&diff=${diff}&track=${track}`); } else { window.location.href = `game.html?mode=${currentModeId}&diff=${diff}&track=${track}`; };
    return;
  }

  // Sudah di game.html — bmDiffKey & bmTrackIdx sudah di-inject oleh router sebelum fungsi ini dipanggil
  // Validasi fallback kalau ternyata kosong
  if (!bmDiffKey || !BM_DIFF[bmDiffKey]) bmDiffKey = "normal";

  bmInitRefs();

  bmScore = 0;
  bmCombo = 0;
  bmBestCombo = 0;
  bmActiveNotes = [];
  bmRunning = false;

  if (bmScoreEl) bmScoreEl.textContent = "0";
  if (bmComboEl) bmComboEl.textContent = "x0";
  if (bmComboBox) {
    bmComboBox.style.opacity = "0";
    bmComboBox.className = "bm-combo-box";
  }
  if (bmJudgeEl) {
    bmJudgeEl.textContent = "";
    bmJudgeEl.className = "bm-judge";
  }
  if (bmArena) bmArena.innerHTML = "";

  const track = BM_TRACKS[bmTrackIdx] ?? BM_TRACKS[0];

  if (bmTrackTitleEl) bmTrackTitleEl.textContent = track.title;

  bmRenderKeyLegend();

  const badge = document.getElementById("bmDiffBadge");
  if (badge) {
    const d = BM_DIFF[bmDiffKey];
    badge.textContent = d.label;
    badge.style.color = d.color;
    badge.style.borderColor = d.color;
    badge.style.textShadow = `0 0 10px ${d.color}88`;
  }

  // Aktifkan screen — id di game.html adalah "basicMode" bukan "basicGame"
  const gameScreen =
    document.getElementById("basicMode") ||
    document.getElementById("basicGame");
  if (gameScreen) gameScreen.classList.add("active");

  // Set background video — preload sebelum countdown, play sesudah
  bmBgVideo = document.getElementById("bmBgVideo");
  if (bmBgVideo) {
    bmBgVideo.pause();
    bmBgVideo.src = track.bg;
    bmBgVideo.load(); // preload aja, belum play
  }

  showCountdownThen(() => {
    bmRunning = true;

    // Play video setelah countdown — sinkron dengan musik
    if (bmBgVideo) {
      bmBgVideo.play().catch(() => {});
    }

    // Play musik
    bmMusicEl = document.getElementById("bmTrackAudio");
    if (!bmMusicEl) {
      bmMusicEl = document.createElement("audio");
      bmMusicEl.id = "bmTrackAudio";
      document.body.appendChild(bmMusicEl);
    }
    bmMusicEl.src = track.src;
    bmMusicEl.volume =
      typeof profile !== "undefined"
        ? ((profile.settings?.masterVolume ?? 100) / 100) * 0.8
        : 0.8;
    bmMusicEl.currentTime = 0;
    bmMusicEl.play().catch(() => {});

    const startTimers = (dur) => {
      bmStartMusicTimer(dur);
      const diff = BM_DIFF[bmDiffKey];
      bmSpawnWave();
      bmSpawnTimer = setInterval(bmSpawnWave, diff.spawnIntervalMs);
    };

    // track.duration adalah sumber utama durasi timer.
    // Audio metadata hanya dipakai sebagai fallback jika track.duration
    // tidak di-set (0 atau undefined).
    if (track.duration && track.duration > 0) {
      startTimers(track.duration);
    } else if (bmMusicEl.duration && isFinite(bmMusicEl.duration)) {
      startTimers(Math.ceil(bmMusicEl.duration));
    } else {
      bmMusicEl.addEventListener(
        "loadedmetadata",
        () => {
          if (bmTimeLeft === 0) startTimers(Math.ceil(bmMusicEl.duration));
        },
        { once: true },
      );
    }

    bmKeyHandler = bmOnKey;
    document.addEventListener("keydown", bmKeyHandler);

    // Touch integration — global multi-touch, hanya di touch device
    const _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (_isTouchDevice) {
      bmTouchHandler = bmHandleTouch;
      document.addEventListener("touchstart", bmTouchHandler, { passive: false });
    }

    // Mouse click integration — hanya aktif jika:
    // 1. Bukan touch device (HP/tablet pakai tap-on-note langsung)
    // 2. Setting mouseClickEnabled = true di profile
    const _mouseEnabled = !_isTouchDevice && (
      typeof profile !== "undefined"
        ? (profile.settings?.mouseClickEnabled ?? true)
        : true
    );
    if (_mouseEnabled) {
      bmMouseHandler = bmOnMouse;
      document.addEventListener("mousedown",    bmMouseHandler);
      document.addEventListener("contextmenu",  bmMouseHandler);
    }
  });
}

function bmStopEngine() {
  bmRunning = false;

  // Reset flag countdown — tanpa ini Play Again stuck karena
  // showCountdownThen() langsung return tanpa jalankan callback.
  if (typeof isCountdownRunning !== "undefined") isCountdownRunning = false;

  if (bmSpawnTimer) {
    clearInterval(bmSpawnTimer);
    bmSpawnTimer = null;
  }
  if (bmMusicTimer) {
    clearInterval(bmMusicTimer);
    bmMusicTimer = null;
  }
  if (bmKeyHandler) {
    document.removeEventListener("keydown", bmKeyHandler);
    bmKeyHandler = null;
  }
  if (bmTouchHandler) {
    document.removeEventListener("touchstart", bmTouchHandler);
    bmTouchHandler = null;
  }
  if (bmMouseHandler) {
    document.removeEventListener("mousedown",   bmMouseHandler);
    document.removeEventListener("contextmenu", bmMouseHandler);
    bmMouseHandler = null;
  }
  if (bmMusicEl) {
    bmMusicEl.pause();
    bmMusicEl.currentTime = 0;
    bmMusicEl.src = "";
    bmMusicEl.load();
  }

  [...bmActiveNotes].forEach((n) => {
    clearTimeout(n.expireTimer);
    n.el?.remove();
  });
  bmActiveNotes = [];
  if (bmArena) bmArena.innerHTML = "";
}

function exitBasicMode() {
  bmStopEngine();
  if (typeof rrNavigate === "function") { rrNavigate("lobby.html"); } else { window.location.href = "lobby.html"; };
}

// ============================================================
// O. QUIT CONFIRM INTEGRATION
// ============================================================
function bmTriggerQuit() {
  if (typeof showQuitConfirm === "function") showQuitConfirm("basic");
  else bmGameOver();
}

// Shims untuk popups.js (yang masih panggil nama lama)
function clearAllTimers() {
  bmStopEngine();
}
function hideAllButtons() {}
function stopCountdown() {}

Object.defineProperty(window, "score", {
  get() {
    return bmScore;
  },
  set(v) {
    bmScore = v;
  },
  configurable: true,
});
Object.defineProperty(window, "basicBestCombo", {
  get() {
    return bmBestCombo;
  },
  set(v) {
    bmBestCombo = v;
  },
  configurable: true,
});

// ============================================================
// P. DYNAMIC TRACK LIST RENDERING — lobby.html
// ============================================================
// Render #songListWrapper otomatis dari BM_TRACKS + BM_DIFF, jadi
// markup <button class="song-item"> dan <div class="diff-panel"> gak
// perlu lagi ditulis manual dua kali (di sini DAN di lobby.html).
// Mau nambah track? cukup tambah object baru di BM_TRACKS (bagian A).
function bmRenderTrackList() {
  const wrapper = document.getElementById("songListWrapper");
  if (!wrapper) return; // bukan lagi di lobby.html (mis. di game.html) — skip

  wrapper.innerHTML = "";

  BM_TRACKS.forEach((track, i) => {
    const accent = track.color || "#00e5ff";

    // ── song-item ──
    const item = document.createElement("button");
    item.type = "button";
    item.className = "song-item" + (i === 0 ? " active" : "");
    item.dataset.index = i;
    item.dataset.video = track.bg;
    item.dataset.trackIdx = i;
    item.dataset.preview = track.src;
    item.style.setProperty("--song-accent", accent);
    item.innerHTML = `
      <span class="song-index">${String(i + 1).padStart(2, "0")}</span>
      <img class="song-album-art" src="${track.art || "assets/picture/new-logo.png"}" alt="album" onerror="this.style.opacity='0'">
      <div class="song-details">
        <span class="song-title">${track.title}</span>
        <span class="song-artist">${track.artist} // BPM: ${track.bpm} // ${bmFmtTime(track.duration)}</span>
      </div>
      <span class="song-status-tag">SELECT</span>
    `;
    wrapper.appendChild(item);

    // ── diff-panel (cuma track pertama yang langsung kebuka) ──
    const panel = document.createElement("div");
    panel.className = "diff-panel";
    panel.id = "diffPanel-" + i;
    panel.style.display = i === 0 ? "block" : "none";

    const diffBtns = (track.difficulties || [])
      .map((key, di) => {
        const d = BM_DIFF[key];
        if (!d) return "";
        return (
          `<button class="diff-btn${di === 0 ? " active" : ""}" data-diff="${key}">` +
          `<span class="diff-dot" style="background:${d.color}"></span>${d.label}</button>`
        );
      })
      .join("");

    panel.innerHTML = `
      <div class="diff-panel-label">// DIFFICULTY</div>
      <div class="diff-btn-row">${diffBtns}</div>
    `;
    wrapper.appendChild(panel);
  });
}

// ============================================================
// Q. EXIT BUTTON & RESULT POPUP LISTENERS
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  // Main.js akan memanggil bmRenderTrackList atau nomRenderTrackList saat inisialisasi

  document.getElementById("exitBasicBtn")?.addEventListener("click", () => {
    if (typeof playSound === "function") playSound();
    // Cek apakah Not Original Mode yang sedang berjalan —
    // kalau iya, delegate ke nomTriggerQuit() agar mode & skor terbaca benar.
    if (typeof nomRunning !== "undefined" && nomRunning) {
      if (typeof nomTriggerQuit === "function") nomTriggerQuit();
    } else {
      bmTriggerQuit();
    }
  });

  document
    .getElementById("basicPlayAgainBtn")
    ?.addEventListener("click", () => {
      // Guard: kalau popup dibuka oleh NOM, biarkan popups.js yang handle.
      // Listener ini hanya boleh jalan untuk Basic Mode.
      if (window._nomResultActive) return;
      if (typeof playSound === "function") playSound();
      document.getElementById("basicResultPopup")?.classList.remove("active");
      bmBestCombo = 0;
      startBasicMode();
    });

  document.getElementById("basicGoHomeBtn")?.addEventListener("click", () => {
    if (typeof playSound === "function") playSound();
    document.getElementById("basicResultPopup")?.classList.remove("active");
    if (typeof rrNavigate === "function") { rrNavigate("lobby.html"); } else { window.location.href = "lobby.html"; };
  });
});