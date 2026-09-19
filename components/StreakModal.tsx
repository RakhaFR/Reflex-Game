"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { ProfileData, getCurrentDisplayStreak } from "../lib/profile";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  onPlayNow?: () => void;
}

interface MascotTier {
  id: string;
  name: string;
  badge: string;
  color: string;
  accentGlow: string;
  videoActive: string;
  videoIdle: string;
  quoteActive: string;
  quoteIdle: string;
}

const STORAGE_BASE = "https://yznaoalbsrgaithstpxv.supabase.co/storage/v1/object/public/game-streak-L2D/";

const MASCOT_TIERS: { min: number; max: number; tier: MascotTier }[] = [
  {
    min: 0,
    max: 9,
    tier: {
      id: "kamia",
      name: "KAMIA",
      badge: "STREAK NOVICE",
      color: "#ff2d78",
      accentGlow: "rgba(255, 45, 120, 0.4)",
      videoActive: `${STORAGE_BASE}kamia-streak.mp4`,
      videoIdle: `${STORAGE_BASE}kamia-idle.mp4`,
      quoteActive: "Ayo bangun ritmemu setiap hari! Aku temani terus ya!",
      quoteIdle: "Kamu belum main hari ini... Apinya hampir padam nih, ayo main sekarang!",
    },
  },
  {
    min: 10,
    max: 24,
    tier: {
      id: "ocean",
      name: "OCEAN",
      badge: "STREAK OPERATOR",
      color: "#00e5ff",
      accentGlow: "rgba(0, 229, 255, 0.4)",
      videoActive: `${STORAGE_BASE}ocean-streak.mp4`,
      videoIdle: `${STORAGE_BASE}ocean-idle.mp4`,
      quoteActive: "Streak makin panas! Jangan biarkan apimu mendingin, Operator!",
      quoteIdle: "Hari ini belum ada ketukan baru. Masih santai atau mau selesaikan 1 lagu?",
    },
  },
  {
    min: 25,
    max: 49,
    tier: {
      id: "silia",
      name: "SILIA",
      badge: "STREAK MASTER",
      color: "#c084fc",
      accentGlow: "rgba(192, 132, 252, 0.4)",
      videoActive: `${STORAGE_BASE}silia-streak.mp4`,
      videoIdle: `${STORAGE_BASE}silia-idle.mp4`,
      quoteActive: "Ritme legenda tak terbendung. Pertahankan kendali refleksmu!",
      quoteIdle: "Ritmemu mulai meredup dalam hening. Mainkan 1 lagu sebelum hari berganti.",
    },
  },
  {
    min: 50,
    max: 99999,
    tier: {
      id: "trio",
      name: "TRIO LEGEND",
      badge: "STREAK DEITY",
      color: "#f59e0b",
      accentGlow: "rgba(245, 158, 11, 0.5)",
      videoActive: `${STORAGE_BASE}all-streak.mp4`,
      videoIdle: `${STORAGE_BASE}all-idle.mp4`,
      quoteActive: "Ritme Absolut! Seluruh semesta ritme tunduk pada kecepatan jarimu!",
      quoteIdle: "Dewa Refleks sedang menunggumu! Jangan biarkan apimu padam sekarang!",
    },
  },
];

const WEEK_DAYS = [
  { key: "mon", label: "SEN", fullName: "Senin" },
  { key: "tue", label: "SEL", fullName: "Selasa" },
  { key: "wed", label: "RAB", fullName: "Rabu" },
  { key: "thu", label: "KAM", fullName: "Kamis" },
  { key: "fri", label: "JUM", fullName: "Jumat" },
  { key: "sat", label: "SAB", fullName: "Sabtu" },
  { key: "sun", label: "MIN", fullName: "Minggu" },
];

export default function StreakModal({
  isOpen,
  onClose,
  profile,
  onPlayNow,
}: StreakModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFading, setIsFading] = useState(false);
  const loopTimerRef = useRef<NodeJS.Timeout | null>(null);

  const streakInfo = useMemo(() => getCurrentDisplayStreak(profile), [profile]);
  const maxStreak = profile.stats?.streak?.max || streakInfo.count;

  // Resolve Mascot Tier based on streak count
  const currentTier = useMemo(() => {
    const found = MASCOT_TIERS.find(
      (t) => streakInfo.count >= t.min && streakInfo.count <= t.max
    );
    return found ? found.tier : MASCOT_TIERS[0].tier;
  }, [streakInfo.count]);

  const activeVideoSrc = streakInfo.playedToday
    ? currentTier.videoActive
    : currentTier.videoIdle;

  const quoteText = streakInfo.playedToday
    ? currentTier.quoteActive
    : currentTier.quoteIdle;

  // Handle Video End with 2s pause + smooth fade to black
  const handleVideoEnded = () => {
    if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    setIsFading(true);

    loopTimerRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current
          .play()
          .catch((err) => console.warn("Video restart prevented:", err));
      }
      setIsFading(false);
    }, 2000);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  // Clean up timer on unmount or close
  useEffect(() => {
    return () => {
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
    };
  }, []);

  // Compute 7-day week calendar state (Mon = 0, Sun = 6)
  const weekCalendar = useMemo(() => {
    const now = new Date();
    // JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
    const jsDay = now.getDay();
    const todayIndex = (jsDay + 6) % 7; // Convert to Mon=0 .. Sun=6

    return WEEK_DAYS.map((day, idx) => {
      const isToday = idx === todayIndex;
      const isPast = idx < todayIndex;
      const isFuture = idx > todayIndex;

      // Determine if day was active based on streak
      let isCompleted = false;
      if (isToday) {
        isCompleted = streakInfo.playedToday;
      } else if (isPast) {
        const daysAgo = todayIndex - idx;
        const effectiveStreak = streakInfo.playedToday ? streakInfo.count : streakInfo.count + 1;
        isCompleted = effectiveStreak > daysAgo;
      }

      return {
        ...day,
        isToday,
        isPast,
        isFuture,
        isCompleted,
      };
    });
  }, [streakInfo]);

  if (!isOpen) return null;

  return (
    <div
      className="streak-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="streak-modal-container">
        {/* Glow halo background */}
        <div
          className="streak-modal-glow"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${currentTier.accentGlow}, transparent 70%)`,
          }}
        />

        {/* Modal Close Button */}
        <button
          className="streak-modal-close-btn"
          onClick={onClose}
          aria-label="Tutup"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Mascot Frame Section with Live2D Video */}
        <div className="streak-mascot-section">
          {/* Status / Tier indicator tag */}
          <div
            className={`streak-mascot-badge ${streakInfo.playedToday ? "active" : "idle"}`}
            style={{
              backgroundColor: streakInfo.playedToday ? currentTier.color : "rgba(100, 116, 139, 0.8)",
              borderColor: streakInfo.playedToday ? currentTier.color : "rgba(148, 163, 184, 0.4)",
            }}
          >
            {streakInfo.playedToday ? (
              <>
                <i className="fa-solid fa-fire"></i> {currentTier.badge}
              </>
            ) : (
              <>
                <i className="fa-solid fa-snowflake"></i> STREAK IDLE (BELUM AKTIF)
              </>
            )}
          </div>

          <div
            className={`streak-mascot-frame ${streakInfo.playedToday ? "tier-active" : "tier-idle"}`}
            style={{ borderColor: currentTier.color }}
          >
            <video
              ref={videoRef}
              key={activeVideoSrc}
              src={activeVideoSrc}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              className={`streak-live2d-video ${isFading ? "fade-black" : ""}`}
            />
            {/* Fade-to-black overlay */}
            <div className={`streak-video-fade-overlay ${isFading ? "active" : ""}`} />
          </div>

          {/* Speech Bubble */}
          <div className="streak-speech-bubble">
            <div className="speech-mascot-name" style={{ color: currentTier.color }}>
              <i className="fa-solid fa-comment-dots"></i> {currentTier.name}:
            </div>
            <p className="speech-quote-text">"{quoteText}"</p>
          </div>
        </div>

        {/* Streak Main Score Hero */}
        <div className="streak-hero-stats">
          <div className="streak-fire-big-wrap">
            <i
              className={`fa-solid fa-fire-flame-curved streak-big-flame ${streakInfo.playedToday ? "flame-on" : "flame-off"}`}
            ></i>
          </div>
          <div className="streak-count-hero-text">
            <span className="streak-big-number">{streakInfo.count}</span>
            <span className="streak-big-unit">HARI BERUNTUN</span>
          </div>

          <div
            className={`streak-status-pill ${streakInfo.playedToday ? "status-safe" : "status-warning"}`}
          >
            {streakInfo.playedToday ? (
              <>
                <i className="fa-solid fa-circle-check"></i> Streak Aman Hari Ini!
              </>
            ) : (
              <>
                <i className="fa-solid fa-triangle-exclamation"></i> Selesaikan 1 Lagu Hari Ini!
              </>
            )}
          </div>
        </div>

        {/* 7-Day Weekly Tracker (Duolingo Style) */}
        <div className="streak-weekly-card">
          <div className="weekly-card-header">
            <span className="weekly-card-title">
              <i className="fa-regular fa-calendar-days"></i> JADWAL MINGGU INI
            </span>
            <span className="weekly-best-record">
              <i className="fa-solid fa-trophy"></i> Best: <strong>{maxStreak} Hari</strong>
            </span>
          </div>

          <div className="weekly-days-grid">
            {weekCalendar.map((item) => (
              <div
                key={item.key}
                className={`weekly-day-item ${item.isToday ? "day-today" : ""} ${item.isCompleted ? "day-completed" : "day-uncompleted"} ${item.isFuture ? "day-future" : ""}`}
              >
                <div className="day-name-tag">{item.label}</div>
                <div className="day-circle-node">
                  {item.isCompleted ? (
                    <i className="fa-solid fa-fire day-fire-icon"></i>
                  ) : item.isToday ? (
                    <i className="fa-solid fa-bolt-lightning day-alert-icon"></i>
                  ) : item.isFuture ? (
                    <i className="fa-solid fa-lock day-lock-icon"></i>
                  ) : (
                    <div className="day-empty-dot" />
                  )}
                </div>
                {item.isToday && (
                  <span className="today-badge-chip">HARI INI</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="streak-modal-actions">
          {!streakInfo.playedToday ? (
            <button
              className="streak-action-btn streak-btn-play"
              onClick={() => {
                onClose();
                if (onPlayNow) onPlayNow();
              }}
            >
              <i className="fa-solid fa-play"></i> MAIN SEKARANG & AKTIFKAN STREAK
            </button>
          ) : (
            <button
              className="streak-action-btn streak-btn-done"
              onClick={onClose}
            >
              <i className="fa-solid fa-check"></i> MANTAP, LANJUTKAN RITME!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
