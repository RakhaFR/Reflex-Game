"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

const MESSAGES = [
  { at: 0, msg: "INITIALIZING REFLEX ENGINE..." },
  { at: 20, msg: "LOADING CORE ASSETS..." },
  { at: 40, msg: "PARSING BEATMAP DATA..." },
  { at: 60, msg: "SYNCING AUDIO BUFFER..." },
  { at: 80, msg: "RENDERING INTERFACE..." },
  { at: 95, msg: "ALMOST READY..." },
  { at: 100, msg: "SINKRONISASI SELESAI!" },
];

export default function LoadingScreen() {
  const pathname = usePathname();

  // Mode: "full" (Image 1 on initial load) or "transition" (Image 2 on page navigation)
  const [mode, setMode] = useState<"full" | "transition">("full");
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("INITIALIZING REFLEX ENGINE...");
  const [activeDot, setActiveDot] = useState(0);

  const targetPctRef = useRef(0);
  const displayPctRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const prevPathnameRef = useRef(pathname);

  // ── Asset Tracker & Loader Engine ──────────────────────────
  const startLoading = (isRouteTransition = false) => {
    doneRef.current = false;
    setVisible(true);
    setFading(false);
    setProgress(0);
    targetPctRef.current = 0;
    displayPctRef.current = 0;

    if (isRouteTransition) {
      setMode("transition");
      setStatusMsg("PREPARING NEXT STAGE...");
    } else {
      setMode("full");
      setStatusMsg("INITIALIZING REFLEX ENGINE...");
    }

    const startTime = Date.now();
    const minDur = isRouteTransition ? 400 : 1200;

    // Track images, videos, audios, stylesheets
    const runTracker = () => {
      const imgs = Array.from(document.querySelectorAll("img[src]"));
      const links = Array.from(document.querySelectorAll("link[rel='stylesheet']"));
      const videos = Array.from(
        document.querySelectorAll("video[src], video source[src]")
      )
        .map((el) => (el.tagName === "SOURCE" ? el.closest("video") : (el as HTMLVideoElement)))
        .filter((v, i, arr) => v && arr.indexOf(v) === i) as HTMLVideoElement[];

      const audios = Array.from(
        document.querySelectorAll("audio[src], audio source[src]")
      )
        .map((el) => (el.tagName === "SOURCE" ? el.closest("audio") : (el as HTMLAudioElement)))
        .filter((a, i, arr) => a && arr.indexOf(a) === i) as HTMLAudioElement[];

      const all = [...imgs, ...links, ...videos, ...audios];
      const total = all.length || 1;
      let loaded = 0;

      const onLoad = () => {
        loaded++;
        targetPctRef.current = Math.min(85, 10 + Math.round((loaded / total) * 75));
      };

      imgs.forEach((img) => {
        const image = img as HTMLImageElement;
        if (image.complete) {
          onLoad();
        } else {
          image.addEventListener("load", onLoad, { once: true });
          image.addEventListener("error", onLoad, { once: true });
        }
      });

      links.forEach((link) => {
        const l = link as HTMLLinkElement;
        try {
          if (l.sheet) {
            onLoad();
            return;
          }
        } catch {}
        l.addEventListener("load", onLoad, { once: true });
        l.addEventListener("error", onLoad, { once: true });
      });

      videos.forEach((video) => {
        if (video.readyState >= 3) {
          onLoad();
        } else {
          video.addEventListener("canplay", onLoad, { once: true });
          video.addEventListener("error", onLoad, { once: true });
          if (video.preload === "none" || video.preload === "") {
            video.preload = "metadata";
            video.load();
          }
        }
      });

      audios.forEach((audio) => {
        if (audio.readyState >= 3) {
          onLoad();
        } else {
          audio.addEventListener("canplay", onLoad, { once: true });
          audio.addEventListener("error", onLoad, { once: true });
        }
      });

      if (all.length === 0) {
        targetPctRef.current = 85;
      }
    };

    runTracker();

    // Safety timeout: max 5s if assets fail to load
    const safetyTimeout = setTimeout(() => {
      targetPctRef.current = 100;
    }, 5000);

    // Progress Ticker Interval (40ms)
    if (tickerRef.current) clearInterval(tickerRef.current);

    tickerRef.current = setInterval(() => {
      let cur = displayPctRef.current;
      let tar = targetPctRef.current;

      if (cur < tar) {
        cur = Math.min(tar, cur + Math.ceil((tar - cur) * 0.25) + 2);
      }
      if (tar >= 85 && cur < 98) {
        cur = Math.min(98, cur + 2);
      }
      if (tar < 10 && cur < 30) {
        cur = Math.min(30, cur + 2);
      }

      displayPctRef.current = cur;
      setProgress(cur);

      if (!isRouteTransition) {
        const match = [...MESSAGES].reverse().find((m) => cur >= m.at);
        if (match) setStatusMsg(match.msg);
        setActiveDot(Math.floor(cur / 25) % 4);
      } else {
        const tMsgs = ["PREPARING NEXT STAGE...", "LOADING ASSETS...", "ALMOST THERE..."];
        setStatusMsg(tMsgs[Math.floor(cur / 34)] || tMsgs[2]);
      }

      const elapsed = Date.now() - startTime;
      const minPassed = elapsed >= minDur;

      if (minPassed && cur >= 95) {
        displayPctRef.current = 100;
        setProgress(100);
        if (tickerRef.current) clearInterval(tickerRef.current);
        clearTimeout(safetyTimeout);

        if (isRouteTransition) {
          setStatusMsg("SIAP!");
          setTimeout(() => {
            setVisible(false);
            doneRef.current = true;
          }, 180);
        } else {
          setStatusMsg("SINKRONISASI SELESAI!");
          setTimeout(() => {
            setFading(true);
            setTimeout(() => {
              setVisible(false);
              doneRef.current = true;
            }, 400);
          }, 250);
        }
      }
    }, 40);
  };

  // ── Initial Start & Route Change Tracker ──────────────────
  useEffect(() => {
    startLoading(false);
    isFirstMountRef.current = false;

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      startLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap');

        /* IMAGE 1: FULL LOADING SCREEN (#rrLoadingScreen) */
        #rrLoadingScreen {
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: #0d0d11;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
          overflow: hidden;
          transition: opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), visibility 400ms;
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

        /* IMAGE 2: TRANSITION LOADING SCREEN (#rrTransitionScreen) */
        #rrTransitionScreen {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: #0d0d11;
          z-index: 9999998;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', sans-serif;
        }
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
          background: #ffaa00;
          transition: width 0.05s linear;
        }
        .rr-t-msg {
          font-size: 11px;
          color: #8a8996;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
      `}</style>

      {mode === "full" ? (
        /* IMAGE 1: FULL LOADING SCREEN ON PAGE LOAD */
        <div id="rrLoadingScreen" className={fading ? "rr-fade-out" : ""}>
          <div className="rr-wrap">
            <div className="rr-top-banner">
              <span>REFLEX ENGINE // Pre-Test</span>
            </div>
            <div className="rr-title-block">
              <h1 className="rr-main-title">LOADING DATA</h1>
              <div className="rr-sub-badge">BEAT SYNCHRONIZATION</div>
            </div>
            <div className="rr-progress-section">
              <div className="rr-status-row">
                <span id="rrStatusText" className="rr-status-text">
                  {statusMsg}
                </span>
                <span id="rrPct" className="rr-pct">
                  {progress}%
                </span>
              </div>
              <div className="rr-bar-container">
                <div
                  id="rrBarFill"
                  className="rr-bar-fill"
                  style={{
                    width: `${progress}%`,
                    background: progress > 65 ? "#ff1166" : "#ffffff",
                  }}
                ></div>
              </div>
            </div>
            <div className="rr-footer-block">
              <div className="rr-meta-box">
                <span className="rr-tag">TRACK ENGINE</span>
                <div className="rr-beats-dot" id="rrDots">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`dot ${activeDot === i ? "active" : ""}`}></div>
                  ))}
                </div>
              </div>
              <div
                className="rr-sys-msg"
                id="rrSysMsg"
                style={{ color: progress >= 100 ? "#00ff88" : "#4a4957" }}
              >
                {progress >= 100 ? "STATUS: READY" : "STATUS: OK"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* IMAGE 2: TRANSITION LOADING SCREEN ON ROUTE CHANGE */
        <div id="rrTransitionScreen">
          <div className="rr-t-inner">
            <div className="rr-t-title">LOADING...</div>
            <div className="rr-t-bar-wrap">
              <div className="rr-t-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="rr-t-msg">{statusMsg}</div>
          </div>
        </div>
      )}
    </>
  );
}
