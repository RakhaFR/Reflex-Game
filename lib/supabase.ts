import { createClient, User } from "@supabase/supabase-js";
import { ProfileData, profileSave } from "./profile";

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
  return await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        username: username || email.split("@")[0],
        full_name: username || email.split("@")[0],
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
    const payload = {
      id: user.id,
      username: localProfile.identity.username || user.user_metadata?.full_name || "Operator",
      avatar_url: localProfile.identity.avatar || user.user_metadata?.avatar_url || "default",
      xp: localProfile.stats.lifetimeScore || 0,
      banner_skin: localProfile.identity.bannerSkin || "arcade-spark",
      stats: localProfile.stats,
      settings: localProfile.settings,
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

export async function fetchCloudProfile(user: User, localProfile: ProfileData): Promise<ProfileData | null> {
  if (!isSupabaseConfigured() || !user) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const googleName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
    const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

    if (error || !data) {
      // First time user profile created in cloud
      const newProfile: ProfileData = {
        ...localProfile,
        identity: {
          ...localProfile.identity,
          username: googleName || localProfile.identity.username,
          avatar: googleAvatar || localProfile.identity.avatar,
        },
      };
      await syncLocalProfileToCloud(user, newProfile);
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
      },
      settings: {
        ...localProfile.settings,
        ...(data.settings || {}),
      },
    };

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
    const payload = {
      user_id: user.id,
      username: profile.identity.username || "Operator",
      avatar_url: profile.identity.avatar || "default",
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
