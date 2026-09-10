// ============================================================
// REFLEXRHYTHM — PROFILE SYSTEM (TypeScript & LocalStorage)
// ============================================================

import { PROFILE_DEFAULT, BannerSkin, BANNER_SKINS } from "./gameData";

export type ProfileData = typeof PROFILE_DEFAULT;

const MAX_LEVEL = 500;

// ── XP & LEVEL CALCULATIONS ──────────────────────────────────
// XP dibutuhkan di dalam level N = 5000 × N
// Total XP kumulatif untuk mencapai level N = 2500 × N × (N - 1)
// Level dari total XP = floor((1 + sqrt(1 + 8 * totalXP / 5000)) / 2)

export function xpToReachLevel(n: number): number {
  return 2500 * n * (n - 1);
}

export function xpNeededForLevel(n: number): number {
  return 5000 * n;
}

export function computeLevelFromXP(totalXP: number): number {
  const n = Math.floor((1 + Math.sqrt(1 + (8 * totalXP) / 5000)) / 2);
  return Math.min(Math.max(1, n), MAX_LEVEL);
}

export function fmtXP(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  if (n >= 1e9)  return (n / 1e9 ).toFixed(1).replace(/\.0$/, "") + "B";
  if (n >= 1e6)  return (n / 1e6 ).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 10000) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export function calcAccuracy(clicks: number, wrongClicks: number): string {
  if (!clicks) return "N/A";
  const acc = Math.max(0, Math.round(((clicks - wrongClicks) / clicks) * 100));
  return `${acc}%`;
}

export function getBannerById(id: string): BannerSkin {
  return BANNER_SKINS.find((b) => b.id === id) || BANNER_SKINS[0];
}

export function getAvatarDisplay(avatar: string | undefined): string {
  if (!avatar || avatar === "default" || avatar === "null" || avatar === "undefined") {
    return "/assets/picture/new-logo.png";
  }
  return avatar;
}

// ── DEEP MERGE HELPER ─────────────────────────────────────────
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key of Object.keys(source) as Array<keyof T>) {
    const src = source[key];
    const tgt = result[key];
    if (src && typeof src === "object" && !Array.isArray(src) && tgt && typeof tgt === "object") {
      result[key] = deepMerge(tgt as Record<string, unknown>, src as Record<string, unknown>) as T[keyof T];
    } else if (src !== undefined) {
      result[key] = src as T[keyof T];
    }
  }
  return result;
}

// ── LOAD / SAVE SYSTEM ────────────────────────────────────────
export function profileLoad(): ProfileData {
  if (typeof window === "undefined") {
    return JSON.parse(JSON.stringify(PROFILE_DEFAULT));
  }
  try {
    const raw = localStorage.getItem("rhg_profile");
    if (!raw) return JSON.parse(JSON.stringify(PROFILE_DEFAULT));
    const parsed = JSON.parse(raw);
    return deepMerge(JSON.parse(JSON.stringify(PROFILE_DEFAULT)), parsed) as ProfileData;
  } catch {
    return JSON.parse(JSON.stringify(PROFILE_DEFAULT));
  }
}

export function profileSave(data: ProfileData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("rhg_profile", JSON.stringify(data));
  } catch (e) {
    console.warn("Profile save failed", e);
  }
}

let _saveTimer: ReturnType<typeof setTimeout> | null = null;
export function profileSaveDebounced(data: ProfileData): void {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    profileSave(data);
  }, 500);
}

export function profileSaveForce(data: ProfileData): void {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  profileSave(data);
}

// ── SFX AUDIO PLAY HELPER ──────────────────────────────────────
export function playSfx(id: string): void {
  if (typeof window === "undefined") return;
  const profile = profileLoad();
  if (id === "countdownSound") {
    if (!profile.settings.countdownSoundEnabled) return;
  } else {
    if (!profile.settings.sfxEnabled) return;
  }

  const audio = document.getElementById(id) as HTMLAudioElement | null;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = (profile.settings.masterVolume ?? 100) / 100;
    audio.play().catch(() => {});
  }
}

// ── STAT RECORDING HELPERS ────────────────────────────────────
export function recordNoteHit(isBonus: boolean, mode: "basic" | "notoriginal"): void {
  const profile = profileLoad();
  profile.stats.totalClicks = (profile.stats.totalClicks || 0) + 1;
  if (isBonus) {
    profile.stats.totalBonusTriggered = (profile.stats.totalBonusTriggered || 0) + 1;
  }
  if (mode === "notoriginal") {
    profile.stats.notoriginal = profile.stats.notoriginal || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
    profile.stats.notoriginal.clicks = (profile.stats.notoriginal.clicks || 0) + 1;
  } else {
    profile.stats.basic = profile.stats.basic || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
    profile.stats.basic.clicks = (profile.stats.basic.clicks || 0) + 1;
  }
  profileSaveDebounced(profile);
}

export function recordNoteMissOrWrong(mode: "basic" | "notoriginal"): void {
  const profile = profileLoad();
  profile.stats.totalWrongClicks = (profile.stats.totalWrongClicks || 0) + 1;
  if (mode === "notoriginal") {
    profile.stats.notoriginal = profile.stats.notoriginal || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
    profile.stats.notoriginal.wrongClicks = (profile.stats.notoriginal.wrongClicks || 0) + 1;
  } else {
    profile.stats.basic = profile.stats.basic || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
    profile.stats.basic.wrongClicks = (profile.stats.basic.wrongClicks || 0) + 1;
  }
  profileSaveDebounced(profile);
}

// ── XP GAINED CALCULATION ─────────────────────────────────────
export function calcXpGained(
  score: number,
  maxCombo: number,
  accNum: number,
  rank: string,
  diffKey: string = "normal"
): number {
  const baseScoreXP = Math.round(score / 20);
  const comboXP = maxCombo * 15;
  const accuracyXP = Math.round(accNum * 5);

  let diffMultiplier = 1.0;
  switch (diffKey.toLowerCase()) {
    case "extreme":
      diffMultiplier = 2.0;
      break;
    case "hard":
      diffMultiplier = 1.5;
      break;
    case "medium":
      diffMultiplier = 1.2;
      break;
    case "normal":
    default:
      diffMultiplier = 1.0;
      break;
  }

  let rankMultiplier = 1.0;
  switch (rank) {
    case "S+":
      rankMultiplier = 1.5;
      break;
    case "S":
      rankMultiplier = 1.3;
      break;
    case "A":
      rankMultiplier = 1.15;
      break;
    case "B":
      rankMultiplier = 1.0;
      break;
    case "C":
      rankMultiplier = 0.75;
      break;
    case "D":
    default:
      rankMultiplier = 0.4;
      break;
  }

  const rawXP = (baseScoreXP + comboXP + accuracyXP) * diffMultiplier * rankMultiplier;
  return Math.max(0, Math.round(rawXP));
}

export function recordGameEnd(
  score: number,
  maxCombo: number,
  mode: "basic" | "notoriginal",
  customXpGained?: number,
  trackId?: string,
  difficulty?: string,
  accuracy?: string,
  rank?: string
): { totalXP: number; gainedXP: number; oldLevel: number; newLevel: number; previousBest: number; isNewBest: boolean } {
  const profile = profileLoad();
  const oldXP = profile.stats.lifetimeScore || 0;
  const oldLevel = computeLevelFromXP(oldXP);

  const gainedXP =
    customXpGained !== undefined
      ? Math.max(0, Math.round(customXpGained))
      : Math.max(0, Math.round(score));
  const newXP = oldXP + gainedXP;
  profile.stats.lifetimeScore = newXP;
  profile.stats.totalGamesPlayed = (profile.stats.totalGamesPlayed || 0) + 1;

  if (mode === "notoriginal") {
    profile.stats.notoriginal = profile.stats.notoriginal || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
    profile.stats.notoriginal.gamesPlayed = (profile.stats.notoriginal.gamesPlayed || 0) + 1;
    if (score > (profile.stats.records.highestNotOriginalScore || 0)) {
      profile.stats.records.highestNotOriginalScore = score;
    }
  } else {
    profile.stats.basic = profile.stats.basic || { clicks: 0, wrongClicks: 0, gamesPlayed: 0 };
    profile.stats.basic.gamesPlayed = (profile.stats.basic.gamesPlayed || 0) + 1;
    if (score > (profile.stats.records.highestBasicScore || 0)) {
      profile.stats.records.highestBasicScore = score;
    }
  }

  if (maxCombo > (profile.stats.records.longestCombo || 0)) {
    profile.stats.records.longestCombo = maxCombo;
  }

  // Personal Best per Track/Mode/Difficulty
  let previousBest = 0;
  let isNewBest = false;

  if (trackId && difficulty) {
    const key = `${trackId}_${mode}_${difficulty}`;
    const trackBestObj = (profile.stats as any).trackBest || {};
    previousBest = trackBestObj[key]?.score || 0;
    if (score > previousBest) {
      isNewBest = true;
      trackBestObj[key] = {
        score,
        rank: rank || "D",
        maxCombo,
        accuracy: accuracy || "0%",
        updatedAt: new Date().toISOString(),
      };
      (profile.stats as any).trackBest = trackBestObj;
    }
  }

  const newLevel = computeLevelFromXP(newXP);
  profileSaveForce(profile);

  return { totalXP: newXP, gainedXP, oldLevel, newLevel, previousBest, isNewBest };
}

export function getTrackBestScore(
  trackId: string,
  mode: string,
  difficulty: string
): { score: number; rank: string; maxCombo: number; accuracy: string } | null {
  const profile = profileLoad();
  const key = `${trackId}_${mode}_${difficulty}`;
  const trackBestObj = (profile.stats as any).trackBest || {};
  return trackBestObj[key] || null;
}
