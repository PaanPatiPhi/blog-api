import { createClient } from "@supabase/supabase-js";
import connectionPool from "../utils/db.mjs";

const protectAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log("Admin auth - Auth header:", authHeader ? "Present" : "Missing");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Admin auth - No Bearer token found");
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Admin auth - Token length:", token.length);
  console.log("Admin auth - Token preview:", token.substring(0, 20) + "...");
  
  try {
    // Check environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Missing Supabase environment variables");
      return res.status(500).json({ 
        error: "Server configuration error",
        details: "Supabase configuration missing"
      });
    }

    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Supabase Key present:", !!process.env.SUPABASE_ANON_KEY);

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
    
    console.log("Admin auth - Supabase response:", { 
      hasError: !!error, 
      errorMessage: error?.message,
      hasUser: !!data?.user 
    });
    
    if (error) {
      console.error("Admin auth - Supabase error:", error);
      return res.status(401).json({ 
        error: "Unauthorized: Invalid token",
        details: error.message || "Token validation failed"
      });
    }

    if (!data.user) {
      console.log("Admin auth - No user found in token");
      return res.status(401).json({ 
        error: "Unauthorized: Invalid token",
        details: "No user found in token"
      });
    }

    const supabaseUserId = data.user.id;
    console.log("Admin auth - User ID:", supabaseUserId);
    
    // Check user role in database
    const query = `
      SELECT role FROM users
      WHERE id = $1
    `;
    const values = [supabaseUserId];
    const { rows } = await connectionPool.query(query, values);
    
    console.log("Admin auth - Database query result:", rows.length, "rows found");
    
    if (!rows.length) {
      console.log("Admin auth - User not found in database");
      return res.status(404).json({ error: "User not found in database" });
    }
    
    const userRole = rows[0].role;
    console.log("Admin auth - User role:", userRole);
    
    // Add user info to request
    req.user = { 
      ...data.user, 
      role: userRole 
    };
    
    // Check if user is admin
    if (userRole !== "admin") {
      console.log("Admin auth - Access denied. Role:", userRole);
      return res.status(403).json({ 
        error: "Forbidden: Admin access required",
        currentRole: userRole 
      });
    }
    
    console.log("Admin auth - Access granted for admin user");
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    
    // Check if it's a fetch error (network/connectivity issue)
    if (err.message && err.message.includes('fetch')) {
      return res.status(500).json({ 
        error: "Server configuration error",
        details: "Cannot connect to Supabase. Check environment variables."
      });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectAdmin;