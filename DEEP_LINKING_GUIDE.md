# 🔗 Deep Linking Guide - Making Shareable Links Work

## Current Status

✅ **Your app is configured with:** `matchslot://` URL scheme
✅ **Links will work immediately** on TestFlight and production
✅ **No domain needed** for basic functionality

---

## 📱 **How Links Work Now**

### **Link Format:**
```
matchslot://offer/abc123token
matchslot://approve/xyz456token
```

### **What Happens:**
1. User receives link (via SMS, WhatsApp, email, etc.)
2. User taps the link
3. iOS/Android asks: "Open in MatchSlot?"
4. User taps "Open"
5. ✅ App opens directly to that screen!

---

## 🧪 **Testing Deep Links**

### ⚠️ **Important: Deep Links Don't Work in Expo Go**

Custom URL schemes (`matchslot://`) **only work in production builds**, not Expo Go!

❌ Won't work: Expo Go (development)
✅ Will work: TestFlight, App Store, EAS Development Builds

---

### **Method 1: Test on TestFlight (Recommended)**

This is the most accurate test:

1. Build your app:
   ```bash
   eas build --platform ios
   ```

2. Upload to TestFlight
3. Install on device
4. Create a match and copy the share link
5. Send link via iMessage/WhatsApp
6. Tap link → Opens in your app! ✅

---

### **Method 2: Build Development Client**

Create a standalone development build that supports deep links:

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --profile development --platform ios
```

Then:
```bash
# Test deep links (will work now!)
xcrun simctl openurl booted "matchslot://offer/test-token-123"
```

✅ This creates an app like production but with debugging enabled

---

### **Method 3: Simulate in Development (Current Approach)**

Since deep links don't work in Expo Go, you can:

1. **Manually navigate** to test screens
2. Use the in-app navigation to simulate the flow
3. Example: Tap a button to navigate to `/offer/[token]`

This tests the screens, but not the actual link opening.

### **Method 2: In Android Emulator**

```bash
# Make sure your app is running
npm start

# In another terminal window, run:
adb shell am start -W -a android.intent.action.VIEW -d "matchslot://offer/test-token-123"
```

### **Method 3: On Physical Device (Best)**

1. Create a match offer in your app
2. Copy the share link
3. Send it to yourself via:
   - iMessage
   - WhatsApp
   - Email
   - Notes (create link and tap it)
4. Tap the link
5. Choose "Open in MatchSlot"
6. ✅ Should open the offer!

---

## 📋 **Step-by-Step: Full Workflow Test**

### **Test 1: Match Offer Link**

1. **Create match offer:**
   - Open app
   - Create a match with time slots
   - Tap "Share Link" in My Matches

2. **Get the token:**
   - Link is copied to clipboard
   - Format will be: `matchslot://offer/XXXXX`
   - The XXXXX is the share_token

3. **Test the link:**
   - On same device: Paste in Notes, tap it
   - On another device: Send via iMessage, tap it
   - Should open the offer screen!

### **Test 2: Approval Link**

1. **Create booking:**
   - Open a match offer link
   - Select a time slot
   - Fill in team details
   - Enter approver email
   - Submit

2. **Get approval token:**
   - Go to Supabase → Table Editor → approvals
   - Find the record
   - Copy the `approval_token`

3. **Create approval link:**
   - Format: `matchslot://approve/THE-TOKEN`

4. **Test:**
   - Send to approver's device
   - They tap link
   - Should open approval screen!

---

## 🚀 **For TestFlight:**

### **What Works Automatically:**
✅ Links work exactly as in development
✅ No code changes needed
✅ No domain needed

### **To Deploy:**

1. **Build your app:**
```bash
npm install -g eas-cli
eas build --platform ios
```

2. **Upload to TestFlight:**
   - Build completes
   - Download and upload to App Store Connect
   - Add internal testers

3. **Share links:**
   - Testers install from TestFlight
   - You create match offers
   - Share links via any messaging app
   - ✅ Links open directly in app!

---

## 🌐 **Upgrading to Universal Links (Optional)**

If you want professional `https://` links instead of `matchslot://`:

### **Requirements:**
1. Own a domain (e.g., matchslot.com)
2. Host a website (can be simple landing page)
3. Configure Apple App Site Association (AASA)

### **Steps:**

1. **Get a domain** (e.g., from Namecheap, GoDaddy)

2. **Create AASA file** at `https://yourdomain.com/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourcompany.matchslot",
        "paths": ["/offer/*", "/approve/*"]
      }
    ]
  }
}
```

3. **Update `lib/shareLink.ts`:**
```typescript
const USE_UNIVERSAL_LINKS = true;
```

4. **Update `app.json`:**
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:yourdomain.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": "yourdomain.com",
              "pathPrefix": "/offer"
            }
          ]
        }
      ]
    }
  }
}
```

5. **Rebuild app** with EAS Build

### **Benefits:**
- Professional looking links
- Works in browser (can show "Install App" page)
- Better for marketing/sharing

---

## 🔧 **Troubleshooting**

### **Link doesn't open app:**

1. **Check URL scheme in app.json:**
   ```json
   "scheme": "matchslot"
   ```
   ✅ This is already set!

2. **Rebuild app:**
   - If you changed anything, rebuild:
   ```bash
   npm start -- --clear
   ```

3. **Check link format:**
   - Correct: `matchslot://offer/token`
   - Wrong: `matchslot:/offer/token` (missing /)
   - Wrong: `matchslot//offer/token` (missing :)

4. **On iOS, reset "Open in" preferences:**
   - Settings → Safari → Clear History and Website Data

### **Link opens but wrong screen:**

Check your route setup. The routes should be:
- `/offer/[token].tsx` → Opens guest view
- `/approve/[token].tsx` → Opens approval view

✅ These are already created!

---

## 📱 **Current Configuration**

Your app already has everything configured:

### **app.json:**
```json
"scheme": "matchslot"
```
✅ Enabled

### **Routes:**
- ✅ `app/offer/[token].tsx` → Guest view
- ✅ `app/approve/[token].tsx` → Approval view

### **Link Generation:**
- ✅ `lib/shareLink.ts` → Generates links
- ✅ Default: URL scheme (`matchslot://`)
- ⏸️ Optional: Universal links (when you have domain)

---

## ✅ **What You Need to Do:**

### **For TestFlight (Now):**
1. ✅ Nothing! It's ready
2. Just build and deploy
3. Links work immediately

### **For Production (Later):**
1. Consider getting a domain
2. Set up universal links (optional)
3. Better for marketing

---

## 📨 **Example Messages to Share:**

### **For Coaches:**
```
🎯 Football Match Available!

U12 11v11 match at Central Park
Saturday, Feb 3rd - Multiple time slots available

View and book: matchslot://offer/abc123xyz

Tap the link to see available times!
```

### **For Approvers:**
```
⚽ Match Booking Approval Needed

City FC has requested to book a match slot.

Review and approve: matchslot://approve/xyz789abc

Tap to view details and approve/reject.
```

---

## 🎉 **Summary**

✅ **Links work NOW** - no domain needed
✅ **Works on TestFlight** - automatically
✅ **Works in production** - automatically
🔄 **Can upgrade later** - to universal links if you want

You're all set for TestFlight! 🚀
