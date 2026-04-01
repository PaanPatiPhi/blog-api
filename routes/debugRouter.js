import { Router } from "express";
import jwt from "jsonwebtoken";

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

// Decode JWT token (without verification)
debugRouter.post("/decode", (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ error: "Invalid JWT format" });
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return res.status(200).json({
      header,
      payload,
      expiresAt: new Date(payload.exp * 1000),
      isExpired: Date.now() > payload.exp * 1000,
      currentTime: new Date()
    });
  } catch (error) {
    return res.status(400).json({ 
      error: "Failed to decode token",
      details: error.message 
    });
  }
});

// Test JWKS endpoint
debugRouter.get("/jwks", async (req, res) => {
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
    const jwks = await response.json();
    
    return res.status(200).json({
      url: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
      keys: jwks.keys,
      keyCount: jwks.keys.length
    });
  } catch (error) {
    return res.status(500).json({ 
      error: "Failed to fetch JWKS",
      details: error.message 
    });
  }
});

export default debugRouter;
