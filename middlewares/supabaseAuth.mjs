import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

// Create JWKS client for Supabase
const client = jwksClient({
  jwksUri: `${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Function to get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) {
      callback(err, null);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

// Supabase JWT verification middleware
export async function verifySupabaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      error: "Unauthorized: No Bearer token provided" 
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify JWT token using JWKS
    jwt.verify(token, getKey, {
      algorithms: ['ES256'],
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
      clockTolerance: 30 // 30 seconds tolerance
    }, (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: "Unauthorized: Token expired" 
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            error: "Unauthorized: Invalid token" 
          });
        }
        
        return res.status(401).json({ 
          error: "Unauthorized: Token verification failed",
          details: err.message 
        });
      }

      // Add user information to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.user_metadata?.role || 'user',
        phone: decoded.phone || null,
        email_verified: decoded.user_metadata?.email_verified || false,
        phone_verified: decoded.user_metadata?.phone_verified || false,
        app_metadata: decoded.app_metadata || {},
        user_metadata: decoded.user_metadata || {},
        session_id: decoded.session_id,
        iss: decoded.iss,
        aud: decoded.aud,
        exp: decoded.exp,
        iat: decoded.iat
      };

      next();
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({ 
      error: "Internal server error during token verification" 
    });
  }
}

// Admin protection middleware
export async function protectAdmin(req, res, next) {
  // First verify the token
  verifySupabaseToken(req, res, (err) => {
    if (err) return; // Error already handled by verifySupabaseToken
    
    // Check if user has admin role in database
    const checkAdminRole = async () => {
      try {
        const connectionPool = await import("../utils/db.mjs").then(m => m.default);
        
        const query = `SELECT role FROM users WHERE id = $1`;
        const { rows } = await connectionPool.query(query, [req.user.id]);
        
        if (!rows.length) {
          return res.status(404).json({ 
            error: "User not found in database" 
          });
        }
        
        const userRole = rows[0].role;
        
        if (userRole !== "admin") {
          return res.status(403).json({ 
            error: "Forbidden: Admin access required",
            currentRole: userRole 
          });
        }
        
        // Update user object with database role
        req.user.role = userRole;
        next();
      } catch (dbError) {
        console.error("Database error checking admin role:", dbError);
        return res.status(500).json({ 
          error: "Internal server error" 
        });
      }
    };
    
    checkAdminRole();
  });
}

// Basic authentication middleware (for non-admin routes)
export const authMiddleware = verifySupabaseToken;

export default {
  verifySupabaseToken,
  protectAdmin,
  authMiddleware
};
