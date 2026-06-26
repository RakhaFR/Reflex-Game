/* ==========================================================================
   REFLEXRYTHM — LOADING.JS
   Self-contained loading screen engine.

   CARA PAKAI:
   Tambahkan tag ini di <head> SEBELUM semua script lain di setiap halaman:
     <script src="js/loading.js"></script>

   Yang dilakukan file ini:
   1. Inject HTML + CSS loading screen langsung ke DOM (tidak perlu hardcode
      di tiap HTML).
   2. Track semua <img>, <audio>, <video>, <link rel="stylesheet"> di halaman.
   3. Simulasi progress minimum 1.2 detik supaya screen tidak langsung lenyap
      di koneksi cepat (UX feel tetap ada).
   4. Intercept semua <a href> dan navigasi programatik ke sesama halaman —
      tampilkan loading screen sebelum pindah, lalu navigate.
   5. Fade out otomatis setelah semua asset + minimum duration selesai.
   ========================================================================== */

(function ReflexLoadingEngine() {
  "use strict";

  // ── Konfigurasi ──────────────────────────────────────────────────────────
  const CFG = {
    minDuration:   1200,  // ms — minimum tampil supaya gak kedip
    fadeDuration:   400,  // ms — durasi CSS opacity fade out
    tickInterval:    40,  // ms — interval update progress bar
    interceptLinks: true, // abat semua <a href> internal → tampil loading dulu
    // Pesan status per tahap progress (0–100)
    messages: [
      { at:  0, msg: "INITIALIZING REFLEX ENGINE..." },
      { at: 20, msg: "LOADING CORE ASSETS..."        },
      { at: 40, msg: "PARSING BEATMAP DATA..."        },
      { at: 60, msg: "SYNCING AUDIO BUFFER..."        },
      { at: 80, msg: "RENDERING INTERFACE..."         },
      { at: 95, msg: "ALMOST READY..."                },
      { at: 100, msg: "SINKRONISASI SELESAI!"         },
    ],
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let _screen     = null;
  let _barFill    = null;
  let _pctEl      = null;
  let _statusEl   = null;
  let _dotsEls    = [];
  let _startTime  = Date.now();
  let _displayPct = 0;   // pct yang ditampilkan (dianimasikan smooth)
  let _targetPct  = 0;   // pct dari asset tracker
  let _ticker     = null;
  let _done       = false;

  // ── 1. INJECT CSS ─────────────────────────────────────────────────────────
  function injectCSS() {
    const style = document.createElement("style");
    style.id = "rr-loading-style";
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

      #rrLoadingScreen {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: #0d0d11;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Orbitron', 'Montserrat', sans-serif;
        overflow: hidden;
        transition: opacity ${CFG.fadeDuration}ms cubic-bezier(0.25, 1, 0.5, 1),
                    visibility ${CFG.fadeDuration}ms;
      }
      #rrLoadingScreen.rr-fade-out {
        opacity: 0;
        visibility: hidden;
      }

      .rr-wrap {
        position: relative;
        width: 85%;
        max-width: 600px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Banner atas */
      .rr-top-banner {
        background: #ffaa00;
        color: #000;
        font-size: 11px;
        font-weight: 900;
        padding: 5px 14px;
        align-self: flex-start;
        transform: skewX(-10deg);
        border: 3px solid #000;
        box-shadow: 4px 4px 0 #000;
        letter-spacing: 1px;
      }

      /* Panel judul */
      .rr-title-block {
        background: #ff1166;
        padding: 20px 30px;
        border: 4px solid #000;
        box-shadow: 6px 6px 0 #000;
        transform: skewX(-10deg);
        position: relative;
      }
      .rr-main-title {
        font-size: clamp(2rem, 6vw, 3.2rem);
        color: #fff;
        margin: 0;
        line-height: 1;
        letter-spacing: 2px;
        text-transform: uppercase;
        -webkit-text-stroke: 1.5px #000;
        transform: skewX(2deg);
        font-weight: 900;
      }
      .rr-sub-badge {
        position: absolute;
        bottom: -14px; right: 20px;
        background: #fff;
        color: #000;
        border: 3px solid #000;
        padding: 2px 12px;
        font-weight: 900;
        font-size: 11px;
        letter-spacing: 1px;
      }

      /* Progress section */
      .rr-progress-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
      }
      .rr-status-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        color: #fff;
        font-weight: 900;
        font-size: 13px;
      }
      .rr-status-text {
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #8a8996;
        font-size: 11px;
      }
      .rr-pct {
        font-size: 2rem;
        color: #ffaa00;
        -webkit-text-stroke: 1px #000;
        font-weight: 900;
        min-width: 70px;
        text-align: right;
      }

      /* Bar */
      .rr-bar-container {
        height: 26px;
        background: #201f26;
        border: 4px solid #000;
        box-shadow: 4px 4px 0 #000;
        transform: skewX(-10deg);
        overflow: hidden;
        padding: 2px;
      }
      .rr-bar-fill {
        height: 100%;
        background: #fff;
        border-right: 3px solid #000;
        transition: width 0.08s linear, background 0.3s;
        width: 0%;
      }

      /* Footer */
      .rr-footer-block {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 5px;
      }
      .rr-meta-box {
        background: #000;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 14px;
        transform: skewX(-10deg);
        border: 3px solid #000;
      }
      .rr-tag {
        color: #fff;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 1px;
      }
      .rr-beats-dot {
        display: flex;
        gap: 5px;
      }
      .rr-beats-dot .dot {
        width: 8px; height: 8px;
        background: #3c3b47;
        border: 1px solid #000;
        transition: background 0.15s;
      }
      .rr-beats-dot .dot.active { background: #ff5599; }
      .rr-sys-msg {
        color: #4a4957;
        font-weight: 900;
        font-size: 11px;
        letter-spacing: 1px;
      }
    `;
    // Inject ke <head> secepat mungkin
    (document.head || document.documentElement).appendChild(style);
  }

  // ── 2. INJECT HTML ────────────────────────────────────────────────────────
  function injectHTML() {
    const div = document.createElement("div");
    div.id = "rrLoadingScreen";
    div.innerHTML = `
      <div class="rr-wrap">
        <div class="rr-top-banner">
          <span>REFLEX ENGINE // v2.0</span>
        </div>
        <div class="rr-title-block">
          <h1 class="rr-main-title">LOADING DATA</h1>
          <div class="rr-sub-badge">BEAT SYNCHRONIZATION</div>
        </div>
        <div class="rr-progress-section">
          <div class="rr-status-row">
            <span id="rrStatusText" class="rr-status-text">INITIALIZING...</span>
            <span id="rrPct" class="rr-pct">0%</span>
          </div>
          <div class="rr-bar-container">
            <div id="rrBarFill" class="rr-bar-fill"></div>
          </div>
        </div>
        <div class="rr-footer-block">
          <div class="rr-meta-box">
            <span class="rr-tag">TRACK ENGINE</span>
            <div class="rr-beats-dot" id="rrDots">
              <div class="dot active"></div>
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>
          <div class="rr-sys-msg" id="rrSysMsg">STATUS: OK</div>
        </div>
      </div>
    `;

    // Inject ke <body> begitu tersedia, atau tunda ke DOMContentLoaded
    if (document.body) {
      document.body.insertBefore(div, document.body.firstChild);
    } else {
      document.addEventListener("DOMContentLoaded", function onDCL() {
        document.body.insertBefore(div, document.body.firstChild);
        document.removeEventListener("DOMContentLoaded", onDCL);
      }, { once: true });
    }

    _screen   = div;
    _barFill  = div.querySelector("#rrBarFill");
    _pctEl    = div.querySelector("#rrPct");
    _statusEl = div.querySelector("#rrStatusText");
    _dotsEls  = Array.from(div.querySelectorAll(".rr-beats-dot .dot"));
  }

  // ── 3. ASSET TRACKER ─────────────────────────────────────────────────────
  // Track img + stylesheet saja — audio/video sengaja di-skip karena
  // browser tidak akan fire canplaythrough/loadedmetadata tanpa gesture user
  // (autoplay policy), sehingga mereka akan stuck dan block loading selamanya.
  // Audio/video dianggap "done" otomatis oleh timeout fallback di ticker.
  function trackAssets() {
    const run = () => {
      const imgs  = Array.from(document.querySelectorAll("img[src]"));
      const links = Array.from(document.querySelectorAll("link[rel='stylesheet']"));
      const all   = [...imgs, ...links];
      const total = all.length || 1;
      let loaded  = 0;

      const onLoad = () => {
        loaded++;
        // Map ke range 10–85 supaya sisanya diisi oleh ticker organik
        _targetPct = Math.min(85, 10 + Math.round((loaded / total) * 75));
      };

      imgs.forEach(img => {
        if (img.complete) { onLoad(); return; }
        img.addEventListener("load",  onLoad, { once: true });
        img.addEventListener("error", onLoad, { once: true });
      });

      links.forEach(link => {
        try {
          if (link.sheet) { onLoad(); return; }
        } catch (_) {}
        link.addEventListener("load",  onLoad, { once: true });
        link.addEventListener("error", onLoad, { once: true });
      });

      if (all.length === 0) _targetPct = 85;
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }
  }

  // ── 4. PROGRESS TICKER ───────────────────────────────────────────────────
  // Strategi: asset tracker isi sampai 85%, sisanya ticker organik sampai 100%.
  // Finish condition: minDuration tercapai + DOM ready.
  // Hard timeout 4 detik — apapun yang terjadi, loading PASTI selesai.
  function startTicker() {
    let domReady = document.readyState !== "loading";
    if (!domReady) {
      document.addEventListener("DOMContentLoaded", () => { domReady = true; }, { once: true });
    }

    // Hard timeout: maksimal 4 detik, loading pasti selesai
    setTimeout(() => {
      _targetPct  = 100;
      _displayPct = 100;
      updateUI(100);
      clearInterval(_ticker);
      fadeOut();
    }, 4000);

    _ticker = setInterval(() => {
      // Kejar _targetPct dari asset tracker
      if (_displayPct < _targetPct) {
        _displayPct = Math.min(_targetPct, _displayPct + Math.ceil((_targetPct - _displayPct) * 0.2) + 1);
      }

      // Naik organik setelah asset tracker selesai (85 → 98), melambat di ujung
      if (_targetPct >= 85 && _displayPct < 98) {
        _displayPct = Math.min(98, _displayPct + 1);
      }

      // Naik pelan di awal kalau asset tracker belum update
      if (_targetPct < 10 && _displayPct < 30) {
        _displayPct = Math.min(30, _displayPct + 1);
      }

      updateUI(_displayPct);

      // Finish: min duration + DOM ready + bar sudah di 98+
      const elapsed    = Date.now() - _startTime;
      const minPassed  = elapsed >= CFG.minDuration;

      if (minPassed && domReady && _displayPct >= 98) {
        _displayPct = 100;
        _targetPct  = 100;
        updateUI(100);
        clearInterval(_ticker);
        setTimeout(fadeOut, 250);
      }
    }, CFG.tickInterval);
  }

  // ── 5. UPDATE UI ─────────────────────────────────────────────────────────
  function updateUI(pct) {
    if (!_screen) return;

    // Bar fill + warna
    if (_barFill) {
      _barFill.style.width = pct + "%";
      _barFill.style.background = pct > 65 ? "#ff1166" : "#ffffff";
    }

    // Persentase teks
    if (_pctEl) _pctEl.textContent = pct + "%";

    // Status message
    if (_statusEl) {
      const match = [...CFG.messages].reverse().find(m => pct >= m.at);
      if (match) _statusEl.textContent = match.msg;
    }

    // Animasi dots
    if (_dotsEls.length > 0) {
      const activeDot = Math.floor(pct / 25) % _dotsEls.length;
      _dotsEls.forEach((d, i) => d.classList.toggle("active", i === activeDot));
    }

    // Sys msg warna selesai
    const sysMsg = _screen.querySelector("#rrSysMsg");
    if (sysMsg && pct >= 100) {
      sysMsg.textContent  = "STATUS: READY";
      sysMsg.style.color  = "#00ff88";
    }
  }

  // ── 6. FADE OUT ──────────────────────────────────────────────────────────
  function fadeOut() {
    if (_done || !_screen) return;
    _done = true;
    _screen.classList.add("rr-fade-out");
    setTimeout(() => {
      if (_screen && _screen.parentNode) {
        _screen.parentNode.removeChild(_screen);
      }
      // Hapus injected style juga
      const style = document.getElementById("rr-loading-style");
      if (style && style.parentNode) style.parentNode.removeChild(style);
    }, CFG.fadeDuration + 50);
  }

  // ── 7. LINK INTERCEPTOR ──────────────────────────────────────────────────
  // Intercept semua klik <a href> ke halaman internal → tampilkan loading dulu.
  function interceptLinks() {
    if (!CFG.interceptLinks) return;

    // Delegate listener di document — works for dynamically added links too
    document.addEventListener("click", function(e) {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip: external link, hash-only, mailto, tel
      if (
        href.startsWith("http") ||
        href.startsWith("//")   ||
        href.startsWith("#")    ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")    ||
        anchor.target === "_blank"
      ) return;

      e.preventDefault();

      // Tampilkan loading screen baru lalu navigate
      showTransitionLoader(() => {
        try {
          sessionStorage.setItem("rr_transition", "1");
          sessionStorage.setItem("rr_had_gesture", "1");
        } catch(_) {}
        window.location.href = href;
      });
    }, true); // capture phase supaya intercept sebelum handler lain
  }

  // ── 8. TRANSITION LOADER ─────────────────────────────────────────────────
  // Buat loading screen baru untuk navigasi antar halaman.
  // Berbeda dari page-load loader — ini lebih singkat (min 600ms).
  function showTransitionLoader(navigateFn) {
    // Kalau loading screen awal masih ada, langsung navigate
    if (!_done) {
      navigateFn();
      return;
    }

    // Buat loading screen transisi baru
    const prevStyle = document.createElement("style");
    prevStyle.textContent = `
      #rrTransitionScreen {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: #0d0d11;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Orbitron', sans-serif;
        opacity: 0;
        transition: opacity 200ms ease;
      }
      #rrTransitionScreen.rr-t-in  { opacity: 1; }
      #rrTransitionScreen.rr-t-out { opacity: 0; }
      .rr-t-inner {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        width: 85%;
        max-width: 500px;
      }
      .rr-t-title {
        background: #ff1166;
        padding: 16px 32px;
        border: 4px solid #000;
        box-shadow: 6px 6px 0 #000;
        transform: skewX(-10deg);
        font-size: clamp(1.4rem, 5vw, 2.2rem);
        font-weight: 900;
        color: #fff;
        letter-spacing: 2px;
      }
      .rr-t-bar-wrap {
        width: 100%;
        height: 20px;
        background: #201f26;
        border: 4px solid #000;
        box-shadow: 4px 4px 0 #000;
        transform: skewX(-10deg);
        overflow: hidden;
        padding: 2px;
      }
      .rr-t-bar {
        height: 100%;
        width: 0%;
        background: #ffaa00;
        transition: width 0.05s linear;
      }
      .rr-t-msg {
        font-size: 11px;
        color: #8a8996;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
    `;
    document.head.appendChild(prevStyle);

    const el = document.createElement("div");
    el.id = "rrTransitionScreen";
    el.innerHTML = `
      <div class="rr-t-inner">
        <div class="rr-t-title">LOADING...</div>
        <div class="rr-t-bar-wrap"><div class="rr-t-bar" id="rrTBar"></div></div>
        <div class="rr-t-msg" id="rrTMsg">PREPARING NEXT STAGE...</div>
      </div>
    `;
    document.body.appendChild(el);

    const tBar = el.querySelector("#rrTBar");
    const tMsg = el.querySelector("#rrTMsg");
    const tMsgs = [
      "PREPARING NEXT STAGE...",
      "LOADING ASSETS...",
      "ALMOST THERE...",
    ];

    let pct = 0;
    const tStart = Date.now();
    const minDur = 600;

    // Fade in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("rr-t-in"));
    });

    const tTick = setInterval(() => {
      pct = Math.min(95, pct + Math.floor(Math.random() * 8) + 3);
      if (tBar) tBar.style.width = pct + "%";
      if (tMsg) tMsg.textContent = tMsgs[Math.floor(pct / 34)] || tMsgs[2];

      const elapsed = Date.now() - tStart;
      if (pct >= 95 && elapsed >= minDur) {
        clearInterval(tTick);
        if (tBar) tBar.style.width = "100%";
        if (tMsg) tMsg.textContent = "SIAP!";
        setTimeout(() => navigateFn(), 200);
      }
    }, 40);
  }

  // ── EXPOSE navigateTo untuk dipanggil dari JS lain ────────────────────────
  // Misal: window.rrNavigate("lobby.html") dari main.js
  window.rrNavigate = function(href) {
    showTransitionLoader(() => {
      // Tandai bahwa halaman berikutnya dibuka via transisi — skip page-load loader
      // Sekaligus tandai bahwa user sudah gesture — lobby bisa langsung preview musik
      try {
        sessionStorage.setItem("rr_transition", "1");
        sessionStorage.setItem("rr_had_gesture", "1");
      } catch(_) {}
      window.location.href = href;
    });
  };

  // ── INIT ─────────────────────────────────────────────────────────────────
  // Cek apakah halaman ini dibuka via transition loader (dari halaman lain).
  // Kalau iya, skip page-load loader — transition loader sudah cukup.
  const _fromTransition = (() => {
    try {
      const flag = sessionStorage.getItem("rr_transition");
      if (flag) { sessionStorage.removeItem("rr_transition"); return true; }
    } catch(_) {}
    return false;
  })();

  if (!_fromTransition) {
    injectCSS();
    injectHTML();
    trackAssets();
    startTicker();
  } else {
    // Halaman dari transisi: langsung expose rrNavigate saja, tidak inject loader
    _done = true; // tandai done supaya showTransitionLoader bekerja normal
  }

  // Intercept link setelah DOM siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", interceptLinks, { once: true });
  } else {
    interceptLinks();
  }

})();