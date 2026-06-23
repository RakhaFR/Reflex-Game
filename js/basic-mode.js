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
  {
    id: "pixel_panic",
    title: "PIXEL PANIC PARTY",
    artist: "Chiptune Frenzy",
    bpm: 140,
    src: "assets/music/Pixel_Panic_Party.mp3",
    duration: 60,          // detik — fallback jika audio metadata belum load
    bg: "assets/video/kamia-live2d.mp4",
    art: "assets/picture/logo.png",        // album art thumbnail (opsional)
    difficulties: ["normal", "medium", "hard", "extreme"],
    color: "#00e5ff",      // warna aksen song-item ini saat ke-select
    role: "// OSU STYLE — KEYBOARD REFLEX",
    titleClass: "title-basic",
    desc: "140 BPM chiptune madness. Tekan tombol yang muncul sebelum ring menyusut habis. Timing is everything.",
  },
  // Tambah track baru di sini — pastikan `id` unik & beda dari track lain:
  {
    id: "id_title",                       // ← WAJIB UNIK
    title: "MY SONG TITLE",
    artist: "Artist Name",
    bpm: 160,
    src: "assets/music/Pixel_Panic.mp3",
    duration: 60,
    bg: "assets/video/ocean-live2d.mp4",
    art: "assets/picture/logo.png",
    difficulties: ["normal", "medium", "hard"],
    color: "#ff2d78",      // tiap track boleh punya warna aksen sendiri-sendiri
    role: "// OSU STYLE — KEYBOARD REFLEX",
    titleClass: "title-basic",
    desc: "Ganti deskripsi ini sesuai vibe lagunya.",
  },
];

// ============================================================
// A2. GAME MODES — buat tombol PREV/NEXT di lobby
// ============================================================
// Next/Prev sekarang switch MODE (bukan track lagi). Track switching
// pindah ke Arrow Up/Down keyboard.
// Tambah mode baru di sini, misal "Not Origin Music" atau "Triple Tap
// Rush" — id harus unik. `engine` adalah nama function start untuk
// mode itu (mis. startBasicMode, startTripleTapMode, dst — bikin sendiri
// function-nya nanti kalau mode itu sudah siap).
const BM_GAME_MODES = [
  {
    id: "basic",
    label: "BASIC MODE",
    shortLabel: "BASIC",
    desc: "Mode standar OSU-style: tekan key sebelum ring habis.",
    engine: "startBasicMode",
  },
  // Contoh nambah mode baru:
  // {
  //   id: "not_origin",
  //   label: "NOT ORIGIN MUSIC",
  //   shortLabel: "N.O.M",
  //   desc: "Deskripsi mode di sini.",
  //   engine: "startNotOriginMode",
  // },
  // {
  //   id: "triple_tap",
  //   label: "TRIPLE TAP RUSH",
  //   shortLabel: "3xTAP",
  //   desc: "Deskripsi mode di sini.",
  //   engine: "startTripleTapMode",
  // },
];

let bmGameModeIdx = 0; // index mode aktif saat ini (dipakai PREV/NEXT)

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
  { id: "hit",   color: "#00ff88", ring: "rgba(0,255,136,0.65)",  scoreBase: 100, weight: 5 },
  { id: "avoid", color: "#ff4444", ring: "rgba(255,68,68,0.65)",  scoreBase: 0,   weight: 3 },
  { id: "bonus", color: "#ffe500", ring: "rgba(255,229,0,0.65)",  scoreBase: 300, weight: 2 },
];

function bmPickNoteType() {
  const total = BM_NOTE_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of BM_NOTE_TYPES) { r -= t.weight; if (r <= 0) return t; }
  return BM_NOTE_TYPES[0];
}

// ============================================================
// D. SPAWN ZONES — 12 posisi dalam % (left, top)
// ============================================================
const BM_ZONES = [
  {x:14,y:18},{x:38,y:13},{x:62,y:18},{x:84,y:16},
  {x:10,y:46},{x:33,y:50},{x:57,y:45},{x:80,y:48},
  {x:17,y:73},{x:43,y:76},{x:67,y:72},{x:87,y:70},
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
    return profile.settings.keybinds.slice(0, 4).map(k => k.toLowerCase());
  }
  return BM_DEFAULT_KEYS;
}

// ============================================================
// F. STATE
// ============================================================
let bmScore       = 0;
let bmCombo       = 0;
let bmBestCombo   = 0;
let bmActiveNotes = [];
let bmSpawnTimer  = null;
let bmMusicTimer  = null;   // countdown timer interval (1s tick)
let bmRunning     = false;
let bmDiffKey     = "normal";
let bmTrackIdx    = 0;
let bmKeyHandler  = null;
let bmMusicEl     = null;   // <audio> element untuk track aktif
let bmTimeLeft    = 0;      // detik tersisa

// ============================================================
// G. DOM REFS
// ============================================================
let bmArena, bmScoreEl, bmComboEl, bmComboBox, bmJudgeEl,
    bmTimerEl, bmTrackTitleEl, bmKeyLegendEl;

function bmInitRefs() {
  bmArena        = document.getElementById("bmArena");
  bmScoreEl      = document.getElementById("bmScore");
  bmComboEl      = document.getElementById("bmComboText");
  bmComboBox     = document.getElementById("bmComboContainer");
  bmJudgeEl      = document.getElementById("bmJudgeText");
  bmTimerEl      = document.getElementById("bmMusicTimer");
  bmTrackTitleEl = document.getElementById("bmTrackTitle");
  bmKeyLegendEl  = document.getElementById("bmKeyLegend");
}

// ============================================================
// H. KEY LEGEND (baris chip keyboard di bawah layar)
// ============================================================
function bmRenderKeyLegend() {
  if (!bmKeyLegendEl) return;
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
  const diff   = BM_DIFF[bmDiffKey];
  const keys   = bmGetKeys();
  const usedK  = bmActiveNotes.map(n => n.key);
  const freeK  = keys.filter(k => !usedK.includes(k));
  const zones  = [...BM_ZONES].sort(() => Math.random() - 0.5);

  for (let i = 0; i < diff.noteCount && i < freeK.length; i++) {
    bmSpawnNote(zones[i], bmPickNoteType(), freeK[i], diff);
  }
}

function bmSpawnNote(zone, type, key, diff) {
  if (!bmArena) return;
  const id  = "bm-" + Date.now() + "-" + Math.random().toString(36).slice(2,6);
  const el  = document.createElement("div");
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

  bmArena.appendChild(el);

  const noteData = {
    id, key, type, el,
    spawnedAt: Date.now(),
    windowMs:  diff.windowMs,
    perfectMs: diff.perfectMs,
    goodMs:    diff.goodMs,
    hit: false,
    expireTimer: setTimeout(() => bmExpire(noteData), diff.windowMs),
  };
  bmActiveNotes.push(noteData);
}

function bmExpire(nd) {
  if (nd.hit) return;
  nd.hit = true;
  // Merah expired = avoid berhasil → NICE
  if (nd.type.id === "avoid") bmResult("NICE!", 50, true);
  else                         bmResult("MISS",  0,  false);
  bmRemoveNote(nd);
}

function bmRemoveNote(nd) {
  clearTimeout(nd.expireTimer);
  nd.el.classList.add("bm-note-exit");
  setTimeout(() => nd.el?.remove(), 200);
  bmActiveNotes = bmActiveNotes.filter(n => n.id !== nd.id);
}

// ============================================================
// J. KEY HANDLER
// ============================================================
function bmOnKey(e) {
  if (!bmRunning) return;
  const k = e.key.toLowerCase();
  // ESC = quit
  if (k === "escape") { bmTriggerQuit(); return; }

  const nd = bmActiveNotes.find(n => n.key === k && !n.hit);
  if (!nd) return;
  e.preventDefault();

  nd.hit = true;
  clearTimeout(nd.expireTimer);
  bmFlashKey(k);

  const elapsed   = Date.now() - nd.spawnedAt;
  const remaining = nd.windowMs - elapsed;

  if (nd.type.id === "avoid") {
    bmResult("WRONG!", 0, false);
    bmNoteHitFx(nd.el, "#ff4444");
  } else {
    let judge, pts;
    const base = nd.type.scoreBase;
    if (remaining <= 0) {
      judge = "MISS"; pts = 0;
    } else if (remaining <= nd.perfectMs) {
      judge = "PERFECT!"; pts = Math.round(base * 2 * (1 + bmCombo * 0.05));
    } else if (remaining <= nd.goodMs) {
      judge = "GOOD"; pts = Math.round(base * 1.2 * (1 + bmCombo * 0.03));
    } else if (elapsed / nd.windowMs < 0.2) {
      judge = "EARLY"; pts = Math.round(base * 0.5);
    } else {
      judge = "GOOD"; pts = Math.round(base * (1 + bmCombo * 0.03));
    }
    bmResult(judge, pts, judge !== "MISS", nd.type.id);
    bmNoteHitFx(nd.el, nd.type.color);
  }
  bmRemoveNote(nd);
}

// ============================================================
// K. RESULT + HUD UPDATE (FIXED BONUS TRACKER)
// ============================================================
function bmResult(judge, pts, combo, noteType = null) {
  if (pts > 0) {
    bmScore += pts;
    if (bmScoreEl) bmScoreEl.textContent = bmScore.toLocaleString();
  }
  if (combo) { bmCombo++; if (bmCombo > bmBestCombo) bmBestCombo = bmCombo; }
  else        bmCombo = 0;

  if (bmComboEl) bmComboEl.textContent = "x" + bmCombo;
  if (bmComboBox) {
    bmComboBox.style.opacity = "1";
    void bmComboBox.offsetWidth;
    bmComboBox.classList.toggle("bm-fire", bmCombo >= 10);
    bmComboBox.classList.add("bm-pop");
    setTimeout(() => bmComboBox.classList.remove("bm-pop"), 220);
  }
  if (bmJudgeEl) {
    const cls = "bm-j-" + judge.replace(/[^a-z]/gi,"").toLowerCase();
    bmJudgeEl.className = "bm-judge " + cls;
    bmJudgeEl.textContent = judge;
    void bmJudgeEl.offsetWidth;
    bmJudgeEl.classList.add("bm-j-pop");
  }

  // Ambil ID mode aktif saat ini (misal: "basic" atau "notoriginal")
  const currentModeId = BM_GAME_MODES[bmGameModeIdx]?.id || "basic";

  // 1. Rekam klik biasa/salah ke profile
  if (typeof statRecordClick === "function") statRecordClick(currentModeId);
  if (judge === "WRONG!" && typeof statRecordWrongClick === "function") statRecordWrongClick(currentModeId);
  
  // 2. FIXED: Rekam bonus jika tipe note yang dipukul adalah "bonus" DAN hit-nya berhasil (bukan MISS/WRONG)
  if (pts > 0 && typeof statRecordBonus === "function") {
    if (noteType === "bonus" || judge === "PERFECT!") {
      statRecordBonus();
      // Paksa UI langsung sinkron saat itu juga jika fungsi updater tersedia
      if (typeof triggerLobbyDOMUpdate === "function") triggerLobbyDOMUpdate();
    }
  }
}

function bmNoteHitFx(el, color) {
  el.style.transition = "transform .1s ease, box-shadow .1s";
  el.style.transform  = "translate(-50%,-50%) scale(1.35)";
  el.style.boxShadow  = `0 0 36px ${color}, 0 0 8px #fff inset`;
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
      if (bmTimeLeft <= 10) bmTimerEl.style.textShadow = "0 0 16px rgba(255,68,68,0.8)";
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
// N. START / STOP
// ============================================================
function startBasicMode() {
  // Kalau kita masih di lobby.html → redirect ke game.html dengan params
  if (document.getElementById("lobbyProfileWidget") !== null) {
    // Baca diff dari diff-btn yang active di panel yang sedang tampil
    const activeDiffBtn = document.querySelector(".diff-panel:not([style*='display: none']) .diff-btn.active")
      || document.querySelector(".diff-btn.active");
    const diff  = activeDiffBtn ? activeDiffBtn.getAttribute("data-diff") : (bmDiffKey || "normal");
    const track = bmTrackIdx ?? 0;
    window.location.href = `game.html?mode=basic&diff=${diff}&track=${track}`;
    return;
  }

  // Sudah di game.html — bmDiffKey & bmTrackIdx sudah di-inject oleh router sebelum fungsi ini dipanggil
  // Validasi fallback kalau ternyata kosong
  if (!bmDiffKey || !BM_DIFF[bmDiffKey]) bmDiffKey = "normal";

  bmInitRefs();

  bmScore = 0; bmCombo = 0; bmBestCombo = 0;
  bmActiveNotes = [];
  bmRunning = false;

  if (bmScoreEl) bmScoreEl.textContent = "0";
  if (bmComboEl) bmComboEl.textContent = "x0";
  if (bmComboBox) { bmComboBox.style.opacity = "0"; bmComboBox.className = "bm-combo-box"; }
  if (bmJudgeEl)  { bmJudgeEl.textContent = ""; bmJudgeEl.className = "bm-judge"; }
  if (bmArena)    bmArena.innerHTML = "";

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
  const gameScreen = document.getElementById("basicMode") || document.getElementById("basicGame");
  if (gameScreen) gameScreen.classList.add("active");

  // Set background video
  if (bmBgVideo === null) bmBgVideo = document.getElementById("bmBgVideo");
  if (bmBgVideo) {
    bmBgVideo.src = track.bg;
    bmBgVideo.load();
    bmBgVideo.play().catch(() => {});
  }

  showCountdownThen(() => {
    bmRunning = true;

    // Play musik
    bmMusicEl = document.getElementById("bmTrackAudio");
    if (!bmMusicEl) {
      bmMusicEl = document.createElement("audio");
      bmMusicEl.id = "bmTrackAudio";
      document.body.appendChild(bmMusicEl);
    }
    bmMusicEl.src = track.src;
    bmMusicEl.volume = typeof profile !== "undefined"
      ? (profile.settings?.masterVolume ?? 100) / 100 * 0.8
      : 0.8;
    bmMusicEl.currentTime = 0;
    bmMusicEl.play().catch(() => {});

    const startTimers = (dur) => {
      bmStartMusicTimer(dur);
      const diff = BM_DIFF[bmDiffKey];
      bmSpawnWave();
      bmSpawnTimer = setInterval(bmSpawnWave, diff.spawnIntervalMs);
    };

    if (bmMusicEl.duration && isFinite(bmMusicEl.duration)) {
      startTimers(Math.ceil(bmMusicEl.duration));
    } else {
      bmMusicEl.addEventListener("loadedmetadata", () => {
        startTimers(Math.ceil(bmMusicEl.duration));
      }, { once: true });
      setTimeout(() => {
        if (bmTimeLeft === 0) startTimers(track.duration);
      }, 1000);
    }

    bmKeyHandler = bmOnKey;
    document.addEventListener("keydown", bmKeyHandler);
  });
}

function bmStopEngine() {
  bmRunning = false;
  if (bmSpawnTimer) { clearInterval(bmSpawnTimer); bmSpawnTimer = null; }
  if (bmMusicTimer) { clearInterval(bmMusicTimer); bmMusicTimer = null; }
  if (bmKeyHandler) { document.removeEventListener("keydown", bmKeyHandler); bmKeyHandler = null; }
  if (bmMusicEl)    { bmMusicEl.pause(); bmMusicEl.currentTime = 0; }

  [...bmActiveNotes].forEach(n => { clearTimeout(n.expireTimer); n.el?.remove(); });
  bmActiveNotes = [];
  if (bmArena) bmArena.innerHTML = "";
}

function exitBasicMode() {
  bmStopEngine();
  window.location.href = "lobby.html";
}

// ============================================================
// O. QUIT CONFIRM INTEGRATION
// ============================================================
function bmTriggerQuit() {
  if (typeof showQuitConfirm === "function") showQuitConfirm("basic");
  else bmGameOver();
}

// Shims untuk popups.js (yang masih panggil nama lama)
function clearAllTimers()  { bmStopEngine(); }
function hideAllButtons()  {}
function stopCountdown()   {}

Object.defineProperty(window, "score", {
  get()  { return bmScore; },
  set(v) { bmScore = v; },
  configurable: true,
});
Object.defineProperty(window, "basicBestCombo", {
  get()  { return bmBestCombo; },
  set(v) { bmBestCombo = v; },
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
    item.dataset.index    = i;
    item.dataset.video    = track.bg;
    item.dataset.trackIdx = i;
    item.dataset.preview  = track.src;
    item.style.setProperty("--song-accent", accent);
    item.innerHTML = `
      <span class="song-index">${String(i + 1).padStart(2, "0")}</span>
      <img class="song-album-art" src="${track.art || "assets/picture/logo.png"}" alt="album" onerror="this.style.opacity='0'">
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
        return `<button class="diff-btn${di === 0 ? " active" : ""}" data-diff="${key}">` +
          `<span class="diff-dot" style="background:${d.color}"></span>${d.label}</button>`;
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
  bmRenderTrackList(); // harus jalan duluan, sebelum main.js baca .song-item

  document.getElementById("exitBasicBtn")?.addEventListener("click", () => {
    if (typeof playSound === "function") playSound();
    bmTriggerQuit();
  });

  document.getElementById("basicPlayAgainBtn")?.addEventListener("click", () => {
    if (typeof playSound === "function") playSound();
    document.getElementById("basicResultPopup")?.classList.remove("active");
    bmBestCombo = 0;
    startBasicMode();
  });

  document.getElementById("basicGoHomeBtn")?.addEventListener("click", () => {
    if (typeof playSound === "function") playSound();
    document.getElementById("basicResultPopup")?.classList.remove("active");
    window.location.href = "lobby.html";
  });
});