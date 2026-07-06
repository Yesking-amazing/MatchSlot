# Design Brief: MatchSlot — Full UI/UX Redesign

## Goal
Redesign the entire MatchSlot app (19 screens) from the ground up. The current UI leans on a **literal** football/stadium metaphor — pitch-green everything, faux "scoreboard" cards, "LED" status strips, chalk-line dividers, "floodlit" dark mode — and it reads as gimmicky rather than premium. We want to **keep and lean into the football identity, but make it feel high-end and intentional** — a confident, bold, premium sports product, not a themed skin over a generic app. Palette can evolve; the green sporty DNA should stay but doesn't have to be the current greens.

The naive fix already in place (theme every surface with a stadium prop) is exactly what we're moving away from. We don't want *more* football decoration — we want the football feeling to come from **typography, motion, hierarchy, and restraint**, with a few high-impact hero moments rather than props on every card.

## Context

**What the app does:** MatchSlot lets grassroots/youth football coaches schedule friendly matches. A host coach creates a *match offer* (age group, format, location, duration, and a set of available time slots), sends it to an *approver* for sign-off, then shares a link so a *guest* coach can book an open slot. Everyone tracks matches, gets reminders, and records results afterward.

**Three user roles, three contexts:**
- **Host coach** (authenticated, in-app): creates offers, manages matches, records results.
- **Approver** (public link, often not logged in): approves/rejects slots.
- **Guest coach** (public link, often not logged in): views an offer and books a slot.

Public link screens (offer, book, approve) are seen by people who may never install the app — they're the **first impression** and must look trustworthy and polished on web too (the app runs on iOS, Android, and web via Expo/React Native).

**Current design system — "Pitch Green"** (`constants/Colors.ts`):
- Primary turf green `#1B8B4E`, dark `#157A42`, bright accent `#4ADE80`, chalk `#F5F5EC`.
- Light mode = green-tinted whites; dark mode = "night match" deep pitch greens (`#0A1F12`).
- Cards: 20px radius, soft green-tinted shadows. Buttons: 52px tall, 16px radius, green glow shadow. Inputs: 52px, 16px radius, Ionicons.
- Custom football props: `scoreboardBg`, `pitchLine` dividers, LED status strips, "chalk" empty-state boards.
- Icons: **Ionicons** throughout. Animation: **react-native-reanimated** (fade/slide entrances, spring press states).

**Direction chosen by stakeholder:** *Lean into the football identity harder, but elevate it — premium and intentional, not literal.* Vibe: bold & premium (designer's discretion on exact execution).

## Design Direction (what "premium sports" should mean here)
Frame these as the north star, not rules:
- The identity should feel like a **modern football brand / broadcast graphics package** (think a high-end matchday app or a Champions-League-tier UI kit) rather than clip-art of a pitch.
- Let **one or two hero moments** carry the theme loudly (e.g. the home dashboard header, the match detail "scoreboard"), and let everything else breathe with clean, confident layout.
- Replace *literal props* (fake LED strips, chalk lines, emoji ball logo) with **systematic design** — a real type scale, a real spacing rhythm, a considered color system, purposeful motion.
- It must still be **fast and legible** for a coach managing many matches on a phone.

## Where It Needs to Appear
All 19 screens, grouped by flow. Density tiers are called out per group.

### A. Authentication (public / first-run) — `app/(auth)/`
- **Login** — `app/(auth)/login.tsx`: decorative gradient orbs, green squircle logo with a **soccer-ball emoji (⚽)**, title/subtitle, form card (email/password), forgot-password 3-step modal (email → OTP → new password), sign-up link.
- **Register** — `app/(auth)/register.tsx`: same shell, 4-field form (name, email, password, confirm).
- **Reset Password** — `app/reset-password.tsx`: web-only, new-password form + session validation, error/success banners.

Current hero pattern to rethink:
```jsx
<View style={styles.logoContainer}>
  <Text style={styles.logo}>⚽</Text>
</View>
<Text style={styles.title}>{t('auth.matchslot')}</Text>
<Text style={styles.subtitle}>{t('auth.scheduleMatches')}</Text>
```
> The emoji logo is the clearest "not premium" tell. Needs a real brandmark/wordmark treatment.

### B. Main app — Tabs (`app/(tabs)/`)

**Home / Dashboard** — `app/(tabs)/index.tsx` — *Large + Medium tiers.* Hero band with greeting, a 3-stat row (Matches Created / Open Now / Confirmed), Quick Actions cards, Upcoming Matches (max 3), Recent Activity, FAB.
```jsx
<View style={styles.heroBand}>
  <Text style={styles.greeting}>{getGreeting()}, {t('home.coach')}</Text>
  <Text style={styles.subtitle}>{t('home.whatsHappening')}</Text>
  <View style={styles.statsRow}>
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle,{backgroundColor:'rgba(27,139,78,0.15)'}]}>
        <Ionicons name="football" size={18} color={Colors[colorScheme].primary} />
      </View>
      <Text style={styles.statValue}>{stats.totalOffers}</Text>
      <Text style={styles.statLabel}>{t('home.matchesCreated')}</Text>
    </View>
    {/* Open Now, Confirmed … */}
  </View>
</View>
```

**Manage Matches** — `app/(tabs)/manage.tsx` — *Large + Compact + Chart tiers.* List/calendar toggle, `react-native-calendars` multi-dot month view, and the "scoreboard card" pattern (dark header strip HOST · format · SLOTS count) + "LED strip" status row + per-slot pills + results modal. **This screen has the heaviest literal theming.**
```jsx
<View style={styles.scoreboardCard}>
  <View style={styles.scoreboardHeader}>
    <View style={styles.scoreboardTeamSide}>
      <Text style={styles.scoreboardTeamLabel}>HOST</Text>
      <Text style={styles.scoreboardTeamName}>{offer.host_club || 'Your Team'}</Text>
    </View>
    <View style={styles.scoreboardCenter}>
      <Text style={styles.scoreboardFormat}>{offer.format}</Text>
      <Text style={styles.scoreboardAge}>{offer.age_group}</Text>
    </View>
    <View style={styles.scoreboardTeamSide}>
      <Text style={styles.scoreboardTeamLabel}>SLOTS</Text>
      <Text style={styles.scoreboardSlotCount}>{booked}/{total}</Text>
    </View>
  </View>
  <View style={styles.scoreboardLED}>{/* colored dot + status text + location button */}</View>
</View>
```

**Approvals** — `app/(tabs)/approvals.tsx` — *Medium + Compact.* Pending queue: warning-bordered cards with "Needs Approval" urgent badge, 3 detail rows (host/location/time), "Tap to Review" footer; empty "All Clear" state; tab count badge.

**Profile** — `app/(tabs)/profile.tsx` — *Medium + Compact.* Hero card (avatar ring w/ initials), Club Info (inline edit), Language picker (modal, 5 langs — EN/DE/FR/IT + system), Support/Feedback, Log Out, version footer.

### C. Host flows
- **Create Match Offer** — `app/match/create.tsx` — *Compact-heavy form.* Sections: Your Details (3 inputs), Match Details (selection rows → pickers for age/format/duration + location/approver/notes), Available Slots (add button, "chalk board" empty state, numbered slot pins with delete). 4 modal pickers + date/time picker.
- **Match Detail / Result** — `app/match/detail/[slotId].tsx` — *Large hero + Compact form.* Real "scoreboard" (HOST vs GUEST, shows score once played), status strip, match-info card (date/kickoff/location/format/duration), Add to Calendar, guest-team card, result form (home/away score, MOTM, scorers, notes).

### D. Public guest & approver flows (web-facing first impression)
- **Offer View** — `app/offer/[token].tsx` — *Medium + Compact.* Match details card (football icon, age+format, closed badge), details grid (location→maps, duration, host, notes), available-slot cards with status dots + Book buttons, app banner.
- **Book Slot** — `app/offer/book/[slotId].tsx` — *Compact form + success state.* Match summary, team-details form, then a full-screen confirmation (big checkmark, details card, Add to Calendar / OK).
- **Approval Review** — `app/approve/[token].tsx` — *Medium + Compact.* Match details card + per-slot approve/deny rows with status badges, bulk actions, confirm modals.

### E. Onboarding & system
- **Onboarding** — `app/onboarding.tsx` — *Large.* 3-page paged FlatList (icon circle + title + desc), dots indicator, Next/Get Started.
- **Tab bar** — `app/(tabs)/_layout.tsx`: 4 tabs (home/football/shield-checkmark/person), blurred translucent background, approvals count badge.
- Minor: `+not-found.tsx`, `modal.tsx` (unused boilerplate), `+html.tsx` (web template).

## Design Problem
The tension isn't "add more football" — it's **"make the football feel expensive."** Specifically:

1. **The literal props fight legibility and taste.** Scoreboard strips, LED rows, and chalk boards are decorative containers that add visual noise around the *actual* data (who, when, where, what status). A coach scanning 10 matches needs status and time to pop; right now the theming competes with them.
2. **Status is encoded almost entirely in color** (green/yellow/red/gray dots and tinted pills) across at least 5 status vocabularies that must stay distinguishable: offer status (Open / Pending Approval / Closed / Cancelled), slot status (Open / Held / Pending / Booked / Rejected), plus approval states. These must be **disambiguated with more than hue** (shape, icon, label, position) and survive dark mode + colorblind users.
3. **The brand's premium ceiling is capped by primitives**: the ⚽ emoji logo, Ionicons-only iconography, and an ad-hoc type scale (sizes 8–32 scattered, weights 500–800). A premium sports feel needs a deliberate **display typeface / type scale**, a real **brandmark**, and possibly a **custom icon treatment** for the football-specific concepts (slot, offer, approval, kickoff).
4. **Three audiences, one system**: the same components render for an authenticated coach *and* for a cold web visitor on a public link. The premium feel has to land without any of the in-app chrome (tabs, greeting, stats).

## What We Need from Design
A proposal that satisfies:
1. A **cohesive premium-sports design system** — color (evolve the green DNA, define light+dark), a real **type scale** with a display face for hero moments, spacing rhythm, elevation/shadow language, radii, and a **motion language** (the app already uses reanimated — specify entrance, press, and transition patterns).
2. A **brandmark/wordmark** to replace the emoji logo, usable at app-icon, splash, auth-hero, and public-link-header sizes.
3. A **status system** that reads instantly and is not color-only — covering all offer/slot/approval states, in light and dark.
4. **Redesigned "hero" concepts** for the two theatrical surfaces — the **home dashboard header** and the **match scoreboard/detail** — that carry the football identity boldly, so the rest of the app can stay clean.
5. A **restrained component kit** for everything else (cards, list rows, forms/inputs, pickers/modals, empty states, buttons, tab bar) that feels premium through hierarchy and space, not props.
6. **Public-link treatment** — how offer/book/approve screens look premium and trustworthy to a logged-out web visitor, including the "smart app banner."

### Suggestions to Explore (not prescriptive)
- A **matchday/broadcast graphics** visual language (kit stripes, number typography, tournament-bracket motifs) used *sparingly* as hero accents.
- A single strong **display/numeric typeface** for scores, times, and stats (jersey-number energy) paired with a clean neutral UI face.
- Replace the LED strip with a **quiet status system**: icon + label chip, or a left status rail, or a stateful color *plus* glyph.
- Turn the literal "scoreboard card" into a **real fixture card** — clean HOST vs GUEST layout, big kickoff time, crest/initials avatars — that looks like a pro football app fixture.
- A **crest/avatar system** (club initials → generated monogram badges) to give teams identity without logos.
- Reconsider the **calendar view** as a premium schedule (agenda list vs month grid) rather than dotted `react-native-calendars`.
- **Dark mode as a genuine "night match" premium mode**, not just darker greens.

### Deliverables
- High-fidelity mocks per **density tier** (large hero, medium card, compact row, chart/calendar, form) — not every one of the 19 screens, but enough to define the system + the two hero surfaces + one public-link screen.
- **Light and dark** variants (the app fully supports both and defaults to system).
- **Status/state rules** with non-color-only encoding, covering every offer/slot/approval state.
- **Type scale + color tokens** expressed so they can map onto `constants/Colors.ts` and component styles.
- **Brandmark** + app-icon direction.
- Disambiguation guidance where multiple status vocabularies coexist on one screen (e.g. Manage).
- Motion notes for the reanimated-driven entrances/press states.

## Out of Scope
- **No changes to app logic, data model, flows, or navigation structure.** Same screens, same steps, same routes — this is visual/interaction, not IA rework (a schedule/agenda alternative for the calendar view is the one allowed exception, framed as optional).
- **No copy rewrite / no new languages.** Strings live in `lib/i18n/{en,de,fr,it}.json`; keep keys stable (design may suggest microcopy tweaks, but EN/DE/FR/IT parity must hold).
- **No backend, Supabase, notifications, or calendar-integration changes.**
- Don't design net-new features — redesign what exists.
- Keep it buildable in **React Native + Expo** (Ionicons or a bundled icon set; system or bundled fonts via expo-font; reanimated for motion; effects limited to what expo-blur / expo-linear-gradient / react-native-svg can do).

## References
Read these first:
- `constants/Colors.ts` — current "Pitch Green" tokens (the thing to evolve).
- `app/(tabs)/index.tsx` — dashboard hero + stats (hero surface #1).
- `app/match/detail/[slotId].tsx` — scoreboard + result form (hero surface #2).
- `app/(tabs)/manage.tsx` — heaviest literal theming; the hardest density/status problem.
- `app/(auth)/login.tsx` — auth hero + emoji logo to replace.
- `app/offer/[token].tsx` + `app/offer/book/[slotId].tsx` — public web first-impression.
- `components/ui/` — Button, Card, Input, CircularProgress, AnimatedPressable, SkeletonLoader (component kit to rebuild).
- `lib/i18n/en.json` — full domain vocabulary and every screen's copy.
