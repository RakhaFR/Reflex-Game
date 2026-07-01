/* ==========================================================================
   REFLEXRYTHM — LOADING.JS  (FIXED: double-wipe & reveal delay)
   Self-contained loading screen engine.

   CARA PAKAI:
   Tambahkan tag ini di <head> SEBELUM semua script lain di setiap halaman:
     <script src="js/loading.js"></script>

   Yang dilakukan file ini:
   1. Inject HTML + CSS loading screen langsung ke DOM.
   2. Track semua <img> dan <link rel="stylesheet"> di halaman.
   3. Simulasi progress minimum 1.2 detik supaya screen tidak langsung lenyap.
   4. Intercept semua <a href> dan navigasi programatik — tampilkan:
      a. Wipe panel naik (cover screen) saat keberangkatan.
      b. Loading screen transisi (600ms) di halaman tujuan.
      c. Wipe panel turun (reveal) setelah transisi selesai.
   5. Fade out otomatis setelah asset + minimum duration selesai.

   FIXES v2.1:
   - Double-wipe bug: interceptLinks sekarang pakai data-rr-handled attribute
     untuk skip link yang sudah di-intercept JS lain via rrNavigate().
   - Reveal delay: chain timing di playTransitionScreen dipercepat —
     total overhead dari "bar selesai" ke wipe turun dikurangi dari ~480ms ke ~150ms.
   - Wipe timing: navigate() dipanggil di 450ms (sebelum 480ms transition selesai)
     — sekarang diperbaiki ke 520ms agar wipe benar-benar cover sebelum navigate.
   ========================================================================== */

(function ReflexLoadingEngine() {
  "use strict";

  // ── Konfigurasi ──────────────────────────────────────────────────────────
  const CFG = {
    minDuration:   1200,   // ms — minimum loading screen page-load
    fadeDuration:   400,   // ms — durasi CSS opacity fade out
    tickInterval:    40,   // ms — interval update progress bar
    interceptLinks: true,
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
  let _displayPct = 0;
  let _targetPct  = 0;
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
    (document.head || document.documentElement).appendChild(style);
  }

  // ── 2. INJECT HTML ────────────────────────────────────────────────────────
  function injectHTML() {
    const div = document.createElement("div");
    div.id = "rrLoadingScreen";
    div.innerHTML = `
      <div class="rr-wrap">
        <div class="rr-top-banner">
          <span>REFLEX ENGINE // Pre-Test</span>
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
  function trackAssets() {
    const run = () => {
      const imgs   = Array.from(document.querySelectorAll("img[src]"));
      const links  = Array.from(document.querySelectorAll("link[rel='stylesheet']"));
      const videos = Array.from(document.querySelectorAll("video[src], video source[src]"))
                       .map(el => el.tagName === "SOURCE" ? el.closest("video") : el)
                       .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe
      const audios = Array.from(document.querySelectorAll("audio[src], audio source[src]"))
                       .map(el => el.tagName === "SOURCE" ? el.closest("audio") : el)
                       .filter((a, i, arr) => arr.indexOf(a) === i);

      const all   = [...imgs, ...links, ...videos, ...audios];
      const total = all.length || 1;
      let loaded  = 0;

      const onLoad = () => {
        loaded++;
        _targetPct = Math.min(85, 10 + Math.round((loaded / total) * 75));
      };

      imgs.forEach(img => {
        if (img.complete) { onLoad(); return; }
        img.addEventListener("load",  onLoad, { once: true });
        img.addEventListener("error", onLoad, { once: true });
      });

      links.forEach(link => {
        try { if (link.sheet) { onLoad(); return; } } catch (_) {}
        link.addEventListener("load",  onLoad, { once: true });
        link.addEventListener("error", onLoad, { once: true });
      });

      // Video: tunggu canplay (cukup data untuk mulai play) bukan canplaythrough
      // — canplaythrough terlalu lama di koneksi lambat, canplay sudah cukup
      // untuk memastikan frame pertama video siap ditampilkan
      videos.forEach(video => {
        // readyState >= 3 = HAVE_FUTURE_DATA, sudah bisa diplay
        if (video.readyState >= 3) { onLoad(); return; }
        const onReady = () => { onLoad(); };
        video.addEventListener("canplay", onReady, { once: true });
        video.addEventListener("error",   onReady, { once: true });
        // Fallback: kalau video autoplay/preload=none, panggil load() dulu
        if (video.preload === "none" || video.preload === "") {
          video.preload = "metadata";
          video.load();
        }
      });

      // Audio: tunggu canplay juga
      audios.forEach(audio => {
        if (audio.readyState >= 3) { onLoad(); return; }
        const onReady = () => { onLoad(); };
        audio.addEventListener("canplay", onReady, { once: true });
        audio.addEventListener("error",   onReady, { once: true });
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
  function startTicker() {
    let domReady = document.readyState !== "loading";
    if (!domReady) {
      document.addEventListener("DOMContentLoaded", () => { domReady = true; }, { once: true });
    }

    // Soft fallback: kalau setelah 8 detik asset masih belum semua load
    // (misalnya video di koneksi sangat lambat), paksa selesai.
    // 8 detik >> 4 detik sebelumnya — beri waktu video cukup.
    setTimeout(() => {
      if (_done) return;
      _targetPct  = 100;
      _displayPct = 100;
      updateUI(100);
      clearInterval(_ticker);
      fadeOut();
    }, 8000);

    _ticker = setInterval(() => {
      if (_displayPct < _targetPct) {
        _displayPct = Math.min(_targetPct, _displayPct + Math.ceil((_targetPct - _displayPct) * 0.2) + 1);
      }
      if (_targetPct >= 85 && _displayPct < 98) {
        _displayPct = Math.min(98, _displayPct + 1);
      }
      if (_targetPct < 10 && _displayPct < 30) {
        _displayPct = Math.min(30, _displayPct + 1);
      }

      updateUI(_displayPct);

      const elapsed   = Date.now() - _startTime;
      const minPassed = elapsed >= CFG.minDuration;

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

    if (_barFill) {
      _barFill.style.width = pct + "%";
      _barFill.style.background = pct > 65 ? "#ff1166" : "#ffffff";
    }
    if (_pctEl) _pctEl.textContent = pct + "%";
    if (_statusEl) {
      const match = [...CFG.messages].reverse().find(m => pct >= m.at);
      if (match) _statusEl.textContent = match.msg;
    }
    if (_dotsEls.length > 0) {
      const activeDot = Math.floor(pct / 25) % _dotsEls.length;
      _dotsEls.forEach((d, i) => d.classList.toggle("active", i === activeDot));
    }
    const sysMsg = _screen.querySelector("#rrSysMsg");
    if (sysMsg && pct >= 100) {
      sysMsg.textContent = "STATUS: READY";
      sysMsg.style.color = "#00ff88";
    }
  }

  // ── 6. FADE OUT ──────────────────────────────────────────────────────────
  function fadeOut() {
    if (_done || !_screen) return;
    _done = true;
    _screen.classList.add("rr-fade-out");
    setTimeout(() => {
      if (_screen && _screen.parentNode) _screen.parentNode.removeChild(_screen);
      const style = document.getElementById("rr-loading-style");
      if (style && style.parentNode) style.parentNode.removeChild(style);
    }, CFG.fadeDuration + 50);
  }

  // ── 7. LINK INTERCEPTOR ──────────────────────────────────────────────────
  // FIX DOUBLE-WIPE: Skip link yang sudah di-mark pakai data-rr-handled="1"
  // oleh rrNavigate() — ini mencegah double-trigger wipe saat main.js
  // memanggil rrNavigate() untuk link yang juga kena interceptLinks listener.
  function interceptLinks() {
    if (!CFG.interceptLinks) return;

    document.addEventListener("click", function(e) {
      const anchor = e.target.closest("a[href]");
      if (!anchor) return;

      // SKIP: link ini sudah di-handle oleh rrNavigate() dari JS lain
      if (anchor.getAttribute("data-rr-handled") === "1") return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("http") || href.startsWith("//") ||
        href.startsWith("#")    || href.startsWith("mailto:") ||
        href.startsWith("tel:") || anchor.target === "_blank"
      ) return;

      e.preventDefault();
      showTransitionLoader(() => {
        try {
          sessionStorage.setItem("rr_transition", "1");
          sessionStorage.setItem("rr_navigated",  "1");
          sessionStorage.setItem("rr_had_gesture", "1");
        } catch(_) {}
        window.location.href = href;
      });
    }, true);
  }

  // ── 8. WIPE PANEL CSS ────────────────────────────────────────────────────
  // Panel hitam naik dari bawah saat keberangkatan, turun saat reveal.
  (function injectWipeCSS() {
    if (document.getElementById("rr-wipe-style")) return;
    const s = document.createElement("style");
    s.id = "rr-wipe-style";
    s.textContent = `
      #rrWipePanel {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: #0d0d11;
        z-index: 9999999;
        pointer-events: none;
        box-shadow: 0 -40px 80px 20px rgba(0,0,0,0.9) inset;
        transform: translateY(100%);
        transition: transform 480ms cubic-bezier(0.76, 0, 0.24, 1);
      }
      #rrWipePanel.wipe-in {
        transform: translateY(0%);
        pointer-events: all;
      }
      #rrWipePanel.wipe-out {
        transform: translateY(-100%);
        transition: transform 520ms cubic-bezier(0.76, 0, 0.24, 1);
        box-shadow: 0 40px 80px 20px rgba(0,0,0,0.9) inset;
        pointer-events: none;
      }
    `;
    (document.head || document.documentElement).appendChild(s);
  })();

  // ── 9. TRANSITION LOADER ─────────────────────────────────────────────────
  // Saat klik navigasi: wipe naik cover screen → navigate.
  // FIX: navigate dipanggil di 520ms (setelah 480ms CSS transition + 40ms buffer)
  // agar wipe benar-benar menutup layar sebelum pindah halaman.
  function showTransitionLoader(navigateFn) {
    if (!_done) {
      // Loading screen awal masih ada — langsung navigate
      navigateFn();
      return;
    }

    // Buat wipe panel dan slide naik (cover screen)
    let panel = document.getElementById("rrWipePanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "rrWipePanel";
      document.body.appendChild(panel);
    }
    panel.className = "";
    // Pastikan panel langsung block input sebelum animasi selesai
    panel.style.pointerEvents = "all";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.add("wipe-in");
      });
    });

    // FIX: tunggu 520ms (480ms transition + 40ms buffer) — dulu 500ms
    // yang kadang navigate sebelum wipe benar-benar di atas
    setTimeout(() => {
      navigateFn();
    }, 520);
  }

  // ── 10. TRANSITION SCREEN (di halaman tujuan) ────────────────────────────
  // Loading screen mini yang muncul setelah wipe cover,
  // sebelum wipe turun reveal halaman tujuan.
  // FIX REVEAL DELAY: chain timing dipercepat — semua delay non-esensial dipotong.
  function playTransitionScreen() {
    // Inject CSS transition screen
    const prevStyle = document.createElement("style");
    prevStyle.id = "rr-trans-style";
    prevStyle.textContent = `
      #rrTransitionScreen {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: #0d0d11;
        z-index: 9999998;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Orbitron', sans-serif;
        opacity: 1;
      }
      #rrTransitionScreen.rr-t-in  { opacity: 1; }
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
    document.body.insertBefore(el, document.body.firstChild);

    const tBar  = el.querySelector("#rrTBar");
    const tMsg  = el.querySelector("#rrTMsg");
    const tMsgs = ["PREPARING NEXT STAGE...", "LOADING ASSETS...", "ALMOST THERE..."];

    let pct    = 0;
    const tStart = Date.now();
    // FIX: minDur dikurangi ke 400ms (dari 600ms) — transition screen
    // fungsinya hanya cover gap antara wipe-in selesai dan halaman siap,
    // bukan membuat delay yang terasa bagi user
    const minDur = 400;

    // Transition screen langsung tampil (opacity:1 default) — tidak perlu fade-in
    // karena di balik wipe panel yang sudah cover layar, user tidak akan lihat
    // "pop" transisi apapun.

    const tTick = setInterval(() => {
      pct = Math.min(95, pct + Math.floor(Math.random() * 10) + 5);
      if (tBar) tBar.style.width = pct + "%";
      if (tMsg) tMsg.textContent = tMsgs[Math.floor(pct / 34)] || tMsgs[2];

      const elapsed = Date.now() - tStart;
      if (pct >= 95 && elapsed >= minDur) {
        clearInterval(tTick);
        if (tBar) tBar.style.width = "100%";
        if (tMsg) tMsg.textContent = "SIAP!";

        // Hapus transition screen LANGSUNG tanpa fade-out opacity —
        // reveal pakai wipe panel yang slide turun dari atas ke bawah,
        // jadi tidak perlu animasi opacity tambahan di sini.
        if (el.parentNode) el.parentNode.removeChild(el);
        const s = document.getElementById("rr-trans-style");
        if (s && s.parentNode) s.parentNode.removeChild(s);
        playRevealAnimation();
      }
    }, 40);
  }

  // ── 11. WIPE REVEAL (turun dari atas ke bawah setelah transition screen) ──
  // Panel start di translateY(0%) — cover penuh layar.
  // Lalu slide ke translateY(100%) — turun keluar ke bawah → reveal halaman.
  function playRevealAnimation() {
    // Inject CSS khusus reveal kalau rr-wipe-style belum ada di halaman ini
    if (!document.getElementById("rr-wipe-style")) {
      const s = document.createElement("style");
      s.id = "rr-wipe-style";
      s.textContent = `
        #rrWipePanel {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: #0d0d11;
          z-index: 9999999;
          pointer-events: all;
          box-shadow: 0 -40px 80px 20px rgba(0,0,0,0.9) inset;
          transform: translateY(0%);
        }
        #rrWipePanel.wipe-down {
          pointer-events: none;
          transform: translateY(100%);
          transition: transform 520ms cubic-bezier(0.76, 0, 0.24, 1);
          box-shadow: 0 -40px 80px 20px rgba(0,0,0,0.9) inset;
        }
      `;
      (document.head || document.documentElement).appendChild(s);
    }

    const panel = document.createElement("div");
    panel.id = "rrWipePanel";
    // Pastikan inline style posisi awal (cover penuh, di atas)
    panel.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:#0d0d11;z-index:9999999;pointer-events:all;
      box-shadow:0 -40px 80px 20px rgba(0,0,0,0.9) inset;
      transform:translateY(0%);
    `;
    document.body.insertBefore(panel, document.body.firstChild);

    // Force reflow agar browser commit posisi awal sebelum class ditambah
    requestAnimationFrame(() => {
      panel.getBoundingClientRect();
      panel.style.transition = "transform 520ms cubic-bezier(0.76, 0, 0.24, 1)";
      panel.style.transform  = "translateY(100%)";
      panel.style.pointerEvents = "none";
      setTimeout(() => {
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        // Cleanup rr-wipe-style kalau ini yang kita inject tadi
        const ws = document.getElementById("rr-wipe-style");
        if (ws && ws.parentNode) ws.parentNode.removeChild(ws);
      }, 540);
    });
  }

  // ── EXPOSE rrNavigate ─────────────────────────────────────────────────────
  // FIX DOUBLE-WIPE: Saat JS lain (main.js) memanggil rrNavigate() untuk
  // sebuah <a href>, kita tandai anchor tsb dengan data-rr-handled="1" agar
  // interceptLinks() skip anchor yang sama saat event bubble naik ke document.
  window.rrNavigate = function(href) {
    try {
      const anchors = document.querySelectorAll('a[href="' + href + '"]');
      anchors.forEach(a => a.setAttribute("data-rr-handled", "1"));
    } catch(_) {}

    showTransitionLoader(() => {
      try {
        sessionStorage.setItem("rr_transition", "1");
        sessionStorage.setItem("rr_navigated",  "1");
        sessionStorage.setItem("rr_had_gesture", "1");
      } catch(_) {}
      window.location.href = href;
    });
  };

  // ── EXPOSE rrTrackVideo ───────────────────────────────────────────────────
  // Untuk video yang src-nya di-set via JS (bukan dari HTML) — misalnya
  // bmBgVideo di game.html yang src-nya di-assign oleh basic-mode.js.
  // Panggil window.rrTrackVideo(videoEl) setelah src di-set supaya loading
  // screen tahu video ini harus ditunggu.
  // Kalau loading screen sudah selesai (_done=true), fungsi ini no-op.
  window.rrTrackVideo = function(videoEl) {
    if (_done || !videoEl) return;
    if (videoEl.readyState >= 3) return; // sudah siap
    const onReady = () => {
      _targetPct = Math.min(100, _targetPct + 5);
    };
    videoEl.addEventListener("canplay", onReady, { once: true });
    videoEl.addEventListener("error",   onReady, { once: true });
  };

  // ── INIT ─────────────────────────────────────────────────────────────────
  const _fromTransition = (() => {
    try {
      const flag = sessionStorage.getItem("rr_transition");
      if (flag) { sessionStorage.removeItem("rr_transition"); return true; }
    } catch(_) {}
    return false;
  })();

  if (!_fromTransition) {
    // Buka langsung (fresh / refresh) → loading screen penuh
    injectCSS();
    injectHTML();
    trackAssets();
    startTicker();
  } else {
    // Dari transisi → skip page-load loader
    // Jalankan: transition screen → wipe reveal
    _done = true;
    if (document.body) {
      playTransitionScreen();
    } else {
      document.addEventListener("DOMContentLoaded", playTransitionScreen, { once: true });
    }
  }

  // Intercept link setelah DOM siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", interceptLinks, { once: true });
  } else {
    interceptLinks();
  }

})();