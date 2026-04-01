# Supabase JWT Authentication Middleware

## Overview
Production-ready Supabase JWT verification middleware using JWKS (JSON Web Key Set) for secure token validation.

## Features
- ✅ JWKS-based verification (no API calls to Supabase)
- ✅ ES256 algorithm support
- ✅ Token expiration checking
- ✅ Issuer and audience validation
- ✅ Caching for performance
- ✅ Comprehensive error handling
- ✅ Admin role protection
- ✅ Production-ready logging

## Installation
```bash
npm install jsonwebtoken jwks-rsa
```

## Environment Variables
Add these to your `.env` file:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-database-url
```

## Usage

### Basic Authentication
```javascript
import { authMiddleware } from "./middlewares/supabaseAuth.mjs";

// Protect any route
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

### Admin-Only Routes
```javascript
import protectAdmin from "./middlewares/protectAdmin.mjs";

// Admin-only route
app.post("/admin/posts", protectAdmin, (req, res) => {
  res.json({ message: "Admin access granted" });
});
```

## Middleware Details

### User Object Structure
After successful authentication, `req.user` contains:
```javascript
{
  id: "user-uuid",
  email: "user@example.com",
  role: "admin" | "user",
  phone: null | "phone-number",
  email_verified: boolean,
  phone_verified: boolean,
  app_metadata: {},
  user_metadata: {},
  session_id: "session-uuid",
  iss: "https://your-project.supabase.co/auth/v1",
  aud: "authenticated",
  exp: 1234567890,
  iat: 1234567890
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized: No Bearer token provided"
}
```

#### 401 Token Expired
```json
{
  "error": "Unauthorized: Token expired"
}
```

#### 401 Invalid Token
```json
{
  "error": "Unauthorized: Invalid token"
}
```

#### 403 Forbidden (Admin Routes)
```json
{
  "error": "Forbidden: Admin access required",
  "currentRole": "user"
}
```

#### 404 User Not Found
```json
{
  "error": "User not found in database"
}
```

## Testing

### 1. Test Environment Variables
```bash
curl http://localhost:4002/debug/env
```

### 2. Test Token Validation
```bash
curl -X POST http://localhost:4002/debug/token \
  -H "Content-Type: application/json" \
  -d '{"token": "your-supabase-access-token"}'
```

### 3. Test Protected Route
```bash
curl -H "Authorization: Bearer your-token" \
  http://localhost:4002/test/auth
```

### 4. Test Admin Route
```bash
curl -H "Authorization: Bearer admin-token" \
  http://localhost:4002/test/admin
```

## Frontend Integration

### React/JavaScript Example
```javascript
// After Supabase login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password'
});

const accessToken = data.session.access_token;

// Make authenticated request
const response = await fetch('/api/admin/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(postData)
});
```

## Security Features

### 1. JWKS Caching
- Keys cached for 10 minutes
- Reduces API calls to Supabase
- Improves performance

### 2. Token Validation
- Algorithm verification (ES256 only)
- Issuer validation
- Audience validation
- Expiration checking
- 30-second clock tolerance

### 3. Error Handling
- Detailed error messages for debugging
- Generic errors for production
- No sensitive data leakage

## Production Considerations

### 1. Environment Variables
Ensure all required environment variables are set in production:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`

### 2. Rate Limiting
Add rate limiting to prevent brute force attacks:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Monitoring
Add logging for security monitoring:
```javascript
// Log authentication failures
console.log(`Auth failed for IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`);
```

## Troubleshooting

### Common Issues

#### 1. "Token expired"
- Token has expired (1 hour lifetime)
- Solution: Refresh token using Supabase client

#### 2. "Invalid token"
- Token format incorrect
- Wrong algorithm (must be ES256)
- Solution: Use proper Supabase access token

#### 3. "User not found in database"
- User exists in Supabase but not local database
- Solution: Sync user from Supabase to local database

#### 4. JWKS fetch errors
- Network connectivity issues
- Supabase URL incorrect
- Solution: Check SUPABASE_URL environment variable

### Debug Mode
Enable detailed logging by setting:
```env
DEBUG=supabase-auth
```

## Migration from Old Middleware

### Before
```javascript
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(url, key);
const { data, error } = await supabase.auth.getUser(token);
```

### After
```javascript
import { authMiddleware } from "./middlewares/supabaseAuth.mjs";
// No API calls, uses JWKS verification
```

## Performance Benefits

- **No API calls**: Uses JWKS instead of Supabase API
- **Caching**: Keys cached for 10 minutes
- **Faster**: ~10-50ms vs ~200-500ms per request
- **Reliable**: No network dependency after initial key fetch

## Support

For issues:
1. Check environment variables
2. Verify token format
3. Check Supabase project URL
4. Review error logs
5. Test with debug endpoints
