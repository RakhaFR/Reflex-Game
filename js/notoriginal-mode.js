// ============================================================
// REFLEXRYTHM — NOT ORIGINAL MODE (N.O.M ENGINE)
// Musik-driven: game berakhir saat lagu eksternal habis
// Keyboard-only: memanfaatkan keybind pool dari profile player
// Timing scoring & stat disinkronkan ke slot profile: notoriginal
// ============================================================

// ============================================================
// A. TRACK LIST — Tambah lagu eksternal tempo tinggi di sini
// ============================================================
const NOM_TRACKS = [
  {
    id: "lightning-moment",
    title: "Lightning Moment",
    artist: "DJ芥末",
    bpm: 145, // Tempo tinggi khas N.O.M!
    src: "assets/music/lightning-moment.mp3",
    duration: 60, // detik — fallback jika audio metadata belum load
    bg: "assets/video/lightning-moment.mp4", // Vibe visual beda
    art: "assets/picture/new-logo.png",
    difficulties: ["normal","medium", "hard"], // N.O.M langsung gas dari medium!
    color: "#0051e8", // Warna aksen khas Not Original Mode
    role: "// N.O.M STYLE — MEDIUM SPEED",
    titleClass: "title-notoriginal",
    desc: "145 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
  {
    id: "masih-adakah-waktu",
    title: "masih_adakah_waktu?",
    artist: "Dyolow",
    bpm: 155, // Tempo tinggi khas N.O.M!
    src: "assets/music/masih-adakah-waktu.mp3",
    duration: 204, // detik — fallback jika audio metadata belum load
    bg: "assets/video/masih-adakah-waktu.mp4", // Vibe visual beda
    art: "assets/picture/new-logo.png",
    difficulties: ["normal","medium", "hard"], // N.O.M langsung gas dari medium!
    color: "#00bbe6", // Warna aksen khas Not Original Mode
    role: "// N.O.M STYLE — MEDIUM SPEED",
    titleClass: "title-notoriginal",
    desc: "155 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
  {
    id: "mv-abm-yararara",
    title: "MV-BM-YARARARA",
    artist: "ABM (AnythingBecomeMoe / エビモエ)",
    bpm: 180,
    src: "assets/music/mv-abm-yararara.mp3",
    duration: 156,
    bg: "assets/video/mv-abm-yararara.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#c70000",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "oliver-tree-miss-you-bemax-cover-remix",
    title: "Miss You (Bemax Cover) [Remix]",
    artist: "Oliver Tree & Bemax Remix",
    bpm: 180,
    src: "assets/music/oliver-tree-miss-you-bemax-cover-remix.mp3",
    duration: 160,
    bg: "assets/video/oliver-tree-miss-you-bemax-cover-remix.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#F7345BFF",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "can-you-feel-the-fury?",
    title: "Can You Feel The Fury?",
    artist: "Ft. MrGoodbarz, Martin T",
    bpm: 190,
    src: "assets/music/can-you-feel-the-fury.mp3",
    duration: 67,
    bg: "assets/video/can-you-feel-the-fury.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#f2c224",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "190 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "funk-abnormal-dj-v12-slowed-reverb",
    title: "Funk Abnormal (Slowed & Reverb)",
    artist: "DJ V12",
    bpm: 180,
    src: "assets/music/funk-abnormal-dj-v12-slowed-reverb.mp3",
    duration: 101,
    bg: "assets/video/funk-abnormal-dj-v12-slowed-reverb.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#E9AC5EFF",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "aria-freaks-stadium",
    title: "Aria Freaks Stadium",
    artist: "NightSoundClouds",
    bpm: 180,
    src: "assets/music/aria-freaks-stadium.mp3",
    duration: 101,
    bg: "assets/video/aria-freaks-stadium.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["hard", "extreme"],
    color: "#222222",
    role: "// N.O.M STYLE — EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "180 BPM High-Speed. Aransemen cepat yang menuntut ketahanan jari. Pertahankan kombo atau hancur di tengah jalan.",
  },
  {
    id: "bang-bang-bang-chainsaw-man",
    title: "bang-bang-bang-chainsaw-man",
    artist: "‪@starxrayne‬ & ‪@JamsDX‬ ",
    bpm: 150,
    src: "assets/music/bang-bang-bang-chainsaw-man-song.mp3",
    duration: 180,
    bg: "assets/video/bang-bang-bang-chainsaw-man-song.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["medium", "hard", "extreme"],
    color: "#7d7d7d",
    role: "// N.O.M STYLE — HARD SPEED",
    titleClass: "title-notoriginal",
    desc: "150 BPM Energetik. Ketukan mulai memanas, pastikan sinkronisasi mata dan tanganmu berada di performa terbaik.",
  },
  {
    id: "blksmiith-sr20det",
    title: "SR20DET",
    artist: "BLKSMIITH",
    bpm: 200,
    src: "assets/music/blksmiith-sr20det.mp3",
    duration: 278,
    bg: "assets/video/blksmiith-sr20det.mp4",
    art: "assets/picture/new-logo.png",
    difficulties: ["extreme"],
    color: "##212121",
    role: "// N.O.M STYLE — ONLY EXTREME SPEED",
    titleClass: "title-notoriginal",
    desc: "200 BPM Ketukan Tanpa Ampun. Kecepatan murni yang akan membakar jarimu. Jangan berkedip, pastikan keybind-mu sudah siap.",
  },
];

// ============================================================
// B. DIFFICULTY CONFIG (N.O.M VERSION — Lebih Agresif)
// ============================================================
const NOM_DIFF = {
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
    windowMs: 2200, // Lebih cepat menciut dibanding basic mode
    perfectMs: 300,
    goodMs: 600,
    spawnIntervalMs: 1100,
  },
  hard: {
    label: "HARD",
    color: "#ff6644",
    noteCount: 3,
    windowMs: 1400, // Menuntut refleks kilat
    perfectMs: 180,
    goodMs: 400,
    spawnIntervalMs: 800,
  },
  extreme: {
    label: "EXTREME",
    color: "#ff00ff",
    noteCount: 4,
    windowMs: 950, // Mode hardcore sejati
    perfectMs: 100,
    goodMs: 220,
    spawnIntervalMs: 550,
  },
  insane: {
    label: "INSANE",
    color: "#111111",
    noteCount: 5,
    windowMs: 950, // Mode insane sejati
    perfectMs: 100,
    goodMs: 220,
    spawnIntervalMs: 550,
  },
};

// ============================================================
// C. NOTE TYPES
// ============================================================
const NOM_NOTE_TYPES = [
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
    scoreBase: 350,
    weight: 2,
  }, // Score bonus sedikit up
];

function nomPickNoteType() {
  const total = NOM_NOTE_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of NOM_NOTE_TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return NOM_NOTE_TYPES[0];
}

// ============================================================
// D. SPAWN ZONES (12 Posisi Layar Arena)
// ============================================================
const NOM_ZONES = [
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
// E. KEYBIND SYSTEM (Mengambil dari profile.js)
// ============================================================
const NOM_DEFAULT_KEYS = ["q", "w", "e", "r"];

function nomGetKeys() {
  if (
    typeof profile !== "undefined" &&
    Array.isArray(profile?.settings?.keybinds) &&
    profile.settings.keybinds.length >= 4
  ) {
    return profile.settings.keybinds.slice(0, 4).map((k) => k.toLowerCase());
  }
  return NOM_DEFAULT_KEYS;
}

// ============================================================
// F. ENGINE STATE
// ============================================================
let nomScore = 0;
let nomCombo = 0;
let nomBestCombo = 0;
let nomActiveNotes = [];
let nomSpawnTimer = null;
let nomMusicTimer = null;
let nomRunning = false;
let nomDiffKey = "normal"; // Default awal N.O.M
let nomTrackIdx = 0;
let nomKeyHandler   = null;
let nomMouseHandler = null;
let nomTouchHandler = null;
let nomMusicEl = null;
let nomTimeLeft = 0;
let nomBgVideo = null;

// Expose ke window agar popups.js (file terpisah) bisa baca
// nilai terkini tanpa ReferenceError — `let` tidak otomatis global.
Object.defineProperty(window, "nomScore", {
  get: () => nomScore,
  set: (v) => {
    nomScore = v;
  },
  configurable: true,
});
Object.defineProperty(window, "nomBestCombo", {
  get: () => nomBestCombo,
  set: (v) => {
    nomBestCombo = v;
  },
  configurable: true,
});
Object.defineProperty(window, "nomTrackIdx", {
  get: () => nomTrackIdx,
  set: (v) => {
    nomTrackIdx = v;
  },
  configurable: true,
});
Object.defineProperty(window, "nomDiffKey", {
  get: () => nomDiffKey,
  set: (v) => {
    nomDiffKey = v;
  },
  configurable: true,
});

// ============================================================
// G. DOM REFS (Membaca Elemen HUD Game.html)
// ============================================================
let nomArena,
  nomScoreEl,
  nomComboEl,
  nomComboBox,
  nomJudgeEl,
  nomTimerEl,
  nomTrackTitleEl,
  nomKeyLegendEl;

function nomInitRefs() {
  nomArena = document.getElementById("bmArena");
  nomScoreEl = document.getElementById("bmScore");
  nomComboEl = document.getElementById("bmComboText");
  nomComboBox = document.getElementById("bmComboContainer");
  nomJudgeEl = document.getElementById("bmJudgeText");
  nomTimerEl = document.getElementById("bmMusicTimer");
  nomTrackTitleEl = document.getElementById("bmTrackTitle");
  nomKeyLegendEl = document.getElementById("bmKeyLegend");
}

// ============================================================
// H. KEY LEGEND CHIPS
// ============================================================
function nomRenderKeyLegend() {
  if (!nomKeyLegendEl) return;

  // Sembunyikan legend di touch device
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) {
    nomKeyLegendEl.style.display = "none";
    if (nomArena) nomArena.style.bottom = "0";
    return;
  }

  const keys = nomGetKeys();
  nomKeyLegendEl.innerHTML = "";
  keys.forEach((k) => {
    const chip = document.createElement("div");
    chip.className = "bm-key-chip";
    chip.id = "nomChip-" + k;
    chip.textContent = k.toUpperCase();
    nomKeyLegendEl.appendChild(chip);
  });
}

function nomFlashKey(k) {
  const chip = document.getElementById("nomChip-" + k);
  if (!chip) return;
  chip.classList.add("pressed");
  setTimeout(() => chip.classList.remove("pressed"), 120);
}

// ============================================================
// I. SPAWN LOGIC WAVE
// ============================================================
function nomSpawnWave() {
  if (!nomRunning) return;
  const diff = NOM_DIFF[nomDiffKey] || NOM_DIFF["normal"];
  const keys = nomGetKeys();
  const usedK = nomActiveNotes.map((n) => n.key);
  const freeK = keys.filter((k) => !usedK.includes(k));
  const zones = [...NOM_ZONES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < diff.noteCount && i < freeK.length; i++) {
    nomSpawnNote(zones[i], nomPickNoteType(), freeK[i], diff);
  }
}

function nomSpawnNote(zone, type, key, diff) {
  if (!nomArena) return;
  const id = "nom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
  const el = document.createElement("div");
  el.className = "bm-note";
  el.id = id;
  el.style.cssText = `left:${zone.x}%;top:${zone.y}%;`;

  el.style.setProperty("--nc", type.color);
  el.style.setProperty("--rc", type.ring);
  el.style.setProperty("--dur", diff.windowMs + "ms");

  const kl = document.createElement("span");
  kl.className = "bm-key-label";
  kl.textContent = key.toUpperCase();
  el.appendChild(kl);

  const ring = document.createElement("div");
  ring.className = "bm-ring";
  el.appendChild(ring);

  // Sembunyikan key label di touch device
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouchDevice) kl.style.display = "none";

  nomArena.appendChild(el);

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
    expireTimer: setTimeout(() => nomExpire(noteData), diff.windowMs),
  };
  nomActiveNotes.push(noteData);
  // Touch: ditangani global di startNotOriginalEngine via nomHandleTouch
}

function nomExpire(nd) {
  if (nd.hit) return;
  nd.hit = true;
  if (nd.type.id === "avoid") {
    nomResult("NICE!", 50, true);
    if (typeof triggerEffects === "function") triggerEffects(null, "green", "basicMode", nd.el);
  } else {
    nomResult("MISS", 0, false);
    if (typeof triggerEffects === "function") triggerEffects(null, "red", "basicMode", nd.el);
  }
  nomRemoveNote(nd);
}

function nomRemoveNote(nd) {
  clearTimeout(nd.expireTimer);
  nd.el.classList.add("bm-note-exit");
  setTimeout(() => nd.el?.remove(), 200);
  nomActiveNotes = nomActiveNotes.filter((n) => n.id !== nd.id);
}

// ============================================================
// J. KEY HANDLER ENGINE
// ============================================================
function nomOnKey(e) {
  if (!nomRunning) return;
  const k = e.key.toLowerCase();
  if (k === "escape") {
    nomTriggerQuit();
    return;
  }

  const nd = nomActiveNotes.find((n) => n.key === k && !n.hit);
  if (!nd) return;
  e.preventDefault();

  nd.hit = true;
  clearTimeout(nd.expireTimer);
  nomFlashKey(k);

  const elapsed = Date.now() - nd.spawnedAt;
  const remaining = nd.windowMs - elapsed;

  if (nd.type.id === "avoid") {
    nomResult("WRONG!", 0, false);
    if (typeof triggerEffects === "function") triggerEffects(null, "red", "basicMode", nd.el);
  } else {
    let judge, pts;
    const base = nd.type.scoreBase;
    if (remaining <= 0) {
      judge = "MISS";
      pts = 0;
    } else if (remaining <= nd.perfectMs) {
      judge = "PERFECT!";
      pts = Math.round(base * 2 * (1 + nomCombo * 0.05));
    } else if (remaining <= nd.goodMs) {
      judge = "GOOD";
      pts = Math.round(base * 1.2 * (1 + nomCombo * 0.03));
    } else if (elapsed / nd.windowMs < 0.2) {
      judge = "EARLY";
      pts = Math.round(base * 0.5);
    } else {
      judge = "GOOD";
      pts = Math.round(base * (1 + nomCombo * 0.03));
    }
    let flashColor = (judge === "MISS") ? "red" : (nd.type.id === "bonus" ? "bonus" : "green");
    
    nomResult(judge, pts, judge !== "MISS", nd.type.id);
    if (typeof triggerEffects === "function") triggerEffects(null, flashColor, "basicMode", nd.el);
  }
  nomRemoveNote(nd);
}

// ============================================================
// J2. MOUSE CLICK HANDLER
// ============================================================
function nomOnMouse(e) {
  if (!nomRunning) return;
  if (e.type === "contextmenu") { e.preventDefault(); return; }
  e.preventDefault();

  const nd = nomActiveNotes.find((n) => !n.hit);
  if (!nd) return;

  const fakeEvent = { key: nd.key, preventDefault: () => {} };
  nomOnKey(fakeEvent);
}

// ============================================================
// K. RESULT & HUD UPDATE (SINKRON DATA PROFILE: notoriginal)
// ============================================================
function nomResult(judge, pts, combo, noteType = null) {
  if (pts > 0) {
    nomScore += pts;
    if (nomScoreEl) nomScoreEl.textContent = nomScore.toLocaleString();
  }
  if (combo) {
    nomCombo++;
    if (nomCombo > nomBestCombo) nomBestCombo = nomCombo;
  } else nomCombo = 0;

  if (nomComboEl) nomComboEl.textContent = "x" + nomCombo;
  if (nomComboBox) {
    nomComboBox.style.opacity = "1";
    void nomComboBox.offsetWidth;
    nomComboBox.classList.toggle("bm-fire", nomCombo >= 10);
    
    const sets = typeof getSettings === "function" ? getSettings() : null;
    if (!sets || sets.comboAnimationEnabled !== false) {
      nomComboBox.classList.add("bm-pop");
      setTimeout(() => nomComboBox.classList.remove("bm-pop"), 220);
    }
  }
  if (nomJudgeEl) {
    const cls = "bm-j-" + judge.replace(/[^a-z]/gi, "").toLowerCase();
    nomJudgeEl.className = "bm-judge " + cls;
    nomJudgeEl.textContent = judge;
    void nomJudgeEl.offsetWidth;
    nomJudgeEl.classList.add("bm-j-pop");
  }

  // TARGET SAVE DATA PROFILE: notoriginal
  if (typeof statRecordClick === "function") statRecordClick("notoriginal");
  if (judge === "WRONG!" && typeof statRecordWrongClick === "function")
    statRecordWrongClick("notoriginal");

  if (pts > 0 && typeof statRecordBonus === "function") {
    if (noteType === "bonus" || judge === "PERFECT!") {
      statRecordBonus();
      if (typeof triggerLobbyDOMUpdate === "function") triggerLobbyDOMUpdate();
    }
  }
}

// ============================================================
// L. MUSIC TIMER
// ============================================================
function nomFmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

function nomStartMusicTimer(duration) {
  nomTimeLeft = duration;
  if (nomTimerEl) nomTimerEl.textContent = nomFmtTime(nomTimeLeft);

  nomMusicTimer = setInterval(() => {
    nomTimeLeft--;
    if (nomTimerEl) {
      nomTimerEl.textContent = nomFmtTime(nomTimeLeft);
      nomTimerEl.style.color = nomTimeLeft <= 10 ? "#ff4444" : "#fff";
      if (nomTimeLeft <= 10)
        nomTimerEl.style.textShadow = "0 0 16px rgba(255,68,68,0.8)";
      else nomTimerEl.style.textShadow = "0 0 16px rgba(255,45,120,0.5)";
    }
    if (nomTimeLeft <= 0) nomGameOver();
  }, 1000);
}

// ============================================================
// M. GAME OVER (SINKRON DATA TERBAIK: highestNotOriginalScore)
// ============================================================
function nomGameOver() {
  nomStopEngine();

  // FIX 1: Expose nomScore ke window.score agar popups.js & statRecordGameEnd
  // membaca nilai N.O.M, bukan bmScore dari basic mode yang masih terbaca.
  window._nomFinalScore = nomScore;
  window._nomFinalCombo = nomBestCombo;
  window._nomFinalTrackIdx = nomTrackIdx;

  // Rekam ke slot notoriginal di profile
  if (typeof statRecordGameEnd === "function")
    statRecordGameEnd("notoriginal", nomScore, nomBestCombo);

  // Munculkan popup result bawaan game (elemen basicResultPopup sudah ada di game.html)
  const popup = document.getElementById("basicResultPopup");
  if (popup) {
    const scoreEl = document.getElementById("basicFinalScore");
    const comboEl = document.getElementById("basicFinalCombo");
    const trackEl = document.getElementById("basicFinalTrack");
    if (scoreEl) scoreEl.textContent = nomScore.toLocaleString();
    if (comboEl) comboEl.textContent = "Best Combo: x" + nomBestCombo;
    if (trackEl) {
      const track = NOM_TRACKS[nomTrackIdx];
      trackEl.textContent = track ? track.title : "";
    }
    // FIX 3: tandai bahwa popup ini dibuka oleh N.O.M bukan basic mode
    window._nomResultActive = true;
    popup.classList.add("active");
  }
}

// ============================================================
// GLOBAL MULTI-TOUCH HANDLER (NOM)
// ============================================================
function nomHandleTouch(e) {
  if (!nomRunning) return;
  e.preventDefault();

  for (let i = 0; i < e.changedTouches.length; i++) {
    const touch = e.changedTouches[i];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    let closestNote = null;
    let closestDist = Infinity;
    const HIT_RADIUS = 60;

    for (const nd of nomActiveNotes) {
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
      nomOnKey(fakeEvent);
    }
  }
}

// ============================================================
// N. START / STOP ENTRY (startNotOriginalEngine)
// ============================================================
function startNotOriginalEngine() {
  // Deteksi apakah kita di lobby (bukan game.html) via pathname —
  // JANGAN cek lobbyProfileWidget karena elemen itu juga ada di game.html
  // lewat dummy patch, sehingga engine salah redirect ke lobby saat "Main Lagi".
  const isLobby = window.location.pathname.includes("lobby");
  if (isLobby) {
    const activeDiffBtn =
      document.querySelector(
        ".diff-panel:not([style*='display: none']) .diff-btn.active",
      ) || document.querySelector(".diff-btn.active");
    const diff = activeDiffBtn
      ? activeDiffBtn.getAttribute("data-diff")
      : nomDiffKey || "normal";
    const track = nomTrackIdx ?? 0;
    if (typeof rrNavigate === "function") { rrNavigate(`game.html?mode=notoriginal&diff=${diff}&track=${track}`); } else { window.location.href = `game.html?mode=notoriginal&diff=${diff}&track=${track}`; };
    return;
  }

  if (!nomDiffKey || !NOM_DIFF[nomDiffKey]) nomDiffKey = "normal";

  nomInitRefs();

  nomScore = 0;
  nomCombo = 0;
  nomBestCombo = 0;
  nomActiveNotes = [];
  nomRunning = false;

  if (nomScoreEl) nomScoreEl.textContent = "0";
  if (nomComboEl) nomComboEl.textContent = "x0";
  if (nomComboBox) {
    nomComboBox.style.opacity = "0";
    nomComboBox.className = "bm-combo-box";
  }
  if (nomJudgeEl) {
    nomJudgeEl.textContent = "";
    nomJudgeEl.className = "bm-judge";
  }
  if (nomArena) nomArena.innerHTML = "";

  const track = NOM_TRACKS[nomTrackIdx] ?? NOM_TRACKS[0];
  if (nomTrackTitleEl) nomTrackTitleEl.textContent = track.title;

  nomRenderKeyLegend();

  const badge = document.getElementById("bmDiffBadge");
  if (badge) {
    const d = NOM_DIFF[nomDiffKey];
    badge.textContent = d.label;
    badge.style.color = d.color;
    badge.style.borderColor = d.color;
    badge.style.textShadow = `0 0 10px ${d.color}88`;
  }

  const gameScreen =
    document.getElementById("basicMode") ||
    document.getElementById("basicGame");
  if (gameScreen) gameScreen.classList.add("active");

  // FIX VIDEO BUG — pisah load dari play:
  // .load() boleh dipanggil sebelum countdown (biar buffer duluan),
  // tapi .play() WAJIB dipanggil DI DALAM callback setelah countdown.
  // Kalau .play() dipanggil sebelum countdown: browser autoplay policy
  // akan block-nya karena user gesture sudah expired, akibatnya video
  // tidak jalan atau malah fallback ke src kosong dari stop sebelumnya.
  nomBgVideo = document.getElementById("bmBgVideo");
  if (nomBgVideo) {
    nomBgVideo.pause();
    nomBgVideo.src = track.bg;
    nomBgVideo.load(); // preload aja, belum play
  }

  if (typeof showCountdownThen === "function") {
    showCountdownThen(() => {
      nomRunning = true;

      // Play video di sini — sudah di dalam callback (post-countdown),
      // masih dalam konteks gesture klik "Main Lagi" / start awal.
      if (nomBgVideo) {
        nomBgVideo.play().catch(() => {});
      }

      nomMusicEl = document.getElementById("bmTrackAudio");
      if (!nomMusicEl) {
        nomMusicEl = document.createElement("audio");
        nomMusicEl.id = "bmTrackAudio";
        document.body.appendChild(nomMusicEl);
      }
      nomMusicEl.src = track.src;
      nomMusicEl.volume =
        typeof profile !== "undefined"
          ? ((profile.settings?.masterVolume ?? 100) / 100) * 0.8
          : 0.8;
      nomMusicEl.currentTime = 0;
      nomMusicEl.play().catch(() => {});

      const startTimers = (dur) => {
        nomStartMusicTimer(dur);
        const diff = NOM_DIFF[nomDiffKey];
        nomSpawnWave();
        nomSpawnTimer = setInterval(nomSpawnWave, diff.spawnIntervalMs);
      };

      // track.duration adalah sumber utama durasi timer.
      // Audio metadata hanya dipakai sebagai fallback jika track.duration
      // tidak di-set (0 atau undefined).
      if (track.duration && track.duration > 0) {
        startTimers(track.duration);
      } else if (nomMusicEl.duration && isFinite(nomMusicEl.duration)) {
        startTimers(Math.ceil(nomMusicEl.duration));
      } else {
        nomMusicEl.addEventListener(
          "loadedmetadata",
          () => {
            if (nomTimeLeft === 0) startTimers(Math.ceil(nomMusicEl.duration));
          },
          { once: true },
        );
      }

      nomKeyHandler = nomOnKey;
      document.addEventListener("keydown", nomKeyHandler);

      // Touch integration — global multi-touch, hanya di touch device
      const _isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (_isTouchDevice) {
        nomTouchHandler = nomHandleTouch;
        document.addEventListener("touchstart", nomTouchHandler, { passive: false });
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
        nomMouseHandler = nomOnMouse;
        document.addEventListener("mousedown",   nomMouseHandler);
        document.addEventListener("contextmenu", nomMouseHandler);
      }
    });
  }
}

function nomStopEngine() {
  nomRunning = false;

  // Reset flag countdown agar startNotOriginalEngine() berikutnya
  // bisa jalankan showCountdownThen() — tanpa ini countdown stuck
  // dan callback musik tidak pernah dipanggil.
  if (typeof isCountdownRunning !== "undefined") isCountdownRunning = false;

  if (nomSpawnTimer) {
    clearInterval(nomSpawnTimer);
    nomSpawnTimer = null;
  }
  if (nomMusicTimer) {
    clearInterval(nomMusicTimer);
    nomMusicTimer = null;
  }
  if (nomKeyHandler) {
    document.removeEventListener("keydown", nomKeyHandler);
    nomKeyHandler = null;
  }
  if (nomTouchHandler) {
    document.removeEventListener("touchstart", nomTouchHandler);
    nomTouchHandler = null;
  }
  if (nomMouseHandler) {
    document.removeEventListener("mousedown",   nomMouseHandler);
    document.removeEventListener("contextmenu", nomMouseHandler);
    nomMouseHandler = null;
  }

  // FIX: Stop background video — tanpa ini video NOM masih jalan saat
  // popup muncul, dan saat restart bisa race condition play()/pause()
  // yang memicu AbortError di browser.
  const bgVideo = nomBgVideo || document.getElementById("bmBgVideo");
  if (bgVideo) {
    bgVideo.pause();
    bgVideo.removeAttribute("src");
    bgVideo.load();
  }
  nomBgVideo = null;

  // Stop audio — cover kasus nomMusicEl null tapi bmMusicEl masih jalan
  // (bisa terjadi kalau basic mode pernah start sebelum NOM di session yg sama)
  const audioToStop = nomMusicEl || document.getElementById("bmTrackAudio");
  if (audioToStop) {
    audioToStop.pause();
    audioToStop.currentTime = 0;
    audioToStop.src = "";
    audioToStop.load();
  }
  nomMusicEl = null;

  [...nomActiveNotes].forEach((n) => {
    clearTimeout(n.expireTimer);
    n.el?.remove();
  });
  nomActiveNotes = [];
  if (nomArena) nomArena.innerHTML = "";
}

function nomTriggerQuit() {
  if (typeof showQuitConfirm === "function") showQuitConfirm("notoriginal");
  else nomGameOver();
}

// ============================================================
// O. DYNAMIC RENDERING FOR LOBBY (Hanya jalan di lobby.html)
// ============================================================
function nomRenderTrackList() {
  const wrapper = document.getElementById("songListWrapper");
  if (!wrapper) return;

  wrapper.innerHTML = "";

  NOM_TRACKS.forEach((track, i) => {
    const accent = track.color || "#ff2d78";

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
      <img class="song-album-art" src="${track.art || "assets/picture/logo.png"}" alt="album" onerror="this.style.opacity='0'">
      <div class="song-details">
        <span class="song-title">${track.title}</span>
        <span class="song-artist">${track.artist} // BPM: ${track.bpm} // ${nomFmtTime(track.duration)}</span>
      </div>
      <span class="song-status-tag">SELECT</span>
    `;
    wrapper.appendChild(item);

    const panel = document.createElement("div");
    panel.className = "diff-panel";
    panel.id = "diffPanel-" + i;
    panel.style.display = i === 0 ? "block" : "none";

    const diffBtns = (track.difficulties || [])
      .map((key, di) => {
        const d = NOM_DIFF[key];
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

// CATATAN: listener slideNextBtn / slidePrevBtn TIDAK perlu didaftarkan di sini.
// switchGameMode() di main.js sudah menangani render ulang secara terpusat.

// ============================================================
// N.O.M — RESULT POPUP BUTTONS
// ============================================================
// Dipasang di DOMContentLoaded (bukan IIFE) agar elemen basicPlayAgainBtn
// sudah tersedia di DOM saat listener terpasang.
//
// Strategi intercept:
//   basic-mode.js mendaftarkan listener ke tombol yang sama via DOMContentLoaded.
//   Karena notoriginal-mode.js di-load SETELAH basic-mode.js, listener N.O.M
//   terpasang lebih belakang → dipanggil lebih belakang dalam event bubble.
//   Kita pakai stopImmediatePropagation() + _nomResultActive flag:
//   jika flag aktif (popup dibuka oleh N.O.M), intercept dan blokir listener
//   basic-mode di belakangnya. Jika flag tidak aktif (popup basic), lewati.

// CATATAN: handler basicPlayAgainBtn & basicGoHomeBtn sudah dipindah
// sepenuhnya ke popups.js yang di-load paling terakhir.
// Tidak ada listener tombol result di sini.