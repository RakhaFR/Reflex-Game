import { createClient, User } from "@supabase/supabase-js";
import { ProfileData, profileSave } from "./profile";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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
    return { data: null, error: new Error("Supabase belum di-setup di .env.local") };
  }
  return await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
}

export async function signInWithEmail(email: string, pass: string) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase belum di-setup di .env.local") };
  }
  return await supabase.auth.signInWithPassword({ email, password: pass });
}

export async function signUpWithEmail(email: string, pass: string, username: string) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: new Error("Supabase belum di-setup di .env.local") };
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

    if (error || !data) {
      return null;
    }

    const merged: ProfileData = {
      ...localProfile,
      identity: {
        ...localProfile.identity,
        username: data.username || localProfile.identity.username,
        avatar: data.avatar_url || localProfile.identity.avatar,
        bannerSkin: data.banner_skin || localProfile.identity.bannerSkin,
      },
      stats: {
        ...localProfile.stats,
        ...(data.stats || {}),
        lifetimeScore: typeof data.xp === "number" ? data.xp : localProfile.stats.lifetimeScore,
      },
    };

    profileSave(merged);
    return merged;
  } catch (err) {
    console.error("Failed to fetch cloud profile:", err);
    return null;
  }
}
