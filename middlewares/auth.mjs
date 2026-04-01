import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return res.status(500).json({ 
        error: "Server configuration error",
        details: "Supabase configuration missing"
      });
    }

    // Create Supabase client inside the function
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

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ 
        error: "Invalid token",
        details: error.message || "Token validation failed"
      });
    }
    
    if (!data.user) {
      return res.status(401).json({ 
        error: "Invalid token",
        details: "No user found in token"
      });
    }

    // Add user info to request
    req.user = data.user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    // Check if it's a fetch error (network/connectivity issue)
    if (error.message && error.message.includes('fetch')) {
      return res.status(500).json({ 
        error: "Server configuration error",
        details: "Cannot connect to Supabase. Check environment variables."
      });
    }
    
    return res.status(401).json({ error: "Token validation failed" });
  }
}