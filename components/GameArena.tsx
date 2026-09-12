"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BM_TRACKS,
  NOM_TRACKS,
  BM_DIFF,
  NOM_DIFF,
  BM_ZONES,
  BM_NOTE_TYPES,
  NOM_NOTE_TYPES,
  PROFILE_DEFAULT,
  Track,
  DifficultyConfig,
  NoteType,
} from "@/lib/gameData";
import {
  profileLoad,
  recordNoteHit,
  recordNoteMissOrWrong,
  recordGameEnd,
  calcAccuracy,
  calcXpGained,
  playSfx,
  ProfileData,
} from "@/lib/profile";
import {
  supabase,
  isSupabaseConfigured,
  syncLocalProfileToCloud,
  recordScoreToCloud,
  recordBestScoreToCloud,
} from "@/lib/supabase";

interface ActiveNote {
  id: string;
  zoneIdx: number;
  x: number;
  y: number;
  key: string;
  type: NoteType;
  spawnTime: number;
  expireTime: number;
  windowMs: number;
  isExiting?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  type: "circle" | "square" | "star";
  gravity: number;
  rotation: number;
  rotSpeed: number;
  decay: number;
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
}

function GameArenaInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  const modeParam = (searchParams.get("mode") as "basic" | "notoriginal") || "basic";
  const trackParam = parseInt(searchParams.get("track") || "0") || 0;
  const diffParam = searchParams.get("diff") || "normal";

  const trackList = modeParam === "notoriginal" ? NOM_TRACKS : BM_TRACKS;
  const currentTrack: Track = trackList[trackParam] || trackList[0];
  const diffConfigs = modeParam === "notoriginal" ? NOM_DIFF : BM_DIFF;
  const currentDiff: DifficultyConfig =
    diffConfigs[diffParam as keyof typeof diffConfigs] || BM_DIFF.normal;

  // ── Game State ─────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData>(PROFILE_DEFAULT);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [, setBestCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(currentTrack.duration || 60);
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;
  const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [judgeText, setJudgeText] = useState<{ text: string; cls: string; key: number } | null>(
    null
  );
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isTouch =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches;
      setIsTouchDevice(isTouch);
    }
  }, []);

  // ── Popups State ───────────────────────────────────────────
  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isRpButtonsReady, setIsRpButtonsReady] = useState(false);
  const [resultAnimKey, setResultAnimKey] = useState(0);
  const [gameResult, setGameResult] = useState<{
    score: number;
    maxCombo: number;
    accuracy: string;
    rank: string;
    xpGained: number;
    previousBest: number;
    isNewBest: boolean;
  } | null>(null);

  // ── Stable Refs for Engine ─────────────────────────────────
  const profileRef = useRef<ProfileData>(profile);
  profileRef.current = profile;

  const currentTrackRef = useRef<Track>(currentTrack);
  currentTrackRef.current = currentTrack;

  const currentDiffRef = useRef<DifficultyConfig>(currentDiff);
  currentDiffRef.current = currentDiff;

  const modeParamRef = useRef<"basic" | "notoriginal">(modeParam);
  modeParamRef.current = modeParam;

  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const activeNotesRef = useRef<ActiveNote[]>([]);
  activeNotesRef.current = activeNotes;

  const trackAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkExpireTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animParticleRef = useRef<number | null>(null);

  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const resultAudioRef = useRef<HTMLAudioElement | null>(null);

  // Track stats for result calculation
  const totalHitClicksRef = useRef(0);
  const totalWrongClicksRef = useRef(0);
  const bestComboRef = useRef(0);
  const currentScoreRef = useRef(0);
  const currentComboRef = useRef(0);

  // ── Particle & Confetti Explosion Effect ───────────────────
  const triggerParticles = useCallback((xPercent: number, yPercent: number, mainColor: string, count: number = 30) => {
    if (profileRef.current.settings?.particleEffectEnabled === false) return;
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    if (!canvas.width) canvas.width = window.innerWidth || 1280;
    if (!canvas.height) canvas.height = window.innerHeight || 720;

    const screenX = (xPercent / 100) * canvas.width;
    const screenY = (yPercent / 100) * canvas.height;

    const palettes: Record<string, string[]> = {
      "#00ffcc": ["#00ffcc", "#00ff88", "#ffe500", "#ffffff", "#00e5ff"],
      "#00ff88": ["#00ff88", "#00c851", "#a8ffcb", "#ffffff", "#00ffcc"],
      "#ff4444": ["#ff4444", "#ff0000", "#ff8888", "#ffffff", "#cc0000"],
      "#ffe500": ["#ffe500", "#fff533", "#ff9500", "#ffffff", "#ffcc00"],
      "#00d4ff": ["#00d4ff", "#a0f0ff", "#ffffff", "#00bfff", "#7fffff"],
    };

    const colors = palettes[mainColor] || [mainColor, "#ffffff", "#ffe500", "#00ffcc"];
    const types: ("circle" | "square" | "star")[] = ["circle", "square", "star"];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      const chosenType = types[Math.floor(Math.random() * types.length)];

      particlesRef.current.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 3,
        color: chosenColor,
        alpha: 1,
        size: Math.random() * 8 + 4,
        type: chosenType,
        gravity: 0.22,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        decay: Math.random() * 0.02 + 0.015,
      });
    }
  }, []);

  const triggerConfettiBlast = useCallback(() => {
    if (profileRef.current.settings?.particleEffectEnabled === false) return;
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    if (!canvas.width) canvas.width = window.innerWidth || 1280;
    if (!canvas.height) canvas.height = window.innerHeight || 720;

    const colors = ["#00ffcc", "#ff2d78", "#ffe500", "#00e5ff", "#ffffff", "#ff9500", "#a8ffcb"];
    const types: ("circle" | "square" | "star")[] = ["square", "star", "circle"];

    const origins = [
      { x: canvas.width * 0.15, y: canvas.height * 0.3 },
      { x: canvas.width * 0.85, y: canvas.height * 0.3 },
      { x: canvas.width * 0.5, y: canvas.height * 0.2 },
    ];

    origins.forEach((orig) => {
      for (let i = 0; i < 45; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 5;
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        const chosenType = types[Math.floor(Math.random() * types.length)];

        particlesRef.current.push({
          x: orig.x,
          y: orig.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 5,
          color: chosenColor,
          alpha: 1,
          size: Math.random() * 10 + 5,
          type: chosenType,
          gravity: 0.25,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.4,
          decay: Math.random() * 0.015 + 0.01,
        });
      }
    });
  }, []);

  // ── Render Particle Canvas Loop ────────────────────────────
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const renderLoop = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const nextParticles: Particle[] = [];

        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.98;
          p.alpha -= p.decay;
          p.size *= 0.98;
          p.rotation += p.rotSpeed;

          if (p.alpha > 0.02 && p.size > 0.5) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            if (p.type === "star") {
              drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
            } else if (p.type === "square") {
              ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
            } else {
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
            nextParticles.push(p);
          }
        }
        particlesRef.current = nextParticles;
      }
      animParticleRef.current = requestAnimationFrame(renderLoop);
    };

    animParticleRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener("resize", resize);
      if (animParticleRef.current) cancelAnimationFrame(animParticleRef.current);
    };
  }, [mounted]);

  // ── Trigger Judge Animation Text ───────────────────────────
  const showJudge = useCallback((text: string, cls: string) => {
    setJudgeText({ text, cls, key: Date.now() + Math.random() });
  }, []);

  // ── Spawn Wave of Notes ────────────────────────────────────
  const spawnWave = useCallback(() => {
    if (!runningRef.current || pausedRef.current) return;

    const mode = modeParamRef.current;
    const diff = currentDiffRef.current;
    const currentProf = profileRef.current;
    const notePool = mode === "notoriginal" ? NOM_NOTE_TYPES : BM_NOTE_TYPES;

    const pickNoteType = (): NoteType => {
      const totalWeight = notePool.reduce((s, n) => s + n.weight, 0);
      let r = Math.random() * totalWeight;
      for (const t of notePool) {
        r -= t.weight;
        if (r <= 0) return t;
      }
      return notePool[0];
    };

    const keys =
      Array.isArray(currentProf.settings.keybinds) && currentProf.settings.keybinds.length >= 4
        ? currentProf.settings.keybinds.slice(0, 4).map((k) => k.toLowerCase())
        : ["q", "w", "e", "r"];

    setActiveNotes((prevNotes) => {
      const now = performance.now();
      const currentActive = prevNotes.filter((n) => !n.isExiting && now < n.expireTime);

      // Determine available zones far enough from active notes
      const activePositions = currentActive.map((n) => ({ x: n.x, y: n.y }));
      const MIN_DIST = 16;

      const isZoneFree = (z: { x: number; y: number }) => {
        return activePositions.every((ap) => Math.hypot(z.x - ap.x, z.y - ap.y) >= MIN_DIST);
      };

      let availableZones = BM_ZONES.map((z, i) => ({ ...z, idx: i })).filter(isZoneFree);
      if (availableZones.length === 0) {
        availableZones = BM_ZONES.map((z, i) => ({ ...z, idx: i }));
      }

      // Shuffle zones
      const shuffledZones = [...availableZones].sort(() => Math.random() - 0.5);

      // Keys already in use
      const usedKeys = new Set(currentActive.map((n) => n.key));
      const freeKeys = keys.filter((k) => !usedKeys.has(k));

      const spawnCount = Math.min(diff.noteCount, shuffledZones.length, freeKeys.length);
      const newWave: ActiveNote[] = [];

      for (let i = 0; i < spawnCount; i++) {
        const zone = shuffledZones[i];
        const type = pickNoteType();
        const key = freeKeys[i];

        newWave.push({
          id: `note-${now}-${Math.random().toString(36).substring(2, 7)}`,
          zoneIdx: zone.idx,
          x: zone.x,
          y: zone.y,
          key,
          type,
          spawnTime: now,
          expireTime: now + diff.windowMs,
          windowMs: diff.windowMs,
        });
      }

      return [...currentActive, ...newWave];
    });
  }, []);

  // ── Handle Note Hit / Click / Key ──────────────────────────
  const handleNoteClickOrKey = useCallback(
    (keyOrId: string, isDirectClick = false) => {
      if (!runningRef.current || pausedRef.current) return;

      const diff = currentDiffRef.current;
      const mode = modeParamRef.current;
      const now = performance.now();

      const currentNotes = activeNotesRef.current;
      const noteIdx = currentNotes.findIndex((n) =>
        !n.isExiting && (isDirectClick ? n.id === keyOrId : n.key === keyOrId.toLowerCase())
      );

      if (noteIdx < 0) {
        if (!isDirectClick) {
          // Wrong key press without matching note
          currentComboRef.current = 0;
          setCombo(0);
          totalWrongClicksRef.current += 1;
          recordNoteMissOrWrong(mode);
          showJudge("WRONG!", "bm-j-wrong bm-j-pop");
        }
        return;
      }

      const note = currentNotes[noteIdx];
      const elapsed = now - note.spawnTime;
      const remaining = note.expireTime - now;

      if (note.type.id === "avoid") {
        // Penalty for hitting avoid note
        currentComboRef.current = 0;
        setCombo(0);
        totalWrongClicksRef.current += 1;
        recordNoteMissOrWrong(mode);
        showJudge("WRONG!", "bm-j-wrong bm-j-pop");
        triggerParticles(note.x, note.y, "#ff4444");
      } else {
        const isBonus = note.type.id === "bonus";
        let multiplier = 1.0;
        let judgeStr = "GOOD";
        let judgeCls = "bm-j-good";

        // Tekan lebih cepat (elapsed kecil) = PERFECT!
        if (remaining <= 0) {
          judgeStr = "MISS";
          judgeCls = "bm-j-miss";
          multiplier = 0;
        } else if (elapsed <= diff.perfectMs) {
          multiplier = 2.0;
          judgeStr = "PERFECT!";
          judgeCls = "bm-j-perfect";
        } else if (elapsed <= diff.goodMs) {
          multiplier = 1.2;
          judgeStr = "GOOD";
          judgeCls = "bm-j-good";
        } else {
          multiplier = 1.0;
          judgeStr = "GOOD";
          judgeCls = "bm-j-good";
        }

        const currentC = currentComboRef.current;
        const comboBonus = 1 + currentC * 0.05;
        const inc = Math.round(note.type.scoreBase * multiplier * comboBonus);

        currentScoreRef.current += inc;
        setScore(currentScoreRef.current);

        const nextCombo = currentC + 1;
        currentComboRef.current = nextCombo;
        setCombo(nextCombo);
        if (nextCombo > bestComboRef.current) {
          bestComboRef.current = nextCombo;
          setBestCombo(nextCombo);
        }

        totalHitClicksRef.current += 1;
        recordNoteHit(isBonus, mode);

        showJudge(judgeStr, `${judgeCls} bm-j-pop`);
        triggerParticles(note.x, note.y, note.type.color);
      }

      // Mark note as exiting & remove
      setActiveNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, isExiting: true } : n))
      );
      setTimeout(() => {
        setActiveNotes((prev) => prev.filter((n) => n.id !== note.id));
      }, 150);
    },
    [showJudge, triggerParticles]
  );

  // ── Finish Game (Show Results & Play Result Music) ────────
  const finishGame = useCallback(() => {
    runningRef.current = false;
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (musicTimerRef.current) {
      clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
    if (checkExpireTimerRef.current) {
      clearInterval(checkExpireTimerRef.current);
      checkExpireTimerRef.current = null;
    }

    if (trackAudioRef.current) {
      trackAudioRef.current.pause();
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
    }

    // Play Result Music PixelCoinDash(hasil).mp3
    if (resultAudioRef.current) {
      resultAudioRef.current.currentTime = 0;
      resultAudioRef.current.volume =
        ((profileRef.current.settings?.masterVolume ?? 100) / 100) * 0.7;
      resultAudioRef.current.play().catch(() => {});
    }

    const finalScore = currentScoreRef.current;
    const finalCombo = bestComboRef.current;
    const totalHits = totalHitClicksRef.current;
    const totalWrongs = totalWrongClicksRef.current;
    const accStr = calcAccuracy(totalHits, totalWrongs);
    const accNum = totalHits > 0 ? Math.max(0, ((totalHits - totalWrongs) / totalHits) * 100) : 0;

    const totalDur = currentTrackRef.current.duration || 60;
    const elapsedSec = Math.max(0, totalDur - timeLeftRef.current);
    const completionRatio = Math.min(1, Math.max(0, elapsedSec / totalDur));

    // Calculating realistic Rank based on completion % and accuracy %
    let rank = "D";
    if (completionRatio < 0.35) {
      rank = "D"; // Early quit = D
    } else if (completionRatio < 0.65) {
      rank = accNum >= 80 ? "C" : "D";
    } else if (completionRatio < 0.88) {
      if (accNum >= 90) rank = "B";
      else if (accNum >= 75) rank = "C";
      else rank = "D";
    } else {
      if (accNum >= 98 && totalWrongs === 0) rank = "S+";
      else if (accNum >= 95 && totalWrongs === 0) rank = "S";
      else if (accNum >= 88) rank = "A";
      else if (accNum >= 75) rank = "B";
      else if (accNum >= 60) rank = "C";
      else rank = "D";
    }

    const calculatedXP = calcXpGained(finalScore, finalCombo, accNum, rank, diffParam);
    const { gainedXP, previousBest, isNewBest } = recordGameEnd(
      finalScore,
      finalCombo,
      modeParamRef.current,
      calculatedXP,
      currentTrack.id,
      diffParam,
      accStr,
      rank
    );
    const updatedProf = profileLoad();
    setProfile(updatedProf);

    // Auto-sync stats, XP & score entry to Supabase Cloud if user is authenticated
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          syncLocalProfileToCloud(data.user, updatedProf);
          recordScoreToCloud(
            data.user,
            updatedProf,
            currentTrack.id,
            modeParamRef.current,
            diffParam,
            finalScore,
            finalCombo,
            accStr,
            rank
          );
          if (isNewBest) {
            recordBestScoreToCloud(
              data.user,
              updatedProf,
              currentTrack.id,
              modeParamRef.current,
              diffParam,
              finalScore,
              finalCombo,
              accStr,
              rank
            );
          }
        }
      });
    }

    triggerConfettiBlast();

    setGameResult({
      score: finalScore,
      maxCombo: finalCombo,
      accuracy: accStr,
      rank,
      xpGained: gainedXP,
      previousBest,
      isNewBest,
    });
    setResultAnimKey(Date.now());
    setIsRpButtonsReady(false);
    setIsResultOpen(true);

    // Enable result buttons 3.1s after popup opens (matches 3s CSS delay)
    setTimeout(() => {
      setIsRpButtonsReady(true);
    }, 3100);
  }, []);

  // ── Cleanup all timers helper ──────────────────────────────
  const cleanupAllTimers = useCallback(() => {
    runningRef.current = false;
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    if (spawnTimerRef.current) {
      clearInterval(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (musicTimerRef.current) {
      clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
    if (checkExpireTimerRef.current) {
      clearInterval(checkExpireTimerRef.current);
      checkExpireTimerRef.current = null;
    }
  }, []);

  // ── Real-time Expiration Checker Loop ──────────────────────
  useEffect(() => {
    checkExpireTimerRef.current = setInterval(() => {
      if (!runningRef.current || pausedRef.current) return;
      const now = performance.now();
      const currentNotes = activeNotesRef.current;

      const expired = currentNotes.filter((n) => !n.isExiting && now >= n.expireTime);
      if (expired.length === 0) return;

      expired.forEach((note) => {
        if (note.type.id === "avoid") {
          // Avoid note successfully expired!
          showJudge("NICE!", "bm-j-nice bm-j-pop");
          triggerParticles(note.x, note.y, "#00ff88");
        } else {
          // Regular note missed
          currentComboRef.current = 0;
          setCombo(0);
          totalWrongClicksRef.current += 1;
          recordNoteMissOrWrong(modeParamRef.current);
          showJudge("MISS", "bm-j-miss bm-j-pop");
          triggerParticles(note.x, note.y, "#ff4444");
        }
      });

      const expiredIds = new Set(expired.map((n) => n.id));
      setActiveNotes((prev) =>
        prev.map((n) => (expiredIds.has(n.id) ? { ...n, isExiting: true } : n))
      );
      setTimeout(() => {
        setActiveNotes((prev) => prev.filter((n) => !expiredIds.has(n.id)));
      }, 150);
    }, 60);

    return () => {
      if (checkExpireTimerRef.current) {
        clearInterval(checkExpireTimerRef.current);
      }
    };
  }, [showJudge, triggerParticles]);

  // ── Countdown Audio Helper ─────────────────────────────────
  const playCountdownAudio = useCallback(() => {
    const prof = profileRef.current;
    if (prof.settings?.countdownSoundEnabled === false) return;
    const vol = (prof.settings?.masterVolume ?? 100) / 100;

    if (countdownAudioRef.current) {
      countdownAudioRef.current.pause();
      countdownAudioRef.current.currentTime = 0;
      countdownAudioRef.current.volume = Math.max(0, Math.min(1, vol));
      const p = countdownAudioRef.current.play();
      if (p !== undefined) {
        p.catch(() => {
          const fallback = new Audio("/assets/audio/countdown.mp3");
          fallback.volume = Math.max(0, Math.min(1, vol));
          fallback.play().catch(() => {});
        });
      }
    } else {
      const fallback = new Audio("/assets/audio/countdown.mp3");
      fallback.volume = Math.max(0, Math.min(1, vol));
      fallback.play().catch(() => {});
    }
  }, []);

  // ── Start Gameplay Engine with Countdown ───────────────────
  const startGame = useCallback(() => {
    cleanupAllTimers();

    if (resultAudioRef.current) {
      resultAudioRef.current.pause();
      resultAudioRef.current.currentTime = 0;
    }

    const track = currentTrackRef.current;
    const diff = currentDiffRef.current;

    // Reset counters
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    currentScoreRef.current = 0;
    currentComboRef.current = 0;
    bestComboRef.current = 0;
    totalHitClicksRef.current = 0;
    totalWrongClicksRef.current = 0;
    setActiveNotes([]);
    setIsResultOpen(false);
    setIsQuitConfirmOpen(false);
    setTimeLeft(track.duration || 60);

    const steps = ["3", "2", "1", "GO!"];
    let stepIdx = 0;

    const runStep = () => {
      const current = steps[stepIdx];
      if (stepIdx === 0) {
        playCountdownAudio();
      }
      setCountdownText(current);
      stepIdx++;

      if (stepIdx < steps.length) {
        countdownTimeoutRef.current = setTimeout(runStep, 1000);
      } else {
        // "GO!" displayed — wait 900ms then start game
        countdownTimeoutRef.current = setTimeout(() => {
          setCountdownText(null);

          // Start active gameplay
          runningRef.current = true;
          pausedRef.current = false;

          // Video
          if (bgVideoRef.current) {
            bgVideoRef.current.currentTime = 0;
            bgVideoRef.current.play().catch(() => {});
          }

          // Music
          if (trackAudioRef.current) {
            trackAudioRef.current.currentTime = 0;
            trackAudioRef.current.volume =
              ((profileRef.current.settings?.masterVolume ?? 100) / 100) * 0.8;
            trackAudioRef.current.play().catch(() => {});
          }

          // Initial wave & spawn interval
          spawnWave();
          spawnTimerRef.current = setInterval(spawnWave, diff.spawnIntervalMs);

          // Track duration countdown
          let dur = track.duration || 60;
          musicTimerRef.current = setInterval(() => {
            dur--;
            setTimeLeft(Math.max(0, dur));
            if (dur <= 0) {
              if (musicTimerRef.current) clearInterval(musicTimerRef.current);
              finishGame();
            }
          }, 1000);
        }, 900);
      }
    };

    runStep();
  }, [spawnWave, finishGame, cleanupAllTimers]);

  // ── Initial Start on Mount ─────────────────────────────────
  useEffect(() => {
    setMounted(true);
    document.body.className = "game-play-page";
    const p = profileLoad();
    setProfile(p);
    profileRef.current = p;

    if (countdownAudioRef.current) {
      countdownAudioRef.current.load();
    }
    if (resultAudioRef.current) {
      resultAudioRef.current.load();
    }

    startGame();

    return () => {
      document.body.className = "";
      cleanupAllTimers();
      if (trackAudioRef.current) trackAudioRef.current.pause();
      if (bgVideoRef.current) bgVideoRef.current.pause();
      if (resultAudioRef.current) resultAudioRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keyboard Listener ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isResultOpen) {
          if (resultAudioRef.current) {
            resultAudioRef.current.pause();
            resultAudioRef.current.currentTime = 0;
          }
          router.push("/lobby");
          return;
        }

        if (isQuitConfirmOpen) {
          setIsQuitConfirmOpen(false);
          pausedRef.current = false;
          if (trackAudioRef.current) trackAudioRef.current.play().catch(() => {});
          if (bgVideoRef.current) bgVideoRef.current.play().catch(() => {});
          return;
        }

        setIsQuitConfirmOpen(true);
        pausedRef.current = true;
        if (trackAudioRef.current) trackAudioRef.current.pause();
        if (bgVideoRef.current) bgVideoRef.current.pause();
        return;
      }
      if (!runningRef.current || pausedRef.current) return;

      const k = e.key.toLowerCase();
      setPressedKey(k);
      setTimeout(() => setPressedKey(null), 120);

      handleNoteClickOrKey(k);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNoteClickOrKey, isResultOpen, isQuitConfirmOpen, router]);

  if (!mounted) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#04040a", zIndex: 99999 }}></div>
    );
  }

  const keybinds =
    Array.isArray(profile.settings?.keybinds) && profile.settings.keybinds.length >= 4
      ? profile.settings.keybinds.slice(0, 4).map((k) => k.toLowerCase())
      : ["q", "w", "e", "r"];

  return (
    <>
      <canvas
        ref={particleCanvasRef}
        id="particleCanvas"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 999999,
        }}
      ></canvas>
      <div id="flashOverlay"></div>

      {/* COUNTDOWN OVERLAY 3..2..1..GO! */}
      {countdownText && (
        <div key={countdownText} id="countdownOverlay" className="countdown-overlay active">
          <div
            className={`countdown-num ${countdownText === "GO!" ? "go" : "pop-in"}`}
          >
            {countdownText}
          </div>
        </div>
      )}

      {/* BASIC / N.O.M MODE LAYOUT */}
      <main
        id="basicMode"
        className="active"
        suppressHydrationWarning
        onClick={(e) => {
          if (isTouchDevice || !profile.settings.mouseClickEnabled) return;
          // Trigger first active note if clicking background on desktop with mouseClick enabled
          if ((e.target as HTMLElement).closest(".bm-note")) return;
          const firstNote = activeNotesRef.current.find((n) => !n.isExiting);
          if (firstNote) {
            handleNoteClickOrKey(firstNote.id, true);
          }
        }}
      >
        {/* BACKGROUND VIDEO */}
        <video
          ref={bgVideoRef}
          id="bmBgVideo"
          src={currentTrack.bg}
          loop
          muted
          playsInline
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.25,
            filter: "brightness(.5) saturate(1.5)",
            zIndex: 0,
            pointerEvents: "none",
          }}
        ></video>
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "linear-gradient(to bottom,rgba(4,4,10,.75) 0%,rgba(4,4,10,.3) 50%,rgba(4,4,10,.85) 100%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        ></div>

        {/* HUD */}
        <div
          id="bmHud"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            zIndex: 20,
            gap: "12px",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}
          >
            <button
              id="exitBasicBtn"
              className="bm-exit-btn"
              type="button"
              onClick={() => {
                playSfx("clickSound");
                pausedRef.current = true;
                if (trackAudioRef.current) trackAudioRef.current.pause();
                if (bgVideoRef.current) bgVideoRef.current.pause();
                setIsQuitConfirmOpen(true);
              }}
            >
              ✕ QUIT
            </button>
            <span
              id="bmDiffBadge"
              className="bm-diff-badge"
              style={{ borderColor: currentDiff.color, color: currentDiff.color }}
            >
              {currentDiff.label}
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}
          >
            <span id="bmMusicTimer" className="bm-timer">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
            <span id="bmTrackTitle" className="bm-track-title">
              {currentTrack.title}
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}
          >
            <span className="bm-hud-lbl">SCORE</span>
            <span id="bmScore" className="bm-score-val">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* NOTE ARENA */}
        <div
          id="bmArena"
          style={{
            position: "fixed",
            inset: "72px 0 80px 0",
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          {activeNotes.map((note) => (
            <div
              key={note.id}
              className={`bm-note ${note.isExiting ? "bm-note-exit" : ""}`}
              style={
                {
                  left: `${note.x}%`,
                  top: `${note.y}%`,
                  cursor: "pointer",
                  pointerEvents: "auto",
                  "--nc": note.type.color,
                  "--rc": note.type.ring,
                  "--dur": `${note.windowMs}ms`,
                } as React.CSSProperties
              }
              onClick={(e) => {
                e.stopPropagation();
                handleNoteClickOrKey(note.id, true);
              }}
            >
              {!isTouchDevice && <span className="bm-key-label">{note.key.toUpperCase()}</span>}
              <div className="bm-ring"></div>
            </div>
          ))}
        </div>

        {/* JUDGE TEXT */}
        {judgeText && (
          <div
            className={`bm-judge ${judgeText.cls}`}
            key={judgeText.key}
            id="bmJudgeText"
          >
            {judgeText.text}
          </div>
        )}

        {/* COMBO BOX */}
        <div
          className={`bm-combo-box ${combo > 1 ? "active" : ""}`}
          id="bmComboContainer"
          style={{
            opacity: combo > 1 ? 1 : 0,
          }}
        >
          <span className="bm-combo-lbl">COMBO</span>
          <span id="bmComboText">x{combo}</span>
        </div>

        {/* KEY LEGEND (BOTTOM) */}
        {!isTouchDevice && (
          <div
            id="bmKeyLegend"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "76px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              background: "linear-gradient(to top,rgba(4,4,10,.97) 60%,transparent)",
              zIndex: 20,
              paddingBottom: "10px",
            }}
          >
            {keybinds.map((k, idx) => (
              <div
                key={idx}
                id={`bmChip-${k}`}
                className={`bm-key-chip ${pressedKey === k ? "pressed" : ""}`}
              >
                {k.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* QUIT CONFIRM POPUP */}
      <div className={`popup-overlay ${isQuitConfirmOpen ? "active" : ""}`} id="quitConfirmPopup">
        <div className="qc-wrap">
          <div className="qc-glow-border"></div>
          <div className="qc-card">
            <div className="qc-header">
              <div className="qc-star qc-star-yellow"></div>
              <div className="qc-star qc-star-cyan"></div>
              <div className="qc-sublabel">⚠ System Alert ⚠</div>
              <div className="qc-title-line">
                <span className="qc-title-mission">Track</span>
                <span className="qc-title-abort">Dihentikan!</span>
              </div>
            </div>

            <div className="qc-body">
              <div className="qc-icon-wrap">
                <i className="fa-solid fa-triangle-exclamation qc-icon"></i>
              </div>
              <div className="qc-stat-row">
                <span className="qc-stat-label">Status</span>
                <span className="qc-stat-value qc-warn-val">ABORT TRACK</span>
              </div>
              <div className="qc-stat-row">
                <span className="qc-stat-label">Peringatan</span>
                <span className="qc-stat-value">Progres akan hilang</span>
              </div>
              <div className="qc-confirm-bar">
                <div className="qc-xp-star"></div>
                <span className="qc-confirm-label">Yakin ingin berhenti?</span>
              </div>
            </div>

            <div className="qc-buttons">
              <button
                className="qc-btn qc-btn-yes"
                id="quitYesBtn"
                type="button"
                onClick={() => {
                  playSfx("clickSound");
                  setIsQuitConfirmOpen(false);
                  finishGame();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 13h7v-2H9V7l-6 5 6 5z"></path>
                  <path d="M19 3h-7v2h7v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2"></path>
                </svg>
                <span>Ya, Akhiri</span>
              </button>
              <button
                className="qc-btn qc-btn-no"
                id="quitNoBtn"
                type="button"
                onClick={() => {
                  playSfx("clickSound");
                  setIsQuitConfirmOpen(false);
                  pausedRef.current = false;
                  if (trackAudioRef.current) trackAudioRef.current.play().catch(() => {});
                  if (bgVideoRef.current) bgVideoRef.current.play().catch(() => {});
                }}
              >
                <i className="fa-solid fa-play qc-btn-icon"></i>
                <span>Lanjut Main</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT POPUP (TRACK CLEAR) */}
      <div
        className={`popup-overlay rp-overlay ${isResultOpen ? "active" : ""}`}
        id="basicResultPopup"
      >
        <div key={resultAnimKey} className="rp-wrap">
          <div className="rp-glow-border"></div>
          <div className="rp-card">
            <div className="rp-header">
              <div className="rp-star rp-star-yellow"></div>
              <div className="rp-star rp-star-cyan"></div>
              <div className="rp-sublabel">✦ Track Clear ✦</div>
              <div className="rp-title-line">
                <span className="rp-title-mission">Track</span>
                <span className="rp-title-completed">Completed!</span>
              </div>
              {gameResult?.isNewBest && (
                <div style={{ display: "inline-block", background: "linear-gradient(90deg, #ffe500, #ff9500)", color: "#0a0a0a", fontWeight: "bold", fontSize: "11px", padding: "4px 14px", borderRadius: "12px", letterSpacing: "1px", marginTop: "6px", textTransform: "uppercase", boxShadow: "0 0 14px rgba(255, 229, 0, 0.7)" }}>
                  <i className="fa-solid fa-crown" style={{ marginRight: "6px" }}></i>NEW PERSONAL BEST!
                </div>
              )}
            </div>

            <div className="rp-body">
              <div className="rp-left">
                <div className="rp-spider rp-spider-pink"></div>
                <div className="rp-art-wrap">
                  <div className="rp-art-frame">
                    <img
                      id="rpAlbumArt"
                      src={currentTrack.art || "/assets/picture/new-logo.png"}
                      alt="Track artwork"
                    />
                    <div className="rp-art-tint"></div>
                  </div>
                  <div className="rp-art-tape" id="rpDiffTape">
                    {currentDiff.label} · BPM {currentTrack.bpm}
                  </div>
                </div>
                <div className="rp-track-info">
                  <div className="rp-track-name" id="basicFinalTrack">
                    {currentTrack.title}
                  </div>
                  <div className="rp-track-sub" id="rpTrackSub">
                    {currentTrack.artist}
                  </div>
                </div>
              </div>

              <div className="rp-right">
                <div className="rp-stat-grid">
                  <div className="rp-stat-row">
                    <span className="rp-stat-label">Total Score</span>
                    <span className="rp-stat-value" id="basicFinalScore" style={{ color: gameResult?.isNewBest ? "#ffe500" : "#fff" }}>
                      {gameResult?.score.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="rp-stat-row" style={{ opacity: 0.85 }}>
                    <span className="rp-stat-label">Previous Best</span>
                    <span className="rp-stat-value" style={{ fontSize: "0.88rem", color: "#aaa" }}>
                      {gameResult?.previousBest ? gameResult.previousBest.toLocaleString() : "-"}
                    </span>
                  </div>
                  <div className="rp-stat-row">
                    <span className="rp-stat-label">Max Combo</span>
                    <span className="rp-stat-value" id="basicFinalCombo">
                      ×{gameResult?.maxCombo || "0"}
                    </span>
                  </div>
                  <div className="rp-stat-row rp-accent">
                    <span className="rp-stat-label">Accuracy</span>
                    <span className="rp-stat-value rp-accent-val" id="rpAccuracy">
                      {gameResult?.accuracy || "0%"}
                    </span>
                  </div>
                  <div className="rp-stat-row rp-accent">
                    <span className="rp-stat-label">Rank</span>
                    <span className="rp-stat-value rp-accent-val" id="rpRank">
                      {gameResult?.rank || "-"}
                    </span>
                  </div>
                </div>
                <div className="rp-xp-bar">
                  <div className="rp-xp-star"></div>
                  <span className="rp-xp-label">XP Gained</span>
                  <span className="rp-xp-value" id="rpXpGained">
                    +{gameResult?.xpGained.toLocaleString() || "0"} XP
                  </span>
                </div>
              </div>
            </div>

            <div className={`rp-buttons ${isRpButtonsReady ? "rp-buttons-ready" : ""}`}>
              <button
                className="rp-btn rp-btn-retry"
                id="basicPlayAgainBtn"
                type="button"
                onClick={() => {
                  playSfx("clickSound");
                  if (resultAudioRef.current) {
                    resultAudioRef.current.pause();
                    resultAudioRef.current.currentTime = 0;
                  }
                  startGame();
                }}
              >
                <i className="fa-solid fa-rotate-right rp-btn-icon"></i>
                <span>Main Lagi</span>
              </button>
              <button
                className="rp-btn rp-btn-lobby"
                id="basicGoHomeBtn"
                type="button"
                onClick={() => {
                  playSfx("clickSound");
                  if (resultAudioRef.current) {
                    resultAudioRef.current.pause();
                    resultAudioRef.current.currentTime = 0;
                  }
                  router.push("/lobby");
                }}
              >
                <span>Balik ke Lobby</span>
                <svg
                  viewBox="0 0 20 20"
                  className="rp-btn-icon"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 10h10M11 6l4 4-4 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AUDIO ELEMENTS */}
      <audio ref={trackAudioRef} id="bmTrackAudio" src={currentTrack.src} preload="auto"></audio>
      <audio id="clickSound" src="/assets/audio/click.mp3" preload="auto"></audio>
      <audio ref={countdownAudioRef} id="countdownSound" src="/assets/audio/countdown.mp3" preload="auto"></audio>
      <audio ref={resultAudioRef} id="resultMusic" src="/assets/music/PixelCoinDash(hasil).mp3" preload="auto"></audio>
    </>
  );
}

export default function GameArena() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "#04040a",
            fontFamily: "Orbitron, sans-serif",
            color: "#00e5ff",
            fontSize: "24px",
          }}
        >
          LOADING...
        </div>
      }
    >
      <GameArenaInner />
    </Suspense>
  );
}