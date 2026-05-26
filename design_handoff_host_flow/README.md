# Handoff: MatchSlot — Host Flow Redesign

## Overview

This handoff covers a redesign of the **host coach's core flow** in MatchSlot — the
three screens an authenticated host moves through:

1. **Home** — dashboard with stats, quick actions, upcoming matches, recent activity
2. **Create Offer** — a **3-step wizard** that replaces today's single long form
3. **Manage** — list of all match offers with **filter chips** and **collapsible
   scoreboard cards** that expand to reveal slot detail + actions

The redesign keeps the existing **"Pitch Green"** identity from the original
MatchSlot design system and **directly addresses three pain points** flagged in
the original handoff:

- **§10.3.1 — "Create form is long"** → broken into a 3-step wizard with a
  stepper at the top and a sticky bottom CTA. Format step uses a tappable card
  per format with a mini formation diagram, replacing the modal pickers.
- **§10.3.2 — "Manage screen density"** → every match collapses to a single
  scoreboard-style card (date block + title + status pill). Tapping expands the
  slot list and action bar.
- **§10.3.3 — "No search/filter on manage"** → filter chips above the list
  (All / Open / Booked / Pending / Closed), each showing a live count.

Additional polish:

- Non-blocking **toasts** replace `Alert.alert()` for "Result saved", "Match
  deleted", "Link copied".
- Result-entry uses an **LED-scoreboard modal** with tap +/− steppers, not raw
  text inputs.
- **Share flow** now shows a celebratory modal with the full link and a
  prominent Copy button, rather than dumping a clipboard toast.

## About the Design Files

The files in this bundle are **design references created in HTML** — interactive
prototypes built with React + Babel in the browser. They are **not** production
code to copy directly.

The MatchSlot codebase is **React Native 0.81 + Expo 54 + Expo Router 6** (per
the original handoff §9). The task is to **recreate these designs in that
environment** using the existing component library (`components/ui/Button`,
`Card`, `Input`, `AnimatedPressable`), the `Colors` token system, and the
existing route structure under `app/(tabs)/`, `app/match/`, etc.

Translation guidance:

- `<div>` with onClick → `<Pressable>` (or the existing `AnimatedPressable`)
- Inline SVG icons → `Ionicons` from `@expo/vector-icons` — names listed per
  component below
- CSS animations → `react-native-reanimated` (`FadeInDown`, spring scale)
- HTML `<input>` / `<textarea>` → existing `<Input>` component
- The custom inline `MSIcon` set is purely for the prototype; production should
  use `Ionicons` outline variants as the original system specifies

## Fidelity

**High-fidelity.** Colors, type sizing, spacing, border radii, and interaction
states are intentional and should be reproduced as specified. The prototype was
designed at the 402×874 px iPhone viewport.

Two variants exist in the prototype, **toggleable via the Tweaks panel**:

- **`classic`** ✅ **— the chosen direction.** Soft rounded cards, primary green
  CTAs, restrained scoreboard hint. **This is what to build.**
- **`stadium`** — exploratory bolder direction with dark scoreboard headers,
  Space Mono LED numerals, formation chips. **Not shipping** — present in the
  prototype only as a reference for future iteration. Ignore unless explicitly
  asked.

All measurements and tokens in this README refer to the **Classic** variant
unless noted.

---

## Design Tokens

These match the existing `constants/Colors.ts` token system. The redesign does
**not** introduce new colors — it only uses tokens already defined.

### Color tokens (Light mode)

| Token              | Hex                       | Used for                                |
|--------------------|---------------------------|-----------------------------------------|
| `text`             | `#1A2E1A`                 | Primary text, large titles              |
| `textSecondary`    | `#4A6B4A`                 | Greeting, supporting copy               |
| `textTertiary`     | `#8FA88F`                 | Chevrons, hints, dividers in copy       |
| `background`       | `#F7FAF5`                 | Screen background                       |
| `card`             | `#FFFFFF`                 | Card surfaces, input backgrounds        |
| `divider`          | `rgba(27,139,78,0.10)`    | Hairlines between rows                  |
| `cardBorder`       | `#D4E4D4`                 | Card / chip borders                     |
| `primary`          | `#1B8B4E`                 | CTAs, active chip, share link border    |
| `primaryDark`      | `#157A42`                 | Pressed CTAs                            |
| `primaryLight`     | `#E8F5E9`                 | Date block bg, quick-action highlight   |
| `secondary`        | `rgba(27,139,78,0.08)`    | Icon backgrounds, active tab bg         |
| `success`          | `#16A34A`                 | OPEN status, confirmed                  |
| `warning`          | `#F59E0B`                 | HELD, PENDING_APPROVAL, awaiting result |
| `error`            | `#EF4444`                 | REJECTED, destructive actions           |
| `info`             | `#2563EB`                 | BOOKED status, info banners             |
| `shadow`           | `rgba(26,46,26,0.10)`     | Card shadows                            |
| `glow`             | `rgba(27,139,78,0.30)`    | Primary CTA / FAB glow                  |

Dark mode equivalents live in `theme.jsx` — match the existing dark tokens in
`Colors.ts`.

### Status colors (semantic mapping)

| Status            | Color token  |
|-------------------|--------------|
| OPEN              | `success`    |
| HELD              | `warning`    |
| PENDING_APPROVAL  | `warning`    |
| BOOKED            | `info`       |
| REJECTED          | `error`      |
| CLOSED            | `textSecondary` |
| CANCELLED         | `textTertiary`  |

> **Note:** The original `AppConfig.STATUS_COLORS` constant (with raw `#4CAF50`
> etc.) was never imported anywhere — per the handoff audit §10.1.1. Status
> colors should derive **exclusively from `Colors` tokens**, mapped semantically
> as above. Delete `AppConfig.STATUS_COLORS`.

### Typography scale

System font (San Francisco on iOS, Roboto on Android).

| Role               | Size  | Weight | Letter spacing | Example                       |
|--------------------|-------|--------|----------------|-------------------------------|
| Screen title       | 30    | 800    | −0.6           | "My matches"                  |
| Section heading    | 20    | 800    | −0.4           | "Quick actions"               |
| Card heading       | 17    | 800    | −0.3           | "vs Hilltop Lions U12"        |
| Body strong        | 15    | 700    | 0              | Form labels (Classic uses Aa) |
| Body               | 14    | 500–600| 0              | Slot detail, descriptions     |
| Small caption      | 12.5  | 500    | 0              | Secondary helper copy         |
| Tiny / uppercase   | 10.5–11.5 | 600–700 | 0.4–1.2 | Section sub-eyebrows, badges  |

Greeting ("Good morning/afternoon/evening,") is 14px / 500. Coach name on Home
is 30px / 800.

### Spacing

- Screen horizontal padding: **18 px**
- Card padding: **14–18 px**
- Element gap inside a card: **10–14 px**
- Section gap: **18–24 px** (`gap * 1.6` of the per-density base)
- Density tweak modifies base gap: compact `10`, regular `14`, comfy `18`

### Radii

| Element              | Radius |
|----------------------|--------|
| Card                 | 18 px  |
| Form input           | 14 px  |
| Button (primary CTA) | 14 px  |
| Pill / chip          | 999 px (filter chips, status pills, choice fields) |
| Tab bar              | 24 px  |
| Date block on upcoming card | 12 px |
| Icon background container | 9–12 px |

### Shadows / elevation

```
Card (light):       0 1px 0 rgba(27,139,78,0.10), 0 6px 22px rgba(26,46,26,0.10)
Primary CTA button: 0 6px 18px rgba(27,139,78,0.30), 0 2px 6px rgba(27,139,78,0.30)
Floating FAB:       0 10px 24px rgba(27,139,78,0.30), 0 2px 8px rgba(27,139,78,0.30)
Tab bar:            0 12px 36px rgba(26,46,26,0.12), inset 0 1px 0 rgba(255,255,255,0.6)
```

---

## Screens / Views

### Tab bar (shared shell)

- **Floating glass bar** at the bottom of every authenticated screen
- 3 tabs: **Home** (`home-outline`), **Matches** (`football-outline`),
  **Profile** (`person-outline`) — Profile is out of scope for this redesign
  but kept in the bar for navigation continuity
- Bar: `position: absolute`, 18 px side margins, 8 px top/bottom padding,
  `backdrop-filter: blur(24px) saturate(180%)`, white at 0.85 opacity (light)
- Active tab: pill background = `secondary` color, icon + label = `primary`
- Inactive: icon + label = `textTertiary`
- Icon: 22 px, stroke 2 (inactive) / 2.4 (active)
- Label: 10.5 px / 700 (active) / 500 (inactive)
- Screens with scrollable content: add `paddingBottom: 110` to clear the bar

### Screen 1 — Home (`app/(tabs)/index.tsx`)

**Purpose:** Snapshot of the coach's activity. Quick access to creating a new
offer or jumping into Manage.

**Layout (top → bottom, 18 px side padding):**

1. **Greeting block**
   - "Good morning/afternoon/evening," (14 / 500, `textSecondary`, 8 px top margin)
   - "Coach Daniels" (30 / 800, `text`, −0.6 letter-spacing, 16 px bottom margin)
   - Greeting time-based on `new Date().getHours()` (<12 morning, <18 afternoon,
     else evening)

2. **Stats row** (3 cards in a CSS grid, 10 px gap)
   - Each card: white bg, 16 px radius, 12/12/10 padding, **3 px top border in
     the stat color**, soft shadow, ~88 px tall
   - Stack inside each card: 30×30 icon bg square (radius 9) in the stat color
     at 0.1 opacity, the icon at 0.6 opacity color → big number (26 / 800,
     leading 1) → label (11 / 600, uppercase, `textSecondary`, letter-spacing 0.6)
   - **Total** — `ball-outline` icon, color `primary`, value = match count
   - **Open** — `flag-outline` icon, color `success`, value = count where
     `status === 'OPEN'`
   - **Confirmed** — `checkmark-outline` icon, color `info`, value = count of
     slots where `status === 'BOOKED'`

3. **Quick actions** (section header "Quick actions" + 2-col grid, 14 px gap)
   - Section header: 20 / 800, `text`, −0.4 letter-spacing
   - **New offer** (highlighted): primary-green fill, white text, ~108 px tall,
     `plus` icon in a 38 px rounded-12 white-0.2-opacity square; title 16 / 700
     ("New offer"); subtitle "Share a link with guest coaches" (12.5, white at
     0.8 opacity). Shadow: `0 8px 24px <glow>`.
   - **My matches** (neutral): white bg, identical layout but title in `text`
     and subtitle in `textSecondary`; subtitle is dynamic — `${total} total · ${openNow} open`
   - Pressing scales to 0.97 over 140 ms

4. **Save a result** (only if any past booked slot lacks `home_score`)
   - One row card per pending result. Bg = `warning` at 0.1 opacity. Border 1 px
     `warning` at 0.4. Radius 14.
   - Left: 36×36 rounded-10 `warning` at 0.13 square with `trophy-outline`
   - Title: "How did the match go?" (14 / 700)
   - Subtitle: "vs {guest_club} · {fmtDate}" (12 / `textSecondary`)
   - Right: small chevron-right
   - Tapping → navigate to Manage with `focusSlot` param → that slot row gets
     a `primary at 0.10` background tint for 2 s

5. **Upcoming matches** (section header "Upcoming matches" + "See all →" link
   on the right if any items)
   - Up to **3** cards, sorted by `start` ascending
   - Each card: white bg, 18 px radius, 1 px `divider` border, soft shadow,
     14×16 px padding, row layout 14 px gap
   - Left date block: **48×54 px**, `primaryLight` bg, radius 12. Stacked:
     month abbrev (10 / 700, `primaryDark`, uppercase, letter-spacing 1) /
     day (22 / 800, `primaryDark`, leading 1)
   - Middle column: "vs {guest_club}" (15.5 / 700, `text`, single line ellipsis)
     → "{age_group} · {format} · {fmtTime}" (12.5 / `textSecondary`) → row with
     `pin-outline` 12 px + location (12 / `textSecondary`)
   - Right: chevron-right 18 px, `textTertiary`
   - Empty state when no upcoming: 28 px padded dashed-border box, 44×44
     `secondary`-bg rounded-14 square with `calendar-outline` 22 px in `primary`,
     "No matches scheduled" (15 / 700) + "Create an offer to share with guest
     clubs." (12.5 / `textSecondary`, centered)

6. **Recent activity** (section header "Recent activity")
   - Single card with up to **4** rows
   - Row: 12×16 padding, status dot (9 px, status color, no glow) + middle
     column ("{age_group} {format} · {n} slots" at 14 / 600 then 12 /
     `textSecondary` second line — either "Booked by {guest_club}" or location)
     + right status pill
   - Hairline divider between rows (`divider`)

**Animations:**
- Each section uses `FadeInDown` with staggered 100 ms delays
- Press scale: 0.97 with spring (mass 0.6, damping 18, stiffness 250)

### Screen 2 — Create Offer (`app/match/create.tsx`)

**Purpose:** 3-step wizard for creating a match offer. Replaces today's single
~600-line scroll-form.

**Header (sticky top):**
- Left: 36×36 rounded-12 `secondary`-bg back button — `close-outline` on step 1,
  `chevron-back-outline` on steps 2–3 (tapping on step 0 closes the wizard;
  on steps 1–2 goes back a step)
- Center stack: "STEP {n} OF 3" (11 / 700, uppercase, letter-spacing 1,
  `textTertiary`) / "New match offer" (16 / 700, `text`)
- Right: 36×36 spacer for symmetry

**Stepper** (below header, 24 px side padding, 14 px bottom)
- 3 circles connected by 2 px lines
- Circle: 24×24, **completed** = filled `primary` with check, **active** = filled
  `primary` with the step number in white, **upcoming** = 1.5 px `cardBorder`
  outline with the number in `textTertiary`
- Label under each (10.5 / 600 / 700-when-active, `textTertiary` /
  `text`-when-active)
- Line between circles: 2 px, `primary` if previous step completed, else
  `cardBorder`

**Sticky footer CTA** (bottom)
- 16/12/16 padding, faded-bg gradient `linear-gradient(to top, bg 70%, bg00)`
- Primary button, full width, 52 px tall, 14 px radius. Label:
  - Step 0: "Next: time slots"
  - Step 1: "Next: review"
  - Step 2: "Send for approval" + `sparkles-outline` icon
- Disabled (`disabled` style: `border` bg + `textTertiary` text) until step
  validates:
  - Step 0: `location.trim()` non-empty
  - Step 1: at least one slot
  - Step 2: `approver_email.trim()` non-empty

#### Step 1 — Details

Fields, top to bottom (each with a uppercase 11.5 / 600 label in
`textSecondary`, 6 px below label gap, 16 px field spacing):

1. **Age group** — wrapping chip list, options `U8 U10 U12 U14 U16 U18 Open`
   from `AppConfig.AGE_GROUPS`. Chips: 10/16 padding, 999 radius, 14 / 500.
   Selected: `primary` bg + white text + 700 weight. Unselected: `card` bg +
   `cardBorder` 1 px border + `text`. Default `U14`.
2. **Format** — 2-col grid of 4 cards (one per `5v5 7v7 9v9 11v11`). Each card:
   `card` bg (or `primaryLight` if selected), 1.5 px border (`cardBorder` or
   `primary`), 14 px radius, 10/12 padding, row layout 10 px gap. Inside: 48×28
   formation chip (mini pitch diagram, see below) + stack of label (15 / 700,
   `text`) + "{10/14/18/22} players" (11 / `textSecondary`)
   - **Formation diagram** (SVG): pitch rectangle with halfway line + center
     circle in `pitchLine`; dots arranged left-side per formation
     (`5v5: [1,2,2]`, `7v7: [1,2,3,1]`, `9v9: [1,3,3,2]`, `11v11: [1,4,4,2]`);
     mirrored dots on right side in `primary` at 0.34 opacity. Dot radius 1.4
     (small) or 2 (medium).
3. **Duration** — wrapping chip list of `60 70 80 90 100 120`. Each chip
   renders the number then a 11 px lowercase "min" suffix at 0.65 opacity.
   Default `80`.
4. **Venue / Pitch** — text input with `pin-outline` icon. Placeholder
   "e.g. Riverside Park · Pitch 3". Required.
5. **Notes (optional)** — multiline textarea with `document-text-outline` icon.
   Placeholder "Anything guests should know — parking, kit, etc."
   `minHeight: 90 px`.

Input style: row with 48 px min height (90 if multiline), 14 px side padding
(12 top if multiline), 14 px radius, 1 px `cardBorder` border, `card` bg.
Left icon 18 px `textSecondary`, then 10 px gap, then transparent input
(15 / `text`). Multiline textarea uses 64 px min text-area height.

#### Step 2 — Time slots

- Label "Available time slots" + helper "Add the dates & times you can host.
  Guest coaches will pick one." (12.5 / `textSecondary`, 14 px bottom)
- If no slots: dashed empty state ("No slots yet" / "Tap below to add your
  first available time.")
- Slot rows (when any): list with 8 px gap, each row 12/14 padded `card` bg
  with 14 px radius and 1 px `divider` border. Inside: 32×32 `secondary` bg
  rounded-10 square with the index in 13 / 700 `primary` ("01", "02"…) +
  stack of "{fmtDate(start)}" (14 / 600) and "{fmtTimeRange(start, duration)}"
  (12 / `textSecondary`) + 32×32 `error` at 0.08 bg rounded-10 trash button
  (`trash-outline` 15 px `error`)
- **"+ Add a time slot"** dashed pill (14/16 padding, 14 radius, 1.5 px dashed
  border `primary` at 0.5 opacity, `primaryLight` bg, centered "Add a time
  slot" 14.5 / 700 `primary` with `add-outline` 18 px leading icon)
- Tapping opens a **bottom-sheet date-time picker** (`absolute inset:0`,
  rgba(0,0,0,0.4) backdrop, white sheet sliding up from bottom with 28 px
  top-radius, 14/18/26 padding, max-height 78%):
  - 40×4 grab handle (centered, `cardBorder`)
  - Title "Pick a date & time" (18 / 800, −0.3 ls)
  - **Date** strip: horizontal scroll, 8 px gap, each item 56 px wide ×
    auto-height, 14 px radius, with day-abbrev (10 / 600 uppercase) / day
    number (18 / 800) / month abbrev (10 / 600). Selected = `primary` bg
    + white text. Unselected = `card` bg + 1 px `cardBorder`. Generates next
    21 days starting from today+7.
  - **Kick-off time**: 5-col grid of times `09:00–18:00` (10 buttons), 13.5 /
    600, 10/0 padding, 12 radius, selected `primary` bg + white text.
  - Footer: primary "Add slot" button + `checkmark-outline`
  - Closing this resets nothing; tapping "Add slot" prepends a new slot row
    sorted by start time and dismisses the sheet.

#### Step 3 — Review

Two summary cards + approver email field + info banner.

- **Match summary card** (18 px radius, 16 padding, `card` bg):
  - Eyebrow: "MATCH SUMMARY" (10.5 / 700 / `primary`, uppercase, letter-spacing 1)
  - Row: 72×42 formation chip (medium) + stack of "{age_group} · {format}"
    (22 / 800, −0.4 ls) and "{duration} minutes" (13 / `textSecondary`)
  - Then `ReviewRow`s — left icon 16 px `textSecondary`, label (11 / 600
    uppercase letter-spacing 0.5 `textTertiary`), value (14 / `text`). Rows
    rendered: "Venue" + location, "Notes" + notes if present.
- **{n} time slots card** (same radius/bg):
  - Eyebrow: "{N} TIME SLOTS"
  - One row per slot: index (11 / 700 / `primary`, 24 px wide column) + date
    (14 / 600) over time range (12 / `textSecondary`)
  - Top-divider between rows (`divider`)
- **Approver email** text field (icon `mail-outline`, placeholder
  `approver@yourclub.com`, default pre-fills `director@riversiderovers.club`
  for demo)
- **Info banner**: 12/14 padding, 14 radius, `info` at 0.06 bg, 1 px `info`
  at 0.19 border. Layout: `shield-outline` 18 px `info` + stack of:
  "Pre-approval keeps your slots safe" (13 / 700) + "Your approver will get
  an email to review each time slot. Your offer goes live once they sign off."
  (12 / `textSecondary`)

**On submit (step 3):**
- POST a new `match_offer` with `status: 'PENDING_APPROVAL'`, all slots
  `status: 'PENDING_APPROVAL'`, a generated `share_token`
- Trigger approval emails (existing `sendApprovalEmail` lib)
- Navigate to a **Success overlay** (see below)

#### Success overlay (after creating)

Full-screen overlay on `bg`:
- 80×80 `primary`-filled circle centered with `sparkles-outline` 36 px white.
  Animations:
  - The circle scales `0.2 → 1.08 → 1` over 520 ms ease-out-back
    (`cubic-bezier(0.2, 1.4, 0.4, 1)`)
  - A second `primary` ring scales `0.6 → 2` while fading 0.6 → 0 over
    1100 ms ease-out — like a sonar pulse
- Eyebrow "FIXTURE CREATED" (11 / 700 / `primary`, uppercase, letter-spacing 1.4)
- Title "Sent for approval" (28 / 800, −0.6 ls, centered)
- Body "We've emailed your approver to review the {N} time slot{s}. You'll
  get a notification once they sign off." (14 / `textSecondary`, max-width 300,
  centered, line-height 1.45)
- Match summary card (same `FormatBlock` left + eyebrow `{age_group} · {format}`
  + bold location + "N slots · {duration} min" subtitle)
- Primary "View in My Matches" button with `arrow-forward-outline`

### Screen 3 — Manage (`app/(tabs)/manage.tsx`)

**Purpose:** List every match offer, filter, inspect, share, delete, save
results. Replaces today's ~915-line dense scoreboard list.

**Header:**
- "My matches" (30 / 800, −0.6 ls)
- Subtitle "{N} offers · {N} confirmed" (13 / `textSecondary`)

**Filter chips** (10/14 padding, 6 px gap, horizontal scroll if overflow):

| Chip       | Count source                                      |
|------------|---------------------------------------------------|
| All        | `matches.length`                                  |
| Open       | `matches.filter(m => m.status === 'OPEN').length` |
| Booked     | `matches.filter(m => m.slots.some(s => s.status === 'BOOKED')).length` |
| Pending    | `matches.filter(m => m.status === 'PENDING_APPROVAL').length` |
| Closed     | `matches.filter(m => m.status === 'CLOSED' && !m.awaitingResult).length` |

Chip style: 7/14 padding, 999 radius, `card` bg + `cardBorder` 1 px (selected
= `primary` bg + white text + 700). 13 / 500 (selected 700). Count appended at
0.6 opacity, 600 weight.

**Match cards** (collapsed by default — only the first match expanded on first
render):

- Outer container: `card` bg, 18 px radius, 1 px `cardBorder`,
  `0 4px 14px <shadow>`, overflow hidden
- **Collapsed header** — pressable, scales to 0.99 on press:
  - 14/16 padding, row 12 px gap
  - **Left block** (58 px wide):
    - If a slot is BOOKED → `DateBlock`: `primaryLight` bg, 14 radius, centered
      day-abbrev (10 / 700 `primaryDark` uppercase ls 0.8) / day number (22 /
      800 `primaryDark`) / "month · time" (9.5 / 700 `primaryDark` uppercase
      ls 0.8)
    - Else → `FormatBlock`: 58×58, `primaryLight` bg, 14 radius, vertical
      stack of mini formation chip (48×28) + format label (9.5 / 700
      `primaryDark`, letter-spacing 0.6)
  - **Middle**: eyebrow "{age_group} · {format}" (10.5 / 700, `textSecondary`,
    uppercase, ls 0.6) + title (17 / 800, `text`, −0.3 ls, single-line ellipsis):
    - BOOKED slot present → "vs {guest_club}"
    - `status === 'PENDING_APPROVAL'` → "Awaiting approval"
    - `status === 'CANCELLED'` → "Cancelled offer"
    - else → "{n} time slot{s} open"
  - Sub-row: `pin-outline` 11 px + location (11.5 / `textSecondary`, single
    line ellipsis)
  - **Right**: status pill (top) + chevron-down 16 px (`textTertiary`) below;
    chevron rotates 180° over 240 ms when expanded
- **Expanded body** (animates in over 280 ms, easing
  `cubic-bezier(0.2, 0.7, 0.2, 1)`):
  - **Slot rows** — 10/16 padding, hairline divider between rows. Layout: 8 px
    status dot (no glow in Classic) + middle column ("{fmtDate} · {fmtTime}"
    13.5 / 700 + status description 11.5 / `textSecondary`) + right area
  - Slot description text by status:
    - `BOOKED`: "{guest_club} · {guest_contact}"
    - `HELD`: "Held by {held_by} — 15-min hold"
    - `OPEN`: "Available · {duration} min"
    - `REJECTED`: "Released after sibling booked"
    - `PENDING_APPROVAL`: "Awaiting approver decision"
  - If `home_score != null` → "FT {h} — {a}" badge below subtitle, 3/8
    padding, 6 radius, `success` at 0.08 bg, `success` text, 12 / 700,
    `trophy-outline` 11 px lead
  - If `played && !home_score` → right-side "Save" button — 6/12 padding,
    radius 8, `warning` at 0.13 bg, 1 px `warning` at 0.33 border, 12 / 700
    `warning`, `trophy-outline` 12 px leading. Opens result modal.
  - If `OPEN` → right-side "OPEN" label (10.5 / 700, `success`, uppercase,
    letter-spacing 0.6)
  - **Action bar** — top 1 px `divider`, 12/16/14 padding, 8 px gap:
    - If `OPEN`: primary "Share link" button (42 tall, `share-social-outline`
      icon, 13.5 / 600) + delete icon button on the right
    - If `PENDING_APPROVAL`: amber info pill "Waiting for {approver_username}"
      (`bell-outline` 16 `warning`, 12.5 / 600 `text`, `warning` at 0.08 bg,
      1 px `warning` at 0.25 border) + delete icon
    - If `CLOSED && awaitingResult`: primary "Save result" button
      (`trophy-outline`) + delete icon
    - If `CLOSED && !awaitingResult`: `secondary` bg confirmation pill
      "Match confirmed" (`checkmark-outline` 16 `success`, 12.5 / 600
      `text`) + delete icon
    - Delete button: 42×42, 14 radius, `error` at 0.06 bg, 1 px `error` at
      0.19, `trash-outline` 16 px `error`

- **FAB** (Floating Action Button) — absolute bottom-right inside the
  scrollable area, **60×60, 30 radius (circle in Classic)**, `primary` bg,
  `add-outline` 28 px white stroke 2.6, shadow `0 10px 24px <glow>, 0 2px
  8px <glow>`. Position: `right: 18, bottom: 90`. Scales to 0.92 on press.

#### Share modal

Bottom sheet (same chrome as the date-time picker):
- 40×4 grab handle
- 56×56 rounded-18 `primaryLight` square with `share-social-outline` 24 px
  `primary` (centered)
- Title "Share with guest coaches" (22 / 800, −0.4 ls, centered)
- Body "Anyone with this link can pick a slot. The first to book wins."
  (13.5 / `textSecondary`, centered, max-width ~ sheet width)
- **Link row** — `card` bg, 14 radius, 1.5 px `primary` at 0.19 border, 14/14
  padding: `share-social-outline` 16 `primary` + monospace link
  `matchslot.app/offer/{token}` (14 / 600 `text`, single-line ellipsis) + Copy
  button. Copy button: 6/12 padding, 8 radius, `primary` bg, white text 12.5 /
  700, `copy-outline` 13 px leading; on tap → flips to `success` bg +
  `checkmark-outline` for 1.5 s and fires "Link copied" toast.
- Primary "Share via…" button (`share-social-outline` icon) — wire to
  `Share.share()` from React Native

#### Result modal

Bottom sheet:
- Eyebrow "FULL TIME" (11 / 700 / `primary`, uppercase, letter-spacing 1)
- Title "{host short} vs {guest short}" (22 / 800, −0.5 ls)
- Sub "{age_group} · {format} · {fmtDate}" (13 / `textSecondary`)
- **Scoreboard panel** — `scoreboardBg` (`#0F2818`) fill, 18 radius, 22/18
  padding, with the `PitchBackdrop` SVG rendered at 0.35 opacity inside.
  Three columns: home input · `:` separator · away input
  - **Score input** column (`ScoreInput`):
    - Eyebrow "HOME" / "AWAY" (10 / 700, `primary`, uppercase, letter-spacing
      1.4, **Space Mono** — this is the one place Classic borrows a numeric
      font for the LED feel; production should use the bundled but currently
      unused `SpaceMono-Regular.ttf` font asset)
    - Row with `−` button (30×30 rgba(255,255,255,0.08) bg, 8 radius,
      `minus-outline` 14 px white at 0.8) + the score number (48 / 700
      **Space Mono**, `primary`, text-shadow `0 0 14px <primary>aa`,
      leading 1) + `+` button (30×30 `primary` bg, 8 radius, `add-outline`
      14 px white)
  - Big colon (32 / 700, white at 0.4) between columns
- Notes label + textarea (60 min height, transparent inside a 14-radius
  bordered shell)
- Primary "Save result" button with `checkmark-outline`. Fires "Result saved"
  toast.

---

## Toasts

Replace `Alert.alert` for success/info feedback with a non-blocking toast:
- Bottom of the screen at `bottom: 108 px` (above the tab bar)
- Pill shape (999 radius), 10/18 padding
- `#0F2818EE` bg in light mode (white text), `#FFFFFFEE` in dark (`#0F2818` text)
- Backdrop blur 20 px, soft drop shadow
- Optional icon leading, then 13.5 / 600 message
- Auto-dismiss after 2200 ms
- Uses: "Result saved" + `checkmark-outline`, "Match deleted" + `trash-outline`,
  "Link copied" + `checkmark-outline`

---

## Interactions & Behavior

- **All pressables**: spring scale to 0.97 on press, 140 ms cubic-bezier
  (.2,.7,.2,1) on release. Use the existing `<AnimatedPressable>` with default
  `scaleTo`.
- **Section entry on Home**: `FadeInDown` with `delay = index * 100`
- **Card expand on Manage**: 280 ms `max-height` + `opacity` animation, easing
  `cubic-bezier(.2,.7,.2,1)`. Chevron rotates 180° (240 ms).
- **Bottom sheets**: slide up over 320 ms `cubic-bezier(.2,.8,.2,1)`; backdrop
  fades in over 200 ms. Tap backdrop to dismiss.
- **Success overlay burst**: see the spec under Step 3 above.
- **Filter chips**: tapping is instant (no animation other than press scale);
  list updates immediately.
- **Focus from Home**: tapping an Upcoming/Awaiting Result card on Home
  navigates to Manage **and passes `focusSlot` / `focusMatch`** params. The
  Manage screen auto-expands the parent match and highlights the slot row
  (`primary` at 0.1 bg). Highlight should clear after ~2 s.

---

## State Management

Per match offer (matches existing `match_offers` table):

```ts
type MatchOffer = {
  id: string;
  host_name: string; host_club: string; host_contact: string;
  age_group: 'U8'|'U10'|'U12'|'U14'|'U16'|'U18'|'Open';
  format: '5v5'|'7v7'|'9v9'|'11v11';
  duration: 60|70|80|90|100|120;
  location: string;
  approver_email: string;
  status: 'PENDING_APPROVAL'|'OPEN'|'CLOSED'|'CANCELLED';
  notes?: string;
  share_token: string;
  created_at: string;
  slots: Slot[];
  awaitingResult?: boolean; // derived: any past BOOKED slot lacking home_score
};

type Slot = {
  id: string;
  start_time: string; // ISO
  end_time: string; // computed
  status: 'OPEN'|'HELD'|'PENDING_APPROVAL'|'BOOKED'|'REJECTED';
  guest_name?: string; guest_club?: string; guest_contact?: string;
  home_score?: number; away_score?: number; result_notes?: string;
  played?: boolean; // derived: start < now
};
```

Local UI state needed:

- `tab: 'home' | 'manage' | 'profile'`
- `showCreate: boolean`
- `createStep: 0|1|2` (wizard step)
- `createForm: { age_group, format, duration, location, notes, approver_email, slots: Slot[] }`
- `expandedMatchId: string | null` (Manage)
- `filter: 'All' | 'Open' | 'Booked' | 'Pending' | 'Closed'`
- `resultModal: {match, slot} | null`
- `shareModal: MatchOffer | null`
- `toast: {msg, icon} | null` + a `showToast(msg, icon)` helper

Server-side flows (unchanged from existing app — wire to existing Supabase
helpers):
- Create flow → insert `match_offer` + `slots` (all `PENDING_APPROVAL`) +
  `approval` row, fire email
- Save result → update slot's `home_score`, `away_score`, `result_notes`,
  `result_saved_at`
- Share copy → `expo-clipboard` `setStringAsync(link)`
- Delete → existing flow, with a confirmation `Alert` (or replace with a
  custom inline confirmation if desired)

---

## Assets

- **Icons** — all Ionicons (`@expo/vector-icons`) outline variants. Names
  referenced inline above. The handful used:
  - `home-outline`, `home` · tabs
  - `football-outline`, `football` · tabs, format chips
  - `person-outline`, `person` · tabs
  - `add-outline` · FAB, "Add slot", +score button
  - `close-outline` · wizard step 1 back
  - `chevron-back-outline`, `chevron-forward-outline`, `chevron-down-outline`
  - `pin-outline`, `location-outline` · location
  - `time-outline`, `calendar-outline`
  - `people-outline`, `shield-outline`
  - `share-social-outline` · share button
  - `copy-outline`, `checkmark-outline`
  - `trash-outline` · delete
  - `trophy-outline` · result entry
  - `flag-outline` · stat card
  - `bell-outline` · waiting-for-approver
  - `document-text-outline` · notes
  - `mail-outline` · approver email field
  - `sparkles-outline` · success overlay
  - `minus-outline`, `arrow-forward-outline`
- **Fonts** — system everywhere. The result modal's score numerals + the
  scoreboard eyebrow labels use **Space Mono Regular** — there's a bundled
  `assets/fonts/SpaceMono-Regular.ttf` already loaded but currently unused
  (per the original handoff §10.1b). This redesign finally uses it. Wire via
  `useFonts({ 'SpaceMono': require(...) })` and set `fontFamily: 'SpaceMono'`
  on those few labels.
- **Images** — none. Decorative pitch markings are SVG (see `PitchBackdrop`
  in `ui.jsx` — Classic doesn't actually render this; Stadium does).

---

## Sample data

The prototype uses 4 sample matches to populate the active-coach-mid-season
state. Replicate this fixture data for storybook/screenshots:

1. **m1** — U14 / 9v9 / 80 min, "Riverside Park · Pitch 3", status `OPEN`,
   4 slots (2× OPEN Sat 6 Jun, 1× HELD Sat 13 Jun, 1× OPEN Sat 13 Jun)
2. **m2** — U12 / 7v7 / 60 min, status `CLOSED`, 1× BOOKED slot by "Hilltop
   Lions U12", 1× REJECTED sibling
3. **m3** — U16 / 11v11 / 90 min, status `CLOSED` + `awaitingResult: true`,
   1× past-and-played BOOKED slot vs "Coastline Athletic"
4. **m4** — U10 / 5v5 / 60 min, status `PENDING_APPROVAL`, 2× pending slots

Greeting time defaults to "Good afternoon," in the prototype (the demo time
is fixed at 14:00) — production should use `Date.now()`.

---

## Files in this bundle

| File                                | What it is                                         |
|-------------------------------------|----------------------------------------------------|
| `MatchSlot Host Flow.html`          | Entry HTML — loads React/Babel and all .jsx       |
| `theme.jsx`                         | Color tokens (light/dark) + sample data           |
| `ui.jsx`                            | Shared components: icons, buttons, status pills,  |
|                                     |   FormationChip, PitchBackdrop, Card, toasts,     |
|                                     |   date formatters                                 |
| `home.jsx`                          | HomeScreen + StatCard + QuickAction + UpcomingCard|
|                                     |   + AwaitingResultCard + ActivityRow + EmptyState |
| `create.jsx`                        | CreateScreen wizard + Stepper + StepDetails +     |
|                                     |   StepSlots + StepReview + DateTimePicker bottom  |
|                                     |   sheet                                           |
| `manage.jsx`                        | ManageScreen + MatchCard (collapsible) + SlotRow  |
|                                     |   + DateBlock + FormatBlock + ResultModal +       |
|                                     |   ScoreInput + ShareModal                         |
| `app.jsx`                           | Root App + TabBar + SuccessOverlay + boot         |
| `ios-frame.jsx`                     | iOS device frame (status bar, home indicator) —   |
|                                     |   PROTOTYPE-ONLY — not needed in production       |
| `tweaks-panel.jsx`                  | Live tweak controls (variant, dark, density) —    |
|                                     |   PROTOTYPE-ONLY                                  |

The two **PROTOTYPE-ONLY** files exist solely to make the HTML prototype
runnable in a browser. They have **no production analog** and should not be
ported.

---

## Open questions for the implementing developer

These are decisions that came up during the design and are worth aligning
with product before coding:

1. **Filter persistence on Manage** — should the active filter survive
   navigating away and back? Prototype resets to "All".
2. **First-card auto-expand on Manage** — should the most recent or the
   "most actionable" match auto-expand on first visit? Prototype expands the
   first item in the current sort.
3. **Date-time picker on web** — the prototype uses a custom date strip +
   time grid. The original app falls back to a text input on web (§10.1.11).
   Recommend replacing that with the custom picker for parity.
4. **Toast accessibility** — needs an `accessibilityLiveRegion="polite"`
   announcement when shown (or equivalent).
5. **Step persistence in Create** — if a user backgrounds the app mid-wizard,
   should we restore step/state? Not implemented in the prototype.

---

*This README is the source of truth. When measurements or colors here conflict
with the prototype files, this document wins.*
