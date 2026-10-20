"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TRACKS = [
  { title: "Butter-Fly", artist: "Koji Wada", bpm: 140, art: "/assets/picture/new-logo.png" },
  { title: "Night of Nights", artist: "ZUN", bpm: 165, art: "/assets/picture/background.jpg" },
];

const RANKS = ["S+", "S", "A", "B", "C", "D"];

const SPRAY_SRCS = [
  "/assets/audio/jet-set-radio/jet-set-radio-spray-1.mp3",
  "/assets/audio/jet-set-radio/jet-set-radio-spray-2.mp3",
  "/assets/audio/jet-set-radio/jet-set-radio-spray-3.mp3",
  "/assets/audio/jet-set-radio/jet-set-radio-spray-4.mp3",
  "/assets/audio/jet-set-radio/jet-set-radio-spray-5.mp3",
  "/assets/audio/jet-set-radio/jet-set-radio-spray-6.mp3",
  "/assets/audio/jet-set-radio/jet-set-radio-spray-7.mp3",
  "/assets/audio/jet-set-radio/jet-set-radio-success-8.mp3",
];

export default function TestResultPage() {
  const [open, setOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [isNewBest, setIsNewBest] = useState(true);
  const [rank, setRank] = useState("S+");
  const [trackIdx, setTrackIdx] = useState(0);
  const [score] = useState(148_200);
  const [prevBest] = useState(120_500);
  const [combo] = useState(87);
  const [accuracy] = useState("98.4%");
  const [xp] = useState(450);
  const [streak] = useState(5);
  const [step, setStep] = useState(0);
  const [buttonsReady, setButtonsReady] = useState(false);

  const pixelAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const currentAudiosRef = useRef<HTMLAudioElement[]>([]);

  const currentTrack = TRACKS[trackIdx];

  const clearAllSequence = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    currentAudiosRef.current.forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
      } catch {}
    });
    currentAudiosRef.current = [];
    if (pixelAudioRef.current) {
      pixelAudioRef.current.pause();
      pixelAudioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    return () => clearAllSequence();
  }, []);

  const playSfx = (idx: number, volume = 1.0) => {
    try {
      const a = new Audio(SPRAY_SRCS[idx]);
      a.volume = volume;
      currentAudiosRef.current.push(a);
      a.play().catch(() => {});
    } catch {}
  };

  function playAndOpen() {
    clearAllSequence();
    setStep(0);
    setButtonsReady(false);
    setAnimKey(Date.now());
    setOpen(true);

    // Timeline schedule
    // Step 1 (0ms): Header & "TRACK CLEAR" + spray-1
    playSfx(0, 1.0);
    setStep(1);

    // Step 2 (400ms): Album Art slams in + spray-2
    timeoutsRef.current.push(
      setTimeout(() => {
        playSfx(1, 1.0);
        setStep(2);
      }, 400)
    );

    // Step 3 (820ms): Diff tape, Title & Artist + spray-3
    timeoutsRef.current.push(
      setTimeout(() => {
        playSfx(2, 1.0);
        setStep(3);
      }, 820)
    );

    // Step 4 (1260ms): Total Score & Prev Best + spray-4
    timeoutsRef.current.push(
      setTimeout(() => {
        playSfx(3, 1.0);
        setStep(4);
      }, 1260)
    );

    // Step 5 (1720ms): Max Combo & Accuracy + spray-5
    timeoutsRef.current.push(
      setTimeout(() => {
        playSfx(4, 1.0);
        setStep(5);
      }, 1720)
    );

    // Step 6 (2350ms): Rank Stamp + spray-6
    timeoutsRef.current.push(
      setTimeout(() => {
        playSfx(5, 1.0);
        setStep(6);
      }, 2350)
    );

    // Step 7 (2950ms): XP Gained Bar & Streak + spray-7
    timeoutsRef.current.push(
      setTimeout(() => {
        playSfx(6, 1.0);
        setStep(7);
      }, 2950)
    );

    // Step 8 or Finish
    if (isNewBest) {
      // Step 8 (3550ms): NEW PERSONAL BEST crown badge + success-8
      timeoutsRef.current.push(
        setTimeout(() => {
          playSfx(7, 1.0);
          setStep(8);
        }, 3550)
      );

      // PixelCoinDash starts AFTER jet-set success finishes (~4750ms)
      timeoutsRef.current.push(
        setTimeout(() => {
          if (pixelAudioRef.current) {
            pixelAudioRef.current.currentTime = 0;
            pixelAudioRef.current.volume = 0.55;
            pixelAudioRef.current.play().catch(() => {});
          }
          setButtonsReady(true);
        }, 4750)
      );
    } else {
      // PixelCoinDash starts AFTER spray-7 finishes (~3650ms)
      timeoutsRef.current.push(
        setTimeout(() => {
          if (pixelAudioRef.current) {
            pixelAudioRef.current.currentTime = 0;
            pixelAudioRef.current.volume = 0.55;
            pixelAudioRef.current.play().catch(() => {});
          }
          setButtonsReady(true);
        }, 3650)
      );
    }
  }

  function closeResult() {
    clearAllSequence();
    setOpen(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#04040a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <div style={{ color: "#00f0ff", fontFamily: "Orbitron, sans-serif", fontSize: 14, letterSpacing: 2, fontWeight: 900, marginBottom: 4 }}>
        JET SET RADIO RESULT SEQUENCE TEST
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 6 }}>
        <label style={{ color: "#aaa", fontSize: 12, fontFamily: "Orbitron,sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          Track:
          <select value={trackIdx} onChange={(e) => setTrackIdx(+e.target.value)} style={{ background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 4, padding: "3px 8px", fontFamily: "Orbitron,sans-serif", fontSize: 11 }}>
            {TRACKS.map((t, i) => <option key={i} value={i}>{t.title}</option>)}
          </select>
        </label>
        <label style={{ color: "#aaa", fontSize: 12, fontFamily: "Orbitron,sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
          Rank:
          <select value={rank} onChange={(e) => setRank(e.target.value)} style={{ background: "#111", color: "#fff", border: "1px solid #333", borderRadius: 4, padding: "3px 8px", fontFamily: "Orbitron,sans-serif", fontSize: 11 }}>
            {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label style={{ color: "#ffe500", fontSize: 12, fontFamily: "Orbitron,sans-serif", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input type="checkbox" checked={isNewBest} onChange={(e) => setIsNewBest(e.target.checked)} />
          Highscore / New Best (Plays success-8)
        </label>
      </div>

      <button
        onClick={playAndOpen}
        style={{
          background: "linear-gradient(90deg,#ff2a7a,#ff9f43)",
          color: "#fff",
          fontFamily: "Orbitron,sans-serif",
          fontWeight: 900,
          fontSize: 13,
          letterSpacing: 2,
          padding: "14px 36px",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          boxShadow: "0 0 25px rgba(255,42,122,0.5)",
        }}
      >
        PLAY FULL JET SET SEQUENCE (1 - 7 {isNewBest ? "+ 8" : ""})
      </button>

      <div style={{ color: "#777", fontSize: 11, fontFamily: "Orbitron,sans-serif" }}>
        Current Step: <span style={{ color: "#00f0ff", fontWeight: "bold" }}>{step}</span> | PixelCoinDash:{" "}
        <span style={{ color: buttonsReady ? "#00ff88" : "#888" }}>
          {buttonsReady ? "PLAYING" : "WAITING FOR JET SET"}
        </span>
      </div>

      {/* Result Popup Overlay */}
      <AnimatePresence mode="wait">
        {open && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(4,4,10,0.92)",
              backdropFilter: "blur(14px)",
              zIndex: 9000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeResult();
            }}
          >
            <motion.div
              key={animKey}
              className="rp-wrap"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              <div className="rp-glow-border"></div>
              <div className="rp-card">
                {/* ── STEP 1: HEADER (spray-1) ── */}
                <div className="rp-header">
                  <div className="rp-star rp-star-yellow"></div>
                  <div className="rp-star rp-star-cyan"></div>
                  <motion.div
                    className="rp-sublabel"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 450, damping: 16 }}
                  >
                    <i className="fa-solid fa-star" style={{ marginRight: 4 }}></i> TRACK CLEAR
                  </motion.div>
                  <div className="rp-title-line">
                    <motion.span
                      className="rp-title-mission"
                      initial={{ opacity: 0, x: -25 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                    >
                      Track
                    </motion.span>
                    <motion.span
                      className="rp-title-completed"
                      initial={{ opacity: 0, scale: 0.5, rotate: -6 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 14 }}
                    >
                      Completed!
                    </motion.span>
                  </div>

                  {/* ── STEP 8: NEW BEST CROWN BADGE (success-8) ── */}
                  {isNewBest && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, y: 15 }}
                      animate={
                        step >= 8
                          ? { scale: 1, opacity: 1, y: 0 }
                          : { scale: 0, opacity: 0, y: 15 }
                      }
                      transition={{ type: "spring", stiffness: 480, damping: 14 }}
                      style={{
                        display: "inline-block",
                        background: "linear-gradient(90deg,#ffe500,#ff9500)",
                        color: "#0a0a0a",
                        fontWeight: 900,
                        fontSize: 11,
                        padding: "5px 16px",
                        borderRadius: 14,
                        letterSpacing: 1.5,
                        marginTop: 6,
                        textTransform: "uppercase",
                        boxShadow: "0 0 20px rgba(255,229,0,0.85), 0 0 40px rgba(255,149,0,0.5)",
                      }}
                    >
                      <i className="fa-solid fa-crown" style={{ marginRight: 6 }}></i>NEW PERSONAL BEST!
                    </motion.div>
                  )}
                </div>

                <div className="rp-body">
                  <div className="rp-left">
                    <div className="rp-spider rp-spider-pink"></div>
                    <div className="rp-art-wrap">
                      {/* ── STEP 2: ALBUM ART BANTING (spray-2) ── */}
                      <motion.div
                        className="rp-art-frame"
                        initial={{ opacity: 0, scale: 0.4, rotate: -22, y: -15 }}
                        animate={
                          step >= 2
                            ? { opacity: 1, scale: 1, rotate: -3, y: 0 }
                            : { opacity: 0, scale: 0.4, rotate: -22, y: -15 }
                        }
                        transition={{ type: "spring", stiffness: 420, damping: 14 }}
                      >
                        <img
                          src={currentTrack.art}
                          alt="Track artwork"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div className="rp-art-tint"></div>
                      </motion.div>

                      {/* ── STEP 3: DIFF TAPE (spray-3) ── */}
                      <motion.div
                        className="rp-art-tape"
                        initial={{ opacity: 0, y: 15, x: "-50%", skewX: -6 }}
                        animate={
                          step >= 3
                            ? { opacity: 1, y: 0, x: "-50%", skewX: -6 }
                            : { opacity: 0, y: 15, x: "-50%", skewX: -6 }
                        }
                        style={{ left: "50%" }}
                        transition={{ type: "spring", stiffness: 420, damping: 16 }}
                      >
                        HARD · BPM {currentTrack.bpm}
                      </motion.div>
                    </div>

                    {/* ── STEP 3: TRACK INFO (spray-3) ── */}
                    <div className="rp-track-info">
                      <motion.div
                        className="rp-track-name"
                        initial={{ opacity: 0, y: 10 }}
                        animate={
                          step >= 3
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: 10 }
                        }
                        transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      >
                        {currentTrack.title}
                      </motion.div>
                      <motion.div
                        className="rp-track-sub"
                        initial={{ opacity: 0, y: 8 }}
                        animate={
                          step >= 3
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: 8 }
                        }
                        transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.04 }}
                      >
                        {currentTrack.artist}
                      </motion.div>
                    </div>
                  </div>

                  <div className="rp-right">
                    <div className="rp-stat-grid">
                      {/* ── STEP 4: TOTAL SCORE & PREV BEST (spray-4) ── */}
                      <motion.div
                        className="rp-stat-row"
                        style={{ color: isNewBest ? "#ffe500" : "#fff" }}
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={
                          step >= 4
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.94 }
                        }
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      >
                        <span className="rp-stat-label">Total Score</span>
                        <span className="rp-stat-value" style={{ textShadow: "0 0 10px rgba(255,229,0,0.6)" }}>
                          {score.toLocaleString()}
                        </span>
                      </motion.div>

                      <motion.div
                        className="rp-stat-row"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={
                          step >= 4
                            ? { opacity: 0.85, scale: 1 }
                            : { opacity: 0, scale: 0.94 }
                        }
                        transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.04 }}
                      >
                        <span className="rp-stat-label">Previous Best</span>
                        <span className="rp-stat-value" style={{ fontSize: "0.88rem", color: "#aaa" }}>
                          {prevBest.toLocaleString()}
                        </span>
                      </motion.div>

                      {/* ── STEP 5: MAX COMBO & ACCURACY (spray-5) ── */}
                      <motion.div
                        className="rp-stat-row"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={
                          step >= 5
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.94 }
                        }
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      >
                        <span className="rp-stat-label">Max Combo</span>
                        <span className="rp-stat-value">×{combo}</span>
                      </motion.div>

                      <motion.div
                        className="rp-stat-row rp-accent"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={
                          step >= 5
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.94 }
                        }
                        transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.04 }}
                      >
                        <span className="rp-stat-label">Accuracy</span>
                        <span className="rp-stat-value rp-accent-val">{accuracy}</span>
                      </motion.div>

                      {/* ── STEP 6: RANK SLAM (spray-6) ── */}
                      <motion.div
                        className="rp-stat-row rp-accent"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={
                          step >= 6
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.94 }
                        }
                        transition={{ type: "spring", stiffness: 420, damping: 18 }}
                      >
                        <span className="rp-stat-label">Rank</span>
                        <motion.span
                          className="rp-stat-value rp-accent-val"
                          initial={{ opacity: 0, scale: 2.2 }}
                          animate={
                            step >= 6
                              ? { opacity: 1, scale: 1 }
                              : { opacity: 0, scale: 2.5 }
                          }
                          transition={{ type: "spring", stiffness: 480, damping: 13 }}
                          style={{
                            display: "inline-block",
                            fontSize: "1.4rem",
                            fontWeight: 900,
                            letterSpacing: 2,
                            textShadow: "0 0 16px rgba(255,159,67,0.9)",
                          }}
                        >
                          {rank}
                        </motion.span>
                      </motion.div>
                    </div>

                    {/* ── STEP 7: XP BAR & STREAK (spray-7) ── */}
                    <motion.div
                      className="rp-xp-bar"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={
                        step >= 7
                          ? { scaleX: 1, opacity: 1 }
                          : { scaleX: 0, opacity: 0 }
                      }
                      style={{ transformOrigin: "left" }}
                      transition={{ type: "spring", stiffness: 380, damping: 16 }}
                    >
                      <div className="rp-xp-star"></div>
                      <span className="rp-xp-label">XP Gained</span>
                      <span className="rp-xp-value">+{xp.toLocaleString()} XP</span>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={step >= 7 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                      transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.06 }}
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "5px 12px",
                        background: "rgba(255,106,0,0.12)",
                        border: "1px solid rgba(255,159,67,0.4)",
                        borderRadius: 6,
                        fontSize: "10.5px",
                        color: "#ff9f43",
                        fontFamily: "'Orbitron',sans-serif",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <i className="fa-solid fa-fire" style={{ color: "#ff6a00", fontSize: 12 }}></i>
                        <span>DAILY PLAY STREAK</span>
                      </span>
                      <strong style={{ fontSize: 11, color: "#fff", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {streak} DAYS <i className="fa-solid fa-fire" style={{ color: "#ff9f43", fontSize: 11 }}></i>
                      </strong>
                    </motion.div>
                  </div>
                </div>

                {/* ── BUTTONS READY AFTER ALL JET SET FINISHES ── */}
                <div className={`rp-buttons ${buttonsReady ? "rp-buttons-ready" : ""}`}>
                  <button className="rp-btn rp-btn-retry" onClick={closeResult}>
                    <i className="fa-solid fa-rotate-right rp-btn-icon"></i>
                    <span>Main Lagi</span>
                  </button>
                  <button className="rp-btn rp-btn-lobby" onClick={closeResult}>
                    <span>Balik ke Lobby</span>
                    <svg viewBox="0 0 20 20" className="rp-btn-icon" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 10h10M11 6l4 4-4 4" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <audio
        ref={pixelAudioRef}
        src="https://yznaoalbsrgaithstpxv.supabase.co/storage/v1/object/public/game-music/PixelCoinDash(hasil).mp3"
        preload="auto"
      />
    </div>
  );
}

