import { createClient, User } from "@supabase/supabase-js";
import { ProfileData, profileSave, computeLevelFromXP, getDaysDifference, getTodayDateString, getTotalCumulativeScore } from "./profile";

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
const supabaseUrl = rawUrl;
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const supabase = createClient(
  supabaseUrl && supabaseUrl !== "https://your-project-ref.supabase.co"
    ? supabaseUrl
    : "https://placeholder.supabase.co",
  supabaseAnonKey && supabaseAnonKey !== "your-anon-key-here"
    ? supabaseAnonKey
    : "placeholder-key"
);

export const isSupabaseConfigured = (): boolean => {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-ref.supabase.co" &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your-anon-key-here" &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder")
  );
};

// ── AUTH HELPERS ──────────────────────────────────────────────

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Layanan Cloud belum di-setup di .env.local") };
  }
  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lobby?openProfile=true`
      : undefined;

  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
    },
  });
}

export async function signInWithEmail(email: string, pass: string) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Layanan Cloud belum di-setup di .env.local") };
  }
  return await supabase.auth.signInWithPassword({ email, password: pass });
}

export async function signUpWithEmail(email: string, pass: string, username: string) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Layanan Cloud belum di-setup di .env.local") };
  }
  const displayUsername = username.trim() || email.split("@")[0];
  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lobby?openProfile=true`
      : undefined;

  return await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        username: displayUsername,
        full_name: displayUsername,
        name: displayUsername,
      },
    },
  });
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured()) return { error: null };
  return await supabase.auth.signOut();
}

export async function sendPasswordResetEmail(email: string) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Layanan Cloud belum di-setup di .env.local") };
  }
  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lobby?openResetPassword=true`
      : undefined;

  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
}

export async function updateUserPassword(newPassword: string) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Layanan Cloud belum di-setup di .env.local") };
  }
  return await supabase.auth.updateUser({ password: newPassword });
}

export async function updateUserEmail(newEmail: string) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Layanan Cloud belum di-setup di .env.local") };
  }
  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lobby?openProfile=true`
      : undefined;

  return await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: redirectUrl }
  );
}

// ── CLOUD PROFILE SYNC ─────────────────────────────────────────

export async function syncLocalProfileToCloud(user: User, localProfile: ProfileData) {
  if (!isSupabaseConfigured() || !user) return null;
  try {
    const fallbackName = user.user_metadata?.username || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Operator";
    const payload = {
      id: user.id,
      username: localProfile.identity.username && localProfile.identity.username !== "Player" ? localProfile.identity.username : fallbackName,
      avatar_url: localProfile.identity.avatar || user.user_metadata?.avatar_url || "default",
      xp: localProfile.stats.lifetimeScore || 0,
      banner_skin: localProfile.identity.bannerSkin || "arcade-spark",
      stats: localProfile.stats || {},
      settings: localProfile.settings || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("Cloud sync save warning:", error.message);
    }
    return data;
  } catch (err) {
    console.error("Failed to sync profile to cloud:", err);
    return null;
  }
}

export async function syncAllLocalBestScoresToCloud(user: User, localProfile: ProfileData) {
  if (!isSupabaseConfigured() || !user) return;
  const trackBestObj = (localProfile.stats as any)?.trackBest || {};
  const keys = Object.keys(trackBestObj);
  if (keys.length === 0) return;

  for (const key of keys) {
    const parts = key.split("_");
    if (parts.length >= 3) {
      const trackId = parts[0];
      const mode = parts[1];
      const difficulty = parts.slice(2).join("_");
      const best = trackBestObj[key];
      if (best && typeof best.score === "number") {
        await recordBestScoreToCloud(
          user,
          localProfile,
          trackId,
          mode,
          difficulty,
          best.score,
          best.maxCombo || 0,
          best.accuracy || "0%",
          best.rank || "D"
        );
      }
    }
  }
}

export async function fetchCloudProfile(user: User, localProfile: ProfileData): Promise<ProfileData | null> {
  if (!isSupabaseConfigured() || !user) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: cloudBestScores } = await supabase
      .from("best_scores")
      .select("*")
      .eq("user_id", user.id);

    const mergedTrackBest: Record<string, any> = {
      ...((localProfile.stats as any)?.trackBest || {}),
    };

    if (cloudBestScores && Array.isArray(cloudBestScores)) {
      cloudBestScores.forEach((item) => {
        const key = `${item.track_id}_${item.mode}_${item.difficulty}`;
        const localScore = mergedTrackBest[key]?.score || 0;
        if (item.score >= localScore) {
          mergedTrackBest[key] = {
            score: item.score,
            rank: item.rank,
            maxCombo: item.max_combo,
            accuracy: item.accuracy,
            updatedAt: item.updated_at,
          };
        }
      });
    }

    const googleName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
    const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

    if (error || !data) {
      // First time user profile created in cloud -> MIGRATE ALL GUEST DATA
      const newProfile: ProfileData = {
        ...localProfile,
        identity: {
          ...localProfile.identity,
          username: googleName || localProfile.identity.username,
          avatar: googleAvatar || localProfile.identity.avatar,
        },
        stats: {
          ...localProfile.stats,
          trackBest: mergedTrackBest,
        } as any,
      };
      await syncLocalProfileToCloud(user, newProfile);
      await syncAllLocalBestScoresToCloud(user, newProfile);
      profileSave(newProfile);
      return newProfile;
    }

    const localAvatar = localProfile.identity.avatar;
    const isLocalCustom = localAvatar && localAvatar !== "default";
    const cloudAvatar = data.avatar_url;
    const isCloudCustom = cloudAvatar && cloudAvatar !== "default";

    const resolvedAvatar = isCloudCustom
      ? cloudAvatar
      : isLocalCustom
      ? localAvatar
      : (googleAvatar || "default");

    const cloudStats = data.stats || {};
    const { lifetimeScore: _stripLocal, ...localStatsRest } = localProfile.stats as any;
    const { lifetimeScore: _stripCloud, ...cloudStatsRest } = cloudStats as any;
    const merged: ProfileData = {
      ...localProfile,
      identity: {
        ...localProfile.identity,
        username: data.username && data.username !== "Player" ? data.username : (googleName || localProfile.identity.username),
        avatar: resolvedAvatar,
        bannerSkin: data.banner_skin || localProfile.identity.bannerSkin,
      },
      stats: {
        ...localStatsRest,
        ...cloudStatsRest,
        lifetimeScore: typeof data.xp === "number" && data.xp > 0
          ? data.xp
          : localProfile.stats.lifetimeScore,
        trackBest: mergedTrackBest,
      } as any,
      settings: {
        ...localProfile.settings,
        ...(data.settings || {}),
      },
    };

    // Auto-migrate any new local guest best scores to cloud
    syncAllLocalBestScoresToCloud(user, merged);

    profileSave(merged);
    return merged;
  } catch (err) {
    console.error("Failed to fetch cloud profile:", err);
    return null;
  }
}

// ── CLOUD SCORE RECORDING ──────────────────────────────────────

export async function recordScoreToCloud(
  user: User | null,
  profile: ProfileData,
  trackId: string,
  mode: string,
  difficulty: string,
  score: number,
  maxCombo: number,
  accuracy: string,
  rank: string
) {
  if (!isSupabaseConfigured() || !user) return null;
  try {
    const payload = {
      user_id: user.id,
      username: profile.identity.username || "Operator",
      track_id: trackId,
      mode: mode,
      difficulty: difficulty,
      score: score,
      max_combo: maxCombo,
      accuracy: accuracy,
      rank: rank,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("scores").insert([payload]).select();
    if (error) {
      console.warn("Failed to record score to cloud:", error.message);
    }
    return data;
  } catch (err) {
    console.error("Error recording score to cloud:", err);
    return null;
  }
}

export async function recordBestScoreToCloud(
  user: User | null,
  profile: ProfileData,
  trackId: string,
  mode: string,
  difficulty: string,
  score: number,
  maxCombo: number,
  accuracy: string,
  rank: string
) {
  if (!isSupabaseConfigured() || !user) return null;
  try {
    // Check existing best score in cloud first -> Only update if new score is higher
    const { data: existing } = await supabase
      .from("best_scores")
      .select("score")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .eq("mode", mode)
      .eq("difficulty", difficulty)
      .maybeSingle();

    if (existing && typeof existing.score === "number" && score <= existing.score) {
      // New score is lower than or equal to existing best score in cloud -> DO NOT OVERWRITE!
      return null;
    }

    const userLevel = computeLevelFromXP(profile.stats.lifetimeScore || 0);
    const payload = {
      user_id: user.id,
      username: profile.identity.username || "Operator",
      avatar_url: profile.identity.avatar || "default",
      banner_skin: profile.identity.bannerSkin || "arcade-spark",
      level: userLevel,
      track_id: trackId,
      mode: mode,
      difficulty: difficulty,
      score: score,
      max_combo: maxCombo,
      accuracy: accuracy,
      rank: rank,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("best_scores")
      .upsert(payload, { onConflict: "user_id,track_id,mode,difficulty" })
      .select();

    if (error) {
      console.warn("Failed to record best score to cloud:", error.message);
    }
    return data;
  } catch (err) {
    console.error("Error recording best score to cloud:", err);
    return null;
  }
}

// ── STORAGE AVATAR UPLOAD ──────────────────────────────────────

export async function uploadAvatarToStorage(user: User, file: File): Promise<string | null> {
  if (!isSupabaseConfigured() || !user) return null;
  try {
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.warn("Avatar storage upload error:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error("Avatar upload exception:", err);
    return null;
  }
}

// ── SYNC PROFILE META TO ALL BEST SCORES ─────────────────────

export async function syncProfileMetaToBestScores(
  user: User | null,
  profile: ProfileData
): Promise<void> {
  if (!isSupabaseConfigured() || !user) return;
  try {
    const userLevel = computeLevelFromXP(profile.stats.lifetimeScore || 0);
    await supabase
      .from("best_scores")
      .update({
        username: profile.identity.username || "Operator",
        avatar_url: profile.identity.avatar || "default",
        banner_skin: profile.identity.bannerSkin || "arcade-spark",
        level: userLevel,
      })
      .eq("user_id", user.id);
  } catch (err) {
    console.error("Failed to sync profile meta to best_scores:", err);
  }
}

// ── TRACK LEADERBOARD FETCH ───────────────────────────────────

export interface TrackLeaderboardItem {
  id: number;
  user_id: string;
  username: string;
  avatar_url: string;
  banner_skin?: string;
  level?: number;
  score: number;
  max_combo: number;
  accuracy: string;
  rank: string;
  updated_at: string;
}

export async function fetchTrackLeaderboardFromCloud(
  trackId: string,
  mode: string,
  difficulty: string
): Promise<TrackLeaderboardItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("best_scores")
      .select("*")
      .eq("track_id", trackId)
      .eq("mode", mode)
      .eq("difficulty", difficulty)
      .order("score", { ascending: false })
      .limit(10);

    if (error || !data) return [];
    return data as TrackLeaderboardItem[];
  } catch (err) {
    console.error("Failed to fetch track leaderboard:", err);
    return [];
  }
}

// ── GLOBAL LEADERBOARD FETCH (4 TABS) ─────────────────────────

export type GlobalLeaderboardTab = "totalScore" | "activeStreak" | "totalGames" | "longestCombo";

export interface GlobalLeaderboardItem {
  user_id: string;
  username: string;
  avatar_url: string;
  banner_skin?: string;
  level: number;
  value: number;
  formattedValue: string;
  subText: string;
}

export async function fetchGlobalLeaderboardFromCloud(
  tab: GlobalLeaderboardTab,
  limitCount = 50
): Promise<GlobalLeaderboardItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, banner_skin, xp, stats, updated_at")
      .limit(100);

    if (error || !data) {
      console.warn("fetchGlobalLeaderboardFromCloud query notice:", error?.message);
      return [];
    }

    const today = getTodayDateString();
    const parsedList: GlobalLeaderboardItem[] = [];

    for (const item of data) {
      const stats = item.stats || {};
      const userLevel = computeLevelFromXP(item.xp || stats.lifetimeScore || 0);
      const username = item.username && item.username !== "Player" ? item.username : "Operator";
      const avatarUrl = item.avatar_url || "default";
      const bannerSkin = item.banner_skin || "arcade-spark";

      if (tab === "totalScore") {
        // Tab 1: Total Cumulative Score (Sum of all track best scores in BM + NOM)
        let totalScore = 0;
        const trackBest = stats.trackBest || {};
        const keys = Object.keys(trackBest);
        if (keys.length > 0) {
          for (const k of keys) {
            const sc = trackBest[k]?.score;
            if (typeof sc === "number" && !isNaN(sc)) {
              totalScore += sc;
            }
          }
        }
        if (totalScore === 0) {
          totalScore = item.xp || stats.lifetimeScore || 0;
        }

        if (totalScore > 0) {
          parsedList.push({
            user_id: item.id,
            username,
            avatar_url: avatarUrl,
            banner_skin: bannerSkin,
            level: userLevel,
            value: totalScore,
            formattedValue: `${totalScore.toLocaleString()} PTS`,
            subText: `BM + NOM All Diff · LV ${userLevel}`,
          });
        }
      } else if (tab === "activeStreak") {
        // Tab 2: Active Streak (Streak nyala / bertahan. If dead, exclude.)
        const streakObj = stats.streak || {};
        const lastPlay = streakObj.lastPlayDate;
        const currentStreak = streakObj.current || 0;

        if (lastPlay && currentStreak > 0) {
          const diff = getDaysDifference(lastPlay, today);
          // diff === 0 (played today) or diff === 1 (played yesterday, still active today)
          if (diff <= 1) {
            parsedList.push({
              user_id: item.id,
              username,
              avatar_url: avatarUrl,
              banner_skin: bannerSkin,
              level: userLevel,
              value: currentStreak,
              formattedValue: `${currentStreak} HARI`,
              subText: diff === 0 ? "Aktif Hari Ini" : "Streak Bertahan",
            });
          }
        }
      } else if (tab === "totalGames") {
        // Tab 3: Total Games Played
        const gamesPlayed =
          stats.totalGamesPlayed ||
          (stats.basic?.gamesPlayed || 0) + (stats.notoriginal?.gamesPlayed || 0);

        if (gamesPlayed > 0) {
          parsedList.push({
            user_id: item.id,
            username,
            avatar_url: avatarUrl,
            banner_skin: bannerSkin,
            level: userLevel,
            value: gamesPlayed,
            formattedValue: `${gamesPlayed.toLocaleString()} MATCHES`,
            subText: `BM: ${stats.basic?.gamesPlayed || 0} · NOM: ${stats.notoriginal?.gamesPlayed || 0}`,
          });
        }
      } else if (tab === "longestCombo") {
        // Tab 4: Longest Combo
        const combo = stats.records?.longestCombo || 0;
        if (combo > 0) {
          parsedList.push({
            user_id: item.id,
            username,
            avatar_url: avatarUrl,
            banner_skin: bannerSkin,
            level: userLevel,
            value: combo,
            formattedValue: `x${combo} COMBO`,
            subText: `Peak Combo · LV ${userLevel}`,
          });
        }
      }
    }

    // Sort descending by value
    parsedList.sort((a, b) => b.value - a.value);

    return parsedList.slice(0, limitCount);
  } catch (err) {
    console.error("Failed to fetch global leaderboard:", err);
    return [];
  }
}

// ── GLOBAL CHAT ROOM ──────────────────────────────────────────

export interface GlobalChatMessage {
  id: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  level?: number;
  badge?: string;
  message: string;
  created_at: string;
}

export async function fetchGlobalMessages(limitCount = 100): Promise<GlobalChatMessage[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("global_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limitCount);

    if (!error && data) {
      return (data as GlobalChatMessage[]).reverse();
    }

    // If there is an auth/JWT error (e.g. "JWT issued at future" / clock skew or stale token),
    // attempt session refresh or fallback to unauthenticated public REST fetch
    if (error) {
      console.warn("fetchGlobalMessages initial query notice:", error.message);
      if (error.message?.includes("JWT") || (error as any).code === "PGRST301" || (error as any).status === 401) {
        try {
          await supabase.auth.refreshSession();
        } catch {
          // ignore refresh error
        }
      }

      // Public read fallback via raw fetch with anon key
      try {
        const restUrl = `${supabaseUrl}/rest/v1/global_messages?select=*&order=created_at.desc&limit=${limitCount}`;
        const resp = await fetch(restUrl, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
        });
        if (resp.ok) {
          const rawData = await resp.json();
          if (Array.isArray(rawData)) {
            return (rawData as GlobalChatMessage[]).reverse();
          }
        }
      } catch (fallbackErr) {
        console.error("Public fallback chat fetch error:", fallbackErr);
      }
    }
    return [];
  } catch (err) {
    console.error("Failed to fetch global messages:", err);
    return [];
  }
}

export async function sendGlobalMessage(
  user: User,
  localProfile: ProfileData,
  messageText: string
): Promise<{ success: boolean; data?: GlobalChatMessage; error?: string }> {
  if (!isSupabaseConfigured() || !user) {
    return { success: false, error: "Harap login untuk mengirim pesan di Global Chat." };
  }

  const cleanMessage = messageText.trim();
  if (!cleanMessage) {
    return { success: false, error: "Pesan tidak boleh kosong." };
  }
  if (cleanMessage.length > 200) {
    return { success: false, error: "Pesan melebihi batas 200 karakter." };
  }

  try {
    const currentLevel = computeLevelFromXP(localProfile?.stats?.lifetimeScore || 0);
    const displayName =
      localProfile?.identity?.username && localProfile.identity.username !== "Player"
        ? localProfile.identity.username
        : user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split("@")[0] || "Operator";

    const payload = {
      user_id: user.id,
      username: displayName,
      avatar_url: localProfile?.identity?.avatar || user.user_metadata?.avatar_url || "default",
      level: currentLevel,
      badge: currentLevel >= 50 ? "LEGEND" : currentLevel >= 25 ? "MASTER" : currentLevel >= 10 ? "ELITE" : "OPERATOR",
      message: cleanMessage,
      created_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from("global_messages")
      .insert([payload])
      .select()
      .single();

    if (error && (error.message?.includes("JWT") || (error as any).status === 401)) {
      // Attempt refresh and retry once
      try {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session) {
          const retry = await supabase
            .from("global_messages")
            .insert([payload])
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }
      } catch {
        // ignore
      }
    }

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as GlobalChatMessage };
  } catch (err: any) {
    console.error("Failed to send global message:", err);
    return { success: false, error: err?.message || "Gagal mengirim pesan." };
  }
}

export function subscribeToGlobalMessages(
  onNewMessage: (msg: GlobalChatMessage) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel("global_messages_feed")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "global_messages",
      },
      (payload) => {
        if (payload.new) {
          onNewMessage(payload.new as GlobalChatMessage);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
