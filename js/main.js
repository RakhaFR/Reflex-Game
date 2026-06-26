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
    // Init switchGameMode SETELAH initLobbyPageLogic() — supaya
    // window._userHasInteracted sudah di-set dengan benar dari sessionStorage
    if (typeof switchGameMode === "function") switchGameMode(0, true);
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
//
// PENTING — fungsi ini mengembalikan cancel():
//   const cancelBgResume = setupBgMusicAutoplay(el);
//   cancelBgResume(); // hapus listener sebelum stop, biar gak re-play
//
// Tanpa cancel() dulu, urutannya: element-handler (pause) → event
// bubble ke document → resumeOnce fires → play lagi. Itu sebabnya
// butuh 2 klik buat beneran matiin music sebelumnya.
function setupBgMusicAutoplay(el, volume = 0.5) {
  if (!el) return () => {};
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
    document.addEventListener(ev, resumeOnce),
  );

  // Kembalikan fungsi cancel — panggil ini sebelum pause biar
  // resumeOnce gak sempet re-fire lewat event bubble.
  return function cancelBgResume() {
    ["click", "keydown", "touchstart"].forEach((ev) =>
      document.removeEventListener(ev, resumeOnce),
    );
  };
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
      if (typeof rrNavigate === "function") { rrNavigate(url); } else { window.location.href = url; }
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
  // songItems sebagai live getter — selalu baca dari DOM terkini.
  // JANGAN diubah jadi const Array.from() karena setelah mode switch
  // (nomRenderTrackList / bmRenderTrackList) elemen lama sudah diganti,
  // sehingga array lama tidak sinkron dan class active/near salah tempat.
  const getSongItems = () => Array.from(document.querySelectorAll(".song-item"));
  // Alias agar kode di bawah yang pakai songItems.xxx tidak perlu diubah satu-satu
  const songItems = new Proxy([], {
    get(_, prop) {
      const live = getSongItems();
      if (prop === "length") return live.length;
      if (prop === "forEach") return live.forEach.bind(live);
      if (prop === "filter") return live.filter.bind(live);
      if (prop === "map") return live.map.bind(live);
      if (!isNaN(prop)) return live[prop];
      return live[prop];
    }
  });
  const bgVideo     = document.getElementById("lobbyBgVideo");
  const mainPlayBtn = document.getElementById("mainPlayActionBtn");

  // Musik bawaan — nyala otomatis pas lobby pertama dibuka, terus
  // di-stop begitu user milih track musik sendiri.
  // cancelBgResume() WAJIB dipanggil duluan sebelum pause — kalau
  // enggak, event bubble dari klik/keydown bakal trigger resumeOnce
  // setelah pause, jadi musik nyala lagi (makanya dulu butuh 2 klik).
  const bgMusic = document.getElementById("bgMusic");
  const cancelBgResume = setupBgMusicAutoplay(bgMusic);
  let bgMusicStopped = false;
  function stopBgMusic() {
    if (bgMusicStopped) return;
    bgMusicStopped = true;
    cancelBgResume();            // cabut listener dulu, BARU pause
    if (bgMusic) bgMusic.pause();
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

window.syncLobbyProfileDOM = function syncLobbyProfileDOM() {
  if (typeof profile === "undefined") return;

  // --- 1. PROSES KALKULASI DATA UTAMA ---
  const computedLevel      = Math.max(1, Math.floor((profile.stats.lifetimeScore || 0) / 25000) + 1);
  const currentExpInLevel  = (profile.stats.lifetimeScore || 0) % 25000;
  const expWidthPercentage = (currentExpInLevel / 25000) * 100;

  // --- 2. SINKRONISASI WIDGET LOBBY UTAMA ---
  const widgetLevelNumber = document.getElementById("widgetLevelNumber");
  const widgetXpBarFill   = document.getElementById("widgetXpBarFill");
  const widgetUsername    = document.getElementById("widgetUsername");
  const widgetAvatar      = document.getElementById("widgetAvatar");
  if (widgetLevelNumber) widgetLevelNumber.textContent = "LV " + computedLevel;
  if (widgetXpBarFill)   widgetXpBarFill.style.width   = `${expWidthPercentage}%`;
  if (widgetUsername)    widgetUsername.textContent     = profile.identity.username.toUpperCase();
  if (widgetAvatar) {
    const avatarSrc = (typeof getAvatarDisplay === "function")
      ? getAvatarDisplay(profile.identity.avatar)
      : (profile.identity.avatar === "default" || !profile.identity.avatar
          ? "assets/picture/logo.png"
          : profile.identity.avatar);
    if (widgetAvatar.src !== avatarSrc) widgetAvatar.src = avatarSrc;
  }

  // --- 3. SINKRONISASI MODAL IDENTITY ---
  const modalLevelNumber  = document.getElementById("modalLevelNumber");
  const modalXpBarFill    = document.getElementById("modalXpBarFill");
  const modalXpTextRow    = document.getElementById("modalXpTextRow");
  const modalUsernameText = document.getElementById("modalUsernameText");
  const modalUsernameInput= document.getElementById("modalUsernameInput");
  const modalProfileImg   = document.getElementById("modalProfileImg");
  if (modalLevelNumber)  modalLevelNumber.textContent  = computedLevel;
  if (modalXpBarFill)    modalXpBarFill.style.width    = `${expWidthPercentage}%`;
  if (modalXpTextRow)    modalXpTextRow.innerHTML      = `<span>EXP PROGRESSION</span><span>${currentExpInLevel.toLocaleString()} / 25,000 PTS</span>`;
  if (modalUsernameText) modalUsernameText.textContent = profile.identity.username.toUpperCase();
  if (modalUsernameInput && !modalUsernameInput.matches(":focus"))
    modalUsernameInput.value = profile.identity.username;
  if (modalProfileImg) {
    const avatarSrc = (typeof getAvatarDisplay === "function")
      ? getAvatarDisplay(profile.identity.avatar)
      : (profile.identity.avatar === "default" || !profile.identity.avatar
          ? "assets/picture/logo.png"
          : profile.identity.avatar);
    if (modalProfileImg.src !== avatarSrc) modalProfileImg.src = avatarSrc;
  }

  // --- 4. DATA PER KATEGORI NOTORIGIN & STATISTICS ---
  const bm  = profile.stats.basic       || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
  const nom = profile.stats.notoriginal || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };

  // Helper accuracy
  function calcAcc(clicks, wrong) {
    if (!clicks) return "N/A";
    return Math.round(((clicks - wrong) / clicks) * 100) + "%";
  }

  // Per-mode: Basic
  const $set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  $set("statBmGames",    bm.gamesPlayed);
  $set("statBmClicks",   bm.clicks);
  $set("statBmWrong",    bm.wrongClicks);
  $set("statBmAccuracy", calcAcc(bm.clicks, bm.wrongClicks));

  // Per-mode: N.O.M
  $set("statNomGames",    nom.gamesPlayed);
  $set("statNomClicks",   nom.clicks);
  $set("statNomWrong",    nom.wrongClicks);
  $set("statNomAccuracy", calcAcc(nom.clicks, nom.wrongClicks));

  // Overall totals
  $set("modalStatGames",       profile.stats.totalGamesPlayed  || 0);
  $set("modalStatClicks",      profile.stats.totalClicks       || 0);
  $set("modalStatWrongClicks", profile.stats.totalWrongClicks  || 0);
  $set("modalStatBonus",       profile.stats.totalBonusTriggered || 0);
  $set("modalStatCombo",       "x" + (profile.stats.records.longestCombo || 0));
  $set("modalStatScore",       (profile.stats.lifetimeScore    || 0).toLocaleString());
  $set("modalStatHighBasic",   (profile.stats.records.highestBasicScore || 0).toLocaleString());
  if (document.getElementById("modalStatHighNotOriginal"))
    $set("modalStatHighNotOriginal", (profile.stats.records.highestNotOriginalScore || 0).toLocaleString());
  $set("statTotalAccuracy", calcAcc(profile.stats.totalClicks || 0, profile.stats.totalWrongClicks || 0));

  // --- 5. RENDER GRAFIK — PER MODE + OVERALL RATIO ---
  function setBar(barId, valId, pct) {
    const bar = document.getElementById(barId);
    const val = document.getElementById(valId);
    if (bar) bar.style.width = pct + "%";
    if (val) val.textContent = pct + "%";
  }

  // Basic Mode bars
  const bmTotal = (bm.clicks || 0) + (bm.wrongClicks || 0);
  if (bmTotal > 0) {
    setBar("graphBmHit",   "graphBmHitVal",   Math.round((bm.clicks       / bmTotal) * 100));
    setBar("graphBmWrong", "graphBmWrongVal",  Math.round((bm.wrongClicks  / bmTotal) * 100));
  } else {
    setBar("graphBmHit", "graphBmHitVal", 0);
    setBar("graphBmWrong", "graphBmWrongVal", 0);
  }

  // N.O.M bars
  const nomTotal = (nom.clicks || 0) + (nom.wrongClicks || 0);
  if (nomTotal > 0) {
    setBar("graphNomHit",   "graphNomHitVal",  Math.round((nom.clicks      / nomTotal) * 100));
    setBar("graphNomWrong", "graphNomWrongVal", Math.round((nom.wrongClicks / nomTotal) * 100));
  } else {
    setBar("graphNomHit", "graphNomHitVal", 0);
    setBar("graphNomWrong", "graphNomWrongVal", 0);
  }

  // Overall ratio (clicks vs bonus vs wrong)
  const totalActions = (profile.stats.totalClicks || 0) + (profile.stats.totalBonusTriggered || 0) + (profile.stats.totalWrongClicks || 0);
  if (totalActions > 0) {
    setBar("graphBarClicks", "graphValClicks", Math.round(((profile.stats.totalClicks       || 0) / totalActions) * 100));
    setBar("graphBarBonus",  "graphValBonus",  Math.round(((profile.stats.totalBonusTriggered || 0) / totalActions) * 100));
    setBar("graphBarWrong",  "graphValWrong",  Math.round(((profile.stats.totalWrongClicks  || 0) / totalActions) * 100));
  } else {
    setBar("graphBarClicks", "graphValClicks", 0);
    setBar("graphBarBonus",  "graphValBonus",  0);
    setBar("graphBarWrong",  "graphValWrong",  0);
  }

  // --- 6. SINKRONISASI ENGINE SETTINGS SINKRON (NO MISSING FUNCTIONS) ---
  const masterVolumeSlider = document.getElementById("masterVolumeSlider");
  const masterVolumeLabel  = document.getElementById("masterVolumeLabel");
  if (masterVolumeSlider && masterVolumeLabel) {
    masterVolumeSlider.value   = profile.settings.masterVolume;
    masterVolumeLabel.textContent = profile.settings.masterVolume + "%";
  }
  syncToggleState("sfxToggleBtn",      profile.settings.sfxEnabled);
  syncToggleState("cdSoundToggleBtn",  profile.settings.countdownSoundEnabled);
  syncToggleState("particleToggleBtn", profile.settings.particleEffectEnabled);
  syncToggleState("comboAnimToggleBtn",  profile.settings.comboAnimationEnabled);
  syncToggleState("mouseClickToggleBtn", profile.settings.mouseClickEnabled ?? true);
}

// NOTE: Settings toggle listeners dihandle oleh profile.js → initLobbyProfileEvents().
// Jangan duplikasi listener di sini — akan menyebabkan double-toggle per klik.

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

  // ============================================================
  // ── SETTINGS TOGGLE & VOLUME SLIDER HANDLERS
  // Dipasang di sini (main.js) bukan di profile.js karena
  // syncToggleState & syncLobbyProfileDOM hanya tersedia setelah
  // main.js selesai di-parse — profile.js load duluan jadi tidak bisa.
  // ============================================================
  (function initSettingsHandlers() {
    const volSlider = document.getElementById("masterVolumeSlider");
    const volLabel  = document.getElementById("masterVolumeLabel");
    if (volSlider) {
      volSlider.addEventListener("input", () => {
        profile.settings.masterVolume = parseInt(volSlider.value);
        if (volLabel) volLabel.textContent = volSlider.value + "%";
        profileSave(profile);
        if (typeof applySoundSettings === "function") applySoundSettings();
      });
    }

    const toggleConfigs = [
      { id: "sfxToggleBtn",       key: "sfxEnabled" },
      { id: "cdSoundToggleBtn",   key: "countdownSoundEnabled" },
      { id: "particleToggleBtn",  key: "particleEffectEnabled" },
      { id: "comboAnimToggleBtn",   key: "comboAnimationEnabled" },
      { id: "mouseClickToggleBtn",  key: "mouseClickEnabled" },
    ];
    toggleConfigs.forEach(({ id, key }) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener("click", () => {
        triggerLobbyClickSound();
        profile.settings[key] = !profile.settings[key];
        // Update tombol langsung — tidak lewat triggerLobbyDOMUpdate()
        // karena kita sudah di dalam main.js dan punya syncToggleState di sini.
        syncToggleState(id, profile.settings[key]);
        profileSave(profile);
        if (typeof applySoundSettings === "function") applySoundSettings();
      });
    });
  })();

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

  // Modal open/close — selalu reset ke tab Identity saat dibuka ulang
  function openProfileModal() {
    // Reset tab ke Identity
    document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".modal-tab-content").forEach(c => c.classList.remove("active"));
    const identityBtn = document.querySelector('.modal-tab-btn[data-tab="tabIdentity"]');
    const identityTab = document.getElementById("tabIdentity");
    if (identityBtn) identityBtn.classList.add("active");
    if (identityTab) identityTab.classList.add("active");

    syncLobbyProfileDOM();
    renderKeybindEditor();
    triggerLobbyClickSound();
    lobbyProfileModal?.classList.add("active");
  }

  lobbyProfileWidget?.addEventListener("click", openProfileModal);
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

  // Toggle handlers sudah dipindah ke initSettingsHandlers() di atas.

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

  // Flag gesture pertama — AudioContext hanya boleh dibuat setelah ini true.
  // Kalau user navigasi dari halaman lain (index → lobby), gesture sudah terjadi
  // di halaman sebelumnya — cek sessionStorage supaya preview langsung bisa play.
  const _hadPriorGesture = (() => {
    try {
      const hadGesture    = sessionStorage.getItem("rr_had_gesture") === "1";
      const fromNavigate  = sessionStorage.getItem("rr_navigated")   === "1";
      // rr_navigated di-set oleh loading.js saat user navigasi dari halaman lain.
      // Ini flag terpisah dari rr_transition (yang di-consume loading.js lebih dulu).
      // Kalau refresh: rr_navigated tidak ada → hapus gesture flag → fresh start.
      if (hadGesture && !fromNavigate) {
        sessionStorage.removeItem("rr_had_gesture");
        return false;
      }
      // Consume rr_navigated setelah dibaca — one-shot per navigasi
      if (fromNavigate) sessionStorage.removeItem("rr_navigated");
      return hadGesture && fromNavigate;
    } catch(_) { return false; }
  })();
  window._userHasInteracted = _hadPriorGesture;

  const _markInteracted = () => {
    window._userHasInteracted = true;
    try { sessionStorage.setItem("rr_had_gesture", "1"); } catch(_) {}
    ["click", "keydown", "touchstart"].forEach(ev =>
      document.removeEventListener(ev, _markInteracted)
    );
  };
  if (!window._userHasInteracted) {
    ["click", "keydown", "touchstart"].forEach(ev =>
      document.addEventListener(ev, _markInteracted, { once: true })
    );
  }

  function stopPreview() {
    clearTimeout(previewTimer);
    previewTimer = null;
    cancelAnimationFrame(vizAnimFrame);
    vizAnimFrame = null;

    // Bersihkan visual tag dari item yang sedang/pernah preview
    if (currentPreviewItem) {
      const tag = currentPreviewItem.querySelector(".song-status-tag");
      if (tag) tag.textContent = "";
      currentPreviewItem.classList.remove("previewing");
      currentPreviewItem = null;
    }

    if (previewAudio) {
      previewAudio.pause();
      previewAudio.src = "";
    }
    if (sourceNode)  { try { sourceNode.disconnect(); } catch(e){} sourceNode = null; }
    if (analyser)    { try { analyser.disconnect();   } catch(e){} analyser = null; }

    if (vizCanvas) vizCanvas.classList.remove("active");
    if (vizCtx && vizCanvas) vizCtx.clearRect(0, 0, vizCanvas.width, vizCanvas.height);

    // Stop bgVideo juga — sinkron dengan audio agar tidak terus muter
    const bv = document.getElementById("lobbyBgVideo");
    if (bv) {
      bv.pause();
      bv.style.opacity = "0.1";
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

    // Jangan set tag/class preview sebelum ada gesture user —
    // audio tidak akan play sehingga tag "♪ PREVIEW" akan muncul tanpa suara.
    // Setup AudioContext — hanya buat setelah ada gesture user.
    if (!window._userHasInteracted) return;

    const tag = songItem.querySelector(".song-status-tag");
    if (tag) tag.textContent = "♪ PREVIEW";
    songItem.classList.add("previewing");
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
      // Resume bgVideo yang mungkin di-pause saat preview sebelumnya habis
      const bv = document.getElementById("lobbyBgVideo");
      if (bv && bv.paused && bv.src) {
        bv.style.opacity = "1";
        bv.play().catch(() => {});
      }
    }).catch(() => {});

    // Stop setelah 20 detik — audio dan bgVideo berhenti bersamaan
    previewTimer = setTimeout(() => {
      stopPreview();
    }, 20000);
  }

  // ============================================================
  // ── TRACK SWITCHER (dengan preview trigger)
  // ============================================================
  function changeTrack(index) {
    if (!songItems.length) return;
    currentIdx = index;
    localStorage.setItem("rhg_active_track", index);

    songItems.forEach((item, i) => {
      item.classList.toggle("active", i === currentIdx);
      // Tetangga langsung (1 di atas, 1 di bawah) ikut maju dikit ke kiri
      item.classList.toggle("near", i === currentIdx - 1 || i === currentIdx + 1);
      if (i === currentIdx) item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });

    // Sync left info panel — baca dari track list mode yang aktif sekarang
    // (bukan hardcode BM_TRACKS, agar N.O.M track 02 tidak ambil data basic mode)
    const activeTrackList = (() => {
      const modeId = typeof BM_GAME_MODES !== "undefined" && BM_GAME_MODES[bmGameModeIdx]?.id;
      if (modeId === "notoriginal" && typeof NOM_TRACKS !== "undefined") return NOM_TRACKS;
      if (typeof BM_TRACKS !== "undefined") return BM_TRACKS;
      return null;
    })();
    const meta = activeTrackList ? activeTrackList[currentIdx] : null;
    if (meta) {
      // Set --track-accent di :root → otomatis update border-left
      // mode-info-block, warna slide-num, dan warna mode-title sekaligus.
      document.documentElement.style.setProperty(
        "--track-accent", meta.color || "#00e5ff"
      );

      if (displayNum)   displayNum.textContent  = String(currentIdx + 1).padStart(2, "0");
      if (displayRole)  displayRole.textContent = meta.role || "";
      if (displayTitle) { displayTitle.textContent = meta.title; displayTitle.className = `mode-title ${meta.titleClass || "title-basic"}`; }
      if (displayDesc)  displayDesc.textContent  = meta.desc || "";
    }

    // Sync track index ke engine yang aktif sekarang
    // FIX: assignment langsung (bukan window.xxx) agar beneran nyambung ke `let` di masing-masing file
    const activeModeId = typeof BM_GAME_MODES !== "undefined" && BM_GAME_MODES[bmGameModeIdx]?.id;
    if (activeModeId === "notoriginal") {
      if (typeof nomTrackIdx !== "undefined") nomTrackIdx = currentIdx;
    } else {
      if (typeof bmTrackIdx !== "undefined") bmTrackIdx = currentIdx;
    }

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

  // Set warna aksen awal (track 0) sebelum user klik apapun
  if (typeof BM_TRACKS !== "undefined" && BM_TRACKS[0]?.color) {
    document.documentElement.style.setProperty("--track-accent", BM_TRACKS[0].color);
  }

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
// ── CENTRALIZED GAME MODE SWITCHER & TRACK RE-RENDER ──
// ============================================================
function switchGameMode(dir, isInit = false) {
  if (typeof BM_GAME_MODES === "undefined" || !BM_GAME_MODES.length) return;

  // 1. Matikan preview lama sesegera mungkin agar tidak tumpang tindih
  if (typeof stopPreview === "function") stopPreview();
  if (typeof stopBgMusic === "function") stopBgMusic();

  // 2. Update Index Global Mode secara akurat
  if (!isInit) {
    bmGameModeIdx = (bmGameModeIdx + dir + BM_GAME_MODES.length) % BM_GAME_MODES.length;
    localStorage.setItem("rhg_active_mode", bmGameModeIdx);
  }

  // 3. Update Text Label UI & Deskripsi Mode
  const labelEl = document.getElementById("currentModeLabel");
  const descEl = document.getElementById("modeDescLabel");
  const currentMode = BM_GAME_MODES[bmGameModeIdx];

  if (labelEl && currentMode) {
    labelEl.textContent = currentMode.label;
  }
  if (descEl && currentMode?.desc) {
    descEl.textContent = currentMode.desc;
  }

  // 4. Pemicu Render Ulang Track List ke DOM Berdasarkan Mode
  if (currentMode?.id === "notoriginal") {
    if (typeof nomRenderTrackList === "function") nomRenderTrackList();
  } else {
    if (typeof bmRenderTrackList === "function") bmRenderTrackList();
  }

  // 5. RE-BIND SONG ITEMS & AKTIFKAN PREVIEW INSTAN
  const newSongItems = Array.from(document.querySelectorAll(".song-item"));
  newSongItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
      if (typeof stopBgMusic === "function") stopBgMusic();
      if (typeof changeTrack === "function") changeTrack(i);
      if (typeof startPreview === "function") startPreview(item);
    });
  });

  // Tentukan track aktif (kembalikan index yang tersimpan jika isInit)
  let nextIdx = 0;
  if (isInit) {
    const savedTrack = parseInt(localStorage.getItem("rhg_active_track"));
    nextIdx = (!isNaN(savedTrack) && savedTrack >= 0 && savedTrack < newSongItems.length) ? savedTrack : 0;
  } else {
    localStorage.setItem("rhg_active_track", 0);
  }

  // Reset currentIdx ke mode baru & aktifkan item pertama
  currentIdx = nextIdx;
  if (typeof changeTrack === "function") changeTrack(currentIdx);
  if (newSongItems[currentIdx]) {
    if (typeof startPreview === "function") startPreview(newSongItems[currentIdx]);
  }
}

// ── Event Listener Tombol Slider Monitor (Klik Mouse) ────────────────
document.getElementById("slideNextBtn")?.addEventListener("click", () => {
  if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
  switchGameMode(1);
});

document.getElementById("slidePrevBtn")?.addEventListener("click", () => {
  if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
  switchGameMode(-1);
});

// switchGameMode(0, true) dipindah ke dalam initLobbyPageLogic() supaya
// _userHasInteracted sudah di-set sebelum startPreview dipanggil.


// ============================================================
// ── PATCH TOMBOL PLAY UTAMA (Memicu Engine Berdasarkan Mode) ──
// ============================================================
function handlePlayButtonClick() {
  if (typeof BM_GAME_MODES === "undefined" || !BM_GAME_MODES.length) {
    if (typeof startBasicMode === "function") startBasicMode();
    return;
  }

  const currentMode = BM_GAME_MODES[bmGameModeIdx];
  if (!currentMode) {
    if (typeof startBasicMode === "function") startBasicMode();
    return;
  }

  const engineFnName = currentMode.engine;
  const engineFn = window[engineFnName];

  if (typeof engineFn === "function") {
    engineFn();
  } else {
    console.warn(`Engine ${engineFnName} belum siap. Fallback otomatis ke Basic Mode.`);
    if (typeof startBasicMode === "function") startBasicMode();
  }
}

// ============================================================
// ── TRACK SWITCHER & PLAY BUTTON CLICK EVENT ──
// ============================================================
function switchTrack(dir) {
  if (!songItems || !songItems.length) return;
  const next = (currentIdx + dir + songItems.length) % songItems.length;
  if (typeof stopBgMusic === "function") stopBgMusic(); 
  if (typeof changeTrack === "function") changeTrack(next);
  if (typeof startPreview === "function") startPreview(songItems[next]);
}

// ── PLAY BUTTON EVENT LISTENER ──
mainPlayBtn?.addEventListener("click", () => {
  if (!songItems || !songItems.length) return;
  if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
  if (typeof stopPreview === "function") stopPreview();

  // Flash effect
  document.body.style.pointerEvents = "none";
  document.body.style.filter = "brightness(3) contrast(2)";
  document.body.style.transition = "filter .2s ease";

  setTimeout(() => {
    document.body.style.filter = "";
    document.body.style.pointerEvents = "";

    // Memanggil patch fungsi play utama yang sudah kita selaraskan di atas
    handlePlayButtonClick();
  }, 220);
});

// ============================================================
// ── KEYBOARD NAVIGATION SYSTEM ──
// ============================================================
window.addEventListener("keydown", (e) => {
  if (typeof lobbyProfileModal !== "undefined" && lobbyProfileModal?.classList.contains("active")) {
    if (e.key === "Escape" && closeProfileModal) closeProfileModal.click();
    return;
  }
  
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
    switchTrack(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
    switchTrack(-1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
    switchGameMode(1); // Navigasi langsung ganti mode game lewat fungsi aman
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (typeof triggerLobbyClickSound === "function") triggerLobbyClickSound();
    switchGameMode(-1); // Navigasi langsung ganti mode game lewat fungsi aman
  } else if (e.key === " " || e.key === "Enter") {
    e.preventDefault(); 
    mainPlayBtn?.click();
  }
});
}