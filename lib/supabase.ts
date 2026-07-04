import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Null when env vars are absent — the app degrades gracefully (quiz still works). */
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;

export const SCORES_TABLE = "rtl8192eu_scores";

export interface ScoreRow {
  handle: string;
  score: number;
  total: number;
  created_at?: string;
}
