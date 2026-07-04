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
    "assets/picture/new-logo.png",
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
    title: "The Survey",
    desc: "Sebuah visual novel yang menceritakan seorang yang berjuang keluar dari isolasi diri selama 8 bulan.",
    tag: "VISUAL NOVEL • STORY",
    img: "assets/picture/OG-GAMES/TheSurvey.png",
    url: "https://rakhafr.github.io/TheSurvey/",
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

// ==========================================================================
// ── DATA UPDATE LOG SYSTEM (EDIT DATA LOG DI SINI) ──
// ==========================================================================
const UPDATE_LOGS = [
    {
      version: "Pre-Test",
      date: "28 MEI 2026",
      badgeClass: "yellow",
      bannerImg: "assets/picture/pre-test.png", // Menggunakan background bawaan kamu sebagai contoh
      changes: [
          // { type: "add", text: "Integrasi Not Original Mode (NOM_TRACKS) ke dalam sistem lobby." },
          { type: "upd", text: "Penataan ulang layout menu & gameplay dengan konsep *Stylized Arcade Interface*. masih tahap pre-test kemungkinan data anda bakal hilang di update selanjutnya.." }
        ]
      },
      // {
      //   version: "Pre-Test",
      //   date: "28 JUNI 2026",
      //   badgeClass: "magenta",
      //   // Tambahkan path gambar preview updatenya di sini (bisa pakai thumbnail sfx/core baru)
      //   bannerImg: "assets/picture/new-logo.png", 
      //   changes: [
      //     { type: "add", text: "Mengimplementasikan stylized loading screen bertema **ReflexRythm**." },
      //     { type: "fix", text: "Memperbaiki bug audio preview yang tumpang tindih saat mengganti trek lagu dengan cepat." },
      //     { type: "upd", text: "Mengoptimalkan visualizer canvas agar lebih ringan di perangkat mobile landscape." }
      //   ]
      // },
    ];

// Fungsi untuk me-render data ke dalam DOM HTML secara dinamis
function renderUpdateLogs() {
  const container = document.getElementById("updateLogContent");
  if (!container) return;

  let htmlContent = `<div class="log-version-container">`;

  UPDATE_LOGS.forEach(log => {
    htmlContent += `
      <div class="log-version-item">
        <div class="log-version-header">
          <span class="v-badge ${log.badgeClass}">${log.version}</span>
          <span class="v-date">${log.date}</span>
        </div>
        
        <div class="log-banner-wrapper">
          <img src="${log.bannerImg}" alt="Update ${log.version}" onerror="this.style.display='none'">
        </div>

        <ul class="log-version-list">
    `;

    log.changes.forEach(change => {
      let tagLabel = "UPD";
      if (change.type === "add") tagLabel = "NEW";
      if (change.type === "fix") tagLabel = "FIX";

      htmlContent += `
        <li>
          <span class="tag-${change.type}">${tagLabel}</span>
          <p>${change.text}</p>
        </li>
      `;
    });

    htmlContent += `
        </ul>
      </div>
    `;
  });

  htmlContent += `</div>`;
  container.innerHTML = htmlContent;
}
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

  // Jalankan render data log otomatis
  renderUpdateLogs();

  const btnUpdateLog = document.getElementById("btnUpdateLog");
  const updateLogModal = document.getElementById("updateLogModal");
  const btnCloseUpdateLog = document.getElementById("btnCloseUpdateLog");
  const clickSoundEl = document.getElementById("clickSound");

  if (btnUpdateLog && updateLogModal && btnCloseUpdateLog) {
    btnUpdateLog.addEventListener("click", () => {
      if (clickSoundEl) { clickSoundEl.currentTime = 0; clickSoundEl.play().catch(() => {}); }
      updateLogModal.classList.add("active");
    });

    btnCloseUpdateLog.addEventListener("click", () => {
      if (clickSoundEl) { clickSoundEl.currentTime = 0; clickSoundEl.play().catch(() => {}); }
      updateLogModal.classList.remove("active");
    });

    updateLogModal.addEventListener("click", (e) => {
      if (e.target === updateLogModal) {
        if (clickSoundEl) { clickSoundEl.currentTime = 0; clickSoundEl.play().catch(() => {}); }
        updateLogModal.classList.remove("active");
      }
    });
  }
  // PENTING: window.open() / pindah tab baru WAJIB sinkron di dalam handler
  // klik asli, gak boleh ditunda lewat setTimeout — browser modern nge-block
  // popup yang dipanggil di luar call-stack klik user (makanya dulu tombol
  // sosial/donate kelihatan "gak bisa diklik", padahal sebenernya kebuka-nya
  // yang diblok). Solusinya: link-link itu sekarang pakai target="_blank"
  // native di HTML, JS di sini cuma mainin SFX-nya aja, gak ikut campur
  // navigasinya sama sekali.
  //
  // FIX DOUBLE-WIPE: navigateWithSfx TIDAK lagi memanggil rrNavigate() untuk
  // link internal. Loading.js interceptLinks() sudah handle semua <a href>
  // internal secara otomatis lewat event bubble — kalau kita juga panggil
  // rrNavigate() di sini, wipe panel akan dibuat DUA KALI (double-wipe).
  // Sekarang: untuk link internal, hanya SFX yang diplay; navigasi + wipe
  // diserahkan sepenuhnya ke interceptLinks() di loading.js.
  function navigateWithSfx(e, url, isNewTab = false) {
    if (isNewTab) {
      triggerMenuClickSound();
      return; // biarin <a target="_blank"> jalan sendiri secara native
    }
    // Internal link: play SFX saja, JANGAN e.preventDefault() dan JANGAN rrNavigate().
    // interceptLinks() di loading.js akan menangkap event yang sama saat bubble
    // ke document dan handle wipe + navigate secara clean (single wipe).
    triggerMenuClickSound();
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
    // Hanya play SFX — navigasi + wipe di-handle interceptLinks() di loading.js
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
    btn.className = `toggle-blueprint-btn ${isEnabled ? "on" : "off"}`;
  }

// ============================================================
// BANNER SKINS — SVG backgrounds untuk player-profile-widget
// Dikonversi dari Customizable_2D_Game_Profile_Cards (App.tsx)
// ============================================================
const BANNER_SKINS = [
  {
    id: "arcade-spark",
    label: "Arcade Spark",
    accent: "#00aaff",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="as1_w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#001433"/><stop offset="100%" stop-color="#000d22"/></linearGradient>
        <filter id="asGlow_w"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#as1_w)"/>
      <path d="M0,8 Q50,3 100,8 Q150,13 200,8 Q250,3 300,8 Q350,13 400,8" stroke="#00aaff" stroke-width="0.8" fill="none" opacity="0.15"/>
      <path d="M0,18 Q50,13 100,18 Q150,23 200,18 Q250,13 300,18 Q350,23 400,18" stroke="#00aaff" stroke-width="0.8" fill="none" opacity="0.18"/>
      <path d="M0,30 Q50,25 100,30 Q150,35 200,30 Q250,25 300,30 Q350,35 400,30" stroke="#00aaff" stroke-width="0.8" fill="none" opacity="0.12"/>
      <path d="M150,0 L135,28 L148,28 L130,58 L150,32 L137,32 L155,0Z" fill="#ff6a00" opacity="0.85" filter="url(#asGlow_w)"/>
      <path d="M260,5 L247,32 L258,32 L242,62 L262,36 L251,36 L265,5Z" fill="#ff8c00" opacity="0.75" filter="url(#asGlow_w)"/>
      <polygon points="80,38 84,44 80,50 76,44" fill="#00ccff" opacity="0.7"/>
      <polygon points="200,18 204,24 200,30 196,24" fill="#00ccff" opacity="0.7"/>
      <polygon points="310,50 314,56 310,62 306,56" fill="#00ccff" opacity="0.65"/>
    </svg>`
  },
  {
    id: "cosmic-nebula",
    label: "Cosmic Nebula",
    accent: "#c084fc",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="nb1_w" cx="30%" cy="60%" r="60%"><stop offset="0%" stop-color="#9b30ff" stop-opacity="0.9"/><stop offset="60%" stop-color="#3b0764" stop-opacity="0.8"/><stop offset="100%" stop-color="#0a0014" stop-opacity="1"/></radialGradient>
        <radialGradient id="nb2_w" cx="75%" cy="40%" r="50%"><stop offset="0%" stop-color="#ff8fce" stop-opacity="0.8"/><stop offset="70%" stop-color="#6b21a8" stop-opacity="0.4"/><stop offset="100%" stop-color="#0a0014" stop-opacity="0"/></radialGradient>
        <filter id="nbBlur_w"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="400" height="80" fill="#06000f"/>
      <ellipse cx="120" cy="50" rx="140" ry="55" fill="url(#nb1_w)" filter="url(#nbBlur_w)"/>
      <ellipse cx="300" cy="30" rx="120" ry="48" fill="url(#nb2_w)" filter="url(#nbBlur_w)"/>
      <circle cx="20" cy="10" r="1" fill="white" opacity="0.7"/><circle cx="50" cy="5" r="0.8" fill="white" opacity="0.6"/>
      <circle cx="90" cy="20" r="1.5" fill="white" opacity="0.8"/><circle cx="170" cy="35" r="0.8" fill="white" opacity="0.5"/>
      <circle cx="240" cy="6" r="1" fill="white" opacity="0.7"/><circle cx="310" cy="8" r="0.8" fill="white" opacity="0.6"/>
      <circle cx="55" cy="15" r="2" fill="white" opacity="0.9"/><circle cx="330" cy="55" r="1.5" fill="#ffccee" opacity="0.8"/>
    </svg>`
  },
  {
    id: "cyber-leopard",
    label: "Cyber Leopard",
    accent: "#ff00aa",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs><radialGradient id="cl1_w" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#2d0059"/><stop offset="100%" stop-color="#0f0020"/></radialGradient></defs>
      <rect width="400" height="80" fill="url(#cl1_w)"/>
      <ellipse cx="30" cy="14" rx="14" ry="9" fill="#ff00aa" opacity="0.5"/>
      <ellipse cx="80" cy="38" rx="18" ry="11" fill="#ff00aa" opacity="0.6"/>
      <ellipse cx="140" cy="10" rx="12" ry="8" fill="#ff00aa" opacity="0.55"/>
      <ellipse cx="200" cy="50" rx="16" ry="10" fill="#ff00aa" opacity="0.5"/>
      <ellipse cx="260" cy="18" rx="14" ry="9" fill="#ff00aa" opacity="0.6"/>
      <ellipse cx="320" cy="42" rx="18" ry="11" fill="#ff00aa" opacity="0.55"/>
      <ellipse cx="370" cy="14" rx="12" ry="8" fill="#ff00aa" opacity="0.5"/>
      <ellipse cx="80" cy="38" rx="9" ry="5.5" fill="#0f0020" opacity="0.85"/>
      <ellipse cx="200" cy="50" rx="8" ry="5" fill="#0f0020" opacity="0.85"/>
      <ellipse cx="320" cy="42" rx="9" ry="5.5" fill="#0f0020" opacity="0.85"/>
      <rect width="400" height="80" fill="url(#cl1_w)" opacity="0.3"/>
    </svg>`
  },
  {
    id: "crimson-magma",
    label: "Crimson Magma",
    accent: "#00ffff",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="cm1_w" cx="50%" cy="80%" r="70%"><stop offset="0%" stop-color="#4a0000"/><stop offset="100%" stop-color="#0a0000"/></radialGradient>
        <filter id="cmGlow_w"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#cm1_w)"/>
      <path d="M50,14 L80,30 L110,20 L140,42 L170,26 L200,48 L230,34 L260,55 L290,36 L320,58 L350,40 L380,62" stroke="#1a0000" stroke-width="2.5" fill="none" opacity="0.8"/>
      <polygon points="60,46 40,72 80,72" fill="#00ffff" opacity="0.22" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <polygon points="80,36 62,60 100,60" fill="#00ffff" opacity="0.28" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <polygon points="200,52 182,76 220,76" fill="#00ffff" opacity="0.22" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <polygon points="330,40 312,65 350,65" fill="#00ffff" opacity="0.28" filter="url(#cmGlow_w)" stroke="#00ffff" stroke-width="0.5"/>
      <path d="M100,40 Q120,32 140,44 Q160,52 180,40" stroke="#8b0000" stroke-width="1.5" fill="none" opacity="0.8" filter="url(#cmGlow_w)"/>
    </svg>`
  },
  {
    id: "cyberpunk-sunset",
    label: "Cyberpunk Sunset",
    accent: "#00ffff",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="cs1_w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#c8823a"/><stop offset="50%" stop-color="#e05a6f"/><stop offset="100%" stop-color="#c44060"/></linearGradient>
        <filter id="csGlow_w"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#cs1_w)"/>
      <path d="M30,6 Q60,20 40,34 Q20,40 50,54 L0,80 L0,0Z" fill="#0a0005" opacity="0.85"/>
      <path d="M300,80 Q320,65 310,50 Q295,38 315,24 Q330,14 320,0 L400,0 L400,80Z" fill="#0a0005" opacity="0.8"/>
      <path d="M60,0 Q62,10 58,20 L56,32" stroke="#050005" stroke-width="4" fill="none" opacity="0.8"/>
      <path d="M160,0 Q163,14 159,26 L157,38" stroke="#050005" stroke-width="3" fill="none" opacity="0.7"/>
      <rect x="90" y="16" width="6" height="2" fill="#00ffff" opacity="0.75" filter="url(#csGlow_w)"/>
      <rect x="130" y="42" width="8" height="2" fill="#00ffff" opacity="0.72" filter="url(#csGlow_w)"/>
      <rect x="180" y="28" width="5" height="2" fill="#00ffff" opacity="0.8" filter="url(#csGlow_w)"/>
      <rect x="260" y="20" width="9" height="2" fill="#00ffff" opacity="0.76" filter="url(#csGlow_w)"/>
      <circle cx="115" cy="30" r="1.5" fill="#00ffff" opacity="0.8" filter="url(#csGlow_w)"/>
      <circle cx="240" cy="60" r="1.5" fill="#00ffff" opacity="0.8" filter="url(#csGlow_w)"/>
    </svg>`
  },
  {
    id: "bio-acid",
    label: "Bio-Acid Slime",
    accent: "#39ff14",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="ac1_w" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#39ff14" stop-opacity="0.4"/><stop offset="100%" stop-color="#050f00" stop-opacity="1"/></radialGradient>
        <filter id="acBlur_w"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="400" height="80" fill="#020802"/>
      <ellipse cx="80" cy="60" rx="100" ry="42" fill="#1a3300" opacity="0.9"/>
      <ellipse cx="200" cy="20" rx="120" ry="35" fill="#0d1f00" opacity="0.8"/>
      <ellipse cx="340" cy="55" rx="90" ry="38" fill="#162b00" opacity="0.9"/>
      <path d="M0,46 Q50,28 100,55 Q150,74 200,40 Q250,14 300,46 Q350,68 400,36 L400,80 L0,80Z" fill="#0a1800" opacity="0.9"/>
      <ellipse cx="60" cy="58" rx="25" ry="10" fill="#39ff14" opacity="0.25" filter="url(#acBlur_w)"/>
      <ellipse cx="200" cy="28" rx="30" ry="12" fill="#7fff00" opacity="0.2" filter="url(#acBlur_w)"/>
      <ellipse cx="350" cy="48" rx="20" ry="8" fill="#39ff14" opacity="0.3" filter="url(#acBlur_w)"/>
      <path d="M100,0 Q102,14 98,24 Q96,30 100,34" stroke="#39ff14" stroke-width="1.5" fill="none" opacity="0.5"/>
      <circle cx="100" cy="36" r="3" fill="#39ff14" opacity="0.6"/>
    </svg>`
  },
  {
    id: "pastel-twilight",
    label: "Pastel Twilight",
    accent: "#a78bfa",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="pt1_w" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2d1b69"/><stop offset="50%" stop-color="#7c3aed" stop-opacity="0.7"/><stop offset="100%" stop-color="#f5f0e8"/></linearGradient>
      </defs>
      <rect width="400" height="80" fill="url(#pt1_w)"/>
      <path d="M20,52 Q35,43 55,48 Q60,40 80,43 Q95,36 110,43 Q115,48 100,54Z" fill="#c4b5fd" opacity="0.3"/>
      <path d="M200,60 Q220,50 245,55 Q250,45 275,49 Q290,42 310,49 Q315,55 295,60Z" fill="#ddd6fe" opacity="0.25"/>
      <g transform="translate(30,14)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <g transform="translate(90,7)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <g transform="translate(160,20)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <g transform="translate(290,15)"><line x1="-3" y1="0" x2="3" y2="0" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/><line x1="0" y1="-3" x2="0" y2="3" stroke="#e9d5ff" stroke-width="1" opacity="0.7"/></g>
      <circle cx="70" cy="23" r="1.5" fill="#f5f0e8" opacity="0.8"/>
      <circle cx="200" cy="36" r="1.5" fill="#f5f0e8" opacity="0.8"/>
      <circle cx="330" cy="20" r="1.5" fill="#f5f0e8" opacity="0.8"/>
    </svg>`
  },
  {
    id: "dark-bramble",
    label: "Dark Bramble",
    accent: "#ff2d78",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="db1_w" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#2d1b3d"/><stop offset="100%" stop-color="#0a0010"/></radialGradient>
        <filter id="dbGlow_w"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="url(#db1_w)"/>
      <ellipse cx="100" cy="55" rx="130" ry="42" fill="#1a0d2e" opacity="0.7"/>
      <ellipse cx="300" cy="28" rx="120" ry="35" fill="#22103a" opacity="0.6"/>
      <path d="M0,40 Q40,26 60,40 Q70,32 85,40 Q95,34 110,40" stroke="#0d0018" stroke-width="3" fill="none" opacity="0.9"/>
      <path d="M300,0 Q320,16 310,28 Q305,36 318,45 Q325,52 315,64" stroke="#0d0018" stroke-width="2.5" fill="none" opacity="0.9"/>
      <path d="M55,43 Q58,40 62,43" stroke="#ff2d78" stroke-width="1.5" fill="none" opacity="0.7" filter="url(#dbGlow_w)"/>
      <path d="M310,48 Q313,45 317,48" stroke="#ff2d78" stroke-width="1.5" fill="none" opacity="0.6" filter="url(#dbGlow_w)"/>
      <ellipse cx="200" cy="62" rx="40" ry="14" fill="#4a0020" opacity="0.4" filter="url(#dbGlow_w)"/>
      <circle cx="20" cy="20" r="2" fill="#ff2d78" opacity="0.35" filter="url(#dbGlow_w)"/>
      <circle cx="80" cy="65" r="2" fill="#ff2d78" opacity="0.45" filter="url(#dbGlow_w)"/>
      <circle cx="350" cy="55" r="2" fill="#ff2d78" opacity="0.4" filter="url(#dbGlow_w)"/>
    </svg>`
  },
  {
    id: "mono-vortex",
    label: "Mono Vortex",
    accent: "#cccccc",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="mv1_w" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#333333"/><stop offset="60%" stop-color="#111111"/><stop offset="100%" stop-color="#000000"/></radialGradient>
        <filter id="mvBlur_w"><feGaussianBlur stdDeviation="1.5"/></filter>
      </defs>
      <rect width="400" height="80" fill="url(#mv1_w)"/>
      <path d="M200,40 Q280,20 350,60" stroke="#444" stroke-width="2.5" fill="none" opacity="0.5" filter="url(#mvBlur_w)"/>
      <path d="M200,40 Q120,20 50,60" stroke="#222" stroke-width="2" fill="none" opacity="0.5" filter="url(#mvBlur_w)"/>
      <path d="M200,40 Q200,0 280,10" stroke="#444" stroke-width="2" fill="none" opacity="0.4" filter="url(#mvBlur_w)"/>
      <path d="M200,40 Q200,80 120,70" stroke="#222" stroke-width="2" fill="none" opacity="0.4" filter="url(#mvBlur_w)"/>
      <polygon points="80,6 95,20 75,23" fill="white" opacity="0.7"/>
      <polygon points="310,52 330,62 315,68" fill="white" opacity="0.6"/>
      <polygon points="160,3 170,14 155,12" fill="white" opacity="0.5"/>
      <line x1="36" y1="32" x2="44" y2="32" stroke="white" stroke-width="1" opacity="0.4"/>
      <line x1="196" y1="65" x2="204" y2="65" stroke="white" stroke-width="1" opacity="0.4"/>
      <line x1="376" y1="58" x2="384" y2="58" stroke="white" stroke-width="1" opacity="0.4"/>
    </svg>`
  },
  {
    id: "toxic-monster",
    label: "Toxic Monster",
    accent: "#39ff14",
    svg: `<svg viewBox="0 0 400 80" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <radialGradient id="tm1_w" cx="80%" cy="50%" r="60%"><stop offset="0%" stop-color="#00ff88" stop-opacity="0.8"/><stop offset="60%" stop-color="#00cc44" stop-opacity="0.3"/><stop offset="100%" stop-color="#001a00" stop-opacity="0"/></radialGradient>
        <filter id="tmGlow_w"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="400" height="80" fill="#0a0f0a"/>
      <path d="M0,0 L15,8 L5,8 L20,17 L8,17 L18,26 L5,26 L22,35 L8,35 L20,44 L6,44 L18,54 L5,54 L15,72 L0,80Z" fill="#0f1a0f" opacity="0.95"/>
      <path d="M0,0 L35,12 L25,14 L42,24 L30,25 L46,34 L33,36 L48,46 L35,48 L46,58 L34,60 L40,74 L0,80Z" fill="#112011" opacity="0.95"/>
      <path d="M160,0 Q155,20 165,40 Q160,60 155,80" stroke="#39ff7a" stroke-width="2" fill="none" opacity="0.6" filter="url(#tmGlow_w)"/>
      <rect x="160" width="240" height="80" fill="url(#tm1_w)" opacity="0.4"/>
      <ellipse cx="240" cy="60" rx="30" ry="12" fill="#39ff14" opacity="0.3" filter="url(#tmGlow_w)"/>
      <ellipse cx="340" cy="20" rx="25" ry="10" fill="#00ff88" opacity="0.35" filter="url(#tmGlow_w)"/>
      <path d="M200,0 Q205,14 200,24 Q198,30 202,35" stroke="#39ff14" stroke-width="1.5" fill="none" opacity="0.4"/>
      <circle cx="202" cy="37" r="3" fill="#39ff14" opacity="0.5"/>
    </svg>`
  },
];

// Helper: dapatkan banner object by id
function getBannerById(id) {
  return BANNER_SKINS.find(b => b.id === id) || BANNER_SKINS[0];
}

// Render banner ke widget
function applyWidgetBanner(bannerId) {
  const bannerBg = document.getElementById("widgetBannerBg");
  const widget   = document.getElementById("lobbyProfileWidget");
  if (!bannerBg || !widget) return;
  const b = getBannerById(bannerId);
  bannerBg.innerHTML = b.svg;
  // Update accent color: avatar outline, stars
  widget.style.setProperty("--widget-accent", b.accent);
  const avatarWrapper = widget.querySelector(".widget-avatar-wrapper");
  if (avatarWrapper) avatarWrapper.style.outline = `2px solid ${b.accent}`;
  const stars = widget.querySelectorAll(".widget-star");
  stars.forEach(s => { s.style.color = b.accent; });
}

// Render banner swatches di modal Identity tab
function renderBannerSwatches(activeBannerId) {
  const row = document.getElementById("bannerSwatchesRow");
  const label = document.getElementById("bannerActiveLabel");
  if (!row) return;
  row.innerHTML = "";
  BANNER_SKINS.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "banner-swatch-btn" + (b.id === activeBannerId ? " active" : "");
    btn.title = b.label;
    btn.dataset.bannerId = b.id;
    btn.style.setProperty("--swatch-accent", b.accent);
    btn.innerHTML = `<div class="banner-swatch-inner">${b.svg}</div>`;
    btn.addEventListener("click", () => {
      profile.identity.bannerSkin = b.id;
      profileSave(profile);
      applyWidgetBanner(b.id);
      if (label) label.textContent = b.label;
      // Update active state semua swatch
      row.querySelectorAll(".banner-swatch-btn").forEach(el => {
        el.classList.toggle("active", el.dataset.bannerId === b.id);
      });
    });
    row.appendChild(btn);
  });
  if (label) {
    const active = getBannerById(activeBannerId);
    label.textContent = active.label;
  }
}

window.syncLobbyProfileDOM = function syncLobbyProfileDOM() {
  if (typeof profile === "undefined") return;

  // --- 1. PROSES KALKULASI DATA UTAMA ---
  // ── XP & LEVEL SYSTEM (stacking per-level) ──────────────────────────────
  // XP dibutuhkan untuk level N = 5000 × N
  // Total XP untuk reach level N = 2500 × N × (N-1)
  // Inverse: level dari total XP → cari N terbesar dimana 2500×N×(N-1) ≤ totalXP
  // Solusi kuadrat: N = (1 + sqrt(1 + 8×totalXP/5000)) / 2

  const MAX_LEVEL = 500;

  function xpToReachLevel(n) {
    // Total XP kumulatif yang dibutuhkan untuk mulai level n
    return 2500 * n * (n - 1);
  }
  function xpNeededForLevel(n) {
    // XP yang dibutuhkan di dalam level n
    return 5000 * n;
  }
  function computeLevelFromXP(totalXP) {
    // Hitung level dari total XP menggunakan rumus kuadrat
    const n = Math.floor((1 + Math.sqrt(1 + (8 * totalXP) / 5000)) / 2);
    return Math.min(Math.max(1, n), MAX_LEVEL);
  }
  function fmtXP(n) {
    // Format angka besar — K mulai dari 10.000 supaya angka kecil tetap terbaca penuh
    if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9)  return (n / 1e9 ).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6)  return (n / 1e6 ).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 10000) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toLocaleString();
  }

  const totalXP         = profile.stats.lifetimeScore || 0;
  const computedLevel   = computeLevelFromXP(totalXP);
  const xpThisLevel     = xpNeededForLevel(computedLevel);
  const xpStartOfLevel  = xpToReachLevel(computedLevel);
  const currentExpInLevel = Math.min(totalXP - xpStartOfLevel, xpThisLevel);
  const expWidthPercentage = Math.min((currentExpInLevel / xpThisLevel) * 100, 100);
  const isMaxLevel      = computedLevel >= MAX_LEVEL;

  // --- 2. SINKRONISASI WIDGET LOBBY UTAMA ---
  const widgetLevelNumber = document.getElementById("widgetLevelNumber");
  const widgetXpBarFill   = document.getElementById("widgetXpBarFill");
  const widgetUsername    = document.getElementById("widgetUsername");
  const widgetAvatar      = document.getElementById("widgetAvatar");
  if (widgetLevelNumber) widgetLevelNumber.textContent = isMaxLevel ? "MAX" : "LV " + computedLevel;
  if (widgetXpBarFill)   widgetXpBarFill.style.width   = `${expWidthPercentage}%`;
  if (widgetUsername)    widgetUsername.textContent     = profile.identity.username.toUpperCase();
  if (widgetAvatar) {
    const avatarSrc = (typeof getAvatarDisplay === "function")
      ? getAvatarDisplay(profile.identity.avatar)
      : (profile.identity.avatar === "default" || !profile.identity.avatar
          ? "assets/picture/new-logo.png"
          : profile.identity.avatar);
    if (widgetAvatar.src !== avatarSrc) widgetAvatar.src = avatarSrc;
  }

  // Banner skin sync
  const activeBannerId = profile.identity.bannerSkin || "arcade-spark";
  if (typeof applyWidgetBanner === "function") applyWidgetBanner(activeBannerId);
  if (typeof renderBannerSwatches === "function") renderBannerSwatches(activeBannerId);

  // --- 3. SINKRONISASI MODAL IDENTITY ---
  const modalLevelNumber  = document.getElementById("modalLevelNumber");
  const modalXpBarFill    = document.getElementById("modalXpBarFill");
  const modalXpTextRow    = document.getElementById("modalXpTextRow");
  const modalUsernameText = document.getElementById("modalUsernameText");
  const modalUsernameInput= document.getElementById("modalUsernameInput");
  const modalProfileImg   = document.getElementById("modalProfileImg");
  if (modalLevelNumber)  modalLevelNumber.textContent  = computedLevel;
  if (modalXpBarFill)    modalXpBarFill.style.width    = `${expWidthPercentage}%`;
  if (modalXpTextRow) {
    if (isMaxLevel) {
      modalXpTextRow.innerHTML = `<span>EXP PROGRESSION</span><span>MAX LEVEL ★</span>`;
    } else {
      const curFmt  = fmtXP(currentExpInLevel);
      const maxFmt  = fmtXP(xpThisLevel);
      modalXpTextRow.innerHTML = `<span>EXP PROGRESSION</span><span>${curFmt} / ${maxFmt} PTS</span>`;
    }
  }
  if (modalUsernameText) modalUsernameText.textContent = profile.identity.username.toUpperCase();
  if (modalUsernameInput && !modalUsernameInput.matches(":focus"))
    modalUsernameInput.value = profile.identity.username;
  if (modalProfileImg) {
    const avatarSrc = (typeof getAvatarDisplay === "function")
      ? getAvatarDisplay(profile.identity.avatar)
      : (profile.identity.avatar === "default" || !profile.identity.avatar
          ? "assets/picture/new-logo.png"
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

  // Volume slider & toggle dihandle oleh initSettingsHandlers() di atas.

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
      const hadGesture   = sessionStorage.getItem("rr_had_gesture") === "1";
      const fromNavigate = sessionStorage.getItem("rr_navigated")   === "1";
      // rr_navigated di-set loading.js saat navigate — flag terpisah dari
      // rr_transition yang sudah di-consume loading.js sebelum main.js jalan.
      // Kalau refresh: rr_navigated tidak ada → hapus gesture flag → fresh start.
      if (hadGesture && !fromNavigate) {
        sessionStorage.removeItem("rr_had_gesture");
        return false;
      }
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

    // Bersihkan visual tag dari item yang sedang/pernah preview — restore ke "SELECT"
    if (currentPreviewItem) {
      const tag = currentPreviewItem.querySelector(".song-status-tag");
      if (tag) tag.textContent = "SELECT";
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

    // ── Tunggu video siap sebelum play audio ──────────────────────────────
    // Supaya audio dan video muncul bersamaan, bukan audio duluan
    // sementara video masih loading (hitam/blank).
    // Fallback 2500ms: kalau video terlalu lama load (koneksi lambat),
    // audio tetap play tanpa menunggu lebih lama.
    const bv = document.getElementById("lobbyBgVideo");

    function doPlayAudio() {
      previewAudio.play().then(() => {
        if (vizCanvas) vizCanvas.classList.add("active");
        drawVisualizer();
        if (bv && bv.paused && bv.src) {
          bv.style.opacity = "1";
          bv.play().catch(() => {});
        }
      }).catch(() => {});
    }

    if (bv && bv.src && bv.readyState < 3) {
      // Video ada tapi belum siap — tunggu canplay atau max 2500ms
      let videoReady = false;

      const onVideoReady = () => {
        if (videoReady) return;
        videoReady = true;
        bv.removeEventListener("canplay", onVideoReady);
        bv.removeEventListener("error",   onVideoReady);
        doPlayAudio();
      };

      bv.addEventListener("canplay", onVideoReady, { once: true });
      bv.addEventListener("error",   onVideoReady, { once: true });

      // Fallback timeout — audio tidak tertahan lebih dari 2.5 detik
      setTimeout(() => {
        if (!videoReady) {
          videoReady = true;
          bv.removeEventListener("canplay", onVideoReady);
          bv.removeEventListener("error",   onVideoReady);
          doPlayAudio();
        }
      }, 2500);
    } else {
      // Video sudah siap atau tidak ada — langsung play
      doPlayAudio();
    }

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

    // Change background video — opacity tunggu canplay dulu
    if (bgVideo) {
      const src = songItems[currentIdx].getAttribute("data-video");
      bgVideo.style.opacity = "0";
      bgVideo.style.transition = "opacity 0.4s ease";
      setTimeout(() => {
        bgVideo.src = src;
        bgVideo.load();
        bgVideo.volume = (profile?.settings?.masterVolume ?? 100) / 100 * 0.4;

        const onReady = () => {
          bgVideo.play().catch(() => {});
          bgVideo.style.opacity = "1";
        };

        if (bgVideo.readyState >= 3) {
          // Sudah ada data (cache) — langsung tampilkan
          onReady();
        } else {
          bgVideo.addEventListener("canplay", onReady, { once: true });
          bgVideo.addEventListener("error",   onReady, { once: true });
          // Fallback: kalau 3 detik video belum canplay, tetap tampilkan
          setTimeout(() => {
            bgVideo.removeEventListener("canplay", onReady);
            bgVideo.removeEventListener("error",   onReady);
            bgVideo.style.opacity = "1";
          }, 3000);
        }
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

// Jalankan state persistence pertama kali saat lobby dimuat
switchGameMode(0, true);


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