# Vercel Deployment Environment Variables Setup

## 🔍 Problem Analysis
- **Local works:** Environment variables are set in `.env` file
- **Vercel fails (401):** Environment variables missing on Vercel
- **Token is valid:** JWT token not expired and properly formatted

## 🛠️ Solution: Set Environment Variables on Vercel

### Step 1: Get Your Environment Variables
Check your local `.env` file:
```bash
cat .env
```

You should have:
```env
SUPABASE_URL=https://bwmnwcgomkjtvvwjhyop.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=your-database-url-here
```

### Step 2: Add Environment Variables to Vercel

#### Method 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project: `blog-api`
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | `https://bwmnwcgomkjtvvwjhyop.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `your-anon-key` | Production, Preview, Development |
| `DATABASE_URL` | `your-database-url` | Production, Preview, Development |

#### Method 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add DATABASE_URL

# Redeploy
vercel --prod
```

### Step 3: Get Your Supabase Credentials

#### From Supabase Dashboard:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `bwmnwcgomkjtvvwjhyop`
3. Go to **Settings** → **API**
4. Copy these values:

**Project URL:** `https://bwmnwcgomkjtvvwjhyop.supabase.co`
**Anon Public Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 4: Verify Setup

#### Test on Vercel:
```bash
# Test environment variables
curl https://your-app.vercel.app/debug/env

# Expected response:
{
  "supabaseUrl": "Set",
  "supabaseAnonKey": "Set", 
  "databaseUrl": "Set"
}
```

#### Test with Token:
```bash
curl -X POST https://your-app.vercel.app/debug/decode \
  -H "Content-Type: application/json" \
  -d '{"token": "your-access-token"}'
```

#### Test Admin Endpoint:
```bash
curl -H "Authorization: Bearer your-token" \
  https://your-app.vercel.app/test/admin
```

## 🚨 Common Issues & Solutions

### Issue 1: Environment Variables Not Loading
**Symptoms:** 401 errors, "Missing Supabase environment variables"

**Solution:**
1. Check Vercel Dashboard → Settings → Environment Variables
2. Ensure all 3 variables are set
3. Redeploy the application

### Issue 2: Wrong Supabase URL
**Symptoms:** "fetch failed" errors

**Solution:**
1. Verify URL format: `https://your-project.supabase.co`
2. No trailing slash
3. Correct project name

### Issue 3: Invalid Anon Key
**Symptoms:** 401 Unauthorized

**Solution:**
1. Get fresh key from Supabase Dashboard
2. Ensure it's the **anon** key, not service_role key
3. Check for extra spaces or characters

### Issue 4: Database URL Missing
**Symptoms:** Database connection errors

**Solution:**
1. Get connection string from Supabase Dashboard
2. Format: `postgresql://user:pass@host:port/dbname`

## 🔧 Debugging Steps

### Step 1: Check Environment
```bash
curl https://your-app.vercel.app/debug/env
```

### Step 2: Check JWKS
```bash
curl https://your-app.vercel.app/debug/jwks
```

### Step 3: Test Token
```bash
curl -X POST https://your-app.vercel.app/debug/decode \
  -H "Content-Type: application/json" \
  -d '{"token": "your-token"}'
```

### Step 4: Test Auth
```bash
curl -H "Authorization: Bearer your-token" \
  https://your-app.vercel.app/test/auth
```

### Step 5: Test Admin
```bash
curl -H "Authorization: Bearer your-token" \
  https://your-app.vercel.app/test/admin
```

## 📋 Environment Variables Checklist

- [ ] `SUPABASE_URL` set correctly
- [ ] `SUPABASE_ANON_KEY` set correctly  
- [ ] `DATABASE_URL` set correctly
- [ ] All variables set for Production environment
- [ ] All variables set for Preview environment
- [ ] Application redeployed after changes

## 🚀 After Setup

1. **Redeploy** your Vercel application
2. **Test** the debug endpoints
3. **Verify** admin functionality works
4. **Monitor** Vercel logs for any errors

## 💡 Pro Tips

### Automatic Environment Sync
Use Vercel CLI to sync local `.env`:
```bash
vercel env pull .env.production
```

### Environment-Specific Variables
Set different values for different environments:
- **Development:** Local testing
- **Preview:** Pull request previews  
- **Production:** Live application

### Security Best Practices
- Never commit `.env` files
- Use Vercel's encrypted environment variables
- Rotate keys regularly
- Monitor for unauthorized access

---

**🎯 Your token is valid - just need to configure Vercel environment variables!**
