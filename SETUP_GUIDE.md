# MatchSlot Setup Guide

Quick guide to get your football match booking app up and running.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier works)
- iOS Simulator (Mac) or Android Emulator, or physical device with Expo Go app

## Step 1: Install Dependencies

```bash
cd MatchSlot
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: MatchSlot
   - Database Password: (save this)
   - Region: Choose closest to you
5. Wait for project to be created (1-2 minutes)

### 2.2 Run Database Schema

1. In your Supabase project, go to the SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the query editor
5. Click "Run" to execute

This creates:
- 4 tables (match_offers, slots, approvals, notifications)
- Indexes for performance
- Row Level Security policies
- Triggers for timestamps

### 2.3 Get API Credentials

1. In Supabase, go to Settings → API
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 2.4 Update App Configuration

Open `lib/supabase.ts` and update:

```typescript
const supabaseUrl = 'YOUR_PROJECT_URL';
const supabaseAnonKey = 'YOUR_ANON_KEY';
```

Or create environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Start Development Server

```bash
npm start
```

This opens Expo DevTools in your browser.

## Step 4: Run the App

### Option A: Physical Device (Recommended for Testing)

1. Install "Expo Go" app from:
   - iOS: App Store
   - Android: Google Play Store
2. Scan the QR code from the terminal/browser
3. App will load on your device

### Option B: iOS Simulator (Mac Only)

```bash
# Press 'i' in the terminal, or
npm run ios
```

### Option C: Android Emulator

```bash
# Press 'a' in the terminal, or
npm run android
```

## Step 5: Test the App

### Create a Match Offer (Host)

1. On the home screen, tap "Create Match Offer"
2. Fill in your details:
   - Name: John Smith
   - Club: City FC
   - Contact: john@cityfc.com
3. Select match details:
   - Age Group: U12
   - Format: 11v11
   - Duration: 90 minutes
   - Location: Central Park Field 1
4. Add time slots (tap the + button):
   - Select date
   - Select start time
   - End time auto-calculates
   - Add at least 2 slots
5. Tap "Create Match Offer"

### View Your Offers

1. Tap "My Matches" tab at bottom
2. You'll see your created offer
3. Tap "Share Link" to copy the link
4. You can paste this in notes/messages

### Book a Match (Guest Flow)

Since you can't actually send the link yet, you can test manually:

1. Copy the share token from the database or URL
2. In your code, hardcode a navigation or use deep linking
3. Or note the token and manually type the URL

For quick testing:
1. In Supabase, go to Table Editor → match_offers
2. Find your offer's `share_token`
3. The guest URL would be: `matchslot://offer/{share_token}`

### Test Booking Process

1. Open offer link (as guest)
2. View match details
3. Select a time slot
4. Fill in booking form:
   - Your name
   - Club name  
   - Contact
   - Approver email (use your own for testing)
5. Submit booking

### Test Approval

1. In Supabase, go to Table Editor → approvals
2. Find the approval record
3. Copy the `approval_token`
4. Approval URL: `matchslot://approve/{approval_token}`
5. Open and approve/reject the booking

## Step 6: Verify Database

Check Supabase Table Editor to see:

### match_offers table
- Your match offer with status 'OPEN'
- Unique share_token

### slots table
- Multiple slots for your offer
- Status changes: OPEN → PENDING_APPROVAL → BOOKED

### approvals table
- Approval requests created
- Status updates

### notifications table
- Notification records created
- `sent` will be `false` (email integration not implemented)

## Common Issues & Solutions

### Issue: "Network request failed"
**Solution**: Check Supabase URL and API key in `lib/supabase.ts`

### Issue: Database errors
**Solution**: Make sure you ran the complete SQL schema. Check Supabase logs.

### Issue: App won't start
**Solution**: 
```bash
# Clear cache and restart
npm start -- --clear
```

### Issue: Icons not showing
**Solution**: Make sure `@expo/vector-icons` is installed:
```bash
npm install @expo/vector-icons
```

### Issue: TypeScript errors
**Solution**: 
```bash
npm install --save-dev typescript @types/react
```

## Deep Linking Setup (Optional)

To test shareable links properly:

### iOS
1. Build development client
2. Configure URL scheme in app.json (already done: `matchslot`)

### Android
1. Build development client
2. URL scheme configured in app.json

### Testing Deep Links

```bash
# iOS Simulator
xcrun simctl openurl booted "matchslot://offer/YOUR_TOKEN"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "matchslot://offer/YOUR_TOKEN"
```

## Production Deployment

When ready to deploy:

1. **Environment Variables**: Use Expo's environment variables
2. **App Icons**: Replace placeholder icons in `assets/images/`
3. **Splash Screen**: Update splash-icon.png
4. **Domain**: Update BASE_URL in `constants/AppConfig.ts`
5. **Build**: Use EAS Build for production builds
   ```bash
   npm install -g eas-cli
   eas build --platform ios
   eas build --platform android
   ```

## Email Notifications Setup (Future)

To implement email notifications:

1. Choose email service (SendGrid, AWS SES, Mailgun)
2. Create Supabase Edge Function
3. Trigger on notification insert
4. Send email and mark as sent

Example with SendGrid:
```typescript
// Supabase Edge Function
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  // Fetch unsent notifications
  // Send via SendGrid API
  // Update sent status
})
```

## Support & Resources

- **Expo Docs**: https://docs.expo.dev
- **Supabase Docs**: https://supabase.com/docs
- **React Native**: https://reactnative.dev
- **Expo Router**: https://docs.expo.dev/router/introduction/

## Next Steps

1. ✅ Create your first match offer
2. ✅ Test the booking flow
3. ✅ Test the approval flow
4. 📧 Set up email notifications (optional)
5. 🎨 Customize branding and colors
6. 🚀 Deploy to production

## Development Tips

- Use Expo's Fast Refresh for instant updates
- Check Supabase logs for database errors
- Use React Developer Tools for debugging
- Test on real devices for best experience
- Keep Supabase dashboard open to monitor data

## Getting Help

If you encounter issues:
1. Check the console/terminal for errors
2. Check Supabase logs (Project → Logs)
3. Verify database schema is correct
4. Check USER_STORIES_IMPLEMENTATION.md for feature details

Happy coding! ⚽
