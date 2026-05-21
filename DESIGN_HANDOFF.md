# MatchSlot Design Handoff — Tutorial & Multi-Language Features

**Date:** 2026-05-21
**App Version:** 1.9.1
**Platform:** iOS 17+, Android, Web (Expo Router + React Native)
**Design System:** "Pitch Green" stadium-inspired theme with light/dark modes

---

## Table of Contents

1. [Existing Design System Reference](#1-existing-design-system-reference)
2. [Feature 1: Tutorial / Onboarding Flow](#2-feature-1-tutorial--onboarding-flow)
3. [Feature 2: Multi-Language (i18n) Support](#3-feature-2-multi-language-i18n-support)
4. [Screen-by-Screen Specifications](#4-screen-by-screen-specifications)
5. [Component Inventory](#5-component-inventory)
6. [Navigation & Routing Changes](#6-navigation--routing-changes)
7. [Interaction & Animation Specs](#7-interaction--animation-specs)
8. [Accessibility Requirements](#8-accessibility-requirements)
9. [Implementation Architecture](#9-implementation-architecture)
10. [Asset Requirements](#10-asset-requirements)

---

## 1. Existing Design System Reference

### Color Palette

| Token               | Light Mode                    | Dark Mode                      |
|----------------------|-------------------------------|--------------------------------|
| `primary`           | `#1B8B4E` (Turf Green)       | `#4ADE80` (Bright Green)       |
| `primaryDark`       | `#157A42`                    | `#1B8B4E`                      |
| `background`        | `#F7FAF5` (Green-tinted)     | `#0A1F12` (Deep pitch night)   |
| `card`              | `#FFFFFF`                    | `#122A1A`                      |
| `text`              | `#1A2E1A` (Deep forest)      | `#E8F5E9` (Light green-white)  |
| `textSecondary`     | `rgba(26,46,26,0.6)`        | `rgba(232,245,233,0.6)`        |
| `border`            | `#D4E4D4`                    | `#1E3D28`                      |
| `secondary`         | `rgba(27,139,78,0.08)`      | `rgba(74,222,128,0.12)`        |
| `success`           | `#16A34A`                    | `#4ADE80`                      |
| `warning`           | `#F59E0B`                    | `#FBBF24`                      |
| `error`             | `#EF4444`                    | `#F87171`                      |

### Typography Conventions

- **Headings:** System font, bold, 24–28px
- **Subheadings:** System font, semibold, 18–20px
- **Body:** System font, regular, 15–16px
- **Captions:** System font, regular, 13–14px
- All text colors via `Colors[colorScheme].text` / `.textSecondary`

### Spacing & Layout

- **Screen horizontal padding:** 16–20px
- **Card padding:** 16–20px
- **Card border radius:** 16–20px
- **Button border radius:** 12–16px
- **Gap between elements:** 12–16px
- **Section spacing:** 24–32px

### Existing Shared Components

| Component             | Path                                  | Notes                                    |
|-----------------------|---------------------------------------|------------------------------------------|
| `Button`              | `components/ui/Button.tsx`            | Variants: primary, secondary, outline    |
| `Card`                | `components/ui/Card.tsx`              | Elevated card with shadow                |
| `Input`               | `components/ui/Input.tsx`             | With label, icon, multiline support      |
| `AnimatedPressable`   | `components/ui/AnimatedPressable.tsx` | Spring scale animation on press          |
| `CircularProgress`    | `components/ui/CircularProgress.tsx`  | Progress ring                            |
| `SkeletonLoader`      | `components/ui/SkeletonLoader.tsx`    | Loading placeholder shapes               |
| `CrossPlatformAlert`  | `components/ui/CrossPlatformAlert.tsx`| Native/web alert abstraction             |

### Iconography

- **Library:** Ionicons via `@expo/vector-icons`
- **Common icons used:** `football-outline`, `people-outline`, `time-outline`, `location-outline`, `checkmark-circle`, `close-circle`

---

## 2. Feature 1: Tutorial / Onboarding Flow

### 2.1 Purpose

First-time users (host coaches) need to understand the MatchSlot booking flow before creating their first match. The tutorial introduces the three user roles (Host, Guest, Approver) and the end-to-end flow visually.

### 2.2 When to Show

| Trigger                    | Behavior                                              |
|----------------------------|-------------------------------------------------------|
| First launch after signup  | Auto-navigate to tutorial before home screen          |
| Profile screen tap         | "Replay Tutorial" button always accessible            |
| Locale change              | Do NOT re-trigger tutorial automatically              |

**Persistence:** Store `tutorial_completed` flag in AsyncStorage keyed by user ID:
`match_slot_tutorial_completed_${userId}`

### 2.3 Tutorial Screens (4 Pages)

#### Page 1 — "Welcome to MatchSlot"

```
┌──────────────────────────────┐
│                              │
│     [Football pitch SVG      │
│      with calendar overlay]  │
│                              │
│   Welcome to MatchSlot       │
│                              │
│   The easiest way to         │
│   organize friendly matches  │
│   for your youth team.       │
│                              │
│        ● ○ ○ ○               │
│                              │
│    [ Next → ]                │
│    Skip                      │
└──────────────────────────────┘
```

- **Illustration:** Football pitch top-down view with a calendar icon overlaid (SVG)
- **Headline:** "Welcome to MatchSlot" — 28px bold, `Colors.text`
- **Body:** 16px regular, `Colors.textSecondary`
- **Pagination dots:** 4 dots, active = `Colors.primary`, inactive = `Colors.border`
- **CTA:** Primary `Button` component, full width
- **Skip:** Text link below CTA, `Colors.textSecondary`, 14px

#### Page 2 — "Create & Share"

```
┌──────────────────────────────┐
│                              │
│     [Illustration:           │
│      phone showing create    │
│      form with share arrow]  │
│                              │
│   Create & Share             │
│                              │
│   Set up available time      │
│   slots and share a link     │
│   with opposing coaches.     │
│                              │
│        ○ ● ○ ○               │
│                              │
│    [ Next → ]                │
│    Skip                      │
└──────────────────────────────┘
```

- **Illustration:** Phone mockup showing the create form with a share/link icon emanating outward
- **Key concept:** Host creates → shares link → guests pick a slot

#### Page 3 — "Book & Approve"

```
┌──────────────────────────────┐
│                              │
│     [Illustration:           │
│      two phones exchanging   │
│      a checkmark]            │
│                              │
│   Book & Approve             │
│                              │
│   Guest coaches pick a slot. │
│   Approvers confirm — no     │
│   login needed.              │
│                              │
│        ○ ○ ● ○               │
│                              │
│    [ Next → ]                │
│    Skip                      │
└──────────────────────────────┘
```

- **Illustration:** Two devices with a checkmark handshake between them
- **Key concept:** Guest books → approver gets email → one-tap approve/reject

#### Page 4 — "Track & Play"

```
┌──────────────────────────────┐
│                              │
│     [Illustration:           │
│      scoreboard card with    │
│      green checkmark]        │
│                              │
│   Track & Play               │
│                              │
│   See all your matches in    │
│   one place. Record scores   │
│   and results after the game.│
│                              │
│        ○ ○ ○ ●               │
│                              │
│    [ Get Started ]           │
└──────────────────────────────┘
```

- **Illustration:** Scoreboard-style card (mirrors the existing manage screen design)
- **CTA changes to:** "Get Started" (primary button, no Skip link on last page)
- **Action:** Sets `tutorial_completed = true`, navigates to home `(tabs)/`

### 2.4 Tutorial Interaction

- **Swipe:** Horizontal swipe between pages (React Native `ScrollView` with `pagingEnabled`)
- **Pagination:** Animated dot indicators sync with scroll position
- **Skip:** Jumps to home, sets `tutorial_completed = true`
- **Back:** Swipe left to revisit previous page (no back button in header)
- **Orientation:** Portrait only

### 2.5 Tutorial Animation

- **Page entry:** Illustration fades in + slides up (FadeInUp, 400ms, spring)
- **Text entry:** Headline fades in after 200ms delay, body after 400ms (FadeInDown)
- **Page transition:** Native horizontal scroll (no custom transition)
- **Dot transition:** Spring animation on width change (active dot = 24px wide pill, inactive = 8px circle)

---

## 3. Feature 2: Multi-Language (i18n) Support

### 3.1 Supported Languages (Initial)

| Code  | Language           | Direction | Priority |
|-------|--------------------|-----------|----------|
| `en`  | English            | LTR       | Default  |
| `es`  | Español (Spanish)  | LTR       | P1       |
| `fr`  | Français (French)  | LTR       | P1       |
| `de`  | Deutsch (German)   | LTR       | P2       |
| `pt`  | Português (Portuguese) | LTR   | P2       |
| `ar`  | العربية (Arabic)   | RTL       | P3       |

### 3.2 Language Selection UX

#### Location: Profile Screen

```
┌──────────────────────────────┐
│  Profile                     │
│  ─────────────────────────── │
│                              │
│  [Avatar / Initials]         │
│  Coach Name                  │
│  email@example.com           │
│                              │
│  ┌────────────────────────┐  │
│  │ 🌐  Language            │  │
│  │     English         >  │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🎨  Appearance          │  │
│  │     System Default  >  │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 📖  Replay Tutorial     │  │
│  └────────────────────────┘  │
│                              │
│  [ Sign Out ]                │
└──────────────────────────────┘
```

- **Language row:** Card with globe icon, current language name, chevron right
- **Tap → Language Picker Modal**

#### Language Picker Modal

```
┌──────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  ← dim overlay
│  ┌────────────────────────┐  │
│  │  Select Language       │  │
│  │  ───────────────────── │  │
│  │                        │  │
│  │  ● English             │  │
│  │  ○ Español             │  │
│  │  ○ Français            │  │
│  │  ○ Deutsch             │  │
│  │  ○ Português           │  │
│  │  ○ العربية              │  │
│  │                        │  │
│  │  [ Apply ]             │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

- **Modal type:** Bottom sheet (slides up from bottom, 50% screen height)
- **Selected state:** Filled radio circle in `Colors.primary`
- **Each row:** Language name in native script + English subtitle in `textSecondary`
  - e.g., "Español" with "Spanish" below it in small text
- **Apply button:** Primary `Button`, full width
- **Dismiss:** Tap overlay or swipe down
- **Instant preview:** App language changes immediately on Apply (no restart)

#### First Launch: Auto-detect

- On first launch, detect device locale via `expo-localization`
- If device locale matches a supported language, use it
- Otherwise default to English
- Store preference in AsyncStorage: `match_slot_language_${userId}`
- Unauthenticated (public) pages use device locale detection only

### 3.3 String Organization

Organize translations by feature area. File structure:

```
/locales
  /en
    common.json        # Shared: buttons, labels, errors, navigation
    home.json          # Home/dashboard screen
    create.json        # Match creation flow
    manage.json        # My Matches / manage screen
    offer.json         # Public offer view + booking
    approve.json       # Approval flow
    auth.json          # Login / register
    profile.json       # Profile screen
    tutorial.json      # Tutorial / onboarding
  /es
    common.json
    home.json
    ...
  /fr
    ...
```

### 3.4 Strings to Translate

Below is the full inventory of user-facing strings organized by screen. Each key maps to the English default.

#### common.json (~40 strings)

```json
{
  "button.next": "Next",
  "button.skip": "Skip",
  "button.cancel": "Cancel",
  "button.confirm": "Confirm",
  "button.save": "Save",
  "button.delete": "Delete",
  "button.share": "Share Link",
  "button.apply": "Apply",
  "button.signOut": "Sign Out",
  "button.getStarted": "Get Started",
  "button.approve": "Approve",
  "button.deny": "Deny",
  "button.bookSlot": "Book This Slot",
  "button.createOffer": "Create Match Offer",
  "label.status": "Status",
  "label.location": "Location",
  "label.date": "Date",
  "label.time": "Time",
  "label.duration": "Duration",
  "label.format": "Format",
  "label.ageGroup": "Age Group",
  "label.notes": "Notes",
  "label.host": "Host",
  "label.guest": "Guest",
  "label.approver": "Approver",
  "status.open": "Open",
  "status.closed": "Closed",
  "status.booked": "Booked",
  "status.pending": "Pending Approval",
  "status.held": "Held",
  "status.rejected": "Rejected",
  "status.cancelled": "Cancelled",
  "status.approved": "Approved",
  "error.generic": "Something went wrong. Please try again.",
  "error.network": "Network error. Check your connection.",
  "error.required": "This field is required.",
  "error.invalidEmail": "Please enter a valid email address.",
  "time.minutes": "{{count}} min",
  "date.today": "Today",
  "date.tomorrow": "Tomorrow"
}
```

#### home.json (~15 strings)

```json
{
  "greeting.morning": "Good Morning, Coach",
  "greeting.afternoon": "Good Afternoon, Coach",
  "greeting.evening": "Good Evening, Coach",
  "stats.totalCreated": "Total Created",
  "stats.openNow": "Open Now",
  "stats.confirmed": "Confirmed",
  "section.quickActions": "Quick Actions",
  "section.upcoming": "Upcoming Matches",
  "section.recentActivity": "Recent Activity",
  "action.createOffer": "Create Offer",
  "action.myMatches": "My Matches",
  "empty.upcoming": "No upcoming matches",
  "empty.activity": "No recent activity",
  "viewAll": "View All"
}
```

#### create.json (~25 strings)

```json
{
  "title": "Create Match Offer",
  "section.hostDetails": "Host Details",
  "section.matchDetails": "Match Details",
  "section.timeSlots": "Available Time Slots",
  "field.hostName": "Your Name",
  "field.hostClub": "Club Name",
  "field.hostContact": "Contact Email",
  "field.location": "Venue / Pitch Name",
  "field.approverEmail": "Approver Email",
  "field.notes": "Additional Notes",
  "placeholder.location": "e.g., Riverside Park Pitch 2",
  "placeholder.notes": "Any special instructions...",
  "modal.selectAge": "Select Age Group",
  "modal.selectFormat": "Select Format",
  "modal.selectDuration": "Select Duration",
  "slot.addSlot": "Add Time Slot",
  "slot.pickDate": "Pick Date",
  "slot.pickTime": "Pick Start Time",
  "slot.empty": "No slots added yet",
  "slot.emptyHint": "Tap 'Add Time Slot' to pin your first slot",
  "submit": "Create & Send for Approval",
  "success.title": "Match Offer Created!",
  "success.message": "Approval email sent to {{email}}",
  "validation.minSlots": "Add at least one time slot"
}
```

#### manage.json (~20 strings)

```json
{
  "title": "My Matches",
  "tab.all": "All",
  "tab.open": "Open",
  "tab.booked": "Booked",
  "tab.closed": "Closed",
  "card.host": "HOST",
  "card.slots": "SLOTS",
  "card.noGuest": "Awaiting booking",
  "card.guestClub": "vs {{club}}",
  "result.title": "Match Result",
  "result.homeScore": "Home Score",
  "result.awayScore": "Away Score",
  "result.notes": "Match Notes",
  "result.save": "Save Result",
  "result.saved": "Result Saved",
  "empty.title": "No Matches Yet",
  "empty.subtitle": "Create your first match offer to get started",
  "pendingApproval": "Waiting for approver to review",
  "fab.create": "New Match"
}
```

#### offer.json (~12 strings)

```json
{
  "title": "Match Offer",
  "hostedBy": "Hosted by {{name}}",
  "selectSlot": "Select a time slot to book",
  "slotAvailable": "Available",
  "slotTaken": "Taken",
  "booking.title": "Book This Slot",
  "booking.guestName": "Your Name",
  "booking.guestClub": "Club Name",
  "booking.guestContact": "Contact Email",
  "booking.guestNotes": "Notes for the host",
  "booking.submit": "Confirm Booking",
  "booking.success": "Slot booked! Approval email sent to your approver."
}
```

#### approve.json (~10 strings)

```json
{
  "title": "Approval Request",
  "matchDetails": "Match Details",
  "teamDetails": "Team Details",
  "decisionNotes": "Notes (optional)",
  "placeholder.notes": "Reason for your decision...",
  "approved.title": "Approved!",
  "approved.message": "The slot has been confirmed.",
  "rejected.title": "Rejected",
  "rejected.message": "The slot has been released.",
  "expired": "This approval link has expired."
}
```

#### auth.json (~12 strings)

```json
{
  "login.title": "Sign In",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign In",
  "login.noAccount": "Don't have an account?",
  "login.signUp": "Sign Up",
  "register.title": "Create Account",
  "register.name": "Full Name",
  "register.email": "Email",
  "register.password": "Password",
  "register.submit": "Create Account",
  "register.hasAccount": "Already have an account?",
  "register.signIn": "Sign In"
}
```

#### profile.json (~8 strings)

```json
{
  "title": "Profile",
  "language": "Language",
  "appearance": "Appearance",
  "appearance.system": "System Default",
  "appearance.light": "Light",
  "appearance.dark": "Dark",
  "replayTutorial": "Replay Tutorial",
  "version": "Version {{version}}"
}
```

#### tutorial.json (~12 strings)

```json
{
  "page1.title": "Welcome to MatchSlot",
  "page1.body": "The easiest way to organize friendly matches for your youth team.",
  "page2.title": "Create & Share",
  "page2.body": "Set up available time slots and share a link with opposing coaches.",
  "page3.title": "Book & Approve",
  "page3.body": "Guest coaches pick a slot. Approvers confirm — no login needed.",
  "page4.title": "Track & Play",
  "page4.body": "See all your matches in one place. Record scores and results after the game."
}
```

### 3.5 Date & Number Formatting

| Format              | Current                                   | i18n Approach                                |
|---------------------|-------------------------------------------|----------------------------------------------|
| Date display        | `toLocaleDateString('en-GB')`             | Use device locale or selected language code   |
| Time display        | `toLocaleTimeString('en-GB')`             | Same                                         |
| Duration            | `"90 min"`                                | `t('time.minutes', { count: 90 })`           |
| Match format        | `"5v5"`, `"11v11"`                        | Keep as-is (universal sports notation)        |
| Age groups          | `"U8"`, `"U12"`, etc.                     | Keep as-is (universal notation)               |

### 3.6 RTL Layout Considerations (Arabic)

- Flex direction reverses (`row` → `row-reverse`) via `I18nManager.forceRTL(true)`
- Text alignment flips automatically
- Icons with directional meaning (chevrons, arrows) must flip
- Pagination dots read right-to-left
- Test with Expo's `I18nManager` support

---

## 4. Screen-by-Screen Specifications

### 4.1 Tutorial Screen — `/tutorial`

| Property         | Value                                         |
|------------------|-----------------------------------------------|
| Route            | `app/tutorial.tsx` (new file)                 |
| Auth required    | Yes (shown after login/signup, before tabs)   |
| Header           | Hidden (no navigation bar)                    |
| Status bar       | Light content over primary background         |
| Background       | `Colors.background`                           |
| Safe area        | Full safe area insets (top + bottom)          |

**Layout (per page):**

```
SafeAreaView (flex: 1)
├── ScrollView (horizontal, pagingEnabled)
│   └── Page (width: screen width)
│       ├── Spacer (flex: 0.1)
│       ├── IllustrationContainer (height: 45% of screen, centered)
│       │   └── SVG illustration (max 280x280)
│       ├── Spacer (24px)
│       ├── Headline (28px bold, center-aligned, px: 32)
│       ├── Spacer (12px)
│       └── Body (16px regular, center-aligned, textSecondary, px: 40)
├── Spacer (flex: 0.05)
├── PaginationDots (row, centered, gap: 8)
│   └── Dot (8x8 circle / 24x8 pill)
├── Spacer (16px)
├── CTAButton (mx: 20, height: 52)
├── Spacer (8px)
├── SkipLink (center, 14px, textSecondary) — hidden on last page
└── Spacer (bottom safe area)
```

### 4.2 Profile Screen Updates — `(tabs)/profile.tsx`

**New rows to add (between existing content and Sign Out):**

```
Existing profile header
─────────────────────────
[NEW] Language Row          → Card, icon: globe-outline, chevron-forward
[NEW] Appearance Row        → Card, icon: color-palette-outline, chevron-forward
[NEW] Replay Tutorial Row   → Card, icon: book-outline
─────────────────────────
Sign Out button
```

**Language Row:**
- Left: `globe-outline` icon (22px, `Colors.primary`)
- Label: `t('profile.language')` (16px, `Colors.text`)
- Right: Current language name in native script (14px, `Colors.textSecondary`) + `chevron-forward` (18px)
- Tap: Open language picker modal

**Replay Tutorial Row:**
- Left: `book-outline` icon (22px, `Colors.primary`)
- Label: `t('profile.replayTutorial')` (16px, `Colors.text`)
- Tap: Navigate to `/tutorial` (reset `tutorial_completed` flag)

### 4.3 Language Picker Modal

| Property         | Value                                        |
|------------------|----------------------------------------------|
| Type             | Bottom sheet modal                           |
| Height           | 50% screen (max 400px)                       |
| Border radius    | 20px top-left, 20px top-right                |
| Background       | `Colors.card`                                |
| Overlay          | `rgba(0,0,0,0.5)`                            |
| Animation        | Slide up from bottom, 300ms spring           |

**Layout:**

```
Modal
├── Handle bar (40x5, Colors.border, radius: 3, center, mt: 12)
├── Title ("Select Language", 20px semibold, px: 20, mt: 20)
├── Divider (1px, Colors.border, mx: 20, mt: 16)
├── ScrollView (flex: 1, pt: 8)
│   └── LanguageRow (repeating)
│       ├── Radio circle (22px, border: 2px)
│       │   └── Filled circle (14px, Colors.primary) if selected
│       ├── Spacer (12px)
│       └── TextColumn
│           ├── Native name (16px medium, Colors.text)
│           └── English name (13px regular, Colors.textSecondary)
├── Spacer (16px)
└── Apply Button (primary, mx: 20, mb: safe area bottom + 20)
```

**Row dimensions:** height 56px, horizontal padding 20px, vertical gap 4px between rows.

---

## 5. Component Inventory

### New Components Required

| Component              | Path                                          | Reusable | Description                                    |
|------------------------|-----------------------------------------------|----------|------------------------------------------------|
| `TutorialPage`         | `components/tutorial/TutorialPage.tsx`        | No       | Single tutorial page with illustration + text  |
| `PaginationDots`       | `components/ui/PaginationDots.tsx`            | Yes      | Animated horizontal dot indicator              |
| `LanguagePickerModal`  | `components/settings/LanguagePickerModal.tsx` | No       | Bottom sheet language selector                 |
| `SettingsRow`          | `components/ui/SettingsRow.tsx`               | Yes      | Generic icon + label + value + chevron row     |

### `PaginationDots` Props

```typescript
interface PaginationDotsProps {
  count: number;
  activeIndex: number;          // from scroll position
  activeColor?: string;         // default: Colors.primary
  inactiveColor?: string;       // default: Colors.border
}
```

### `SettingsRow` Props

```typescript
interface SettingsRowProps {
  icon: string;                 // Ionicons name
  label: string;
  value?: string;               // shown on the right side
  onPress: () => void;
  showChevron?: boolean;        // default: true
}
```

---

## 6. Navigation & Routing Changes

### New Routes

| Route Path         | File                        | Auth Required | Purpose                |
|--------------------|-----------------------------|---------------|------------------------|
| `/tutorial`        | `app/tutorial.tsx`          | Yes           | Onboarding flow        |

### Modified Routes

| Route Path         | File                        | Change                                |
|--------------------|-----------------------------|---------------------------------------|
| `(tabs)/profile`   | `app/(tabs)/profile.tsx`    | Add language, appearance, tutorial rows |
| `_layout.tsx`      | `app/_layout.tsx`           | Add tutorial redirect for first-time users |

### Navigation Flow

```
App Launch
  └── Auth check
       ├── Not logged in → /login
       └── Logged in
            ├── tutorial_completed == false → /tutorial
            │   └── "Get Started" → /(tabs)/
            └── tutorial_completed == true → /(tabs)/
```

---

## 7. Interaction & Animation Specs

### Tutorial Page Transitions

| Element         | Animation              | Duration | Delay    | Easing        |
|-----------------|------------------------|----------|----------|---------------|
| Illustration    | FadeInUp               | 500ms    | 0ms      | spring(1, 80) |
| Headline        | FadeInDown             | 400ms    | 200ms    | spring(1, 80) |
| Body text       | FadeInDown             | 400ms    | 350ms    | spring(1, 80) |
| CTA button      | FadeIn                 | 300ms    | 500ms    | ease-out      |

### Pagination Dot Animation

| Property        | Inactive       | Active                    | Transition    |
|-----------------|----------------|---------------------------|---------------|
| Width           | 8px            | 24px                      | spring, 300ms |
| Height          | 8px            | 8px                       | —             |
| Border radius   | 4px            | 4px                       | —             |
| Color           | `Colors.border`| `Colors.primary`          | interpolate   |

### Language Modal

| Event           | Animation                                  |
|-----------------|--------------------------------------------|
| Open            | Overlay fade in (200ms) + sheet slide up (300ms spring) |
| Close           | Sheet slide down (250ms) + overlay fade out (200ms)     |
| Row tap         | Radio fill scale in (spring, 200ms)                     |

---

## 8. Accessibility Requirements

### Tutorial

- Each page must be a single accessible group
- Illustrations: `accessibilityLabel` describing the scene
- Pagination dots: `accessibilityLabel="Page {{current}} of {{total}}"`
- Skip button: `accessibilityRole="link"`, `accessibilityHint="Skip tutorial and go to home screen"`
- Swipe gesture: VoiceOver must announce page changes

### Language Picker

- Modal: `accessibilityViewIsModal={true}`
- Radio buttons: `accessibilityRole="radio"`, `accessibilityState={{ checked: isSelected }}`
- Language names: Read both native name and English name

### i18n General

- All translated strings must be complete — no mixing English fallback with partial translations
- Number/date formatting must respect locale
- Screen reader must read translated content

---

## 9. Implementation Architecture

### Recommended i18n Library

**`react-i18next`** + **`expo-localization`**

```
Dependencies to add:
  - i18next
  - react-i18next
  - expo-localization (already available via Expo)
```

### i18n Setup File

**Path:** `lib/i18n.ts`

```
Responsibilities:
  - Initialize i18next with all locale JSON files
  - Detect device language via expo-localization
  - Load saved preference from AsyncStorage
  - Export `changeLanguage(code)` helper
  - Configure fallback: any missing key → English
```

### Language Context

**Path:** `contexts/LanguageContext.tsx`

```
Provides:
  - currentLanguage: string
  - setLanguage(code: string): Promise<void>
    → updates i18next
    → persists to AsyncStorage
    → updates React state (triggers re-render)
```

### Tutorial Integration Points

| File                     | Change                                              |
|--------------------------|-----------------------------------------------------|
| `app/_layout.tsx`        | Check `tutorial_completed` flag, redirect if needed  |
| `app/tutorial.tsx`       | New screen with 4-page horizontal scroller           |
| `app/(tabs)/profile.tsx` | Add "Replay Tutorial" row                            |
| `lib/storage.ts`         | Add `getTutorialCompleted` / `setTutorialCompleted`  |

### i18n Integration Points

| File                     | Change                                              |
|--------------------------|-----------------------------------------------------|
| `app/_layout.tsx`        | Wrap with `I18nextProvider`                          |
| `app/(tabs)/profile.tsx` | Add language row + modal                             |
| All screen files         | Replace hardcoded strings with `t('key')` calls     |
| `lib/i18n.ts`            | New: i18next configuration                           |
| `contexts/LanguageContext.tsx` | New: language state context                    |
| `locales/**/*.json`      | New: all translation files                           |

---

## 10. Asset Requirements

### Tutorial Illustrations (4 total)

| Page | Filename                    | Description                                                 | Style                        |
|------|-----------------------------|-------------------------------------------------------------|------------------------------|
| 1    | `tutorial_welcome.svg`      | Top-down football pitch with calendar icon overlay          | Flat, green tones, outlined  |
| 2    | `tutorial_create_share.svg` | Phone showing form + share arrow radiating outward          | Flat, green tones, outlined  |
| 3    | `tutorial_book_approve.svg` | Two phones with checkmark handshake between them            | Flat, green tones, outlined  |
| 4    | `tutorial_track_play.svg`   | Scoreboard card with green checkmark, whistle icon          | Flat, green tones, outlined  |

**Illustration specs:**
- Format: SVG (for resolution independence)
- Max dimensions: 280x280px viewBox
- Color palette: Use only theme colors (`#1B8B4E`, `#4ADE80`, `#F7FAF5`, `#1A2E1A`)
- Provide both light and dark variants, OR use `currentColor` for adaptability
- Line weight: 2px strokes for consistency with Ionicons

### Language Flags (Optional)

If flags are desired alongside language names:
- Format: PNG, 24x16px @3x (72x48px)
- Alternatively, use emoji flags (platform-native rendering)

---

## Appendix: File Change Summary

| Action   | File Path                                    | Type       |
|----------|----------------------------------------------|------------|
| CREATE   | `app/tutorial.tsx`                           | Screen     |
| CREATE   | `components/tutorial/TutorialPage.tsx`       | Component  |
| CREATE   | `components/ui/PaginationDots.tsx`           | Component  |
| CREATE   | `components/ui/SettingsRow.tsx`              | Component  |
| CREATE   | `components/settings/LanguagePickerModal.tsx`| Component  |
| CREATE   | `lib/i18n.ts`                                | Config     |
| CREATE   | `contexts/LanguageContext.tsx`                | Context    |
| CREATE   | `locales/en/*.json` (9 files)                | Strings    |
| CREATE   | `locales/es/*.json` (9 files)                | Strings    |
| CREATE   | `locales/fr/*.json` (9 files)                | Strings    |
| CREATE   | `locales/de/*.json` (9 files)                | Strings    |
| CREATE   | `locales/pt/*.json` (9 files)                | Strings    |
| CREATE   | `locales/ar/*.json` (9 files)                | Strings    |
| CREATE   | `assets/illustrations/tutorial_*.svg` (4)    | Assets     |
| MODIFY   | `app/_layout.tsx`                            | Navigation |
| MODIFY   | `app/(tabs)/profile.tsx`                     | Screen     |
| MODIFY   | All screen files                             | i18n keys  |
| MODIFY   | `package.json`                               | Deps       |
