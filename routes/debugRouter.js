import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const debugRouter = Router();

// Check environment variables
debugRouter.get("/env", async (req, res) => {
  return res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL ? "Set" : "Missing",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? "Set" : "Missing",
    databaseUrl: process.env.DATABASE_URL ? "Set" : "Missing",
    port: process.env.PORT || "Not set"
  });
});

// Debug endpoint to check token format
debugRouter.post("/token", async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  console.log("Received token:", token.substring(0, 50) + "...");

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    console.log("Supabase response:", { data, error });

    if (error) {
      return res.status(400).json({
        error: "Token validation failed",
        details: error.message,
        tokenType: "Invalid or expired token"
      });
    }

    if (!data.user) {
      return res.status(400).json({
        error: "No user found",
        tokenType: "Token valid but no user data"
      });
    }

    return res.status(200).json({
      message: "Token is valid",
      user: data.user,
      tokenType: "Valid Supabase access token"
    });

  } catch (err) {
    console.error("Debug error:", err);
    return res.status(500).json({
      error: "Debug error",
      details: err.message
    });
  }
});

export default debugRouter;
