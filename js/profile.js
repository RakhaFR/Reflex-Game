// ============================================================
// PROFILE SYSTEM — localStorage-based
// ============================================================

// ---- Default Data Structure ----
const PROFILE_DEFAULT = {
  identity: {
    username: "Player",
    avatar: "default", // "default" | "custom_base64"
  },
  stats: {
    totalGamesPlayed: 0,
    totalClicks: 0,
    totalWrongClicks: 0,
    totalBonusTriggered: 0,
    totalFreezeUsed: 0,
    lifetimeScore: 0,

    basic:  { clicks: 0, wrongClicks: 0, gamesPlayed: 0 },
    
    // AKTIF: Slot record data untuk Not Original Mode
    notoriginal: { clicks: 0, wrongClicks: 0, gamesPlayed: 0 },

    records: {
      highestBasicScore: 0,
      
      // AKTIF: Slot best record untuk Not Original Mode
      highestNotOriginalScore: 0,
      
      longestCombo: 0,
      // fastestReactionTime stored in ms, 0 = not recorded yet
      fastestReactionTime: 0,
    }
  },
  settings: {
    masterVolume: 100,
    sfxEnabled: true,
    countdownSoundEnabled: true,
    screenFlashEnabled: true,
    particleEffectEnabled: true,
    comboAnimationEnabled: true,
    keybinds: ["q", "w", "e", "r"],
  }
};

// ---- Load / Save ----
function profileLoad() {
  try {
    const raw = localStorage.getItem("rhg_profile");
    if (!raw) return JSON.parse(JSON.stringify(PROFILE_DEFAULT));
    const parsed = JSON.parse(raw);
    // Deep merge to ensure new keys exist
    return deepMerge(JSON.parse(JSON.stringify(PROFILE_DEFAULT)), parsed);
  } catch (e) {
    return JSON.parse(JSON.stringify(PROFILE_DEFAULT));
  }
}

// Global profile object — always in sync with localStorage
let profile = profileLoad();

function profileSave(data) {
  try {
    localStorage.setItem("rhg_profile", JSON.stringify(data));
  } catch (e) { console.warn("Profile save failed", e); }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}; deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// ---- Settings Helpers ----
function getSettings() { return profile.settings; }

function applySoundSettings() {
  const s = getSettings();
  const vol = s.masterVolume / 100;
  ["clickSound","soundGreen","soundRed","soundBonus","soundFreeze","countdownSound","menuClickSfx","lobbyClickSfx"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.volume = vol;
    if (id === "countdownSound") el.muted = !s.countdownSoundEnabled;
    else if (id !== "clickSound" && id !== "menuClickSfx" && id !== "lobbyClickSfx") el.muted = !s.sfxEnabled;
  });
}

// ---- Stat Helpers (called from game files) ----
function statRecordClick(mode) {
  profile.stats.totalClicks++;
  if (mode === "basic") {
    profile.stats.basic.clicks++;
  } else if (mode === "notoriginal" && profile.stats.notoriginal) {
    profile.stats.notoriginal.clicks++;
  }
  profileSave(profile);
}

function statRecordWrongClick(mode) {
  profile.stats.totalWrongClicks++;
  if (mode === "basic") {
    profile.stats.basic.wrongClicks++;
  } else if (mode === "notoriginal" && profile.stats.notoriginal) {
    profile.stats.notoriginal.wrongClicks++;
  }
  profileSave(profile);
}

function statRecordBonus() {
  profile.stats.totalBonusTriggered++;
  profileSave(profile);
}

function statRecordFreeze() {
  profile.stats.totalFreezeUsed++;
  profileSave(profile);
}

function statRecordGameEnd(mode, finalScore, maxCombo) {
  profile.stats.totalGamesPlayed++;
  profile.stats.lifetimeScore += finalScore;

  const r = profile.stats.records;
  if (mode === "basic") {
    profile.stats.basic.gamesPlayed++;
    if (finalScore > r.highestBasicScore) r.highestBasicScore = finalScore;
  } else if (mode === "notoriginal") {
    if (profile.stats.notoriginal) profile.stats.notoriginal.gamesPlayed++;
    if (r.highestNotOriginalScore !== undefined && finalScore > r.highestNotOriginalScore) {
      r.highestNotOriginalScore = finalScore;
    }
  }

  if (maxCombo > r.longestCombo) r.longestCombo = maxCombo;
  profileSave(profile);
}

function statRecordReaction(ms) {
  const r = profile.stats.records;
  if (r.fastestReactionTime === 0 || ms < r.fastestReactionTime) {
    r.fastestReactionTime = ms;
    profileSave(profile);
  }
}

// ---- Accuracy helper ----
function calcAccuracy(clicks, wrongClicks) {
  if (clicks === 0) return "N/A";
  const correct = clicks - wrongClicks;
  return Math.round((correct / clicks) * 100) + "%";
}

// ---- Get avatar display (Murni Path Gambar / Base64) ----
function getAvatarDisplay(avatar) {
  if (avatar === "default" || !avatar) return "assets/picture/logo.png";
  return avatar;
}

// ---- Init on load ----
window.addEventListener("DOMContentLoaded", () => {
  applySoundSettings();
});