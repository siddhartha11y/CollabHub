# Database Connection Fix for Serverless

## The Problem
The error `prepared statement "s0" already exists` happens because:
1. Serverless functions reuse connections
2. Prisma tries to reuse prepared statements
3. This causes conflicts in connection pooling

## The Solution

### Update your Vercel Environment Variables:

**DATABASE_URL** (use this exact string):
```
postgresql://postgres.bmhoejzbdrycjwpzegfx:MyCollabHub2024!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Alternative Connection Strings to Try:

**Option 1: Session Pooler with Parameters**
```
postgresql://postgres.bmhoejzbdrycjwpzegfx:MyCollabHub2024!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0
```

**Option 2: Direct Connection (if pooler fails)**
```
postgresql://postgres.bmhoejzbdrycjwpzegfx:MyCollabHub2024!@db.bmhoejzbdrycjwpzegfx.supabase.co:5432/postgres?connection_limit=1
```

**Option 3: Transaction Pooler**
```
postgresql://postgres.bmhoejzbdrycjwpzegfx:MyCollabHub2024!@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

## Steps to Fix:

1. **Update Vercel Environment Variable**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Update `DATABASE_URL` with Option 1 above
   - Redeploy

2. **If Option 1 doesn't work, try Option 2**
3. **If still failing, try Option 3**

## Test After Each Change:
- Visit: `https://collabhub-amber.vercel.app/api/test-db`
- Should show success message
- Try logging in with Google OAuth

## Connection Parameters Explained:
- `pgbouncer=true`: Enables connection pooling
- `connection_limit=1`: Limits connections per function
- `pool_timeout=0`: Prevents connection timeout issues