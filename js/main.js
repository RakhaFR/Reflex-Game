/* ==========================================================================
   REFLEXHANDS GAMES — GLOBAL CORE ENGINE & INITIALIZATION (ANTI-BENTROK)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1. LOADING SCREEN TRACKER AUTO-RUN (Jika Elemennya Ada)
  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    initLoadingScreen();
  }

  // 2. DETEKSI & INISIALISASI FITUR HALAMAN INDEX.HTML
  // Kita cek keberadaan tombol utama index untuk mengaktifkan logikanya
  if (
    document.getElementById("btnMainPlay") ||
    document.getElementById("btnMainOtherGames")
  ) {
    initIndexPageLogic();
  }

  // 3. DETEKSI & INISIALISASI FITUR HALAMAN LOBBY.HTML
  // Kita cek keberadaan slider lobby untuk mengaktifkan logikanya
  if (
    document.querySelector(".song-item") ||
    document.getElementById("mainPlayActionBtn")
  ) {
    initLobbyPageLogic();
  }
});

/* ==========================================================================
   A. CORE ENGINE: LOADING SCREEN TRACKER
   ========================================================================== */
function initLoadingScreen() {
  const screen = document.getElementById("loadingScreen");
  const barFill = document.querySelector("#loadingScreen .bar-fill");
  const pctEl = document.querySelector("#loadingScreen .pct");
  const subtitleEl = document.getElementById("loadingSubtitle");

  const imageUrls = [
    "assets/picture/background.jpg",
    "assets/picture/logo.png",
  ];
  // Menggunakan audio ID sesuai yang di-track sistem utama
  const audioIds = [
    "clickSound",
    "countdownSound",
    "menuClickSfx",
    "lobbyClickSfx",
  ];

  let loaded = 0;
  const total = imageUrls.length + audioIds.length;

  function finish() {
    if (subtitleEl) subtitleEl.textContent = "Siap! 🎮";
    if (barFill) barFill.style.width = "100%";
    if (pctEl) pctEl.textContent = "100%";

    setTimeout(() => {
      screen.classList.add("loading-fade-out");
      setTimeout(() => {
        screen.style.display = "none";
      }, 600);
    }, 400);
  }

  function tick(msg) {
    loaded++;
    if (subtitleEl && msg) subtitleEl.textContent = msg;

    const percent = Math.floor((loaded / total) * 100);
    if (barFill) barFill.style.width = percent + "%";
    if (pctEl) pctEl.textContent = percent + "%";

    if (loaded >= total) finish();
  }

  if (total === 0) {
    finish();
    return;
  }

  imageUrls.forEach((url) => {
    const img = new Image();
    img.onload = () => tick("Gambar dimuat…");
    img.onerror = () => tick("Gambar dimuat…");
    img.src = url;
  });

  audioIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) {
      tick();
      return;
    }
    if (el.readyState >= 4) {
      tick("Audio dimuat…");
      return;
    }
    el.addEventListener("canplaythrough", () => tick("Audio dimuat…"), {
      once: true,
    });
    el.addEventListener("error", () => tick("Audio dimuat…"), { once: true });
  });
}

/* ==========================================================================
   B. CORE ENGINE: INDEX.HTML INTERACTION INTERCEPTOR
   ========================================================================== */
// ============================================================
// OTHER GAMES — data buat modal PS5-style di index.html
// ============================================================
// Mau nambah/ubah game? cukup edit array ini, card-nya di-render
// otomatis sama renderOgGames() — gak perlu sentuh index.html.
const OG_GAMES = [
  {
    title: "Plenger RnG",
    desc: "Koleksi semua foto yang ada di game dan pamerkan ke teman mu!",
    tag: "CASUAL • SIMULATION",
    img: "assets/picture/OG-GAMES/plengerRNG.jpg",
    url: "https://rakhafr.github.io/PlengerRnG/",
  },
  {
    title: "Geotrade",
    desc: "Buat perusahaan mu dan tingkatkan jaringan antar kota, jangan sampai pasokan habis!",
    tag: "CASUAL • SANDBOX",
    img: "assets/picture/OG-GAMES/geoTrade.png",
    url: "#",
    comingSoon: true,
  },
];

// ============================================================
// BACKGROUND MUSIC — helper autoplay (dipakai index.html & lobby.html)
// ============================================================
// Browser modern nge-block autoplay-with-sound sebelum user pernah
// interaksi sama halaman. Kita coba play duluan, kalau keblokir,
// nunggu interaksi pertama (klik/keydown/touch) buat nyoba lagi.
function setupBgMusicAutoplay(el, volume = 0.5) {
  if (!el) return;
  el.volume = volume;
  const tryPlay = () => el.play().catch(() => {});
  tryPlay();
  const resumeOnce = () => {
    tryPlay();
    ["click", "keydown", "touchstart"].forEach((ev) =>
      document.removeEventListener(ev, resumeOnce),
    );
  };
  ["click", "keydown", "touchstart"].forEach((ev) =>
    document.addEventListener(ev, resumeOnce, { once: true }),
  );
}

function initIndexPageLogic() {
  const modal = document.getElementById("modalOtherGames");
  const btnOpen = document.getElementById("btnMainOtherGames");
  const btnClose = document.getElementById("btnCloseModal");

  // Ambil sfx khusus index, jika tidak ada fallback ke clickSound bawaan utils
  const sfx =
    document.getElementById("menuClickSfx") ||
    document.getElementById("clickSound");

  // Nama fungsi diubah agar tidak menabrak playSound() milik utils.js
  function triggerMenuClickSound() {
    if (sfx) {
      sfx.pause();
      sfx.currentTime = 0;
      sfx.play().catch(() => {});
    } else if (typeof playSound === "function") {
      // Jika elemen sfx spesifik tidak ketemu, panggil fungsi global utils.js
      playSound();
    }
  }

  // PENTING: window.open() / pindah tab baru WAJIB sinkron di dalam handler
  // klik asli, gak boleh ditunda lewat setTimeout — browser modern nge-block
  // popup yang dipanggil di luar call-stack klik user (makanya dulu tombol
  // sosial/donate kelihatan "gak bisa diklik", padahal sebenernya kebuka-nya
  // yang diblok). Solusinya: link-link itu sekarang pakai target="_blank"
  // native di HTML, JS di sini cuma mainin SFX-nya aja, gak ikut campur
  // navigasinya sama sekali.
  function navigateWithSfx(e, url, isNewTab = false) {
    if (isNewTab) {
      triggerMenuClickSound();
      return; // biarin <a target="_blank"> jalan sendiri secara native
    }
    e.preventDefault();
    triggerMenuClickSound();
    setTimeout(() => {
      window.location.href = url;
    }, 150);
  }

  // Modal Window Listeners
  if (btnOpen && modal) {
    btnOpen.addEventListener("click", () => {
      triggerMenuClickSound();
      modal.classList.add("active");
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener("click", () => {
      triggerMenuClickSound();
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        triggerMenuClickSound();
        modal.classList.remove("active");
      }
    });
  }

  // Main Buttons Navigation Interceptors
  const btnPlay = document.getElementById("btnMainPlay");
  if (btnPlay) {
    btnPlay.addEventListener("click", (e) =>
      navigateWithSfx(e, "lobby.html", false),
    );
  }

  const btnDonate = document.getElementById("btnMainDonate");
  if (btnDonate) {
    // btnDonate sekarang punya target="_blank" native di HTML —
    // ini cuma buat mainin SFX-nya, navigasinya dibiarin native.
    btnDonate.addEventListener("click", (e) => navigateWithSfx(e, null, true));
  }

  // Sosmed Links — sama kayak donate, native target="_blank" di HTML,
  // JS cuma numpang mainin SFX klik.
  document.querySelectorAll(".social-circle-link").forEach((link) => {
    link.addEventListener("click", (e) => navigateWithSfx(e, null, true));
  });

  // ============================================================
  // OTHER GAMES MODAL — render kartu PS5-style dari OG_GAMES
  // ============================================================
  function renderOgGames() {
    const row = document.getElementById("ogGamesRow");
    if (!row) return;
    row.innerHTML = "";

    OG_GAMES.forEach((game) => {
      const locked = !!game.comingSoon;
      const card = document.createElement(locked ? "div" : "a");
      card.className = "og-game-card" + (locked ? " og-locked" : "");
      if (!locked) {
        card.href = game.url;
        card.target = "_blank";
        card.rel = "noopener noreferrer";
        card.addEventListener("click", () => triggerMenuClickSound());
      } else {
        card.tabIndex = 0;
      }

      card.innerHTML = `
        <div class="og-card-art">
          <img src="${game.img}" alt="${game.title}" onerror="this.style.opacity='0'">
          ${locked ? '<div class="og-coming-soon-ribbon">COMING SOON</div>' : ""}
          <div class="og-card-art-fade"></div>
        </div>
        <div class="og-card-info">
          <span class="og-card-tag">${game.tag}</span>
          <span class="og-card-title">${game.title}</span>
          <span class="og-card-desc">${game.desc}</span>
        </div>
      `;
      row.appendChild(card);
    });
  }
  renderOgGames();

  // ============================================================
  // BACKGROUND MUSIC (bawaan) — autoplay, dengan fallback kalau
  // browser nge-block autoplay-with-sound (umum di Chrome/Safari),
  // bakal coba lagi begitu user pertama kali interaksi sama halaman.
  // ============================================================
  setupBgMusicAutoplay(document.getElementById("bgMusic"));
}

/* ==========================================================================
   C. CORE ENGINE: LOBBY.HTML SLIDER & TRACK ENGINE
   ========================================================================== */
function initLobbyPageLogic() {
  const songItems   = Array.from(document.querySelectorAll(".song-item"));
  const bgVideo     = document.getElementById("lobbyBgVideo");
  const mainPlayBtn = document.getElementById("mainPlayActionBtn");

  // Musik bawaan — nyala otomatis pas lobby pertama dibuka, terus
  // di-stop begitu user milih track musik sendiri (lihat stopBgMusic()
  // yang dipanggil di click handler song-item di bawah).
  const bgMusic = document.getElementById("bgMusic");
  setupBgMusicAutoplay(bgMusic);
  function stopBgMusic() {
    if (bgMusic && !bgMusic.paused) bgMusic.pause();
  }

  const displayNum   = document.querySelector(".slide-num");
  const displayRole  = document.querySelector(".char-role");
  const displayTitle = document.getElementById("displayModeTitle");
  const displayDesc  = document.getElementById("displayModeDesc");

  let currentIdx  = 0;

  // ============================================================
  // ── PROFILE MODAL SYSTEM
  // ============================================================
  const lobbyProfileWidget = document.getElementById("lobbyProfileWidget");
  const lobbyProfileModal  = document.getElementById("lobbyProfileModal");
  const closeProfileModal  = document.getElementById("closeProfileModal");

  function syncToggleState(buttonId, isEnabled) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.textContent = isEnabled ? "ON" : "OFF";
    btn.classList.toggle("off", !isEnabled);
  }

  function syncLobbyProfileDOM() {
    if (typeof profile === "undefined") return;

    const computedLevel      = Math.max(1, Math.floor((profile.stats.lifetimeScore || 0) / 1000) + 1);
    const currentExpInLevel  = (profile.stats.lifetimeScore || 0) % 1000;
    const expWidthPercentage = (currentExpInLevel / 1000) * 100;

    const widgetLevelNumber = document.getElementById("widgetLevelNumber");
    const widgetXpBarFill   = document.getElementById("widgetXpBarFill");
    const widgetUsername    = document.getElementById("widgetUsername");
    if (widgetLevelNumber) widgetLevelNumber.textContent = "LV " + computedLevel;
    if (widgetXpBarFill)   widgetXpBarFill.style.width   = `${expWidthPercentage}%`;
    if (widgetUsername)    widgetUsername.textContent     = profile.identity.username.toUpperCase();

    const modalLevelNumber  = document.getElementById("modalLevelNumber");
    const modalXpBarFill    = document.getElementById("modalXpBarFill");
    const modalXpTextRow    = document.getElementById("modalXpTextRow");
    const modalUsernameText = document.getElementById("modalUsernameText");
    const modalUsernameInput= document.getElementById("modalUsernameInput");
    if (modalLevelNumber)  modalLevelNumber.textContent  = computedLevel;
    if (modalXpBarFill)    modalXpBarFill.style.width    = `${expWidthPercentage}%`;
    if (modalXpTextRow)    modalXpTextRow.innerHTML      = `<span>EXP PROGRESSION</span><span>${currentExpInLevel.toLocaleString()} / 1,000 PTS</span>`;
    if (modalUsernameText) modalUsernameText.textContent = profile.identity.username.toUpperCase();
    if (modalUsernameInput && !modalUsernameInput.matches(":focus"))
      modalUsernameInput.value = profile.identity.username;

    const widgetAvatar  = document.getElementById("widgetAvatar");
    const modalProfileImg = document.getElementById("modalProfileImg");
    const avatarSrc = profile.identity.avatar?.startsWith("data:image")
      ? profile.identity.avatar
      : "assets/picture/logo.png";
    if (widgetAvatar)    widgetAvatar.src    = avatarSrc;
    if (modalProfileImg) modalProfileImg.src = avatarSrc;

    if (document.getElementById("modalStatGames"))
      document.getElementById("modalStatGames").textContent      = profile.stats.totalGamesPlayed || 0;
    if (document.getElementById("modalStatClicks"))
      document.getElementById("modalStatClicks").textContent     = profile.stats.totalClicks || 0;
    if (document.getElementById("modalStatWrongClicks"))
      document.getElementById("modalStatWrongClicks").textContent= profile.stats.totalWrongClicks || 0;
    if (document.getElementById("modalStatBonus"))
      document.getElementById("modalStatBonus").textContent      = profile.stats.totalBonusTriggered || 0;
    if (document.getElementById("modalStatFreeze"))
      document.getElementById("modalStatFreeze").textContent     = profile.stats.totalFreezeUsed || 0;
    if (document.getElementById("modalStatCombo"))
      document.getElementById("modalStatCombo").textContent      = "x" + (profile.stats.records.longestCombo || 0);
    if (document.getElementById("modalStatScore"))
      document.getElementById("modalStatScore").textContent      = profile.stats.lifetimeScore || 0;
    if (document.getElementById("modalStatHighBasic"))
      document.getElementById("modalStatHighBasic").textContent  = profile.stats.records.highestBasicScore || 0;
    if (document.getElementById("modalStatHighTA"))
      document.getElementById("modalStatHighTA").textContent     = profile.stats.records.highestTimeAttackScore || 0;

    const masterVolumeSlider = document.getElementById("masterVolumeSlider");
    const masterVolumeLabel  = document.getElementById("masterVolumeLabel");
    if (masterVolumeSlider && masterVolumeLabel) {
      masterVolumeSlider.value   = profile.settings.masterVolume;
      masterVolumeLabel.textContent = profile.settings.masterVolume + "%";
    }
    syncToggleState("sfxToggleBtn",      profile.settings.sfxEnabled);
    syncToggleState("cdSoundToggleBtn",  profile.settings.countdownSoundEnabled);
    syncToggleState("flashToggleBtn",    profile.settings.screenFlashEnabled);
    syncToggleState("particleToggleBtn", profile.settings.particleEffectEnabled);
    syncToggleState("comboAnimToggleBtn",profile.settings.comboAnimationEnabled);

    // Sync keybind editor kalau tab Settings sedang aktif
    const settingsTab = document.getElementById("tabSettings");
    if (settingsTab?.classList.contains("active")) {
      if (typeof renderKeybindEditor === "function") renderKeybindEditor();
    }
  }

  // Self-contained toast
  function showLobbyToast(msg, type) {
    let toast = document.getElementById("lobbyToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "lobbyToast";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed;bottom:28px;left:50%;
      transform:translateX(-50%) translateY(20px);
      background:${type === "error" ? "#ff4444" : "#00c851"};
      color:#fff;padding:10px 22px;border-radius:8px;
      font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;
      letter-spacing:1px;z-index:99999;opacity:0;
      transition:opacity .25s ease,transform .25s ease;
      pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.4);white-space:nowrap;
    `;
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2200);
  }

  syncLobbyProfileDOM();

  // Avatar upload
  const changeAvatarBtn = document.getElementById("changeAvatarBtn");
  const avatarFileInput = document.getElementById("avatarFileInput");
  if (changeAvatarBtn && avatarFileInput) {
    changeAvatarBtn.addEventListener("click", (e) => {
      e.stopPropagation(); triggerLobbyClickSound(); avatarFileInput.click();
    });
    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) { showLobbyToast("File harus berupa gambar!", "error"); avatarFileInput.value = ""; return; }
      if (file.size > 8 * 1024 * 1024)    { showLobbyToast("File terlalu besar! Maks 8MB", "error"); avatarFileInput.value = ""; return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 300;
          let { width: w, height: h } = img;
          if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
          else if (h > MAX)     { w = Math.round(w * MAX / h); h = MAX; }
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          if (typeof profile !== "undefined") {
            profile.identity.avatar = c.toDataURL("image/jpeg", 0.85);
            if (typeof profileSave === "function") profileSave(profile);
            syncLobbyProfileDOM();
            showLobbyToast("Avatar Updated!", "success");
          }
          avatarFileInput.value = "";
        };
        img.onerror = () => { showLobbyToast("Gagal baca gambar!", "error"); avatarFileInput.value = ""; };
        img.src = ev.target.result;
      };
      reader.onerror = () => { showLobbyToast("Gagal baca file!", "error"); avatarFileInput.value = ""; };
      reader.readAsDataURL(file);
    });
  }

  // Reset data
  document.getElementById("resetProfileDataBtn")?.addEventListener("click", (e) => {
    e.stopPropagation(); triggerLobbyClickSound();
    if (!confirm("Reset SEMUA data profile?\nAksi ini tidak bisa dibatalkan.")) return;
    localStorage.removeItem("rhg_profile");
    if (typeof profileLoad === "function") profile = profileLoad();
    syncLobbyProfileDOM();
    if (typeof applySoundSettings === "function") applySoundSettings();
    showLobbyToast("Profile direset!", "success");
  });

  // Modal open/close
  lobbyProfileWidget?.addEventListener("click", () => {
    syncLobbyProfileDOM();
    renderKeybindEditor();
    triggerLobbyClickSound();
    lobbyProfileModal?.classList.add("active");
  });
  closeProfileModal?.addEventListener("click", (e) => {
    e.stopPropagation(); triggerLobbyClickSound();
    lobbyProfileModal?.classList.remove("active");
  });

  // Tab switcher
  document.querySelectorAll(".modal-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      triggerLobbyClickSound();
      document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".modal-tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.getAttribute("data-tab"))?.classList.add("active");
    });
  });

  // Save username
  document.getElementById("saveUsernameBtn")?.addEventListener("click", () => {
    triggerLobbyClickSound();
    const v = document.getElementById("modalUsernameInput")?.value.trim();
    if (v && typeof profile !== "undefined") {
      profile.identity.username = v;
      if (typeof profileSave === "function") profileSave(profile);
      syncLobbyProfileDOM();
      showLobbyToast("Username Updated!", "success");
    }
  });

  // Volume slider
  document.getElementById("masterVolumeSlider")?.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    if (typeof profile !== "undefined") {
      profile.settings.masterVolume = val;
      if (typeof profileSave === "function") profileSave(profile);
    }
    const lbl = document.getElementById("masterVolumeLabel");
    if (lbl) lbl.textContent = val + "%";
    const bv = document.getElementById("lobbyBgVideo");
    if (bv) bv.volume = (val / 100) * 0.4;
  });

  // Toggle settings
  function bindToggle(id, key) {
    document.getElementById(id)?.addEventListener("click", () => {
      if (typeof profile === "undefined") return;
      triggerLobbyClickSound();
      profile.settings[key] = !profile.settings[key];
      if (typeof profileSave === "function") profileSave(profile);
      syncToggleState(id, profile.settings[key]);
      if (typeof applySoundSettings === "function") applySoundSettings();
    });
  }
  bindToggle("sfxToggleBtn",       "sfxEnabled");
  bindToggle("cdSoundToggleBtn",   "countdownSoundEnabled");
  bindToggle("flashToggleBtn",     "screenFlashEnabled");
  bindToggle("particleToggleBtn",  "particleEffectEnabled");
  bindToggle("comboAnimToggleBtn", "comboAnimationEnabled");

  // ============================================================
  // ── KEYBIND EDITOR
  // ============================================================
  const KEYBIND_LABELS = ["KEY 1", "KEY 2", "KEY 3", "KEY 4"];
  let keybindListeningIdx = -1; // index slot yang sedang menunggu input

  function renderKeybindEditor() {
    const row = document.getElementById("keybindEditorRow");
    if (!row || typeof profile === "undefined") return;

    const keys = Array.isArray(profile.settings.keybinds)
      ? [...profile.settings.keybinds]
      : ["q","w","e","r"];

    row.innerHTML = "";
    keys.slice(0, 4).forEach((k, i) => {
      const slot = document.createElement("div");
      slot.className = "keybind-slot";

      const lbl = document.createElement("span");
      lbl.className = "keybind-slot-label";
      lbl.textContent = KEYBIND_LABELS[i];

      const btn = document.createElement("button");
      btn.className = "keybind-key-btn";
      btn.id = "keybindBtn-" + i;
      btn.textContent = k.toUpperCase();
      if (keybindListeningIdx === i) btn.classList.add("listening");

      // Cek duplikat
      const isDup = keys.filter(x => x === k).length > 1;
      if (isDup) btn.classList.add("duplicate");

      btn.addEventListener("click", () => {
        triggerLobbyClickSound();
        keybindListeningIdx = i;
        renderKeybindEditor(); // rerender buat kasih style listening
      });

      slot.appendChild(lbl);
      slot.appendChild(btn);
      row.appendChild(slot);
    });
  }

  // Tangkap keydown saat listening
  document.addEventListener("keydown", (e) => {
    if (keybindListeningIdx < 0) return;
    if (!lobbyProfileModal?.classList.contains("active")) return;

    // Abaikan key modifier dan key yang panjang
    const k = e.key.toLowerCase();
    if (k.length !== 1 && !["arrowup","arrowdown","arrowleft","arrowright"].includes(k)) return;
    if (["escape"," ","enter","tab"].includes(k)) return;

    e.preventDefault();
    e.stopPropagation();

    if (typeof profile !== "undefined") {
      if (!Array.isArray(profile.settings.keybinds)) profile.settings.keybinds = ["q","w","e","r"];
      profile.settings.keybinds[keybindListeningIdx] = k;
      if (typeof profileSave === "function") profileSave(profile);
    }

    keybindListeningIdx = -1;
    renderKeybindEditor();
    showLobbyToast(`Key ${KEYBIND_LABELS[keybindListeningIdx < 0 ? 0 : keybindListeningIdx]} → "${k.toUpperCase()}"`, "success");
  });

  // Reset keybind ke default
  document.getElementById("keybindResetBtn")?.addEventListener("click", () => {
    triggerLobbyClickSound();
    keybindListeningIdx = -1;
    if (typeof profile !== "undefined") {
      profile.settings.keybinds = ["q","w","e","r"];
      if (typeof profileSave === "function") profileSave(profile);
    }
    renderKeybindEditor();
    showLobbyToast("Keybinds reset ke Q W E R", "success");
  });

  // Tutup listening kalau klik di luar
  lobbyProfileModal?.addEventListener("click", (e) => {
    if (!e.target.closest(".keybind-key-btn") && keybindListeningIdx >= 0) {
      keybindListeningIdx = -1;
      renderKeybindEditor();
    }
  });

  // Render saat tab Settings dibuka
  document.querySelectorAll(".modal-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("data-tab") === "tabSettings") {
        renderKeybindEditor();
      }
    });
  });

  // ── SFX helper ──
  function triggerLobbyClickSound() {
    const sfx = document.getElementById("lobbyClickSfx") || document.getElementById("clickSound");
    if (typeof profile !== "undefined" && !profile.settings?.sfxEnabled) return;
    if (sfx) {
      sfx.pause(); sfx.currentTime = 0;
      sfx.volume = (profile?.settings?.masterVolume ?? 100) / 100;
      sfx.play().catch(() => {});
    }
  }

  // ============================================================
  // ── DIFFICULTY PANEL (inline per track)
  // ============================================================
  function updateDiffPanels(activeIdx) {
    songItems.forEach((_, i) => {
      const p = document.getElementById("diffPanel-" + i);
      if (p) p.style.display = i === activeIdx ? "block" : "none";
    });
  }
  updateDiffPanels(0);

  // Diff button clicks — delegasi ke wrapper
  document.getElementById("songListWrapper")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".diff-btn");
    if (!btn) return;
    e.stopPropagation();
    triggerLobbyClickSound();
    const diff = btn.getAttribute("data-diff");
    if (!diff) return;
    btn.closest(".diff-panel")?.querySelectorAll(".diff-btn")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    // FIX: assignment langsung ke lexical var, BUKAN window.xxx — karena
    // currentDifficulty (utils.js) & bmDiffKey (basic-mode.js) adalah
    // `let` di scope file masing-masing, window.xxx = beda variabel sama sekali.
    if (typeof currentDifficulty !== "undefined") currentDifficulty = diff;
    if (typeof bmDiffKey !== "undefined") bmDiffKey = diff;
  });

  // ============================================================
  // ── AUDIO PREVIEW + VISUALIZER
  // ============================================================
  let previewAudio    = null;
  let previewTimer    = null;
  let audioCtx        = null;
  let analyser        = null;
  let sourceNode      = null;
  let vizAnimFrame    = null;
  let currentPreviewItem = null;

  const vizCanvas = document.getElementById("lobbyVisualizer");
  const vizCtx    = vizCanvas ? vizCanvas.getContext("2d") : null;

  function resizeViz() {
    if (!vizCanvas) return;
    const wrap = vizCanvas.parentElement;
    vizCanvas.width  = wrap.offsetWidth;
    vizCanvas.height = wrap.offsetHeight;
  }
  resizeViz();
  window.addEventListener("resize", resizeViz);

  function stopPreview() {
    clearTimeout(previewTimer);
    previewTimer = null;
    cancelAnimationFrame(vizAnimFrame);
    vizAnimFrame = null;

    if (previewAudio) {
      previewAudio.pause();
      previewAudio.src = "";
    }
    if (sourceNode)  { try { sourceNode.disconnect(); } catch(e){} sourceNode = null; }
    if (analyser)    { try { analyser.disconnect();   } catch(e){} analyser = null; }

    if (vizCanvas) vizCanvas.classList.remove("active");
    if (vizCtx && vizCanvas) vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);

    if (currentPreviewItem) {
      const tag = currentPreviewItem.querySelector(".song-status-tag");
      if (tag) tag.textContent = "SELECT";
      currentPreviewItem.classList.remove("previewing");
      currentPreviewItem = null;
    }
  }

  function drawVisualizer() {
    if (!analyser || !vizCtx || !vizCanvas) return;
    vizAnimFrame = requestAnimationFrame(drawVisualizer);

    const bufLen = analyser.frequencyBinCount;
    const data   = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(data);

    const W = vizCanvas.width;
    const H = vizCanvas.height;
    vizCtx.clearRect(0, 0, W, H);

    // Ambil subset frekuensi yang relevan (bukan semua 1024 bins)
    const barCount = 64;
    const step     = Math.floor(bufLen / barCount);
    const barW     = W / barCount - 1;

    for (let i = 0; i < barCount; i++) {
      const val    = data[i * step] / 255;
      const barH   = val * H;
      const x      = i * (barW + 1);
      const y      = H - barH;

      // Gradient per bar: putih di atas, cyan di bawah
      const grad = vizCtx.createLinearGradient(x, y, x, H);
      grad.addColorStop(0, "rgba(255,255,255,0.9)");
      grad.addColorStop(1, "rgba(0,229,255,0.5)");

      vizCtx.fillStyle = grad;
      vizCtx.fillRect(x, y, barW, barH);
    }
  }

  function startPreview(songItem) {
    stopPreview();

    const previewSrc = songItem.getAttribute("data-preview");
    if (!previewSrc) return;

    currentPreviewItem = songItem;
    const tag = songItem.querySelector(".song-status-tag");
    if (tag) tag.textContent = "♪ PREVIEW";
    songItem.classList.add("previewing");

    // Setup AudioContext
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();

    previewAudio = new Audio();
    previewAudio.src = previewSrc;
    previewAudio.crossOrigin = "anonymous";
    previewAudio.volume = typeof profile !== "undefined"
      ? (profile.settings?.masterVolume ?? 100) / 100 * 0.6
      : 0.6;
    previewAudio.currentTime = 0;

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    sourceNode = audioCtx.createMediaElementSource(previewAudio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    previewAudio.play().then(() => {
      if (vizCanvas) vizCanvas.classList.add("active");
      drawVisualizer();
    }).catch(() => {});

    // Stop setelah 15 detik
    previewTimer = setTimeout(() => {
      stopPreview();
    }, 15000);
  }

  // ============================================================
  // ── TRACK SWITCHER (dengan preview trigger)
  // ============================================================
  function changeTrack(index) {
    if (!songItems.length) return;
    currentIdx = index;

    songItems.forEach((item, i) => {
      item.classList.toggle("active", i === currentIdx);
      // Tetangga langsung (1 di atas, 1 di bawah) ikut maju dikit ke kiri
      item.classList.toggle("near", i === currentIdx - 1 || i === currentIdx + 1);
      if (i === currentIdx) item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // Sync left info panel — langsung dari BM_TRACKS, gak ada duplikat lagi
    const meta = typeof BM_TRACKS !== "undefined" ? BM_TRACKS[currentIdx] : null;
    if (meta) {
      if (displayNum)   displayNum.textContent  = String(currentIdx + 1).padStart(2, "0");
      if (displayRole)  displayRole.textContent = meta.role || "";
      if (displayTitle) { displayTitle.textContent = meta.title; displayTitle.className = `mode-title ${meta.titleClass || "title-basic"}`; }
      if (displayDesc)  displayDesc.textContent  = meta.desc || "";
    }

    // Sync track index ke basic-mode engine
    // FIX: bmTrackIdx adalah `let` di basic-mode.js, window.bmTrackIdx = beda
    // variabel — assignment langsung tanpa window. supaya beneran nyambung.
    if (typeof bmTrackIdx !== "undefined") bmTrackIdx = currentIdx;

    // Change background video
    if (bgVideo) {
      const src = songItems[currentIdx].getAttribute("data-video");
      bgVideo.style.opacity = "0.1";
      setTimeout(() => {
        bgVideo.src = src; bgVideo.load();
        bgVideo.volume = (profile?.settings?.masterVolume ?? 100) / 100 * 0.4;
        bgVideo.play().catch(() => {});
        bgVideo.style.opacity = "1";
      }, 200);
    }

    updateDiffPanels(currentIdx);
  }

  // Set state "near" yang bener pas pertama kali halaman dibuka,
  // tanpa ikut trigger pindah video/preview/info panel (cukup class-nya aja)
  songItems.forEach((item, i) => {
    item.classList.toggle("near", i === currentIdx - 1 || i === currentIdx + 1);
  });

  songItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      triggerLobbyClickSound();
      stopBgMusic(); // musik bawaan berhenti begitu user milih track sendiri
      changeTrack(i);
      // Start 15s preview
      startPreview(item);
    });
  });

  // ============================================================
  // ── MODE SWITCHER (tombol PREV/NEXT) ──
  // ============================================================
  // PREV/NEXT sekarang ganti GAME MODE (Basic / Not Origin Music / dst),
  // BUKAN ganti track lagi. Track switching ada di Arrow Up/Down keyboard.
  const modeLabel = document.getElementById("currentModeLabel");

  function renderModeLabel() {
    if (!modeLabel || typeof BM_GAME_MODES === "undefined") return;
    const mode = BM_GAME_MODES[bmGameModeIdx] || BM_GAME_MODES[0];
    modeLabel.textContent = mode.label;
  }
  renderModeLabel();

  function switchMode(dir) {
    if (typeof BM_GAME_MODES === "undefined" || !BM_GAME_MODES.length) return;
    bmGameModeIdx = (bmGameModeIdx + dir + BM_GAME_MODES.length) % BM_GAME_MODES.length;
    renderModeLabel();
  }

  document.getElementById("slideNextBtn")?.addEventListener("click", () => {
    triggerLobbyClickSound();
    switchMode(1);
  });

  document.getElementById("slidePrevBtn")?.addEventListener("click", () => {
    triggerLobbyClickSound();
    switchMode(-1);
  });

  // ============================================================
  // ── TRACK SWITCHER VIA ARROW UP/DOWN ──
  // ============================================================
  function switchTrack(dir) {
    if (!songItems.length) return;
    const next = (currentIdx + dir + songItems.length) % songItems.length;
    changeTrack(next);
    startPreview(songItems[next]);
  }

  // ── PLAY BUTTON — panggil engine sesuai mode aktif, no redirect ──
  mainPlayBtn?.addEventListener("click", () => {
    if (!songItems.length) return;
    triggerLobbyClickSound();
    stopPreview();

    // Flash effect
    document.body.style.pointerEvents = "none";
    document.body.style.filter = "brightness(3) contrast(2)";
    document.body.style.transition = "filter .2s ease";

    setTimeout(() => {
      document.body.style.filter = "";
      document.body.style.pointerEvents = "";

      // Jalankan engine sesuai mode yang lagi dipilih (PREV/NEXT).
      // Default tetap startBasicMode kalau BM_GAME_MODES belum diisi.
      const mode = (typeof BM_GAME_MODES !== "undefined" && BM_GAME_MODES.length)
        ? BM_GAME_MODES[bmGameModeIdx]
        : null;
      const engineFnName = mode?.engine || "startBasicMode";
      const engineFn = window[engineFnName];

      if (typeof engineFn === "function") {
        engineFn();
      } else if (typeof startBasicMode === "function") {
        // Fallback kalau engine mode itu belum dibuat function-nya
        startBasicMode();
      }
    }, 220);
  });

  // Keyboard nav — Up/Down = ganti track, Left/Right = ganti mode
  window.addEventListener("keydown", (e) => {
    if (lobbyProfileModal?.classList.contains("active")) {
      if (e.key === "Escape") closeProfileModal?.click();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      triggerLobbyClickSound();
      switchTrack(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      triggerLobbyClickSound();
      switchTrack(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      document.getElementById("slideNextBtn")?.click();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      document.getElementById("slidePrevBtn")?.click();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault(); mainPlayBtn?.click();
    }
  });
}