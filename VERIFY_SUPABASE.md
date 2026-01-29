# 🔍 Verify Your Supabase Configuration

## Step 1: Get Your CORRECT Supabase URL

1. Go to [https://supabase.com](https://supabase.com)
2. Open your project
3. Click **Settings** (gear icon on left sidebar)
4. Click **API**
5. Look for **Project URL** section
6. Copy the URL (should look like: `https://xxxxx.supabase.co`)

## Step 2: Get Your CORRECT Anon Key

In the same API settings page:
1. Look for **Project API keys** section
2. Find the **anon public** key
3. Copy it (starts with `eyJ...`)

## Step 3: Update lib/supabase.ts

Replace the values on lines 5-6:

```typescript
const supabaseUrl = 'YOUR_URL_HERE';
const supabaseAnonKey = 'YOUR_ANON_KEY_HERE';
```

## Common Issues:

### "Network request failed" means:
- ✅ Tables exist (you confirmed this)
- ❌ URL or API key is incorrect
- ❌ Network connectivity issue

### How to fix:
1. Double-check URL matches EXACTLY what's in Supabase settings
2. Double-check anon key matches EXACTLY
3. Make sure you're using `https://` not `http://`
4. Try accessing the URL in your browser to verify it works

## Current Values in Your Code:

**URL:** `https://ijmjjzcroxkbsjcmztgd.supabase.co`
**Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (truncated)

Compare these with what's in your Supabase dashboard!

## Test After Updating:

1. Save `lib/supabase.ts`
2. Restart the app: `npm start`
3. Tap "Test Database Connection" on home screen
4. Should see ✅ Success!
