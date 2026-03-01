// ============================================================
// PROFILE SYSTEM — localStorage-based
// ============================================================

// ---- Default Data Structure ----
const PROFILE_DEFAULT = {
  identity: {
    username: "Player",
    avatar: "default", // "default" | "preset_X" | "custom_base64"
  },
  stats: {
    totalGamesPlayed: 0,
    totalClicks: 0,
    totalWrongClicks: 0,
    totalBonusTriggered: 0,
    totalFreezeUsed: 0,
    lifetimeScore: 0,

    basic:  { clicks: 0, wrongClicks: 0, gamesPlayed: 0 },
    timeAttack: { clicks: 0, wrongClicks: 0, gamesPlayed: 0 },
    versus: { clicks: 0, wrongClicks: 0, gamesPlayed: 0 },

    records: {
      highestBasicScore: 0,
      highestTimeAttackScore: 0,
      highestVersusScore: 0,
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
  }
};

// ---- Preset Avatars (emoji-based, no external assets needed) ----
const PRESET_AVATARS = [
  { id: "preset_0",  emoji: "🎮", label: "Gamer" },
  { id: "preset_1",  emoji: "🔥", label: "Fire" },
  { id: "preset_2",  emoji: "⚡", label: "Lightning" },
  { id: "preset_3",  emoji: "🌟", label: "Star" },
  { id: "preset_4",  emoji: "🦊", label: "Fox" },
  { id: "preset_5",  emoji: "🐉", label: "Dragon" },
  { id: "preset_6",  emoji: "🤖", label: "Robot" },
  { id: "preset_7",  emoji: "💀", label: "Skull" },
  { id: "preset_8",  emoji: "🦁", label: "Lion" },
  { id: "preset_9",  emoji: "🐺", label: "Wolf" },
  { id: "preset_10", emoji: "🦋", label: "Butterfly" },
  { id: "preset_11", emoji: "🎯", label: "Target" },
];

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

function profileSave(data) {
  try {
    localStorage.setItem("rhg_profile", JSON.stringify(data));
  } catch (e) { console.warn("Profile save failed", e); }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Global profile object — always in sync with localStorage
let profile = profileLoad();

// ---- Settings Helpers ----
function getSettings() { return profile.settings; }

function applySoundSettings() {
  const s = getSettings();
  const vol = s.masterVolume / 100;
  ["clickSound","soundGreen","soundRed","soundBonus","soundFreeze","countdownSound"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.volume = vol;
    if (id === "countdownSound") el.muted = !s.countdownSoundEnabled;
    else if (id !== "clickSound") el.muted = !s.sfxEnabled;
  });
}

// ---- Stat Helpers (called from game files) ----
function statRecordClick(mode) {
  profile.stats.totalClicks++;
  if (mode === "basic")      profile.stats.basic.clicks++;
  else if (mode === "ta")    profile.stats.timeAttack.clicks++;
  else if (mode === "vs")    profile.stats.versus.clicks++;
  profileSave(profile);
}

function statRecordWrongClick(mode) {
  profile.stats.totalWrongClicks++;
  if (mode === "basic")      profile.stats.basic.wrongClicks++;
  else if (mode === "ta")    profile.stats.timeAttack.wrongClicks++;
  else if (mode === "vs")    profile.stats.versus.wrongClicks++;
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
  } else if (mode === "ta") {
    profile.stats.timeAttack.gamesPlayed++;
    if (finalScore > r.highestTimeAttackScore) r.highestTimeAttackScore = finalScore;
  } else if (mode === "vs") {
    profile.stats.versus.gamesPlayed++;
    if (finalScore > r.highestVersusScore) r.highestVersusScore = finalScore;
  }

  if (maxCombo > r.longestCombo) r.longestCombo = maxCombo;
  profileSave(profile);
}

// Reaction time: call with ms between button appear and click
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

// ---- Get avatar display ----
function getAvatarDisplay(avatar) {
  if (avatar === "default") return "🎮";
  if (avatar.startsWith("preset_")) {
    const idx = parseInt(avatar.split("_")[1]);
    return PRESET_AVATARS[idx]?.emoji || "🎮";
  }
  // custom base64 — return as img src
  return avatar; // will be treated as image src
}

// ---- Profile Screen ----
function openProfile() {
  playSound();
  renderProfileScreen();
  document.getElementById("profileScreen").classList.add("active");
  document.getElementById("lobby").classList.remove("active");
}

function closeProfile() {
  document.getElementById("profileScreen").classList.remove("active");
  document.getElementById("lobby").classList.add("active");
  // Update lobby profile button
  updateProfileBtn();
}

function updateProfileBtn() {
  const btn = document.getElementById("profileBtn");
  if (!btn) return;
  const av = getAvatarDisplay(profile.identity.avatar);
  const isEmoji = !av.startsWith("data:");
  btn.innerHTML = isEmoji
    ? `<span class="prof-btn-avatar">${av}</span> <span class="prof-btn-name">${profile.identity.username}</span>`
    : `<img src="${av}" class="prof-btn-img" /> <span class="prof-btn-name">${profile.identity.username}</span>`;
}

// ============================================================
// RENDER PROFILE SCREEN
// ============================================================
function renderProfileScreen() {
  const screen = document.getElementById("profileScreen");
  const s = profile.stats;
  const r = s.records;
  const sets = profile.settings;
  const av = getAvatarDisplay(profile.identity.avatar);
  const isCustomImg = av.startsWith("data:");

  const overallAcc = calcAccuracy(s.totalClicks, s.totalWrongClicks);
  const basicAcc   = calcAccuracy(s.basic.clicks, s.basic.wrongClicks);
  const taAcc      = calcAccuracy(s.timeAttack.clicks, s.timeAttack.wrongClicks);
  const vsAcc      = calcAccuracy(s.versus.clicks, s.versus.wrongClicks);
  const reactionDisplay = r.fastestReactionTime > 0
    ? r.fastestReactionTime + " ms"
    : "—";

  screen.innerHTML = `
    <div class="profile-wrapper">

      <!-- HEADER -->
      <div class="profile-header">
        <h1>👤 PROFILE</h1>
        <button class="btn back-btn shiny-button" id="profileCloseBtn" style="width:200px;margin:0;">← Kembali</button>
      </div>

      <!-- TABS -->
      <div class="profile-tabs">
        <button class="ptab active" data-tab="identity">🪪 Identity</button>
        <button class="ptab" data-tab="stats">📊 Statistics</button>
        <button class="ptab" data-tab="settings">⚙️ Settings</button>
      </div>

      <!-- TAB: IDENTITY -->
      <div class="profile-tab-content active" id="ptab-identity">
        <div class="identity-card">

          <!-- AVATAR -->
          <div class="avatar-section">
            <div class="avatar-display" id="avatarDisplay">
              ${isCustomImg
                ? `<img src="${av}" class="avatar-custom-img" />`
                : `<span class="avatar-emoji">${av}</span>`}
            </div>
            <div class="avatar-actions">
              <button class="pact-btn" id="avatarPresetBtn">🖼️ Preset Avatar</button>
              <label class="pact-btn upload-label" for="avatarUpload">📁 Upload Foto</label>
              <input type="file" id="avatarUpload" accept="image/*" style="display:none" />
              ${isCustomImg ? `<button class="pact-btn pact-danger" id="avatarResetBtn">🔄 Reset Default</button>` : ""}
            </div>
          </div>

          <!-- PRESET GRID -->
          <div class="avatar-preset-grid" id="avatarPresetGrid" style="display:none">
            ${PRESET_AVATARS.map(a => `
              <button class="preset-av-btn ${profile.identity.avatar === a.id ? 'selected' : ''}"
                data-avid="${a.id}" title="${a.label}">
                ${a.emoji}
              </button>
            `).join("")}
          </div>

          <!-- USERNAME -->
          <div class="username-section">
            <label class="pfield-label">Username</label>
            <div class="username-row">
              <input type="text" id="usernameInput" class="pfield-input"
                value="${profile.identity.username}"
                maxlength="12" placeholder="3-12 karakter" />
              <button class="pact-btn pact-save" id="usernameSaveBtn">💾 Simpan</button>
            </div>
            <div class="username-hint" id="usernameHint">3–12 karakter, huruf/angka/spasi</div>
          </div>

        </div>
      </div>

      <!-- TAB: STATISTICS -->
      <div class="profile-tab-content" id="ptab-stats">
        <div class="stats-grid">

          <div class="stats-card">
            <div class="stats-card-title">📊 Global Stats</div>
            <div class="stats-row"><span>Total Games</span><span class="stats-val">${s.totalGamesPlayed}</span></div>
            <div class="stats-row"><span>Total Clicks</span><span class="stats-val">${s.totalClicks}</span></div>
            <div class="stats-row"><span>Wrong Clicks</span><span class="stats-val">${s.totalWrongClicks}</span></div>
            <div class="stats-row"><span>Bonus Triggered</span><span class="stats-val">${s.totalBonusTriggered}</span></div>
            <div class="stats-row"><span>Freeze Used</span><span class="stats-val">${s.totalFreezeUsed}</span></div>
            <div class="stats-row highlight"><span>Lifetime Score</span><span class="stats-val">${s.lifetimeScore.toLocaleString()}</span></div>
          </div>

          <div class="stats-card">
            <div class="stats-card-title">🎯 Accuracy</div>
            <div class="stats-row"><span>Overall</span><span class="stats-val acc">${overallAcc}</span></div>
            <div class="stats-row"><span>Basic Mode</span><span class="stats-val acc">${basicAcc}</span></div>
            <div class="stats-row"><span>Time Attack</span><span class="stats-val acc">${taAcc}</span></div>
            <div class="stats-row"><span>Versus</span><span class="stats-val acc">${vsAcc}</span></div>
          </div>

          <div class="stats-card">
            <div class="stats-card-title">🏆 Best Records</div>
            <div class="stats-row"><span>Best Basic</span><span class="stats-val gold">${r.highestBasicScore}</span></div>
            <div class="stats-row"><span>Best Time Attack</span><span class="stats-val gold">${r.highestTimeAttackScore}</span></div>
            <div class="stats-row"><span>Best Versus</span><span class="stats-val gold">${r.highestVersusScore}</span></div>
            <div class="stats-row"><span>Longest Combo</span><span class="stats-val gold">x${r.longestCombo}</span></div>
            <div class="stats-row"><span>Fastest Reaction</span><span class="stats-val gold">${reactionDisplay}</span></div>
          </div>

        </div>
        <div style="text-align:center;margin-top:16px;">
          <button class="pact-btn pact-danger" id="resetStatsBtn">🗑️ Reset Semua Statistik</button>
        </div>
      </div>

      <!-- TAB: SETTINGS -->
      <div class="profile-tab-content" id="ptab-settings">
        <div class="settings-grid">

          <div class="settings-card">
            <div class="stats-card-title">🎵 Audio</div>

            <div class="setting-row">
              <label>Master Volume</label>
              <div class="vol-row">
                <input type="range" id="volSlider" min="0" max="100"
                  value="${sets.masterVolume}" class="vol-slider" />
                <span id="volLabel" class="vol-label">${sets.masterVolume}%</span>
              </div>
            </div>

            <div class="setting-row">
              <label>Sound Effects</label>
              <button class="toggle-btn ${sets.sfxEnabled ? 'on' : 'off'}" id="sfxToggle">
                ${sets.sfxEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div class="setting-row">
              <label>Countdown Sound</label>
              <button class="toggle-btn ${sets.countdownSoundEnabled ? 'on' : 'off'}" id="cdSoundToggle">
                ${sets.countdownSoundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div class="settings-card">
            <div class="stats-card-title">🔔 Visual Effects</div>

            <div class="setting-row">
              <label>Screen Flash</label>
              <button class="toggle-btn ${sets.screenFlashEnabled ? 'on' : 'off'}" id="flashToggle">
                ${sets.screenFlashEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div class="setting-row">
              <label>Particle Effects</label>
              <button class="toggle-btn ${sets.particleEffectEnabled ? 'on' : 'off'}" id="particleToggle">
                ${sets.particleEffectEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div class="setting-row">
              <label>Combo Animation</label>
              <button class="toggle-btn ${sets.comboAnimationEnabled ? 'on' : 'off'}" id="comboAnimToggle">
                ${sets.comboAnimationEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;

  // Bind all events
  bindProfileEvents();
  applySoundSettings();
}

// ============================================================
// BIND EVENTS
// ============================================================
function bindProfileEvents() {
  // Close
  document.getElementById("profileCloseBtn").addEventListener("click", closeProfile);

  // Tabs
  document.querySelectorAll(".ptab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ptab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".profile-tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("ptab-" + btn.dataset.tab).classList.add("active");
    });
  });

  // Avatar preset toggle
  document.getElementById("avatarPresetBtn").addEventListener("click", () => {
    const grid = document.getElementById("avatarPresetGrid");
    grid.style.display = grid.style.display === "none" ? "grid" : "none";
  });

  // Preset avatar selection
  document.querySelectorAll(".preset-av-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      profile.identity.avatar = btn.dataset.avid;
      profileSave(profile);
      renderProfileScreen();
    });
  });

  // Upload custom avatar
  document.getElementById("avatarUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showProfileToast("❌ Ukuran file maksimal 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      profile.identity.avatar = ev.target.result;
      profileSave(profile);
      renderProfileScreen();
    };
    reader.readAsDataURL(file);
  });

  // Reset avatar
  const resetAvBtn = document.getElementById("avatarResetBtn");
  if (resetAvBtn) {
    resetAvBtn.addEventListener("click", () => {
      profile.identity.avatar = "default";
      profileSave(profile);
      renderProfileScreen();
    });
  }

  // Username save
  document.getElementById("usernameSaveBtn").addEventListener("click", () => {
    const val = document.getElementById("usernameInput").value.trim();
    const hint = document.getElementById("usernameHint");
    if (val.length < 3 || val.length > 12) {
      hint.textContent = "⚠️ Username harus 3–12 karakter!";
      hint.style.color = "#ff6666";
      return;
    }
    if (!/^[a-zA-Z0-9 _\-]+$/.test(val)) {
      hint.textContent = "⚠️ Hanya huruf, angka, spasi, _ atau -";
      hint.style.color = "#ff6666";
      return;
    }
    profile.identity.username = val;
    profileSave(profile);
    hint.textContent = "✅ Username berhasil disimpan!";
    hint.style.color = "#00ff88";
    updateProfileBtn();
    setTimeout(() => { hint.textContent = "3–12 karakter, huruf/angka/spasi"; hint.style.color = ""; }, 2500);
  });

  // Reset stats
  document.getElementById("resetStatsBtn").addEventListener("click", () => {
    if (!confirm("Yakin ingin reset semua statistik? Data tidak bisa dikembalikan.")) return;
    profile.stats = JSON.parse(JSON.stringify(PROFILE_DEFAULT.stats));
    profileSave(profile);
    renderProfileScreen();
    showProfileToast("🗑️ Statistik berhasil direset", "info");
  });

  // Volume slider
  const volSlider = document.getElementById("volSlider");
  volSlider.addEventListener("input", () => {
    const val = parseInt(volSlider.value);
    document.getElementById("volLabel").textContent = val + "%";
    profile.settings.masterVolume = val;
    profileSave(profile);
    applySoundSettings();
  });

  // Toggle buttons
  function bindToggle(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      profile.settings[key] = !profile.settings[key];
      profileSave(profile);
      btn.textContent = profile.settings[key] ? "ON" : "OFF";
      btn.className = "toggle-btn " + (profile.settings[key] ? "on" : "off");
      if (key === "sfxEnabled" || key === "masterVolume" || key === "countdownSoundEnabled") {
        applySoundSettings();
      }
    });
  }

  bindToggle("sfxToggle",       "sfxEnabled");
  bindToggle("cdSoundToggle",   "countdownSoundEnabled");
  bindToggle("flashToggle",     "screenFlashEnabled");
  bindToggle("particleToggle",  "particleEffectEnabled");
  bindToggle("comboAnimToggle", "comboAnimationEnabled");
}

// ---- Toast notification inside profile ----
function showProfileToast(msg, type) {
  let toast = document.getElementById("profileToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "profileToast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = "profile-toast " + (type || "info");
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// ---- Init on load ----
window.addEventListener("DOMContentLoaded", () => {
  updateProfileBtn();
  applySoundSettings();
});