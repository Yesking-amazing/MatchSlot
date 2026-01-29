# ⚽ MatchSlot Quick Start

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create new project
3. **Choose one of these options:**

   **Option A: Fresh Database (Recommended)**
   - Copy entire content from `supabase/schema.sql`
   - In Supabase dashboard: SQL Editor → New Query → Paste → Run

   **Option B: Migrating from Old Schema**
   - If you have existing tables (like old "matches" or "slots" tables)
   - Copy entire content from `supabase/full_migration.sql`
   - In Supabase dashboard: SQL Editor → New Query → Paste → Run
   - ⚠️ This will delete all existing data!

4. Get your credentials: Settings → API

### 3. Update Config

Edit `lib/supabase.ts`:
```typescript
const supabaseUrl = 'YOUR_URL_HERE';
const supabaseAnonKey = 'YOUR_KEY_HERE';
```

### 4. Run App
```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Or scan QR code with Expo Go app

---

## 📱 Test the Full Workflow

### As Host (Create Match)
1. Home screen → "Create Match Offer"
2. Enter your details
3. Select: U12, 11v11, 90 mins
4. Add location
5. Add 2-3 time slots
6. Create!

### View Your Offers
1. Tap "My Matches" tab
2. See your offer
3. Tap "Share Link" (copies to clipboard)

### As Guest (Book Match)
1. To test: Check Supabase → match_offers table → copy share_token
2. Guest URL format: `matchslot://offer/{share_token}`
3. View offer → Select slot
4. Enter team details
5. Enter approver email (use your own for testing)
6. Submit

### As Approver (Approve/Reject)
1. Check Supabase → approvals table → copy approval_token
2. Approval URL: `matchslot://approve/{approval_token}`
3. Review details
4. Approve or Reject

---

## 🎯 Key Features

- ✅ Create match offers with multiple time slots
- ✅ Share links (no login needed for guests)
- ✅ Book slots with approval workflow
- ✅ Real-time slot status updates
- ✅ Prevent double bookings
- ✅ Football-specific (age groups, formats)

---

## 📂 Important Files

- `supabase/schema.sql` - Database setup
- `lib/supabase.ts` - Configuration
- `app/match/create.tsx` - Create offer
- `app/(tabs)/manage.tsx` - Manage offers
- `app/offer/[token].tsx` - Guest view
- `app/offer/book/[slotId].tsx` - Booking form
- `app/approve/[token].tsx` - Approval screen

---

## 🔧 Troubleshooting

**App won't connect to database?**
→ Check URL and API key in `lib/supabase.ts`

**Database errors?**
→ Make sure you ran the full schema SQL

**App won't start?**
→ Try: `npm start -- --clear`

**Icons not showing?**
→ Run: `npm install @expo/vector-icons`

---

## 📚 More Info

- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup steps
- `USER_STORIES_IMPLEMENTATION.md` - Feature details
- `CHANGES_SUMMARY.md` - What changed

---

## 🎨 Customize

### Change Colors
Edit `constants/Colors.ts`

### Change Age Groups
Edit `constants/AppConfig.ts`

### Change App Name
Edit `app.json`

---

## 📧 TODO: Email Notifications

Currently notifications are created in database but not sent.

To enable:
1. Choose email service (SendGrid, AWS SES)
2. Create Supabase Edge Function
3. Send emails from notifications table
4. Mark as sent

---

## 🚀 Ready to Deploy?

1. Update `BASE_URL` in `constants/AppConfig.ts`
2. Add app icons in `assets/images/`
3. Build with EAS:
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

---

Happy coding! ⚽

Need help? Check the full documentation in README.md
