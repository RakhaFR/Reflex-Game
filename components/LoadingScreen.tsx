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

  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("INITIALIZING...");
  const [activeDot, setActiveDot] = useState(0);

  const targetPctRef = useRef(0);
  const displayPctRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);
  const prevPathnameRef = useRef(pathname);

  // ── Asset Tracker & Loader Loop ────────────────────────────
  const startLoading = () => {
    doneRef.current = false;
    setVisible(true);
    setFading(false);
    setProgress(0);
    targetPctRef.current = 0;
    displayPctRef.current = 0;
    setStatusMsg("INITIALIZING...");

    const startTime = Date.now();

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

    // Safety timeout: max 6s if assets fail to load
    const safetyTimeout = setTimeout(() => {
      targetPctRef.current = 100;
    }, 6000);

    // Progress Ticker Interval (40ms)
    if (tickerRef.current) clearInterval(tickerRef.current);

    tickerRef.current = setInterval(() => {
      let cur = displayPctRef.current;
      let tar = targetPctRef.current;

      if (cur < tar) {
        cur = Math.min(tar, cur + Math.ceil((tar - cur) * 0.2) + 1);
      }
      if (tar >= 85 && cur < 98) {
        cur = Math.min(98, cur + 1);
      }
      if (tar < 10 && cur < 30) {
        cur = Math.min(30, cur + 1);
      }

      displayPctRef.current = cur;
      setProgress(cur);

      // Match status message
      const match = [...MESSAGES].reverse().find((m) => cur >= m.at);
      if (match) setStatusMsg(match.msg);

      setActiveDot(Math.floor(cur / 25) % 4);

      const elapsed = Date.now() - startTime;
      const minPassed = elapsed >= 1200; // Minimum 1.2 seconds

      if (minPassed && cur >= 98) {
        displayPctRef.current = 100;
        setProgress(100);
        setStatusMsg("SINKRONISASI SELESAI!");
        if (tickerRef.current) clearInterval(tickerRef.current);
        clearTimeout(safetyTimeout);

        setTimeout(() => {
          setFading(true);
          setTimeout(() => {
            setVisible(false);
            doneRef.current = true;
          }, 450);
        }, 250);
      }
    }, 40);
  };

  // ── Initial Start & Route Change Tracker ──────────────────
  useEffect(() => {
    startLoading();

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      startLoading();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      id="rrLoadingScreen"
      className={fading ? "rr-fade-out" : ""}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#0d0d11",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Orbitron', sans-serif",
        overflow: "hidden",
        opacity: fading ? 0 : 1,
        visibility: fading ? "hidden" : "visible",
        transition: "opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), visibility 400ms",
      }}
    >
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
  );
}
