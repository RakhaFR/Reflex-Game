"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BM_TRACKS,
  NOM_TRACKS,
  BM_GAME_MODES,
  BM_DIFF,
  NOM_DIFF,
  BANNER_SKINS,
  PROFILE_DEFAULT,
  Track,
} from "@/lib/gameData";
import {
  profileLoad,
  profileSave,
  computeLevelFromXP,
  xpNeededForLevel,
  xpToReachLevel,
  fmtXP,
  calcAccuracy,
  getBannerById,
  getAvatarDisplay,
  getTrackBestScore,
  playSfx,
  ProfileData,
} from "@/lib/profile";
import { User } from "@supabase/supabase-js";
import {
  supabase,
  isSupabaseConfigured,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutSupabase,
  syncLocalProfileToCloud,
  fetchCloudProfile,
  uploadAvatarToStorage,
  fetchTrackLeaderboardFromCloud,
  TrackLeaderboardItem,
} from "@/lib/supabase";

export default function Lobby() {
  const router = useRouter();

  // ── Mount Check for 100% Hydration Safety ─────────────────
  const [mounted, setMounted] = useState(false);

  // ── Profile State ──────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData>(PROFILE_DEFAULT);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"tabIdentity" | "tabStats" | "tabSettings">("tabIdentity");
  const [usernameInput, setUsernameInput] = useState(PROFILE_DEFAULT.identity.username);
  const [keybindListeningIdx, setKeybindListeningIdx] = useState<number>(-1);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── Supabase Auth State ────────────────────────────────────
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthSubModalOpen, setIsAuthSubModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // ── Track Leaderboard State ───────────────────────────────
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<TrackLeaderboardItem[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // ── Periodic Fullscreen Prompt State ─────────────────────
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
    setIsTouchDevice(isTouch);

    const isFS = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (isFS) return;

    const lastDismissed = localStorage.getItem("rhg_fullscreen_prompt_dismissed");
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    if (!lastDismissed || now - parseInt(lastDismissed) > TWELVE_HOURS) {
      const timer = setTimeout(() => {
        if (
          !(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
          )
        ) {
          setShowFullscreenPrompt(true);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableFullscreen = () => {
    playSfx("clickSound");
    setShowFullscreenPrompt(false);
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
    else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
    else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen();
    else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
  };

  const handleDismissFullscreenPrompt = () => {
    playSfx("clickSound");
    setShowFullscreenPrompt(false);
    localStorage.setItem("rhg_fullscreen_prompt_dismissed", String(Date.now()));
  };

  // ── Game Mode & Track State ────────────────────────────────
  const [modeIdx, setModeIdx] = useState<number>(0);
  const [activeTrackIdx, setActiveTrackIdx] = useState<number>(0);
  const [activeDiff, setActiveDiff] = useState<string>("normal");
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  // ── Audio & Video Refs ─────────────────────────────────────
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const profileRef = useRef<ProfileData>(profile);
  profileRef.current = profile;

  const modeIdxRef = useRef<number>(modeIdx);
  modeIdxRef.current = modeIdx;

  const currentMode = BM_GAME_MODES[modeIdx] || BM_GAME_MODES[0];
  const activeTracks: Track[] = currentMode.id === "notoriginal" ? NOM_TRACKS : BM_TRACKS;
  const currentTrack: Track = activeTracks[activeTrackIdx] || activeTracks[0];
  const diffConfigs = currentMode.id === "notoriginal" ? NOM_DIFF : BM_DIFF;

  // ── Toast Helper ───────────────────────────────────────────
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 2400);
  };

  // ── Stop Audio Preview ─────────────────────────────────────
  const stopPreview = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = "";
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.pause();
    }
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.disconnect(); } catch {}
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try { analyserRef.current.disconnect(); } catch {}
      analyserRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.classList.remove("active");
    }
    setIsPreviewing(false);
  }, []);

  // ── Draw Visualizer on Canvas ──────────────────────────────
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    animFrameRef.current = requestAnimationFrame(drawVisualizer);

    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(data);

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const barCount = 64;
    const step = Math.floor(bufLen / barCount);
    const barW = W / barCount - 1;

    for (let i = 0; i < barCount; i++) {
      const val = data[i * step] / 255;
      const barH = val * H;
      const x = i * (barW + 1);
      const y = H - barH;

      const grad = ctx.createLinearGradient(x, y, x, H);
      grad.addColorStop(0, "rgba(255,255,255,0.9)");
      grad.addColorStop(1, "rgba(0,229,255,0.5)");

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);
    }
  }, []);

  // ── Start Audio Preview ────────────────────────────────────
  const startPreview = useCallback(
    (track: Track) => {
      stopPreview();
      if (!track?.src) return;

      try {
        const audio = new Audio();
        audio.src = track.src;
        const vol = ((profileRef.current?.settings?.masterVolume ?? 100) / 100) * 0.6;
        audio.volume = Math.max(0, Math.min(1, vol));
        previewAudioRef.current = audio;

        try {
          if (!audioCtxRef.current) {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
              audioCtxRef.current = new AudioCtx();
            }
          }
          if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume();
          }

          if (audioCtxRef.current) {
            const analyser = audioCtxRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;

            const source = audioCtxRef.current.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioCtxRef.current.destination);
            sourceNodeRef.current = source;
          }
        } catch {
          // Visualizer fallback if Web Audio is restricted
        }

        audio.play().then(() => {
          setIsPreviewing(true);
          if (canvasRef.current) {
            canvasRef.current.classList.add("active");
            canvasRef.current.width = canvasRef.current.parentElement?.offsetWidth || 400;
            canvasRef.current.height = canvasRef.current.parentElement?.offsetHeight || 150;
          }
          drawVisualizer();
        }).catch(() => {});

        // Stop preview after 30 seconds
        previewTimerRef.current = setTimeout(() => {
          stopPreview();
        }, 30000);
      } catch (err) {
        console.error("Preview error:", err);
      }
    },
    [stopPreview, drawVisualizer]
  );

  // ── Select Track ───────────────────────────────────────────
  const selectTrack = useCallback(
    (idx: number, playAudio = true, targetModeIdx?: number) => {
      const activeMode = targetModeIdx ?? modeIdxRef.current;
      const tracks = activeMode === 1 ? NOM_TRACKS : BM_TRACKS;
      const clampedIdx = Math.max(0, Math.min(idx, tracks.length - 1));
      setActiveTrackIdx(clampedIdx);
      localStorage.setItem("rhg_active_track", String(clampedIdx));

      const track = tracks[clampedIdx];
      if (track) {
        if (track.color) {
          document.documentElement.style.setProperty("--track-accent", track.color);
        }
        if (track.difficulties?.length && !track.difficulties.includes(activeDiff)) {
          setActiveDiff(track.difficulties[0]);
        }
        if (bgVideoRef.current && track.bg) {
          const bv = bgVideoRef.current;
          bv.style.opacity = "0.2";
          bv.style.transition = "opacity 0.3s ease";
          setTimeout(() => {
            if (bgVideoRef.current) {
              bgVideoRef.current.src = track.bg;
              bgVideoRef.current.load();
              bgVideoRef.current.play().then(() => {
                if (bgVideoRef.current) bgVideoRef.current.style.opacity = "1";
              }).catch(() => {
                if (bgVideoRef.current) bgVideoRef.current.style.opacity = "1";
              });
            }
          }, 150);
        }
        if (playAudio) {
          startPreview(track);
        }

        // Scroll track item + diff panel into view smoothly
        setTimeout(() => {
          const panelEl = document.getElementById(`diffPanel-${clampedIdx}`);
          const itemEl = document.getElementById(`songItem-${clampedIdx}`);
          if (panelEl) {
            panelEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          } else if (itemEl) {
            itemEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 50);
      }
    },
    [activeDiff, startPreview]
  );

  // ── Switch Game Mode ───────────────────────────────────────
  const switchMode = useCallback(
    (dir: number) => {
      playSfx("clickSound");
      stopPreview();

      const nextModeIdx = (modeIdxRef.current + dir + BM_GAME_MODES.length) % BM_GAME_MODES.length;
      setModeIdx(nextModeIdx);
      modeIdxRef.current = nextModeIdx;
      localStorage.setItem("rhg_active_mode", String(nextModeIdx));
      localStorage.setItem("rhg_active_track", "0");
      setActiveTrackIdx(0);

      const nextTracks = nextModeIdx === 1 ? NOM_TRACKS : BM_TRACKS;
      const firstTrack = nextTracks[0];
      if (firstTrack?.difficulties?.length) {
        setActiveDiff(firstTrack.difficulties[0]);
      }
      if (firstTrack?.color) {
        document.documentElement.style.setProperty("--track-accent", firstTrack.color);
      }
      if (bgVideoRef.current && firstTrack?.bg) {
        const bv = bgVideoRef.current;
        bv.style.opacity = "0.2";
        bv.style.transition = "opacity 0.3s ease";
        setTimeout(() => {
          if (bgVideoRef.current) {
            bgVideoRef.current.src = firstTrack.bg;
            bgVideoRef.current.load();
            bgVideoRef.current.play().then(() => {
              if (bgVideoRef.current) bgVideoRef.current.style.opacity = "1";
            }).catch(() => {
              if (bgVideoRef.current) bgVideoRef.current.style.opacity = "1";
            });
          }
        }, 150);
      }
      startPreview(firstTrack);

      setTimeout(() => {
        const itemEl = document.getElementById("songItem-0");
        if (itemEl) {
          itemEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);
    },
    [stopPreview, startPreview]
  );

  // ── Initial Mount Setup ────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    document.body.className = "lobby-page";
    const p = profileLoad();
    setProfile(p);
    setUsernameInput(p.identity.username);

    // Sync persisted mode and track
    const savedMode = parseInt(localStorage.getItem("rhg_active_mode") || "0");
    const validMode = !isNaN(savedMode) && savedMode >= 0 && savedMode < BM_GAME_MODES.length ? savedMode : 0;
    setModeIdx(validMode);
    modeIdxRef.current = validMode;

    const savedTrack = parseInt(localStorage.getItem("rhg_active_track") || "0");
    const tracks = validMode === 1 ? NOM_TRACKS : BM_TRACKS;
    const validTrack = !isNaN(savedTrack) && savedTrack >= 0 && savedTrack < tracks.length ? savedTrack : 0;
    setActiveTrackIdx(validTrack);

    const initialTrack = tracks[validTrack] || tracks[0];
    if (initialTrack) {
      if (initialTrack.difficulties?.length) {
        setActiveDiff(initialTrack.difficulties[0]);
      }
      if (initialTrack.color) {
        document.documentElement.style.setProperty("--track-accent", initialTrack.color);
      }
      if (bgVideoRef.current && initialTrack.bg) {
        bgVideoRef.current.src = initialTrack.bg;
        bgVideoRef.current.load();
        bgVideoRef.current.play().catch(() => {});
      }
      startPreview(initialTrack);
    }

    // Automatically trigger and scroll to the last played track in the correct mode
    setTimeout(() => {
      selectTrack(validTrack, true, validMode);
    }, 150);

    return () => {
      document.body.className = "";
      stopPreview();
      if (bgMusicRef.current) bgMusicRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Supabase Auth Listener ─────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Retrieve initial session (parses URL hash token if coming from Google OAuth)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        setIsAuthSubModalOpen(false);
        fetchCloudProfile(session.user, profileRef.current).then((cloudData) => {
          if (cloudData) {
            setProfile(cloudData);
            setUsernameInput(cloudData.identity.username);
          }
        });

        const isOAuthReturn =
          typeof window !== "undefined" &&
          (window.location.hash.includes("access_token") || window.location.search.includes("openProfile=true"));

        if (isOAuthReturn) {
          setIsProfileModalOpen(true);
          setActiveModalTab("tabIdentity");
          window.history.replaceState(null, "", window.location.pathname);
          showToast("Connected & Synced with Google!", "success");
        }
      }
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        setIsAuthSubModalOpen(false);
        const cloudData = await fetchCloudProfile(session.user, profileRef.current);
        if (cloudData) {
          setProfile(cloudData);
          setUsernameInput(cloudData.identity.username);
          if (event === "SIGNED_IN") {
            setIsProfileModalOpen(true);
            setActiveModalTab("tabIdentity");
            showToast("Cloud sync berhasil!", "success");
          }
        }
      } else {
        setAuthUser(null);
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  // ── Auth Handlers ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    const { error } = await signInWithGoogle();
    setAuthLoading(false);
    if (error) setAuthError(error.message);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError("Email dan password wajib diisi");
      return;
    }
    setAuthLoading(true);
    setAuthError("");

    if (authMode === "login") {
      const { data, error } = await signInWithEmail(authEmail, authPassword);
      setAuthLoading(false);
      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        showToast("Berhasil login!", "success");
      }
    } else {
      const { data, error } = await signUpWithEmail(authEmail, authPassword, profile.identity.username);
      setAuthLoading(false);
      if (error) {
        setAuthError(error.message);
      } else if (data.user) {
        showToast("Registrasi berhasil! Silakan cek email / login.", "success");
      }
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    await signOutSupabase();
    setAuthUser(null);
    setAuthLoading(false);
    showToast("Berhasil Logout", "success");
  };

  const handleManualSyncCloud = async () => {
    if (!authUser) return;
    setAuthLoading(true);
    await syncLocalProfileToCloud(authUser, profile);
    setAuthLoading(false);
    showToast("Profile tersimpan di Cloud Server!", "success");
  };

  const handleOpenTrackLeaderboard = async () => {
    playSfx("clickSound");
    setIsLeaderboardModalOpen(true);
    setLeaderboardLoading(true);
    const data = await fetchTrackLeaderboardFromCloud(currentTrack.id, currentMode.id, activeDiff);
    setLeaderboardData(data);
    setLeaderboardLoading(false);
  };

  // ── Handle Play Button (Start Game) ────────────────────────
  const handleStartPlay = () => {
    playSfx("clickSound");
    stopPreview();

    // Flash screen effect
    document.body.style.pointerEvents = "none";
    document.body.style.filter = "brightness(3) contrast(2)";
    document.body.style.transition = "filter .2s ease";

    setTimeout(() => {
      document.body.style.filter = "";
      document.body.style.pointerEvents = "";
      router.push(`/game?mode=${currentMode.id}&track=${activeTrackIdx}&diff=${activeDiff}`);
    }, 220);
  };

  // ── Keyboard Navigation ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProfileModalOpen) {
        if (keybindListeningIdx >= 0) {
          const k = e.key.toLowerCase();
          if (k.length === 1 || ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
            if (!["escape", " ", "enter", "tab"].includes(k)) {
              e.preventDefault();
              const newKeybinds = Array.isArray(profile.settings.keybinds)
                ? [...profile.settings.keybinds]
                : ["q", "w", "e", "r"];
              newKeybinds[keybindListeningIdx] = k;

              const updated = {
                ...profile,
                settings: { ...profile.settings, keybinds: newKeybinds },
              };
              setProfile(updated);
              profileSave(updated);
              setKeybindListeningIdx(-1);
              showToast(`Key ${keybindListeningIdx + 1} diatur ke "${k.toUpperCase()}"`, "success");
            }
          }
          return;
        }

        if (e.key === "Escape") {
          setIsProfileModalOpen(false);
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        playSfx("clickSound");
        const next = (activeTrackIdx + 1) % activeTracks.length;
        selectTrack(next, true);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        playSfx("clickSound");
        const prev = (activeTrackIdx - 1 + activeTracks.length) % activeTracks.length;
        selectTrack(prev, true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        switchMode(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        switchMode(-1);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleStartPlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProfileModalOpen, keybindListeningIdx, activeTrackIdx, activeTracks.length, selectTrack, switchMode, profile]);

  // ── Profile Operations ─────────────────────────────────────
  const totalXP = profile.stats.lifetimeScore || 0;
  const currentLevel = computeLevelFromXP(totalXP);
  const xpThisLevel = xpNeededForLevel(currentLevel);
  const xpStartOfLevel = xpToReachLevel(currentLevel);
  const currentExpInLevel = Math.min(totalXP - xpStartOfLevel, xpThisLevel);
  const expWidthPct = Math.min((currentExpInLevel / xpThisLevel) * 100, 100);
  const activeBanner = getBannerById(profile.identity.bannerSkin);

  const handleSaveUsername = () => {
    playSfx("clickSound");
    const trimmed = usernameInput.trim();
    if (!trimmed) return;
    const updated = {
      ...profile,
      identity: { ...profile.identity, username: trimmed },
    };
    setProfile(updated);
    profileSave(updated);
    if (authUser) syncLocalProfileToCloud(authUser, updated);
    showToast("Username Updated!", "success");
  };

  const handleSelectBanner = (bannerId: string) => {
    playSfx("clickSound");
    const updated = {
      ...profile,
      identity: { ...profile.identity, bannerSkin: bannerId },
    };
    setProfile(updated);
    profileSave(updated);
    if (authUser) syncLocalProfileToCloud(authUser, updated);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar!", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("File terlalu besar! Maks 8MB", "error");
      return;
    }

    let finalAvatarUrl: string | null = null;
    if (authUser) {
      showToast("Uploading avatar to Cloud Storage...", "success");
      finalAvatarUrl = await uploadAvatarToStorage(authUser, file);
    }

    if (finalAvatarUrl) {
      const updated = {
        ...profile,
        identity: { ...profile.identity, avatar: finalAvatarUrl },
      };
      setProfile(updated);
      profileSave(updated);
      if (authUser) await syncLocalProfileToCloud(authUser, updated);
      showToast("Avatar Updated & Saved to Cloud!", "success");
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 200;
          let { width: w, height: h } = img;
          if (w > h && w > MAX) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else if (h > MAX) {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
            const updated = {
              ...profile,
              identity: { ...profile.identity, avatar: dataUrl },
            };
            setProfile(updated);
            profileSave(updated);
            if (authUser) syncLocalProfileToCloud(authUser, updated);
            showToast("Avatar Updated!", "success");
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const handleResetProfile = () => {
    playSfx("clickSound");
    if (!confirm("Reset SEMUA data profile?\nAksi ini tidak bisa dibatalkan.")) return;
    localStorage.removeItem("rhg_profile");
    const reset = profileLoad();
    setProfile(reset);
    setUsernameInput(reset.identity.username);
    showToast("Profile direset!", "success");
  };

  const handleToggleSetting = (key: keyof ProfileData["settings"]) => {
    playSfx("clickSound");
    const updated = {
      ...profile,
      settings: {
        ...profile.settings,
        [key]: !profile.settings[key],
      },
    };
    setProfile(updated);
    profileSave(updated);
  };

  const handleVolumeChange = (vol: number) => {
    const updated = {
      ...profile,
      settings: { ...profile.settings, masterVolume: vol },
    };
    setProfile(updated);
    profileSave(updated);
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = (vol / 100) * 0.6;
    }
  };

  const bm = profile.stats.basic || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
  const nom = profile.stats.notoriginal || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
  const bmTotalClicks = (bm.clicks || 0) + (bm.wrongClicks || 0);
  const nomTotalClicks = (nom.clicks || 0) + (nom.wrongClicks || 0);
  const totalActions = (profile.stats.totalClicks || 0) + (profile.stats.totalBonusTriggered || 0) + (profile.stats.totalWrongClicks || 0);

  if (!mounted) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#05060a", zIndex: 99999 }}></div>
    );
  }

  return (
    <>
      {/* BACKGROUND VIDEO */}
      <div className="lobby-video-bg">
        <video
          ref={bgVideoRef}
          id="lobbyBgVideo"
          src={currentTrack.bg}
          autoPlay
          loop
          muted
          playsInline
        ></video>
        <div className="video-overlay"></div>
      </div>

      {/* LOBBY LAYOUT */}
      <main className="lobby-layout">
        {/* HEADER */}
        <header className="lobby-header">
          {/* PROFILE WIDGET (TOP-LEFT) */}
          <div
            className="player-profile-widget"
            id="lobbyProfileWidget"
            onClick={() => {
              playSfx("clickSound");
              setIsProfileModalOpen(true);
            }}
            style={{ "--widget-accent": activeBanner.accent } as React.CSSProperties}
          >
            <div
              className="widget-banner-bg"
              id="widgetBannerBg"
              dangerouslySetInnerHTML={{ __html: activeBanner.svg }}
            ></div>
            <div className="widget-dot-grid"></div>
            <div className="widget-vignette"></div>
            <div
              className="widget-avatar-wrapper"
              style={{ outline: `2px solid ${activeBanner.accent}` }}
            >
              <img
                src={getAvatarDisplay(profile.identity.avatar)}
                alt="Avatar"
                id="widgetAvatar"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/picture/new-logo.png";
                }}
              />
            </div>
            <div className="widget-info">
              <div className="widget-name" id="widgetUsername">
                {profile.identity.username.toUpperCase()}
              </div>
              <div className="widget-level-row">
                <span className="lvl-badge" id="widgetLevelNumber">
                  {currentLevel >= 500 ? "MAX" : `LV ${currentLevel}`}
                </span>
                <div className="widget-stars" id="widgetStars">
                  <span className="widget-star" style={{ color: activeBanner.accent }}>★</span>
                  <span className="widget-star" style={{ color: activeBanner.accent }}>★</span>
                  <span className="widget-star" style={{ color: activeBanner.accent }}>★</span>
                </div>
              </div>
              <div className="xp-bar-container">
                <div
                  className="xp-bar-fill"
                  id="widgetXpBarFill"
                  style={{ width: `${expWidthPct}%` }}
                ></div>
              </div>
            </div>
            <button
              className="widget-settings-btn"
              id="widgetSettingsBtn"
              title="Pengaturan"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSfx("clickSound");
                setActiveModalTab("tabSettings");
                setIsProfileModalOpen(true);
              }}
            >
              <i className="fas fa-cog"></i>
            </button>
            <button
              className="widget-settings-btn"
              title="Toggle Fullscreen Mode"
              type="button"
              style={{ marginLeft: "6px" }}
              onClick={(e) => {
                e.stopPropagation();
                handleEnableFullscreen();
              }}
            >
              <i className="fa-solid fa-expand"></i>
            </button>
          </div>

          {/* BRAND */}
          <div className="brand">
            <h1 className="game-logo">
              REFLEX<span className="logo-accent">RHYTHM</span>
            </h1>
            <span className="game-subtitle">CHOOSE YOUR BEAT &amp; REFLEX SESSION</span>
          </div>

          {/* BACK TO MAIN MENU */}
          <a
            href="/"
            className="back-snake-btn"
            title="Kembali ke Main Menu"
            onClick={(e) => {
              e.preventDefault();
              playSfx("clickSound");
              stopPreview();
              router.push("/");
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="snake-arrow-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 10h6c2.21 0 4 1.79 4 4s-1.79 4-4 4h-3v2h3c3.31 0 6-2.69 6-6s-2.69-6-6-6H9V4L3 9l6 5z"></path>
            </svg>
            <span className="back-text">BACK</span>
          </a>
        </header>

        {/* PROFILE & CONFIG MODAL */}
        <div className={`profile-modal-overlay ${isProfileModalOpen ? "active" : ""}`}>
          <div className="profile-modal-box">
            <div className="modal-corner-accent top-left"></div>
            <div className="modal-corner-accent bottom-right"></div>

            <div className="profile-modal-header">
              <div className="modal-title-group">
                <span className="modal-main-icon">
                  <i className="fa-solid fa-user-gear"></i>
                </span>
                <h3 className="modal-title-text">[P] PLAYER PROFILE &amp; CONFIG</h3>
              </div>
              <button
                className="profile-modal-close"
                id="closeProfileModal"
                type="button"
                onClick={() => {
                  playSfx("clickSound");
                  setIsProfileModalOpen(false);
                }}
              >
                ✕ CLOSE
              </button>
            </div>

            {/* MODAL TABS */}
            <div className="profile-modal-tabs">
              <button
                className={`modal-tab-btn ${activeModalTab === "tabIdentity" ? "active" : ""}`}
                onClick={() => {
                  playSfx("clickSound");
                  setActiveModalTab("tabIdentity");
                }}
                type="button"
              >
                <i className="fa-solid fa-id-card"></i> IDENTITY
              </button>
              <button
                className={`modal-tab-btn ${activeModalTab === "tabStats" ? "active" : ""}`}
                onClick={() => {
                  playSfx("clickSound");
                  setActiveModalTab("tabStats");
                }}
                type="button"
              >
                <i className="fa-solid fa-chart-simple"></i> STATISTICS
              </button>
              <button
                className={`modal-tab-btn ${activeModalTab === "tabSettings" ? "active" : ""}`}
                onClick={() => {
                  playSfx("clickSound");
                  setActiveModalTab("tabSettings");
                }}
                type="button"
              >
                <i className="fa-solid fa-sliders"></i> SETTINGS
              </button>
            </div>

            <div className="profile-modal-content-wrapper">
              {/* TAB 1: IDENTITY */}
              {activeModalTab === "tabIdentity" && (
                <div className="modal-tab-content active" id="tabIdentity">
                  <div className="identity-tab-layout">
                    <div className="avatar-left-block">
                      <div className="level-badge-zone">
                        <span className="lvl-label">LVL</span>
                        <span className="lvl-number">{currentLevel}</span>
                      </div>
                      <div className="avatar-glow-frame">
                        <img
                          src={getAvatarDisplay(profile.identity.avatar)}
                          alt="Player Avatar"
                          id="modalProfileImg"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/assets/picture/new-logo.png";
                          }}
                        />
                      </div>
                      <div className="avatar-buttons-stack">
                        <label className="pact-btn-blueprint" id="changeAvatarBtn" style={{ cursor: "pointer" }}>
                          <i className="fa-solid fa-camera"></i> CHANGE AVATAR
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleAvatarUpload}
                          />
                        </label>
                        <button
                          className="pact-btn-blueprint pact-danger-blueprint"
                          id="resetProfileDataBtn"
                          type="button"
                          onClick={handleResetProfile}
                        >
                          <i className="fa-solid fa-trash"></i> RESET DATA
                        </button>
                      </div>
                    </div>

                    <div className="identity-right-block">
                      <div className="input-blueprint-group">
                        <label className="blueprint-field-label" htmlFor="modalUsernameInput">
                          // OPERATOR IDENTITY NAME
                        </label>
                        <div className="username-submit-row">
                          <input
                            type="text"
                            id="modalUsernameInput"
                            className="blueprint-field-input"
                            placeholder="Enter new username..."
                            maxLength={14}
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                          />
                          <button
                            id="saveUsernameBtn"
                            className="pact-btn-save-blueprint"
                            type="button"
                            onClick={handleSaveUsername}
                          >
                            SAVE
                          </button>
                        </div>
                        <div className="username-hint-text">
                          CURRENT CODE:{" "}
                          <span id="modalUsernameText" style={{ color: "#fff", fontWeight: "bold" }}>
                            {profile.identity.username.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="xp-progression-panel">
                        <div className="xp-text-row" id="modalXpTextRow">
                          <span>EXP PROGRESSION</span>
                          <span>
                            {currentLevel >= 500
                              ? "MAX LEVEL ★"
                              : `${fmtXP(currentExpInLevel)} / ${fmtXP(xpThisLevel)} PTS`}
                          </span>
                        </div>
                        <div className="xp-bar-container">
                          <div
                            className="xp-bar-fill"
                            id="modalXpBarFill"
                            style={{ width: `${expWidthPct}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="banner-selector-panel">
                        <div className="blueprint-field-label">// BANNER SKIN</div>
                        <div className="banner-swatches-row" id="bannerSwatchesRow">
                          {BANNER_SKINS.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              className={`banner-swatch-btn ${profile.identity.bannerSkin === b.id ? "active" : ""}`}
                              title={b.label}
                              style={{ "--swatch-accent": b.accent } as React.CSSProperties}
                              onClick={() => handleSelectBanner(b.id)}
                            >
                              <div
                                className="banner-swatch-inner"
                                dangerouslySetInnerHTML={{ __html: b.svg }}
                              ></div>
                            </button>
                          ))}
                        </div>
                        <div className="banner-active-label" id="bannerActiveLabel">
                          {activeBanner.label}
                        </div>
                      </div>

                      {/* ACCOUNT & CLOUD LINKING CARD IN IDENTITY TAB */}
                      <div style={{ marginTop: "14px", padding: "12px", background: "rgba(0, 229, 255, 0.04)", border: "1px solid rgba(0, 229, 255, 0.2)", borderRadius: "8px" }}>
                        <div className="blueprint-field-label" style={{ marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span>// CLOUD ACCOUNT SYNC</span>
                          <span style={{ fontSize: "10px", color: authUser ? "#00ffcc" : "#ff9900", fontWeight: "bold" }}>
                            {authUser ? "CONNECTED" : "GUEST MODE"}
                          </span>
                        </div>

                        {authUser ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <img
                                src={authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || getAvatarDisplay(profile.identity.avatar)}
                                alt="Google Avatar"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/assets/picture/new-logo.png";
                                }}
                                style={{ width: "34px", height: "34px", borderRadius: "50%", border: "1px solid #00ffcc", objectFit: "cover" }}
                              />
                              <div>
                                <div style={{ fontSize: "12px", color: "#fff", fontWeight: "bold" }}>
                                  {authUser.user_metadata?.full_name || authUser.email?.split("@")[0]}
                                </div>
                                <div style={{ fontSize: "10px", color: "#888" }}>{authUser.email}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="pact-btn-blueprint"
                                style={{ padding: "4px 10px", fontSize: "10px" }}
                                onClick={handleManualSyncCloud}
                                disabled={authLoading}
                              >
                                <i className="fa-solid fa-rotate"></i> {authLoading ? "SAVING..." : "SAVE CLOUD"}
                              </button>
                              <button
                                type="button"
                                className="pact-btn-blueprint pact-danger-blueprint"
                                style={{ padding: "4px 10px", fontSize: "10px" }}
                                onClick={handleSignOut}
                                disabled={authLoading}
                              >
                                LOGOUT
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", color: "#aaa" }}>
                              Simpan XP, Score &amp; Level kamu secara online
                            </span>
                            <button
                              type="button"
                              className="pact-btn-blueprint"
                              style={{ padding: "6px 14px", fontSize: "11px", whiteSpace: "nowrap" }}
                              onClick={() => {
                                playSfx("clickSound");
                                setIsAuthSubModalOpen(true);
                              }}
                            >
                              <i className="fa-solid fa-right-to-bracket"></i> MASUK / SYNC AKUN
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STATISTICS */}
              {activeModalTab === "tabStats" && (
                <div className="modal-tab-content active" id="tabStats">
                  <div className="stats-blueprint-grid stats-grid-2col stats-section">
                    <div className="stats-blueprint-card card-basic">
                      <div className="card-blueprint-title title-basic">// BASIC MODE</div>
                      <div className="blueprint-row">
                        <span>Games Played</span>
                        <span className="b-val val-basic">{bm.gamesPlayed}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Hit Clicks</span>
                        <span className="b-val text-neon-green">{bm.clicks}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Wrong Clicks</span>
                        <span className="b-val" style={{ color: "#ff4444" }}>{bm.wrongClicks}</span>
                      </div>
                      <div className="blueprint-row row-divider">
                        <span>Accuracy</span>
                        <span className="b-val val-accuracy">{calcAccuracy(bm.clicks, bm.wrongClicks)}</span>
                      </div>
                    </div>

                    <div className="stats-blueprint-card card-nom">
                      <div className="card-blueprint-title title-nom">// N.O.M MODE</div>
                      <div className="blueprint-row">
                        <span>Games Played</span>
                        <span className="b-val val-nom">{nom.gamesPlayed}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Hit Clicks</span>
                        <span className="b-val text-neon-green">{nom.clicks}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Wrong Clicks</span>
                        <span className="b-val" style={{ color: "#ff4444" }}>{nom.wrongClicks}</span>
                      </div>
                      <div className="blueprint-row row-divider">
                        <span>Accuracy</span>
                        <span className="b-val val-accuracy">{calcAccuracy(nom.clicks, nom.wrongClicks)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="stats-blueprint-grid stats-grid-2col stats-section">
                    <div className="stats-blueprint-card">
                      <div className="card-blueprint-title">// OVERALL TOTALS</div>
                      <div className="blueprint-row">
                        <span>Total Games</span>
                        <span className="b-val">{profile.stats.totalGamesPlayed || 0}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Total Hit Clicks</span>
                        <span className="b-val text-neon-green">{profile.stats.totalClicks || 0}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Total Wrong</span>
                        <span className="b-val" style={{ color: "#ff4444" }}>{profile.stats.totalWrongClicks || 0}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Bonus Triggered</span>
                        <span className="b-val text-neon-yellow">{profile.stats.totalBonusTriggered || 0}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Longest Combo</span>
                        <span className="b-val text-neon-yellow">x{profile.stats.records?.longestCombo || 0}</span>
                      </div>
                    </div>

                    <div className="stats-blueprint-card">
                      <div className="card-blueprint-title">// RECORDS &amp; PEAK</div>
                      <div className="blueprint-row">
                        <span>Basic Peak Score</span>
                        <span className="b-val val-basic">{(profile.stats.records?.highestBasicScore || 0).toLocaleString()}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>N.O.M Peak Score</span>
                        <span className="b-val val-nom">{(profile.stats.records?.highestNotOriginalScore || 0).toLocaleString()}</span>
                      </div>
                      <div className="blueprint-row row-divider">
                        <span>Lifetime Score</span>
                        <span className="b-val text-neon-green">{(profile.stats.lifetimeScore || 0).toLocaleString()}</span>
                      </div>
                      <div className="blueprint-row">
                        <span>Overall Accuracy</span>
                        <span className="b-val val-accuracy">
                          {calcAccuracy(profile.stats.totalClicks || 0, profile.stats.totalWrongClicks || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="stats-graph-card stats-section">
                    <div className="card-blueprint-title">// PERFORMANCE GRAPH — ACCURACY &amp; RATIO PER MODE</div>
                    <div className="graph-mode-label label-basic">BASIC MODE</div>
                    <div className="graph-row">
                      <span className="graph-label-hit">HIT</span>
                      <div className="graph-bar-track">
                        <div
                          className="graph-bar-fill fill-hit"
                          style={{ width: `${bmTotalClicks > 0 ? Math.round((bm.clicks / bmTotalClicks) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="graph-val">{bmTotalClicks > 0 ? `${Math.round((bm.clicks / bmTotalClicks) * 100)}%` : "0%"}</span>
                    </div>
                    <div className="graph-row">
                      <span className="graph-label-wrong">WRONG</span>
                      <div className="graph-bar-track">
                        <div
                          className="graph-bar-fill fill-wrong"
                          style={{ width: `${bmTotalClicks > 0 ? Math.round((bm.wrongClicks / bmTotalClicks) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="graph-val">{bmTotalClicks > 0 ? `${Math.round((bm.wrongClicks / bmTotalClicks) * 100)}%` : "0%"}</span>
                    </div>

                    <hr className="graph-divider" />
                    <div className="graph-mode-label label-nom">NOT ORIGINAL MODE</div>
                    <div className="graph-row">
                      <span className="graph-label-hit">HIT</span>
                      <div className="graph-bar-track">
                        <div
                          className="graph-bar-fill fill-hit"
                          style={{ width: `${nomTotalClicks > 0 ? Math.round((nom.clicks / nomTotalClicks) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="graph-val">{nomTotalClicks > 0 ? `${Math.round((nom.clicks / nomTotalClicks) * 100)}%` : "0%"}</span>
                    </div>
                    <div className="graph-row">
                      <span className="graph-label-wrong">WRONG</span>
                      <div className="graph-bar-track">
                        <div
                          className="graph-bar-fill fill-wrong"
                          style={{ width: `${nomTotalClicks > 0 ? Math.round((nom.wrongClicks / nomTotalClicks) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="graph-val">{nomTotalClicks > 0 ? `${Math.round((nom.wrongClicks / nomTotalClicks) * 100)}%` : "0%"}</span>
                    </div>

                    <hr className="graph-divider" />
                    <div className="graph-mode-label label-total">OVERALL RATIO (ALL MODES)</div>
                    <div className="graph-row">
                      <span className="graph-label-click">HIT CLICKS</span>
                      <div className="graph-bar-track">
                        <div
                          className="graph-bar-fill fill-click"
                          style={{ width: `${totalActions > 0 ? Math.round(((profile.stats.totalClicks || 0) / totalActions) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="graph-val">
                        {totalActions > 0 ? `${Math.round(((profile.stats.totalClicks || 0) / totalActions) * 100)}%` : "0%"}
                      </span>
                    </div>
                    <div className="graph-row">
                      <span className="graph-label-bonus">BONUS</span>
                      <div className="graph-bar-track">
                        <div
                          className="graph-bar-fill fill-bonus"
                          style={{ width: `${totalActions > 0 ? Math.round(((profile.stats.totalBonusTriggered || 0) / totalActions) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="graph-val">
                        {totalActions > 0 ? `${Math.round(((profile.stats.totalBonusTriggered || 0) / totalActions) * 100)}%` : "0%"}
                      </span>
                    </div>
                    <div className="graph-row">
                      <span className="graph-label-wrong">WRONG PEN</span>
                      <div className="graph-bar-track">
                        <div
                          className="graph-bar-fill fill-wrong"
                          style={{ width: `${totalActions > 0 ? Math.round(((profile.stats.totalWrongClicks || 0) / totalActions) * 100) : 0}%` }}
                        ></div>
                      </div>
                      <span className="graph-val">
                        {totalActions > 0 ? `${Math.round(((profile.stats.totalWrongClicks || 0) / totalActions) * 100)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS */}
              {activeModalTab === "tabSettings" && (
                <div className="modal-tab-content active" id="tabSettings">
                  <div className="settings-blueprint-grid">
                    <div className="settings-blueprint-card">
                      <div className="card-blueprint-title">// AUDIO CONTROL</div>
                      <div className="setting-blueprint-row">
                        <span>Master Volume</span>
                        <div className="vol-inline-row">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={profile.settings.masterVolume}
                            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                            className="vol-slider-blueprint"
                          />
                          <span className="vol-label-blueprint">{profile.settings.masterVolume}%</span>
                        </div>
                      </div>
                      <div className="setting-blueprint-row">
                        <span>Sound Effects (SFX)</span>
                        <button
                          type="button"
                          className={`toggle-blueprint-btn ${profile.settings.sfxEnabled ? "on" : "off"}`}
                          onClick={() => handleToggleSetting("sfxEnabled")}
                        >
                          {profile.settings.sfxEnabled ? "ON" : "OFF"}
                        </button>
                      </div>
                      <div className="setting-blueprint-row">
                        <span>Countdown Bleeps</span>
                        <button
                          type="button"
                          className={`toggle-blueprint-btn ${profile.settings.countdownSoundEnabled ? "on" : "off"}`}
                          onClick={() => handleToggleSetting("countdownSoundEnabled")}
                        >
                          {profile.settings.countdownSoundEnabled ? "ON" : "OFF"}
                        </button>
                      </div>
                    </div>

                    <div className="settings-blueprint-card">
                      <div className="card-blueprint-title">// VISUAL FEEDBACK</div>
                      <div className="setting-blueprint-row">
                        <span>Particle Effects</span>
                        <button
                          type="button"
                          className={`toggle-blueprint-btn ${profile.settings.particleEffectEnabled ? "on" : "off"}`}
                          onClick={() => handleToggleSetting("particleEffectEnabled")}
                        >
                          {profile.settings.particleEffectEnabled ? "ON" : "OFF"}
                        </button>
                      </div>
                      <div className="setting-blueprint-row">
                        <span>Combo Animation</span>
                        <button
                          type="button"
                          className={`toggle-blueprint-btn ${profile.settings.comboAnimationEnabled ? "on" : "off"}`}
                          onClick={() => handleToggleSetting("comboAnimationEnabled")}
                        >
                          {profile.settings.comboAnimationEnabled ? "ON" : "OFF"}
                        </button>
                      </div>
                    </div>

                    {!isTouchDevice && (
                      <div className="settings-blueprint-card" id="mouseClickToggleCard">
                        <div className="card-blueprint-title">// GAMEPLAY INPUT</div>
                        <div className="setting-blueprint-row">
                          <span>Mouse Click</span>
                          <button
                            type="button"
                            id="mouseClickToggleBtn"
                            className={`toggle-blueprint-btn ${profile.settings.mouseClickEnabled ? "on" : "off"}`}
                            onClick={() => handleToggleSetting("mouseClickEnabled")}
                          >
                            {profile.settings.mouseClickEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isTouchDevice && (
                    <div className="settings-blueprint-card" style={{ marginTop: "14px" }}>
                      <div className="card-blueprint-title">
                        // GAMEPLAY KEYBINDS <span style={{ fontSize: "10px", color: "#52638a", fontWeight: 400 }}>(4 KEYS)</span>
                      </div>
                      <div className="keybind-editor-row" id="keybindEditorRow">
                        {["KEY 1", "KEY 2", "KEY 3", "KEY 4"].map((label, idx) => {
                          const keys = Array.isArray(profile.settings.keybinds) ? profile.settings.keybinds : ["q", "w", "e", "r"];
                          const currentKey = keys[idx] || "q";
                          const isListening = keybindListeningIdx === idx;
                          const isDup = keys.filter((k) => k === currentKey).length > 1;

                          return (
                            <div className="keybind-slot" key={idx}>
                              <span className="keybind-slot-label">{label}</span>
                              <button
                                type="button"
                                className={`keybind-key-btn ${isListening ? "listening" : ""} ${isDup ? "duplicate" : ""}`}
                                onClick={() => {
                                  playSfx("clickSound");
                                  setKeybindListeningIdx(idx);
                                }}
                              >
                                {currentKey.toUpperCase()}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "10px", color: "#52638a" }}>Klik key lalu tekan tombol keyboard baru</span>
                        <button
                          id="keybindResetBtn"
                          className="pact-btn-blueprint"
                          type="button"
                          style={{ fontSize: "10px", padding: "5px 12px" }}
                          onClick={() => {
                            playSfx("clickSound");
                            const updated = {
                              ...profile,
                              settings: { ...profile.settings, keybinds: ["q", "w", "e", "r"] },
                            };
                            setProfile(updated);
                            profileSave(updated);
                            setKeybindListeningIdx(-1);
                            showToast("Keybinds reset ke Q W E R", "success");
                          }}
                        >
                          RESET DEFAULT
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DEDICATED AUTH SUB-MODAL POP-UP */}
        {isAuthSubModalOpen && (
          <div className="profile-modal-overlay active" style={{ zIndex: 100005 }}>
            <div className="profile-modal-box" style={{ maxWidth: "460px", margin: "auto" }}>
              <div className="modal-corner-accent top-left"></div>
              <div className="modal-corner-accent bottom-right"></div>

              <div className="profile-modal-header">
                <div className="modal-title-group">
                  <span className="modal-main-icon" style={{ color: "#00ffcc" }}>
                    <i className="fa-solid fa-shield-halved"></i>
                  </span>
                  <h3 className="modal-title-text">[A] ACCOUNT CLOUD AUTH</h3>
                </div>
                <button
                  className="profile-modal-close"
                  type="button"
                  onClick={() => {
                    playSfx("clickSound");
                    setIsAuthSubModalOpen(false);
                  }}
                >
                  ✕ CLOSE
                </button>
              </div>

              <div style={{ padding: "20px" }}>
                {!isSupabaseConfigured() ? (
                  <div style={{ padding: "16px", textAlign: "center", background: "rgba(255,100,100,0.08)", border: "1px dashed rgba(255,100,100,0.3)", borderRadius: "8px" }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "1.8rem", color: "#ff4757", marginBottom: "8px" }}></i>
                    <h4 style={{ color: "#fff", margin: "0 0 6px 0" }}>CLOUD SERVER CONFIG NEEDED</h4>
                    <p style={{ color: "#aaa", fontSize: "0.8rem", lineHeight: "1.4" }}>
                      Kredensial Cloud belum dikonfigurasi
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ textAlign: "center", marginBottom: "18px" }}>
                      <h4 style={{ color: "#fff", margin: "0 0 4px 0", fontSize: "1rem" }}>CONNECT GOOGLE / EMAIL ACCOUNT</h4>
                      <p style={{ color: "#aaa", fontSize: "0.8rem", margin: 0 }}>
                        Profil, XP &amp; Score kamu akan tersinkronisasi otomatis
                      </p>
                    </div>

                    {authError && (
                      <div style={{ padding: "10px", background: "rgba(255,0,0,0.15)", border: "1px solid #ff4757", borderRadius: "6px", color: "#ff6b81", fontSize: "0.85rem", marginBottom: "15px", textAlign: "center" }}>
                        {authError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={authLoading}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "#fff",
                        color: "#333",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        cursor: "pointer",
                        marginBottom: "15px",
                        fontSize: "0.95rem"
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      {authLoading ? "CONNECTING..." : "CONTINUE WITH GOOGLE"}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "15px 0", color: "#666", fontSize: "0.8rem" }}>
                      <div style={{ flex: 1, height: "1px", background: "#333" }}></div>
                      <span>ATAU EMAIL</span>
                      <div style={{ flex: 1, height: "1px", background: "#333" }}></div>
                    </div>

                    <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="blueprint-field-input"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        required
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        className="blueprint-field-input"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        required
                      />

                      <button
                        type="submit"
                        className="pact-btn-save-blueprint"
                        disabled={authLoading}
                        style={{ width: "100%", marginTop: "5px", padding: "10px" }}
                      >
                        {authLoading
                          ? "PROCESSING..."
                          : authMode === "login"
                          ? "LOGIN EMAIL"
                          : "DAFTAR EMAIL"}
                      </button>
                    </form>

                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "#00ffcc", cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline" }}
                        onClick={() => {
                          setAuthMode(authMode === "login" ? "signup" : "login");
                          setAuthError("");
                        }}
                      >
                        {authMode === "login"
                          ? "Belum punya akun? Daftar Email"
                          : "Sudah punya akun? Login Email"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DEDICATED TRACK LEADERBOARD POP-UP MODAL */}
        {isLeaderboardModalOpen && (
          <div className="profile-modal-overlay active" style={{ zIndex: 100006 }}>
            <div className="profile-modal-box" style={{ maxWidth: "680px", margin: "auto" }}>
              <div className="modal-corner-accent top-left"></div>
              <div className="modal-corner-accent bottom-right"></div>

              <div className="profile-modal-header">
                <div className="modal-title-group">
                  <span className="modal-main-icon" style={{ color: "#ffe500" }}>
                    <i className="fa-solid fa-trophy"></i>
                  </span>
                  <h3 className="modal-title-text">[T] {currentTrack.title} LEADERBOARD</h3>
                </div>
                <button
                  className="profile-modal-close"
                  type="button"
                  onClick={() => {
                    playSfx("clickSound");
                    setIsLeaderboardModalOpen(false);
                  }}
                >
                  ✕ CLOSE
                </button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>
                  <div>
                    <span style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "0.9rem", letterSpacing: "1px" }}>
                      MODE: {currentMode.label.toUpperCase()} · {activeDiff.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                    TOP 10 PLAYERS
                  </div>
                </div>

                {leaderboardLoading ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#00ffcc", fontSize: "0.95rem" }}>
                    LOADING LEADERBOARD...
                  </div>
                ) : leaderboardData.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: "#aaa", fontSize: "0.85rem" }}>
                    Belum ada rekor skor publik di difficulty ini.<br />Jadilah pemain pertama yang mencetak skor!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                    {leaderboardData.map((item, index) => {
                      const banner = getBannerById(item.banner_skin || "arcade-spark");
                      const userLevel = item.level || 1;
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;

                      const rankBadgeColor = isTop1 ? "#ffe500" : isTop2 ? "#e0e0e0" : isTop3 ? "#cd7f32" : "#222";

                      return (
                        <div
                          key={item.id || index}
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 18px",
                            minHeight: "64px",
                            border: isTop1
                              ? "1.5px solid #ffe500"
                              : isTop2
                              ? "1.5px solid #c0c0c0"
                              : isTop3
                              ? "1.5px solid #cd7f32"
                              : "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "8px",
                            overflow: "hidden",
                            boxShadow: isTop1 ? "0 0 15px rgba(255,229,0,0.25)" : "none",
                          }}
                        >
                          {/* BANNER SKIN SVG BACKGROUND */}
                          <div
                            style={{ position: "absolute", inset: 0, opacity: 0.55, zIndex: 0, pointerEvents: "none" }}
                            dangerouslySetInnerHTML={{ __html: banner.svg }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "linear-gradient(90deg, rgba(6,6,14,0.85) 0%, rgba(10,10,24,0.65) 50%, rgba(6,6,14,0.9) 100%)",
                              zIndex: 0,
                              pointerEvents: "none",
                            }}
                          />

                          <div style={{ display: "flex", alignItems: "center", gap: "14px", zIndex: 1 }}>
                            <div style={{ position: "relative" }}>
                              <span
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "50%",
                                  background: rankBadgeColor,
                                  color: index < 3 ? "#000" : "#fff",
                                  fontWeight: "900",
                                  fontSize: "12px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  boxShadow: isTop1 ? "0 0 12px rgba(255,229,0,0.9)" : "none",
                                }}
                              >
                                {isTop1 ? <i className="fa-solid fa-crown"></i> : index + 1}
                              </span>
                            </div>

                            <div style={{ position: "relative", width: "40px", height: "40px" }}>
                              <img
                                src={getAvatarDisplay(item.avatar_url)}
                                alt="Avatar"
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/assets/picture/new-logo.png";
                                }}
                                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${banner.accent || "#00ffcc"}` }}
                              />
                              <span style={{ position: "absolute", bottom: "-4px", right: "-6px", background: "#0a0a0a", color: "#00ffcc", border: "1px solid #00ffcc", borderRadius: "8px", fontSize: "8px", padding: "1px 5px", fontWeight: "bold" }}>
                                LVL {userLevel}
                              </span>
                            </div>

                            <div>
                              <div style={{ color: "#fff", fontWeight: "bold", fontSize: "0.95rem" }}>
                                {item.username}
                              </div>
                              <div style={{ color: "#bbb", fontSize: "0.75rem", marginTop: "2px" }}>
                                Rank <strong style={{ color: item.rank === "S+" || item.rank === "S" ? "#ffe500" : "#00ffcc" }}>{item.rank}</strong> · Acc {item.accuracy} · Max Combo x{item.max_combo}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: "right", zIndex: 1 }}>
                            <div style={{ color: isTop1 ? "#ffe500" : "#00ffcc", fontWeight: "900", fontSize: "1.15rem", textShadow: isTop1 ? "0 0 10px rgba(255,229,0,0.6)" : "none" }}>
                              {item.score.toLocaleString()}
                            </div>
                            <div style={{ color: "#888", fontSize: "10px", marginTop: "2px", fontWeight: "bold", letterSpacing: "1px" }}>
                              PTS
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PERIODIC FULLSCREEN PROMPT MODAL */}
        {showFullscreenPrompt && (
          <div className="profile-modal-overlay active" style={{ zIndex: 100007 }}>
            <div className="profile-modal-box" style={{ maxWidth: "460px", margin: "auto", textAlign: "center" }}>
              <div className="modal-corner-accent top-left"></div>
              <div className="modal-corner-accent bottom-right"></div>

              <div className="profile-modal-header" style={{ justifyContent: "center" }}>
                <div className="modal-title-group">
                  <span className="modal-main-icon" style={{ color: "#00e5ff" }}>
                    <i className="fa-solid fa-expand"></i>
                  </span>
                  <h3 className="modal-title-text">[R] RECOMMENDED IMMERSION</h3>
                </div>
              </div>

              <div style={{ padding: "24px 20px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(0, 229, 255, 0.1)", border: "1.5px solid #00e5ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#00e5ff", fontSize: "1.4rem" }}>
                  <i className="fa-solid fa-display"></i>
                </div>

                <h4 style={{ color: "#fff", margin: "0 0 8px 0", fontSize: "1.1rem", fontFamily: "Orbitron, sans-serif" }}>
                  FULLSCREEN MODE RECOMMENDED
                </h4>
                <p style={{ color: "#aaa", fontSize: "0.85rem", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                  Mainkan ReflexRHYTHM dalam mode Layar Penuh untuk pengalaman ritme terbaik dan bebas gangguan browser!
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    type="button"
                    className="pact-btn-save-blueprint"
                    style={{ width: "100%", padding: "12px", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    onClick={handleEnableFullscreen}
                  >
                    <i className="fa-solid fa-expand"></i> MASUK MODE FULLSCREEN
                  </button>

                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#888", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline", marginTop: "4px" }}
                    onClick={handleDismissFullscreenPrompt}
                  >
                    Nanti Saja / Abaikan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOBBY CONTENT GRID */}
        <div className="lobby-content-grid">
          {/* LEFT INFO PANEL */}
          <section className="info-panel-left">
            <div className="mode-info-block mode-info-block-basic" id="modeInfoBlock">
              <div className="slide-meta">
                <span className="slide-num slide-num-basic">{String(activeTrackIdx + 1).padStart(2, "0")}</span>
                <span className="char-role">{currentTrack.role}</span>
              </div>
              <h2 className={`mode-title ${currentTrack.titleClass || "title-basic"}`} id="displayModeTitle">
                {currentTrack.title}
              </h2>
              <p className="mode-description" id="displayModeDesc">
                {currentTrack.desc}
              </p>
            </div>
            <div className="lobby-visualizer-wrap">
              <canvas ref={canvasRef} id="lobbyVisualizer"></canvas>
            </div>
          </section>

          {/* RIGHT CONTROL PANEL */}
          <section className="control-panel-right">
            <div className="song-list-container">
              <div className="song-list-header">
                <div className="cd-icon-wrap">
                  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="30" fill="#0a0a0a" />
                    <circle cx="32" cy="32" r="30" fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity="0.5" />
                    <path d="M32 2 A30 30 0 0 1 62 32" fill="none" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                    <circle cx="32" cy="32" r="20" fill="none" stroke="#1a1a1a" strokeWidth="1" />
                    <circle cx="32" cy="32" r="13" fill="none" stroke="#1a1a1a" strokeWidth="1" />
                    <circle cx="32" cy="32" r="6" fill="#00e5ff" />
                    <circle cx="32" cy="32" r="2.5" fill="#0a0a0a" />
                  </svg>
                </div>
                <span className="song-list-header-text">TRACK LIST ({activeTracks.length})</span>
                <span className="track-switch-hint" title="Gunakan panah atas/bawah untuk ganti track">
                  <kbd className="hint-key">▲</kbd>
                  <kbd className="hint-key">▼</kbd>
                  <span className="hint-label">SWITCH</span>
                </span>
              </div>

              {/* SONG LIST WRAPPER */}
              <div className="song-list-wrapper" id="songListWrapper">
                {activeTracks.map((track, i) => {
                  const isActive = i === activeTrackIdx;
                  const isNear = i === activeTrackIdx - 1 || i === activeTrackIdx + 1;
                  const accent = track.color || "#00e5ff";

                  return (
                    <div key={track.id} className="song-track-group">
                      <button
                        type="button"
                        id={`songItem-${i}`}
                        className={`song-item ${isActive ? "active" : ""} ${isNear ? "near" : ""} ${isActive && isPreviewing ? "previewing" : ""}`}
                        style={{ "--song-accent": accent } as React.CSSProperties}
                        onClick={() => {
                          playSfx("clickSound");
                          selectTrack(i, true);
                        }}
                      >
                        <span className="song-index">{String(i + 1).padStart(2, "0")}</span>
                        <img
                          className="song-album-art"
                          src={track.art || "/assets/picture/new-logo.png"}
                          alt="album"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = "0";
                          }}
                        />
                        <div className="song-details">
                          <span className="song-title">{track.title}</span>
                          <span className="song-artist">
                            {track.artist} // BPM: {track.bpm} // {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
                          </span>
                        </div>
                        <span className="song-status-tag">
                          {isActive && isPreviewing ? (
                            <>
                              <i className="fa-solid fa-music" style={{ marginRight: "4px" }}></i>PREVIEW
                            </>
                          ) : (
                            "SELECT"
                          )}
                        </span>
                      </button>

                      {/* INLINE DIFFICULTY PANEL */}
                      {isActive && (() => {
                        const currentPB = getTrackBestScore(track.id, currentMode.id, activeDiff);
                        return (
                          <div className="diff-panel" id={`diffPanel-${i}`} style={{ display: "block" }}>
                            <div className="diff-panel-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>// DIFFICULTY</span>
                              <button
                                type="button"
                                style={{ background: "none", border: "none", color: "#00ffcc", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTrackLeaderboard();
                                }}
                              >
                                <i className="fa-solid fa-trophy" style={{ marginRight: "4px" }}></i>RANKING &amp; HISTORY
                              </button>
                            </div>
                            <div className="diff-btn-row">
                              {track.difficulties.map((diffKey) => {
                                const d = diffConfigs[diffKey] || BM_DIFF[diffKey] || { label: diffKey.toUpperCase(), color: "#00ff88" };
                                const isDiffActive = activeDiff === diffKey;

                                return (
                                  <button
                                    key={diffKey}
                                    type="button"
                                    className={`diff-btn ${isDiffActive ? "active" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playSfx("clickSound");
                                      setActiveDiff(diffKey);
                                    }}
                                  >
                                    <span className="diff-dot" style={{ background: d.color }}></span>
                                    {d.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* PERSONAL BEST SUMMARY STRIP */}
                            <div style={{ marginTop: "8px", padding: "6px 10px", background: "rgba(0, 229, 255, 0.05)", border: "1px solid rgba(0, 229, 255, 0.2)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px" }}>
                              <span style={{ color: "#aaa" }}>
                                BEST ({activeDiff.toUpperCase()}): <strong style={{ color: "#00ffcc" }}>{currentPB ? currentPB.score.toLocaleString() : "NONE"}</strong>
                              </span>
                              {currentPB && (
                                <span style={{ color: "#ffe500", fontWeight: "bold" }}>
                                  RANK {currentPB.rank} · {currentPB.accuracy}
                                </span>
        )}

        {/* PERIODIC FULLSCREEN PROMPT MODAL */}
        {showFullscreenPrompt && (
          <div className="profile-modal-overlay active" style={{ zIndex: 100007 }}>
            <div className="profile-modal-box" style={{ maxWidth: "460px", margin: "auto", textAlign: "center" }}>
              <div className="modal-corner-accent top-left"></div>
              <div className="modal-corner-accent bottom-right"></div>

              <div className="profile-modal-header" style={{ justifyContent: "center" }}>
                <div className="modal-title-group">
                  <span className="modal-main-icon" style={{ color: "#00e5ff" }}>
                    <i className="fa-solid fa-expand"></i>
                  </span>
                  <h3 className="modal-title-text">[R] RECOMMENDED IMMERSION</h3>
                </div>
              </div>

              <div style={{ padding: "24px 20px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(0, 229, 255, 0.1)", border: "1.5px solid #00e5ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#00e5ff", fontSize: "1.4rem" }}>
                  <i className="fa-solid fa-display"></i>
                </div>

                <h4 style={{ color: "#fff", margin: "0 0 8px 0", fontSize: "1.1rem", fontFamily: "Orbitron, sans-serif" }}>
                  FULLSCREEN MODE RECOMMENDED
                </h4>
                <p style={{ color: "#aaa", fontSize: "0.85rem", lineHeight: "1.5", margin: "0 0 20px 0" }}>
                  Mainkan ReflexRHYTHM dalam mode Layar Penuh untuk pengalaman ritme terbaik dan bebas gangguan browser!
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    type="button"
                    className="pact-btn-save-blueprint"
                    style={{ width: "100%", padding: "12px", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    onClick={handleEnableFullscreen}
                  >
                    <i className="fa-solid fa-expand"></i> MASUK MODE FULLSCREEN
                  </button>

                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#888", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline", marginTop: "4px" }}
                    onClick={handleDismissFullscreenPrompt}
                  >
                    Nanti Saja / Abaikan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION CONTROLS */}
            <div className="action-controls-block">
              <button
                id="mainPlayActionBtn"
                className="osu-play-button"
                type="button"
                onClick={handleStartPlay}
              >
                <div className="osu-inner">
                  <span className="osu-icon-indicator">▶</span>
                  <span className="osu-text">START PLAY</span>
                </div>
              </button>

              <div className="arrow-navigation-row">
                <button
                  className="nav-arrow-btn"
                  id="slidePrevBtn"
                  title="Mode Sebelumnya (←)"
                  type="button"
                  onClick={() => switchMode(-1)}
                >
                  <span className="nav-icon">◀</span>
                </button>
                <div className="mode-switch-label-wrap" title="Gunakan panah kiri/kanan untuk ganti mode">
                  <span className="mode-switch-hint-label">GAME MODE</span>
                  <span className="mode-switch-current" id="currentModeLabel">
                    {currentMode.label}
                  </span>
                </div>
                <button
                  className="nav-arrow-btn"
                  id="slideNextBtn"
                  title="Mode Berikutnya (→)"
                  type="button"
                  onClick={() => switchMode(1)}
                >
                  <span className="nav-icon">▶</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div
          id="lobbyToast"
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%) translateY(0)",
            background: toastMsg.type === "error" ? "#ff4444" : "#00c851",
            color: "#fff",
            padding: "10px 22px",
            borderRadius: "8px",
            fontFamily: "Orbitron, sans-serif",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1px",
            zIndex: 99999,
            opacity: 1,
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,.4)",
            whiteSpace: "nowrap",
            transition: "opacity .25s ease, transform .25s ease",
          }}
        >
          {toastMsg.text}
        </div>
      )}

      {/* LANDSCAPE NOTICE */}
      <div id="landscapeNotice">
        <div className="ln-icon">
          <i className="fa-solid fa-mobile"></i>
        </div>
        <div className="ln-title">Putar Perangkatmu</div>
        <div className="ln-sub">Game ini optimal di mode landscape</div>
      </div>

      {/* AUDIO SFX */}
      <audio id="clickSound" src="/assets/audio/click.mp3" preload="auto"></audio>
      <audio id="countdownSound" src="/assets/audio/countdown.mp3" preload="auto"></audio>
    </>
  );
}