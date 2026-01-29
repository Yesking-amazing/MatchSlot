# 🚀 TestFlight Deployment Guide

Complete step-by-step guide to get MatchSlot on TestFlight.

---

## ✅ Pre-Deployment Checklist

Before building, let's verify everything is ready:

- [x] ✅ Database schema deployed to Supabase
- [x] ✅ Supabase credentials configured in `lib/supabase.ts`
- [x] ✅ Deep linking configured (`matchslot://`)
- [x] ✅ All user stories implemented
- [x] ✅ `eas.json` created
- [x] ✅ `app.json` configured with bundle identifier

---

## 📋 Prerequisites

### 1. Apple Developer Account
**Required:** You need an Apple Developer account ($99/year)

- Go to [developer.apple.com](https://developer.apple.com)
- Enroll if you haven't already
- Wait for approval (can take 24-48 hours)

### 2. Install EAS CLI

```bash
npm install -g eas-cli
```

### 3. Create Expo Account (Free)

```bash
# Login or create account
eas login
```

---

## 🏗️ Build Process

### Step 1: Configure Your Project

Your project is already configured! But let's verify:

**Bundle Identifier:** `com.matchslot.app`
- This uniquely identifies your app
- You can change it in `app.json` if needed (before first build)

### Step 2: Configure EAS

```bash
# In your project directory
cd /Users/craighugli/Documents/MatchSlot

# Initialize EAS (if needed)
eas build:configure
```

This will:
- Link to your Expo account
- Create/update `eas.json`

### Step 3: Start the Build

```bash
# Build for iOS (production profile for TestFlight)
eas build --platform ios --profile production
```

**What happens:**
1. ✅ Code is uploaded to Expo servers
2. ✅ Dependencies are installed
3. ✅ Native iOS app is built
4. ✅ Build takes ~10-20 minutes
5. ✅ You get a download link

**During the build, you'll be asked:**

**"Generate a new Apple Distribution Certificate?"**
→ Answer: **Yes** (first time)

**"Generate a new Apple Provisioning Profile?"**
→ Answer: **Yes** (first time)

**"What would you like your iOS bundle identifier to be?"**
→ Answer: **com.matchslot.app** (or your custom one)

---

## 📱 App Store Connect Setup

While the build is running, set up App Store Connect:

### Step 1: Create App in App Store Connect

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Click **"My Apps"**
3. Click **"+"** → **"New App"**
4. Fill in:
   - **Platform:** iOS
   - **Name:** MatchSlot
   - **Primary Language:** English (US)
   - **Bundle ID:** Select `com.matchslot.app`
   - **SKU:** matchslot-app-001 (or any unique ID)
   - **User Access:** Full Access

5. Click **"Create"**

### Step 2: Fill Basic App Information

In App Store Connect:

1. **App Information:**
   - Privacy Policy URL: (you'll need to create one)
   - Category: Sports
   - Content Rights: Check the box

2. **Pricing and Availability:**
   - Price: Free
   - Availability: All countries (or your choice)

---

## 📤 Upload to TestFlight

### Step 1: Download Your Build

After `eas build` completes:

```bash
# You'll see a link like:
# https://expo.dev/artifacts/eas/...

# Or download via:
eas build:list
```

- Click the download link
- Save the `.ipa` file to your computer

### Step 2: Upload to App Store Connect

**Option A: Using Transporter (Recommended)**

1. Download **Transporter** from Mac App Store
2. Open Transporter
3. Sign in with your Apple ID
4. Drag and drop the `.ipa` file
5. Click **"Deliver"**
6. Wait for upload (5-10 minutes)

**Option B: Using EAS Submit (Easiest)**

```bash
# This does everything automatically!
eas submit --platform ios
```

When prompted:
- Select the build you just created
- Provide Apple ID credentials
- Wait for upload

### Step 3: Processing

After upload:
1. Go to App Store Connect → Your App → TestFlight
2. Build will show "Processing" (15-30 minutes)
3. You'll get an email when ready
4. Build will go through Apple review (usually 24-48 hours for first build)

---

## 👥 Add TestFlight Testers

Once build is processed:

### Internal Testing (No Review Needed)

1. In App Store Connect → TestFlight
2. Click **"Internal Testing"**
3. Click **"+"** to create a group
4. Name it: "MatchSlot Team"
5. Add testers:
   - Click **"+"** next to testers
   - Enter email addresses
   - Click **"Add"**

Testers receive email invite immediately! ✅

### External Testing (Requires Apple Review)

1. Click **"External Testing"**
2. Create a new group
3. Add testers (up to 10,000)
4. Provide test information for Apple
5. Submit for review (24-48 hours)

---

## 🧪 Testing on TestFlight

### For Testers:

1. **Install TestFlight** from App Store
2. **Check email** for invite
3. **Tap "View in TestFlight"**
4. **Install** MatchSlot
5. **Open and test!**

### Test Checklist:

- [ ] App opens successfully
- [ ] Create match offer works
- [ ] Multiple time slots can be added
- [ ] Share link is generated
- [ ] Share link format: `matchslot://offer/...`
- [ ] Send link via iMessage/WhatsApp
- [ ] Tap link on another device
- [ ] Link opens directly in app ✅
- [ ] Guest can view offer
- [ ] Guest can book slot
- [ ] Approval flow works

---

## 🔄 Updating Your App

When you make changes:

### Step 1: Update Version

In `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment this
    "ios": {
      "buildNumber": "2"  // Increment this
    }
  }
}
```

### Step 2: Build Again

```bash
eas build --platform ios --profile production
```

### Step 3: Upload

```bash
eas submit --platform ios
```

### Step 4: Notify Testers

TestFlight testers are notified automatically of updates!

---

## 🐛 Troubleshooting

### Build Failed?

**"Missing Apple Distribution Certificate"**
→ Run: `eas credentials` and regenerate

**"Bundle identifier already in use"**
→ Change `bundleIdentifier` in `app.json`

**"Command failed"**
→ Check terminal for specific error
→ Try: `npm install` and rebuild

### Upload Failed?

**"Invalid IPA"**
→ Make sure you built with `--profile production`

**"Transporter stuck"**
→ Use `eas submit` instead

### TestFlight Issues?

**"Build stuck in Processing"**
→ Normal, can take up to 1 hour
→ Check App Store Connect for status

**"Missing Compliance"**
→ In TestFlight, answer encryption questions:
  - Does your app use encryption? → No (unless you added it)

---

## 📊 Build Commands Reference

```bash
# Check build status
eas build:list

# View build details
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel

# View credentials
eas credentials

# Submit to App Store
eas submit --platform ios

# Build and auto-submit
eas build --platform ios --auto-submit
```

---

## 🎯 Expected Timeline

| Step | Duration |
|------|----------|
| EAS Build | 10-20 minutes |
| Upload to App Store | 5-10 minutes |
| Processing | 15-30 minutes |
| **First build available to internal testers** | **~45 minutes** |
| Apple TestFlight Review (external) | 24-48 hours |

---

## ✅ Success Indicators

You'll know it worked when:

1. ✅ Build completes without errors
2. ✅ Upload succeeds
3. ✅ Build appears in App Store Connect
4. ✅ Status changes from "Processing" to "Ready to Test"
5. ✅ Testers receive invite email
6. ✅ App installs on devices
7. ✅ Deep links work! (`matchslot://` links open the app)

---

## 🎉 You're Ready!

Your build configuration is complete. Just run:

```bash
eas build --platform ios --profile production
```

And follow the prompts! The build will be ready for TestFlight in about 45 minutes.

---

## 📞 Need Help?

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **TestFlight Docs:** https://developer.apple.com/testflight/
- **Expo Discord:** https://chat.expo.dev/

Good luck with your launch! 🚀⚽
