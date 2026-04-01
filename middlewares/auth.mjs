import { verifySupabaseToken } from "./supabaseAuth.mjs";

export const authMiddleware = verifySupabaseToken;