import { createClient } from "@supabase/supabase-js";
import connectionPool from "../utils/db.mjs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    console.log("Admin auth - Supabase response:", { 
      hasError: !!error, 
      errorMessage: error?.message,
      hasUser: !!data?.user 
    });
    
    if (error || !data.user) {
      console.error("Admin auth error:", error);
      return res.status(401).json({ 
        error: "Unauthorized: Invalid token",
        details: error?.message || "No user found"
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
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectAdmin;