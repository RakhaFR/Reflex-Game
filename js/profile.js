// ============================================================
// PROFILE SYSTEM — localStorage-based & main.js Lifecycle Core
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

// Helper bawaan fungsi toggle status tombol (dipanggil oleh main.js)
function syncToggleState(id, state) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.textContent = state ? "ON" : "OFF";
  btn.className = `toggle-blueprint-btn ${state ? 'on' : 'off'}`;
}

function statRecordBonus() {
  profile.stats.totalBonusTriggered++;
  profileSave(profile);
}

// Pemanggil trigger update layar aman (menghubungkan ke main.js)
function triggerLobbyDOMUpdate() {
  if (typeof syncLobbyProfileDOM === "function") {
    syncLobbyProfileDOM();
  }
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

// ============================================================
// LOBBY INTERACTIVITY EVENT CONTROLLERS
// ============================================================
function initLobbyProfileEvents() {
  const modal = document.getElementById("lobbyProfileModal");
  const openWidget = document.getElementById("lobbyProfileWidget");
  const openSettings = document.getElementById("widgetSettingsBtn");
  const closeBtn = document.getElementById("closeProfileModal");

  // Handler Buka Modal
  const openModalAction = () => {
    triggerLobbyDOMUpdate();
    renderKeybindEditor();
    modal.classList.add("active");
  };

  if (openWidget) openWidget.addEventListener("click", (e) => {
    if (e.target.closest("#widgetSettingsBtn")) return; // skip jika mengklik ikon gear
    openModalAction();
  });
  if (openSettings) openSettings.addEventListener("click", openModalAction);

  // Handler Tutup Modal
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  // Engine Pengubah Tab Internal Modal
  document.querySelectorAll(".modal-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".modal-tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const targetTab = document.getElementById(btn.dataset.tab);
      if (targetTab) targetTab.classList.add("active");
      
      // Jika tab settings diaktifkan, paksa main.js merender ulang editor binding key
      triggerLobbyDOMUpdate();
    });
  });

  // Event Klik Save Username
  const saveUserBtn = document.getElementById("saveUsernameBtn");
  if (saveUserBtn) {
    saveUserBtn.addEventListener("click", () => {
      const input = document.getElementById("modalUsernameInput");
      if (!input) return;
      const val = input.value.trim();
      if (val.length < 3 || val.length > 14) {
        alert("⚠️ Username harus berkisar antara 3–14 karakter!");
        return;
      }
      profile.identity.username = val;
      profileSave(profile);
      triggerLobbyDOMUpdate();
    });
  }

  // Event Engine Unggah File Avatar Custom (Base64)
  const changeAvBtn = document.getElementById("changeAvatarBtn");
  const avInput = document.getElementById("avatarFileInput");
  if (changeAvBtn && avInput) {
    changeAvBtn.addEventListener("click", () => avInput.click());
    avInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("❌ Ukuran file maksimal adalah 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        profile.identity.avatar = ev.target.result;
        profileSave(profile);
        triggerLobbyDOMUpdate();
      };
      reader.readAsDataURL(file);
    });
  }

  // Event Hard Reset Data Operator
  const resetBtn = document.getElementById("resetProfileDataBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!confirm("🚨 SYSTEM WARNING: Reset seluruh profile dan config data? Tindakan ini bersifat permanen.")) return;
      profile = JSON.parse(JSON.stringify(PROFILE_DEFAULT));
      profileSave(profile);
      triggerLobbyDOMUpdate();
      renderKeybindEditor();
      applySoundSettings();
    });
  }

  // Kontrol Slider Real-time Volume suara
  const volSlider = document.getElementById("masterVolumeSlider");
  if (volSlider) {
    volSlider.addEventListener("input", () => {
      profile.settings.masterVolume = parseInt(volSlider.value);
      profileSave(profile);
      triggerLobbyDOMUpdate();
      applySoundSettings();
    });
  }

  // Kontrol Switch Toggle ON/OFF Audio & Visual Feedback
  const bindToggleEvent = (btnId, settingKey) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener("click", () => {
      profile.settings[settingKey] = !profile.settings[settingKey];
      profileSave(profile);
      triggerLobbyDOMUpdate();
      applySoundSettings();
    });
  };

  bindToggleEvent("sfxToggleBtn", "sfxEnabled");
  bindToggleEvent("cdSoundToggleBtn", "countdownSoundEnabled");
  bindToggleEvent("flashToggleBtn", "screenFlashEnabled");
  bindToggleEvent("particleToggleBtn", "particleEffectEnabled");
  bindToggleEvent("comboAnimToggleBtn", "comboAnimationEnabled");
}

// ---- Keybind Capture Editor Engine (Sinkron dengan Ekspektasi main.js) ----
function renderKeybindEditor() {
  const row = document.getElementById("keybindEditorRow");
  if (!row) return;
  const binds = profile.settings.keybinds;
  
  row.innerHTML = binds.map((key, index) => `
    <div class="keybind-slot" data-index="${index}">
      <span class="slot-idx">KEY ${index + 1}</span>
      <button class="keybind-capture-btn">${key.toUpperCase()}</button>
    </div>
  `).join("");

  row.querySelectorAll(".keybind-capture-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const slot = e.target.closest(".keybind-slot");
      const idx = parseInt(slot.dataset.index);
      
      btn.textContent = "???";
      btn.classList.add("listening");

      const captureKey = (event) => {
        event.preventDefault();
        const newKey = event.key.toLowerCase();
        
        if (newKey === " ") {
          profile.settings.keybinds[idx] = "space";
        } else if (newKey.length === 1) {
          profile.settings.keybinds[idx] = newKey;
        } else {
          profile.settings.keybinds[idx] = newKey;
        }
        
        profileSave(profile);
        window.removeEventListener("keydown", captureKey);
        renderKeybindEditor();
      };

      window.addEventListener("keydown", captureKey);
    });
  });

  const resetKbBtn = document.getElementById("keybindResetBtn");
  if (resetKbBtn) {
    resetKbBtn.onclick = () => {
      profile.settings.keybinds = ["q", "w", "e", "r"];
      profileSave(profile);
      renderKeybindEditor();
    };
  }
}

// ---- Init on load ----
window.addEventListener("DOMContentLoaded", () => {
  applySoundSettings();
  triggerLobbyDOMUpdate();
  initLobbyProfileEvents();
});