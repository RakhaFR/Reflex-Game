import { createClient, User } from "@supabase/supabase-js";
import { ProfileData, profileSave, computeLevelFromXP } from "./profile";

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
  return await supabase.auth.signUp({
    email,
    password: pass,
    options: {
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

    const merged: ProfileData = {
      ...localProfile,
      identity: {
        ...localProfile.identity,
        username: data.username && data.username !== "Player" ? data.username : (googleName || localProfile.identity.username),
        avatar: resolvedAvatar,
        bannerSkin: data.banner_skin || localProfile.identity.bannerSkin,
      },
      stats: {
        ...localProfile.stats,
        ...(data.stats || {}),
        lifetimeScore: typeof data.xp === "number" ? data.xp : localProfile.stats.lifetimeScore,
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
