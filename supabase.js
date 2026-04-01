import dotenv from "dotenv";
dotenv.config(); // ✅ ต้องอยู่บนสุด

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);