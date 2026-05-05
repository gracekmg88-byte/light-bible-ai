import { supabase } from "@/integrations/supabase/client";

export type UserSettings = {
  user_id: string;
  reminder_time: string; // "HH:MM"
  reminder_enabled: boolean;
  active_plan_id: string | null;
};

export async function getSettings(userId: string): Promise<UserSettings | null> {
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as UserSettings) ?? null;
}

export async function upsertSettings(
  userId: string,
  patch: Partial<Omit<UserSettings, "user_id">>
) {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as UserSettings;
}
