import { createClient } from "@supabase/supabase-js";
import connectionPool from "../utils/db.mjs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const protectAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const token = authHeader.split(" ")[1];
  
  try {
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error("Admin auth error:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const supabaseUserId = data.user.id;
    
    // Check user role in database
    const query = `
      SELECT role FROM users
      WHERE id = $1
    `;
    const values = [supabaseUserId];
    const { rows } = await connectionPool.query(query, values);
    
    if (!rows.length) {
      return res.status(404).json({ error: "User not found in database" });
    }
    
    const userRole = rows[0].role;
    
    // Add user info to request
    req.user = { 
      ...data.user, 
      role: userRole 
    };
    
    // Check if user is admin
    if (userRole !== "admin") {
      return res.status(403).json({ 
        error: "Forbidden: Admin access required",
        currentRole: userRole 
      });
    }
    
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectAdmin;