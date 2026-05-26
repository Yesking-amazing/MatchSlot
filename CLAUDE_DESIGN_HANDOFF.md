# MatchSlot — Complete Design Handoff for Claude Design

> **Purpose:** Give Claude Design full context about MatchSlot so it can redesign, improve, or extend any part of the UI with zero guesswork. This is a living reference covering product context, user flows, every screen, every component, the full design system, data model, and known pain points.

---

## 1. Product Overview

**MatchSlot** is a mobile-first app (iOS, Android, Web) for organizing youth football (soccer) friendly matches between clubs. It connects three user roles through a link-based workflow — no one except the host needs an account.

**Core value prop:** A host coach creates a match offer with time slots, shares a link, a guest coach books a slot, and both sides' approvers confirm via email — all without the guest or approver ever downloading the app or logging in.

**Tech stack:** React Native 0.81 + Expo 54 + Expo Router 6 (file-based routing) + Supabase (Postgres + Auth + Realtime) + TypeScript 5.9

**Current version:** 1.9.1

---

## 2. User Roles & Journeys

### 2.1 Host Coach (Authenticated)

The only role that needs an account. Creates match offers, manages bookings, records results.

```
Sign Up/Login
  → Home Dashboard (stats, upcoming matches, quick actions)
  → Create Match Offer (form: details + time slots)
    → Sent to approver for pre-approval
    → Once approved → share link with guest coaches
  → My Matches (manage all offers, view slot statuses, record results)
  → Profile (club name, settings, logout)
```

### 2.2 Guest Coach (Public, No Auth)

Receives a shared link. Books a slot for their team. **Booking is immediate — there is no guest-side approval step.**

```
Open shared link → /offer/{token}
  → View match details + available time slots
  → Select a slot → /offer/book/{slotId}
    → Enter team details (name, club, contact, notes)
    → Submit → slot becomes BOOKED immediately
              → all other OPEN/HELD slots → REJECTED
              → offer → CLOSED
              → confirmation screen ("Match Confirmed!")
```

### 2.3 Approver (Public, No Auth) — Host-side pre-approval

The approval flow is a **host-side pre-approval of the offer's time slots**, NOT a booking confirmation. When the host creates an offer, its slots start as `PENDING_APPROVAL`. The host's nominated approver receives an email link to approve/reject the slots before the offer goes live (`OPEN`).

```
Open approval link → /approve/{token}
  → Review match + each time slot
  → Approve individual slots (slot → OPEN) or Approve All
    → offer → OPEN, share link copied
  → OR Reject individual slots (slot → REJECTED)
    → if all rejected, offer → CANCELLED
```

### 2.4 Status Flow Diagram

```
[Host Creates Offer]
       │
       ▼
  PENDING_APPROVAL ──(approver rejects all slots)──→  CANCELLED
       │
  (host's approver approves slots)
       │
       ▼
     OPEN
       │
  (guest selects slot → optional HELD, 15-min)
       │
  (guest submits booking — immediate, no approval)
       │
       ▼
    BOOKED  ── (sibling slots → REJECTED, offer → CLOSED)
       │
  (match played → host records result)
       │
       ▼
  RESULT SAVED
```

---

## 3. Design System — "Pitch Green"

The visual identity is inspired by a football stadium: grass green, chalk white, floodlit night mode. It should feel like the pitch, not a SaaS dashboard.

### 3.1 Color Tokens

| Token               | Light Mode                       | Dark Mode                         | Usage                          |
|----------------------|----------------------------------|-----------------------------------|--------------------------------|
| `text`              | `#1A2E1A` (deep forest)         | `#E8F5E9` (light green-white)    | Primary text                   |
| `textSecondary`     | `#4A6B4A` (medium forest)       | `#8FA88F` (sage)                 | Secondary/supporting text      |
| `textTertiary`      | `#8FA88F` (light sage)          | `#5C7A5C` (muted green)         | Hints, captions, disabled      |
| `background`        | `#F7FAF5` (green-tinted white)  | `#0A1F12` (deep pitch at night) | Screen backgrounds             |
| `backgroundAlt`     | `#FFFFFF`                        | `#122A1A`                        | Elevated surfaces              |
| `primary`           | `#1B8B4E` (turf green)          | `#4ADE80` (bright green)        | CTAs, active states, brand     |
| `primaryDark`       | `#157A42`                        | `#1B8B4E`                        | Pressed states                 |
| `primaryLight`      | `#E8F5E9`                        | `rgba(74,222,128,0.1)`          | Light green wash/tint          |
| `secondary`         | `rgba(27,139,78,0.08)`          | `rgba(74,222,128,0.12)`         | Icon backgrounds, subtle fills |
| `accent`            | `#4ADE80`                        | `#86EFAC`                        | Highlights, badges             |
| `card`              | `#FFFFFF`                        | `#122A1A`                        | Card surfaces                  |
| `cardBorder`        | `#D4E4D4`                        | `#1E3D28`                        | Card borders                   |
| `border`            | `#D4E4D4` (soft green)          | `#1E3D28` (dark green)          | Dividers, borders              |
| `success`           | `#16A34A`                        | `#4ADE80`                        | Confirmed, approved            |
| `warning`           | `#F59E0B`                        | `#FBBF24`                        | Held, pending states           |
| `error`             | `#EF4444`                        | `#F87171`                        | Rejected, destructive          |
| `glow`              | `rgba(27,139,78,0.15)`          | `rgba(74,222,128,0.2)`          | Shadow accents on primary      |
| `shadow`            | `rgba(26,46,26,0.08)`           | `rgba(0,0,0,0.5)`               | Drop shadows                   |
| `pitchLine`         | `rgba(27,139,78,0.12)`          | `rgba(74,222,128,0.08)`         | Subtle divider lines           |
| `scoreboardBg`      | `#1A2E1A`                        | `#0A1F12`                        | Dark scoreboard header         |
| `scoreboardText`    | `#FFFFFF`                        | `#E8F5E9`                        | Text on scoreboard             |

### Status Colors (used for slot status badges)

| Status             | Color      | Hex       |
|--------------------|------------|-----------|
| OPEN               | Green      | `#4CAF50` |
| HELD               | Orange     | `#FFA500` |
| PENDING_APPROVAL   | Gold       | `#FFD700` |
| BOOKED             | Blue       | `#2196F3` |
| REJECTED           | Red        | `#F44336` |

### 3.2 Typography

All text uses the system font (San Francisco on iOS, Roboto on Android). One custom font is bundled but not actively used: `SpaceMono-Regular.ttf`.

| Role               | Size  | Weight | Letter Spacing | Example Usage                     |
|--------------------|-------|--------|----------------|-----------------------------------|
| Screen title       | 30px  | 800    | -0.5           | "Profile", "My Matches"          |
| Section heading    | 22-24px | 800  | -0.5           | "Quick Actions", "Upcoming"       |
| Card heading       | 18-20px | 700  | 0              | Match card titles                 |
| Body               | 15-16px | 400-500 | 0           | Descriptions, form labels         |
| Caption            | 12-13px | 500-600 | 0.5-0.8      | Section headers (uppercase), hints|
| Badge/chip         | 11-12px | 700  | 0.5            | Status badges                     |

### 3.3 Spacing & Layout

| Property                  | Value        |
|---------------------------|--------------|
| Screen horizontal padding | 20px         |
| Card padding              | 16-20px      |
| Card border radius        | 16-20px (some 24px for hero cards) |
| Button border radius      | 12-16px      |
| Input border radius       | 14px         |
| Element gap (within card) | 12-16px      |
| Section gap               | 24-28px      |
| Safe area                 | Top edges respected on all tab screens |

### 3.4 Shadows & Elevation

Light mode uses colored green shadows for brand feel. Dark mode uses darker, subtler shadows.

```
Primary cards:
  shadowColor: '#1B8B4E'
  shadowOffset: { width: 0, height: 6 }
  shadowOpacity: 0.15 (light) / 0.3 (dark)
  shadowRadius: 20
  elevation: 6

Standard cards:
  shadowColor: Colors.shadow
  shadowOffset: { width: 0, height: 2 }
  shadowOpacity: 0.08
  shadowRadius: 8
  elevation: 3
```

### 3.5 Iconography

- **Library:** Ionicons via `@expo/vector-icons`
- **Icon size:** 20-24px in UI, 28-32px for hero/feature icons
- **Style:** Outline variants preferred (`football-outline`, `time-outline`, `location-outline`)
- **Icon backgrounds:** 36x36px rounded square (borderRadius: 12), filled with `Colors.secondary`

### 3.6 Animations

Uses `react-native-reanimated` throughout:
- **Screen entry:** `FadeInDown` / `FadeInUp` with staggered delays (100-200ms per element)
- **Pressables:** Spring scale effect (scale to 0.97 on press, spring back)
- **Pull-to-refresh:** Standard RefreshControl with primary color tint

---

## 4. Screen-by-Screen Reference

### 4.1 Root Layout (`app/_layout.tsx`)

- Wraps entire app in `AuthContext` provider
- Route protection: unauthenticated users redirect to `/login` except for public routes (`/offer/*`, `/approve/*`)
- Tutorial check: after auth, checks `tutorial_completed` flag — if false, redirects to `/tutorial`
- Status bar: auto (adapts to color scheme)

### 4.2 Login Screen (`app/(auth)/login.tsx`)

**Layout:**
```
SafeAreaView (background)
├── KeyboardAvoidingView
│   ├── Spacer (flex: 0.15)
│   ├── Header area
│   │   ├── Icon container (80x80, primary bg, rounded 24)
│   │   │   └── Football icon (40px, white)
│   │   ├── "Welcome Back" (32px bold)
│   │   └── "Sign in to manage your matches" (16px, textSecondary)
│   ├── Spacer (32px)
│   ├── Form Card
│   │   ├── Email Input (icon: mail-outline)
│   │   ├── Password Input (icon: lock-closed-outline, secure)
│   │   └── Sign In Button (primary, full width, 54px height)
│   ├── Spacer (24px)
│   └── "Don't have an account? Sign Up" (link to /register)
```

**States:** Loading (button shows ActivityIndicator), Error (Alert popup)

### 4.3 Register Screen (`app/(auth)/register.tsx`)

Same layout as login with added "Full Name" field. CTA: "Create Account". Footer links to login.

### 4.4 Tab Layout (`app/(tabs)/_layout.tsx`)

**Bottom tabs (3):**
| Tab     | Icon (inactive)        | Icon (active)    | Title     |
|---------|------------------------|------------------|-----------|
| Home    | `home-outline`         | `home`           | Home      |
| Manage  | `football-outline`     | `football`       | My Matches|
| Profile | `person-outline`       | `person`         | Profile   |

- Active color: `Colors.primary`
- Inactive color: `Colors.tabIconDefault`
- Icon size: 24px, label fontWeight 500 / fontSize 12
- **Tab bar is `position: absolute`** (floats over content) with a semi-transparent background — dark: `rgba(10,31,18,0.95)`, light: `rgba(255,255,255,0.95)`. Top border is `StyleSheet.hairlineWidth` in `Colors.border`, elevation 0.
- Because the bar floats, scrollable screens add `paddingBottom: 100` and FABs sit at `bottom: 90`.
- Header hidden on all tabs (each screen handles its own header)

### 4.5 Home Screen (`app/(tabs)/index.tsx`)

**Layout (top to bottom):**
```
SafeAreaView
├── ScrollView (refreshControl)
│   ├── Header
│   │   ├── "Good Morning/Afternoon/Evening," (16px, textSecondary)
│   │   └── "Coach" (30px, bold)
│   │
│   ├── Stats Row (horizontal, 3 items)
│   │   ├── StatCard: "Total Created" (count)
│   │   ├── StatCard: "Open Now" (count)
│   │   └── StatCard: "Confirmed" (count)
│   │   Design: Card with colored top border (3px), icon, count (28px bold), label
│   │
│   ├── Quick Actions (section header + 2 cards in row)
│   │   ├── "Create Offer" → navigates to /match/create
│   │   │   Icon: add-circle, green gradient background
│   │   └── "My Matches" → navigates to /(tabs)/manage
│   │       Icon: list-circle, green gradient background
│   │   Design: Cards with icon (48px container), title (16px 600), subtitle (13px)
│   │
│   ├── Upcoming Matches (section header + list)
│   │   └── MatchCard (for each upcoming, max 3)
│   │       ├── Status dot + date/time
│   │       ├── Format + Age Group badges
│   │       ├── Location with icon
│   │       └── Guest club (if booked)
│   │   Empty: "No upcoming matches" with calendar icon
│   │
│   └── Recent Activity (section header + list)
│       └── ActivityCard (for each recent, max 3)
│           ├── Offer details (format, age group, slot count)
│           ├── Status badge
│           └── Created date
│       Empty: "No recent activity" message
```

**Animations:** Each section uses `Animated.View` with `FadeInDown.delay(n*100)` for staggered entry.

**Data:** Fetches all match offers for current user from Supabase, filters/sorts for upcoming (future dates, booked status) and recent.

### 4.6 My Matches / Manage Screen (`app/(tabs)/manage.tsx`)

This is the most complex screen (~915 lines). Uses a "scoreboard" card design.

**Layout:**
```
SafeAreaView
├── Header: "My Matches" (30px bold)
├── ScrollView (refreshControl)
│   └── For each match offer:
│       └── Scoreboard Card
│           ├── Dark Header (scoreboardBg)
│           │   ├── "HOST" label + host club name
│           │   ├── Format/Age badge (e.g., "11v11 | U16")
│           │   └── "SLOTS" label + count
│           │
│           ├── LED Status Strip
│           │   ├── Colored dot (status color)
│           │   ├── Status text
│           │   └── Location with pin icon
│           │
│           ├── Slot List
│           │   └── For each slot:
│           │       ├── Date + time
│           │       ├── Status badge (colored pill)
│           │       ├── Guest club name (if booked)
│           │       └── "Save Result" button (if past + booked)
│           │
│           └── Action Bar
│               ├── Share Link button (if OPEN)
│               └── Delete button
│
├── Empty state: trophy icon + "No Matches Yet" + "Create your first..."
│
└── FAB (Floating Action Button)
    └── "+" icon → navigates to /match/create
    Design: 60x60, primary color, circular, bottom-right, shadow
```

**Match Result Modal:**
- Triggered by "Save Result" on past booked slots
- Fields: Home Score (number input), Away Score (number input), Match Notes (text area)
- Save button saves to Supabase `slots` table

**Key interactions:**
- Share Link: copies `matchslot.netlify.app/offer/{token}` to clipboard
- Delete: confirmation alert → deletes from Supabase
- Pull-to-refresh
- Pending approval state shows "Waiting for approver to review" message

### 4.7 Profile Screen (`app/(tabs)/profile.tsx`)

**Layout:**
```
SafeAreaView
├── ScrollView
│   ├── Title: "Profile" (30px 800)
│   │
│   ├── Hero Card (24px radius, green shadow)
│   │   ├── Avatar ring (66x66, primary border, rounded 22)
│   │   │   └── Avatar inner (62x62, initials from email)
│   │   └── "Coach" (19px 700) + email (13px)
│   │
│   ├── Section: "Club Info"
│   │   └── Card: Club name row (editable inline with save/cancel)
│   │       Icon: shield-outline
│   │
│   ├── Section: "Support & Feedback"
│   │   └── Card:
│   │       ├── "Send Feedback" → mailto:support@matchslot.app
│   │       ├── Divider
│   │       └── "Privacy Policy" → matchslot.app/privacy
│   │
│   ├── Section: "Account"
│   │   └── Card: "Log Out" (destructive red styling)
│   │
│   └── "MatchSlot v1.9.1" (centered, tertiary text)
```

**Settings row pattern:** Icon in 36x36 rounded container → label → right element (chevron or edit icon). 16px padding, 12px gap.

### 4.8 Create Match Offer (`app/match/create.tsx`)

**Layout:**
```
SafeAreaView
├── ScrollView
│   ├── Header: back button + "Create Match Offer" (24px bold)
│   │
│   ├── Section: "Host Details"
│   │   ├── Input: "Your Name" (pre-filled from auth)
│   │   ├── Input: "Club Name" (pre-filled from saved)
│   │   └── Input: "Contact Email" (pre-filled from auth)
│   │
│   ├── Section: "Match Details"
│   │   ├── Selector: Age Group → opens modal with list
│   │   ├── Selector: Format → opens modal with mini tactical pitch SVGs
│   │   │   Shows formation dots (e.g., 5v5 = 5 dots each side)
│   │   ├── Selector: Duration → opens modal with time options
│   │   ├── Input: Location / Venue
│   │   ├── Input: Approver Email
│   │   └── Input: Notes (multiline)
│   │
│   ├── Section: "Available Time Slots"
│   │   ├── Slot cards (showing date/time with remove button)
│   │   ├── Empty state: pin icon + "No slots added yet"
│   │   └── "Add Time Slot" button → date/time picker
│   │       Mobile: native DateTimePicker
│   │       Web: text input fallback (YYYY-MM-DD HH:MM format)
│   │
│   └── Submit Button: "Create & Send for Approval"
│       Full width, primary, with loading spinner

Modals:
├── Age Group picker (scrollable list, radio selection)
├── Format picker (cards with tactical pitch visualization)
└── Duration picker (list of options: "60 min", "90 min", etc.)
```

**After creation:** Creates `match_offer` + `slots` + `approval` record → sends approval email to approver → shows success alert → navigates back.

### 4.9 Slot Detail Screen (`app/match/detail/[slotId].tsx`)

Shows full details for a single slot with the result form. Accessed from manage screen for viewing/editing match results.

### 4.10 Guest Offer View (`app/offer/[token].tsx`)

**Public (no auth required). Loads offer by share_token.**

**Layout:**
```
SafeAreaView
├── App Banner (top: "Open in App" / "Get App" smart banner)
├── ScrollView
│   ├── Header: Football icon + "Match Offer" + hosted by text
│   │
│   ├── Details Card
│   │   ├── Row: Age Group (with people icon)
│   │   ├── Row: Format (with football icon)
│   │   ├── Row: Duration (with time icon)
│   │   ├── Row: Location (with location icon)
│   │   └── Row: Notes (if any)
│   │   Design: icon (in colored container) + label + value
│   │
│   ├── Section: "Available Time Slots"
│   │   └── For each slot:
│   │       └── Slot Card
│   │           ├── Date + day of week
│   │           ├── Time range
│   │           ├── Status badge
│   │           └── "Book This Slot" button (if OPEN)
│   │               OR "Taken" indicator (if BOOKED/PENDING)
│   │               OR locked icon (if HELD)
│   │
│   └── Footer: Host info card
```

**Real-time:** Subscribes to Supabase slot changes so availability updates live.

### 4.11 Booking Form (`app/offer/book/[slotId].tsx`)

**Public screen. Guest fills in their details.**

**Layout:**
```
SafeAreaView
├── ScrollView
│   ├── Header: "Book This Slot" + slot time summary
│   │
│   ├── Summary Card (bg secondary, primary border): selected slot + match details
│   ├── Form Card
│   │   ├── Input: "Your Name *" (icon person-outline)
│   │   ├── Input: "Your Club Name *" (icon shield-outline)
│   │   ├── Input: "Contact (Email or Phone) *" (icon call-outline)
│   │   └── Input: "Additional Notes (optional)" (icon document-text-outline, multiline)
│   ├── Info banner: "Your match will be confirmed immediately..."
│   └── Submit Button: "Confirm Match" (footer, absolute bottom)
│       Loading state with ActivityIndicator
```
(No approver email field — guest booking does not route through approval.)

**On submit:** Re-checks slot availability, books the slot as **BOOKED immediately** (no approval gate), rejects all other OPEN/HELD slots in the offer, closes the offer (CLOSED), sends email via MailComposer, creates a notification. Note: there is NO approver email field on this form — guest booking is direct.

**Success state:** Full-screen confirmation — `checkmark-circle` (80px, success) + "Match Confirmed!" + match summary card (date/time, location, host) + "Done" button → `/`.

### 4.12 Approval Screen (`app/approve/[token].tsx`)

**Public screen. Host's approver reviews and approves/rejects time slots — per-slot, not a single decision.**

**Layout:**
```
SafeAreaView
├── ScrollView
│   ├── Header Card (bg secondary, primary border, centered)
│   │   ├── shield-checkmark icon (40px, primary)
│   │   ├── "Match Slot Approval"
│   │   └── "Review and approve or reject each time slot individually..."
│   │
│   ├── Status Summary (3 count badges in a row)
│   │   ├── Pending (primary)  ├── Approved (success)  └── Rejected (error)
│   │
│   ├── Host Coach Card: name (+ club)
│   │
│   ├── Match Details Card: match type, location, duration
│   │
│   └── Time Slots — one card per slot (2px border tinted by state)
│       ├── status icon + slot datetime + status label
│       └── If PENDING: [Deny] (error) + [Approve] (success) buttons
│
└── Footer (if any pending): [Reject All] + [Approve All]

Decision actions:
├── Approve slot → slot OPEN; offer → OPEN if it was PENDING_APPROVAL
├── Reject slot → slot REJECTED; if all rejected → offer CANCELLED
├── Approve All → approval APPROVED, offer OPEN, share link copied
└── Reject All → approval REJECTED, offer CANCELLED
```

Uses its own custom `ConfirmModal` / `AlertModal` (NOT the shared `CrossPlatformAlert`, which is unused).

---

## 5. Shared Component Library

### 5.1 Button (`components/ui/Button.tsx`)

```typescript
Props extends PressableProps {
  title: string
  variant?: 'primary' | 'secondary' | 'outline'  // default: 'primary'
  loading?: boolean
  style?: any
  // onPress, disabled, etc. via PressableProps
}
```

**Dimensions:** Height 52px, borderRadius 16px, paddingHorizontal 28px, centered row. Text: fontSize 16, fontWeight 600, letterSpacing 0.5.

**Variant colors:**
| Variant   | Normal BG          | Pressed BG          | Text Color       |
|-----------|--------------------|---------------------|------------------|
| primary   | `#1B8B4E`          | `#157A42`           | `#fff`           |
| secondary | `Colors.secondary` | `Colors.cardBorder` | `Colors.primary` |
| outline   | transparent        | transparent         | `Colors.text`    |

- `primary` shadow: color `#1B8B4E`, offset {0,4}, opacity 0.35, radius 10, elevation 6
- `outline` adds 1px `Colors.border`
- **Disabled:** bg `Colors.border`, text `Colors.textTertiary`
- **Loading:** `ActivityIndicator` replaces text, button disabled

### 5.2 Card (`components/ui/Card.tsx`)

```typescript
Props {
  children: ReactNode
  style?: ViewStyle
}
```

**Styles:** `Colors.card` background, borderRadius **20**, padding 16, marginBottom 16. Shadow: light = `rgba(27,139,78,0.08)`, dark = `#000` at opacity 0.2; offset {0,2}, radius 16, elevation 4. (Note: no explicit border — relies on shadow for separation.)

### 5.3 Input (`components/ui/Input.tsx`)

```typescript
Props extends TextInputProps {
  label?: string
  icon?: keyof typeof Ionicons.glyphMap   // left icon
  rightElement?: React.ReactNode
  // value, onChangeText, placeholder, secureTextEntry, multiline,
  // keyboardType, autoCapitalize, autoFocus, editable via TextInputProps
}
```

**Styles:**
- Wrapper: marginBottom 16
- Label: fontSize 13, fontWeight 500, marginBottom 8, letterSpacing 0.3, color `Colors.textSecondary`
- Container: row layout, 1px border `Colors.border`, borderRadius **16**, paddingHorizontal 16, paddingVertical 10, minHeight 52, bg `Colors.card`. The **entire row is a Pressable** that focuses the field on tap.
- Left icon: 22px, `Colors.textSecondary`, marginRight 12
- Input text: fontSize 16, flex 1, minHeight 36, color `Colors.text`; placeholder color `Colors.textTertiary`
- No built-in `error` prop — screens render their own error containers above the input.

### 5.4 AnimatedPressable (`components/ui/AnimatedPressable.tsx`)

Wraps `Pressable` with `react-native-reanimated` spring animation.

```typescript
Props extends PressableProps {
  scaleTo?: number      // default 0.96
  opacityTo?: number    // default 0.85
  style?: StyleProp<ViewStyle>
}
```

Press-in: spring scale to `scaleTo` (mass 0.6, damping 18, stiffness 250) + opacity to `opacityTo` over 150ms. Press-out: springs back to scale 1 / opacity 1.

### 5.5 AppBanner (`components/ui/AppBanner.tsx`)

Smart app banner shown on web for mobile visitors. Shows "Open in App" (if app installed) or "Get the App" with link. Dismissible.

### 5.6 CircularProgress (`components/ui/CircularProgress.tsx`)

SVG-based circular progress indicator. Used for loading states.

### 5.7 SkeletonLoader (`components/ui/SkeletonLoader.tsx`)

Loading placeholder with pulsing animation. Exports `HomeSkeleton` and `ManageSkeleton` presets matching their respective screen layouts.

### 5.8 CrossPlatformAlert (`components/ui/CrossPlatformAlert.tsx`)

Abstraction over `Alert.alert` (native) and custom modal (web) since `Alert` doesn't work on web.

---

## 6. Data Model

### 6.1 Entity Relationship

```
match_offers  1──N  slots
match_offers  1──N  approvals
slots         1──N  approvals
match_offers  1──N  notifications
slots         1──N  notifications
```

### 6.2 Tables

#### match_offers
| Column          | Type         | Notes                                    |
|-----------------|--------------|------------------------------------------|
| id              | UUID (PK)    | Auto-generated                           |
| host_name       | TEXT         | Required                                 |
| host_club       | TEXT         | Optional                                 |
| host_contact    | TEXT         | Optional (email)                         |
| age_group       | TEXT         | U8/U10/U12/U14/U16/U18/Seniors/Open     |
| format          | TEXT         | 5v5/7v7/9v9/11v11                        |
| duration        | INTEGER      | Minutes (60-120)                         |
| location        | TEXT         | Venue/pitch name                         |
| approver_email  | TEXT         | Host's approver                          |
| status          | TEXT         | PENDING_APPROVAL/OPEN/CLOSED/CANCELLED   |
| share_token     | TEXT (UNIQUE) | For public links                        |
| notes           | TEXT         | Optional                                 |
| created_at      | TIMESTAMPTZ  | Auto                                     |
| updated_at      | TIMESTAMPTZ  | Auto (trigger)                           |

#### slots
| Column          | Type         | Notes                                    |
|-----------------|--------------|------------------------------------------|
| id              | UUID (PK)    |                                          |
| match_offer_id  | UUID (FK)    | → match_offers.id (CASCADE)             |
| start_time      | TIMESTAMPTZ  |                                          |
| end_time        | TIMESTAMPTZ  | Computed from start + duration           |
| status          | TEXT         | OPEN/HELD/PENDING_APPROVAL/BOOKED/REJECTED|
| held_by_session | TEXT         | Session ID during hold                   |
| held_at         | TIMESTAMPTZ  | Hold timestamp                           |
| guest_name      | TEXT         | Filled on booking                        |
| guest_club      | TEXT         | Filled on booking                        |
| guest_contact   | TEXT         | Filled on booking                        |
| guest_notes     | TEXT         | Filled on booking                        |
| home_score      | INTEGER      | Match result                             |
| away_score      | INTEGER      | Match result                             |
| result_notes    | TEXT         | Match notes                              |
| result_saved_at | TIMESTAMPTZ  | When result was saved                    |

#### approvals
| Column          | Type         | Notes                                    |
|-----------------|--------------|------------------------------------------|
| id              | UUID (PK)    |                                          |
| slot_id         | UUID (FK)    | → slots.id (CASCADE)                    |
| match_offer_id  | UUID (FK)    | → match_offers.id (CASCADE)             |
| approval_token  | TEXT (UNIQUE) | For approval links                      |
| approver_email  | TEXT         |                                          |
| status          | TEXT         | PENDING/APPROVED/REJECTED                |
| decision_at     | TIMESTAMPTZ  |                                          |
| decision_notes  | TEXT         |                                          |

#### notifications
| Column            | Type         | Notes                                  |
|-------------------|--------------|----------------------------------------|
| id                | UUID (PK)    |                                        |
| recipient_email   | TEXT         |                                        |
| recipient_type    | TEXT         | HOST/GUEST/APPROVER                    |
| notification_type | TEXT         | SLOT_SELECTED/APPROVAL_REQUEST/etc.    |
| match_offer_id    | UUID (FK)    |                                        |
| slot_id           | UUID (FK)    |                                        |
| subject           | TEXT         |                                        |
| message           | TEXT         |                                        |
| sent              | BOOLEAN      | Default false                          |
| sent_at           | TIMESTAMPTZ  |                                        |

---

## 7. App Configuration Constants

```
Age Groups:     U8, U10, U12, U14, U16, U18, Open
                (TypeScript also allows: Seniors, 1st Team, Reserve)
Match Formats:  5v5, 7v7, 9v9, 11v11
Durations:      60, 70, 80, 90, 100, 120 minutes
Slot Hold:      15 minutes
Base URL:       https://matchslot.app
                (Share links use: https://matchslot.netlify.app)
```

---

## 8. Navigation Map

```
/
├── (auth)/
│   ├── login          ← Email/password sign in
│   └── register       ← Create account
│
├── (tabs)/            ← Authenticated, bottom tab bar
│   ├── index          ← Home dashboard
│   ├── manage         ← My Matches (scoreboard cards)
│   └── profile        ← Profile & settings
│
├── match/
│   ├── create         ← Create match offer form
│   └── detail/[slotId] ← Single slot detail + result form
│
├── offer/             ← Public (no auth)
│   ├── [token]        ← View shared match offer
│   └── book/[slotId]  ← Guest booking form
│
├── approve/           ← Public (no auth)
│   └── [token]        ← Approver decision screen
│
└── tutorial           ← Onboarding (4 pages, first launch)
```

---

## 9. Dependencies & Platform

```json
{
  "expo": "~54.0.32",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo-router": "~6.0.22",
  "@supabase/supabase-js": "^2.91.0",
  "react-native-reanimated": "~4.1.1",
  "@react-native-community/datetimepicker": "^8.6.0",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "expo-linear-gradient": "~15.0.8",
  "expo-blur": "^15.0.8",
  "expo-linking": "~8.0.11",
  "expo-clipboard": "^8.0.8",
  "expo-mail-composer": "~15.0.8",
  "react-native-svg": "^15.15.3",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "@expo/vector-icons": "^15.0.3"
}
```

**Supported platforms:**
- iOS 17.0+ (bundleIdentifier: `com.matchslot.app`)
- Android (edge-to-edge mode via `react-native-edge-to-edge`)
- Web (Netlify deployment, SPA routing configured)

**Typed routes enabled** via `experiments.typedRoutes` in app.json.

---

## 10. Known UI Issues & Improvement Opportunities

### 10.1 Verified Inconsistencies (from full source audit)

1. **Status colors mismatch / dead code:** `AppConfig.STATUS_COLORS` (e.g., OPEN = `#4CAF50`) is **never imported anywhere** — the `Colors` theme system supplies all status colors. Remove or consolidate.

2. **BASE_URL mismatch:** `AppConfig.ts` defines `https://matchslot.app`, but `shareLink.ts` actually builds links with `https://matchslot.netlify.app`. Share + approval links use the Netlify domain.

3. **AGE_GROUPS divergence:** `AppConfig.AGE_GROUPS` lists 7 values (no Seniors/1st Team/Reserve), while `types/database.ts` and the create screen's local array list 10. The create screen uses its own array, so AppConfig's is partly unused.

4. **Login vs Register drift:** Login title is fontSize 36 / header marginBottom 40; Register title is fontSize 32 / marginBottom 36. Should match.

5. **Hardcoded colors:** Scoreboard headers, profile hero, and avatars use raw hex (`#1B8B4E`, `#1A2E1A`, `#0A1F12`, `#4ADE80`, `rgba(255,255,255,0.5)`) instead of `Colors` tokens — they happen to match token values but bypass the theme system.

6. **AppBanner uses a different palette entirely:** The web smart banner uses warm-neutral stone colors (`#1C1917`, `#FAFAF9`, `#A8A29E`, `#44403C`, `#78716C`) — completely off the green pitch system. Visually inconsistent with the rest of the app.

7. **Splash vs background:** app.json splash background is `#FAFAF9` (warm white) but `Colors.light.background` is `#F7FAF5` (green-tinted) — slight color flash on load.

8. **Dark-mode profile:** Hero card hardcodes `#fff` / `rgba(255,255,255,0.6)` for name/email rather than theme tokens.

9. **Storage not platform-safe:** `lib/storage.ts` uses `AsyncStorage` directly, while `lib/supabase.ts` has a platform-safe wrapper — storage will break on web/SSR.

10. **Date formatting:** Locked to `toLocaleDateString('en-GB')` in places, with no shared date utility used consistently.

11. **Web date picker UX:** The web fallback for date/time is a raw text input expecting `YYYY-MM-DD` / `HH:MM` — poor UX.

### 10.1b Dead Code to Clean Up

- `components/ui/CrossPlatformAlert.tsx` — defined, never imported (approval screen rolls its own modals).
- `components/ui/CircularProgress.tsx` — defined, never imported.
- `AppConfig.STATUS_COLORS` — never imported.
- `selectedSlotId` state in `offer/[token].tsx` — set once, never read.
- `Stack.Screen name="modal"` in root layout — references a route file that doesn't exist (Expo template leftover).
- `console.log` artifacts in `supabase.ts` (config dump) and `AuthContext.tsx` (auth state).
- Bundled `SpaceMono-Regular.ttf` font is loaded but not used in any text style.
- `AppBanner` App Store URL is a placeholder: `id000000000`.

### 10.2 Missing Features (UI-Impactful)

1. **No onboarding/tutorial:** First-time users land directly on an empty home screen with no guidance on the workflow.

2. **No i18n:** All strings hardcoded in English. Date formatting locked to `en-GB`.

3. **No empty state illustrations:** Empty states use text + small icon. Could benefit from illustrated empty states.

4. **No loading skeletons on all screens:** Only home and manage have `SkeletonLoader` presets. Other screens use plain `ActivityIndicator`.

5. **No pull-to-refresh on offer/approve screens:** Only tab screens have refresh.

6. **No haptic feedback:** No vibration/haptics on key actions (booking confirmation, approval decision).

7. **Limited profile:** Shows "Coach" as name instead of the user's actual name from auth metadata.

8. **No app-wide toast/snackbar:** Success/error feedback uses `Alert.alert` (blocking modal) instead of non-blocking toasts.

### 10.3 UX Pain Points

1. **Create form is long:** Single scrolling form with selectors + slot pickers. Could benefit from a stepped/wizard flow.

2. **Manage screen density:** Each match offer card is tall (scoreboard + slots + actions). With many offers, lots of scrolling. Could use collapsible sections or a list → detail drill-down.

3. **No search/filter on manage:** Can't filter by status, date, or age group.

4. **No visual confirmation after share:** Copying link to clipboard shows a brief alert but no persistent confirmation.

5. **Guest can't see which device/browser held a slot:** The hold mechanism is session-based but there's no UI for the guest to know their session is holding.

6. **Tab bar on public screens:** The tab bar is correctly hidden on public routes, but the navigation header handling varies — some public screens show a back button, others don't.

7. **N+1 query on Manage:** The manage screen fetches each offer and its slots in separate queries (Promise.all loop), unlike the home screen which batches with `.in(...)`. With many offers this means slower loads / more spinner time.

### 10.4 Accessibility Gaps

1. No `accessibilityLabel` on most interactive elements
2. Status color badges rely on color alone (no icon/text alternative for colorblind users)
3. No `accessibilityRole` annotations on custom components
4. Minimum touch target size not enforced (some text links are small)

---

## 11. File Map

```
/home/user/MatchSlot/
├── app/
│   ├── _layout.tsx                    # Root layout (auth guard, providers)
│   ├── (auth)/
│   │   ├── login.tsx                  # Sign in screen
│   │   └── register.tsx               # Sign up screen
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab navigator config
│   │   ├── index.tsx                  # Home dashboard (~400 lines)
│   │   ├── manage.tsx                 # My Matches (~915 lines)
│   │   └── profile.tsx                # Profile & settings (~340 lines)
│   ├── match/
│   │   ├── create.tsx                 # Create offer form (~600 lines)
│   │   └── detail/[slotId].tsx        # Slot detail + results
│   ├── offer/
│   │   ├── [token].tsx                # Public offer view (~350 lines)
│   │   └── book/[slotId].tsx          # Guest booking form (~300 lines)
│   ├── approve/
│   │   └── [token].tsx                # Approval screen (~400 lines)
│   └── tutorial.tsx                   # Onboarding (planned)
├── components/
│   ├── ui/
│   │   ├── AnimatedPressable.tsx
│   │   ├── AppBanner.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── CircularProgress.tsx
│   │   ├── CrossPlatformAlert.tsx
│   │   ├── Input.tsx
│   │   └── SkeletonLoader.tsx
│   ├── useClientOnlyValue.ts
│   ├── useClientOnlyValue.web.ts
│   ├── useColorScheme.ts
│   └── useColorScheme.web.ts
├── constants/
│   ├── AppConfig.ts                   # Domain constants
│   └── Colors.ts                      # Full color system
├── contexts/
│   └── AuthContext.tsx                # Auth state provider
├── lib/
│   ├── auth.ts                        # Auth helpers
│   ├── shareLink.ts                   # Link generation/sharing
│   ├── storage.ts                     # AsyncStorage helpers
│   └── supabase.ts                    # Supabase client init
├── types/
│   └── database.ts                    # TypeScript interfaces
├── supabase/
│   ├── schema.sql                     # Full DB schema
│   ├── full_migration.sql
│   └── migrations/
│       └── add_match_results.sql
├── assets/
│   ├── fonts/SpaceMono-Regular.ttf
│   └── images/ (icon, splash, favicon, adaptive-icon)
├── dist/                              # Built web output
├── public/                            # Web static assets
├── app.json                           # Expo config
├── package.json
├── tsconfig.json
├── eas.json                           # EAS Build config
└── netlify.toml                       # Netlify SPA routing
```

---

## 12. Design Principles (Inferred)

Based on the current implementation, the design follows these principles:

1. **Stadium metaphor:** Dark scoreboards, pitch-green accents, chalk-white backgrounds. The app should feel like you're at the ground, not in a spreadsheet.

2. **Progressive disclosure:** Home shows summary → Manage shows detail → Modals show full forms. Information reveals itself as needed.

3. **Link-first sharing:** The core workflow is shareable-link-based. Guest and approver flows must work perfectly without any app install or account.

4. **Mobile-first, web-compatible:** Designed for phones (coaches on the sideline), but the web version must work for shared links opened on desktop.

5. **Three-click booking:** Guest should go from opening a link to confirming a booking in three taps: select slot → fill form → submit.

---

## 13. Assets

| Asset                | Path                                    | Size/Format       |
|----------------------|-----------------------------------------|--------------------|
| App icon             | `assets/images/icon.png`                | Calendar+football  |
| Splash icon          | `assets/images/splash-icon.png`         | PNG                |
| Adaptive icon        | `assets/images/adaptive-icon.png`       | PNG (Android)      |
| Favicon              | `assets/images/favicon.png`             | 48x48 PNG          |
| Font                 | `assets/fonts/SpaceMono-Regular.ttf`    | Monospace (unused)  |

---

*This document is the single source of truth for any Claude Design session working on MatchSlot. When in doubt, reference the actual source files listed in the File Map (Section 11).*
