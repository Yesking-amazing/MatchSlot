# User Stories Implementation Guide

This document maps each user story to its implementation in the codebase.

## Host Coach User Stories

### US-HC-01: Create match offer
**Status**: ✅ Implemented

**Location**: `app/match/create.tsx`

**Implementation Details**:
- Form with host details (name, club, contact)
- Match details selection:
  - Age Group: U8, U10, U12, U14, U16, U18, Open
  - Format: 5v5, 7v7, 9v9, 11v11
  - Duration: 60, 70, 80, 90, 100, 120 minutes
  - Location (text input)
  - Optional notes
- Multiple time slots with date/time pickers
- Saves to `match_offers` and `slots` tables
- Status automatically set to 'OPEN'

**Database Tables**:
- `match_offers`: Stores match offer details
- `slots`: Stores multiple time slot options

---

### US-HC-02: Generate shareable link
**Status**: ✅ Implemented

**Locations**: 
- `app/match/create.tsx` (generation)
- `app/(tabs)/manage.tsx` (display and sharing)
- `lib/shareLink.ts` (utility functions)

**Implementation Details**:
- Unique `share_token` generated on match offer creation
- Format: `{timestamp}-{random-string}`
- Link format: `https://matchslot.app/offer/{share_token}`
- Copy to clipboard functionality in manage screen
- No login required to access offer via link

**Database Fields**:
- `match_offers.share_token`: Unique token (indexed)

---

### US-HC-03: View slot status
**Status**: ✅ Implemented

**Location**: `app/(tabs)/manage.tsx`

**Implementation Details**:
- Lists all match offers created by host
- For each offer, displays all slots with:
  - Status badge (OPEN, HELD, PENDING_APPROVAL, BOOKED, REJECTED)
  - Color-coded status indicators
  - Guest club name (if booked/pending)
  - Date and time
- Real-time updates with refresh functionality
- Pull-to-refresh support

**Slot Statuses**:
- **OPEN**: Available for booking (Green)
- **HELD**: Temporarily held during booking process (Orange)
- **PENDING_APPROVAL**: Awaiting approval decision (Gold)
- **BOOKED**: Confirmed booking (Blue)
- **REJECTED**: Not available (Red)

---

### US-HC-04: Cancel or close offer
**Status**: ✅ Implemented

**Location**: `app/(tabs)/manage.tsx`

**Implementation Details**:
- "Close Offer" button on each active offer
- Confirmation dialog before closing
- Updates `match_offers.status` to 'CLOSED'
- Closed offers no longer accept new bookings
- Notifications sent to relevant parties (via notifications table)

**Database Updates**:
- `match_offers.status`: Updated to 'CLOSED'
- `notifications`: Created for affected parties

---

## Guest Coach User Stories

### US-GC-01: View match offer
**Status**: ✅ Implemented

**Location**: `app/offer/[token].tsx`

**Implementation Details**:
- Accessible via shareable link (no login required)
- Displays complete match details:
  - Age group and format
  - Location
  - Duration
  - Host information
  - Additional notes
- Lists all time slots with availability status
- Real-time updates via Supabase subscriptions
- Unavailable slots visually disabled

**Route**: `/offer/{share_token}`

---

### US-GC-02: Select slot
**Status**: ✅ Implemented

**Locations**:
- `app/offer/[token].tsx` (selection)
- `app/offer/book/[slotId].tsx` (booking form)

**Implementation Details**:
- Guest selects available slot
- Navigates to booking form with slot ID
- Slot status check before allowing booking
- If slot taken, shows error message (US-GC-04)
- Slot marked as 'HELD' during booking process
- Hold prevents other users from booking same slot

**Database Fields**:
- `slots.held_by_session`: Session identifier
- `slots.held_at`: Timestamp of hold

---

### US-GC-03: Enter team details
**Status**: ✅ Implemented

**Location**: `app/offer/book/[slotId].tsx`

**Implementation Details**:
- Form with required fields:
  - Guest name (required)
  - Club name (required)
  - Contact info - email or phone (required)
  - Additional notes (optional)
- Approver email field (required)
- Validation on all required fields
- Data saved to `slots` table on submission
- Status updated to 'PENDING_APPROVAL'

**Database Updates**:
- `slots.guest_name`
- `slots.guest_club`
- `slots.guest_contact`
- `slots.guest_notes`
- `slots.status`: 'PENDING_APPROVAL'
- `approvals`: New approval record created
- `notifications`: Notification sent to approver

---

### US-GC-04: Slot unavailable handling
**Status**: ✅ Implemented

**Locations**:
- `app/offer/[token].tsx` (visual feedback)
- `app/offer/book/[slotId].tsx` (booking validation)

**Implementation Details**:
- Slot status checked before booking submission
- If status changed to non-OPEN:
  - Clear error message displayed
  - User directed to select another slot
  - Page automatically refreshes to show current status
- Real-time slot status updates prevent race conditions
- Unavailable slots shown with lock icon and disabled state

---

## Approver User Stories

### US-AP-01: Receive approval request
**Status**: ✅ Implemented

**Locations**:
- `app/offer/book/[slotId].tsx` (creation)
- Database: `approvals` and `notifications` tables

**Implementation Details**:
- Approval request created on booking submission
- Unique `approval_token` generated
- Notification record created with:
  - Approver email
  - Match and team information
  - Direct approval link
- Link format: `https://matchslot.app/approve/{approval_token}`
- Notification includes:
  - Match type (age group, format)
  - Guest team details
  - Time slot
  - Location

**Database Tables**:
- `approvals`: Approval request record
- `notifications`: Email notification record

**Route**: `/approve/{approval_token}`

---

### US-AP-02: Approve match
**Status**: ✅ Implemented

**Location**: `app/approve/[token].tsx`

**Implementation Details**:
- Approval screen shows complete booking details
- "Approve" button with confirmation dialog
- On approval:
  1. Updates approval status to 'APPROVED'
  2. Updates slot status to 'BOOKED'
  3. Updates all other slots in offer to 'REJECTED'
  4. Closes the match offer
  5. Sends notifications to guest and host
- Optional decision notes field
- Process is atomic (all updates or none)

**Database Updates**:
- `approvals.status`: 'APPROVED'
- `approvals.decision_at`: Timestamp
- `approvals.decision_notes`: Optional notes
- `slots.status`: 'BOOKED' for approved slot
- `slots.status`: 'REJECTED' for all other slots
- `match_offers.status`: 'CLOSED'
- `notifications`: Created for guest (approved) and host (confirmed)

---

### US-AP-03: Reject match
**Status**: ✅ Implemented

**Location**: `app/approve/[token].tsx`

**Implementation Details**:
- "Reject" button with confirmation dialog
- Decision notes **required** for rejection
- On rejection:
  1. Updates approval status to 'REJECTED'
  2. Clears guest data from slot
  3. Updates slot status back to 'OPEN'
  4. Slot becomes available for other teams
  5. Sends notifications to guest (with reason) and host
- Rejection reason included in guest notification

**Database Updates**:
- `approvals.status`: 'REJECTED'
- `approvals.decision_at`: Timestamp
- `approvals.decision_notes`: Required notes with reason
- `slots.status`: 'OPEN'
- `slots.guest_*`: All guest fields cleared
- `slots.held_by_session`: Cleared
- `notifications`: Created for guest (rejected with reason) and host (informed)

---

## System User Stories

### US-SYS-01: Prevent double booking
**Status**: ✅ Implemented

**Locations**:
- Database: Unique constraints and transactions
- `app/offer/book/[slotId].tsx`: Status checking

**Implementation Details**:
- Slot status checked immediately before booking
- Database constraint prevents concurrent bookings
- If slot already taken, clear error message shown
- User redirected to select another slot
- Status updates are atomic
- Real-time subscriptions keep UI in sync

**Prevention Mechanisms**:
1. Status check in booking flow
2. Database-level constraints
3. Atomic updates
4. Real-time status updates

---

### US-SYS-02: Slot hold timeout
**Status**: ⚠️ Partially Implemented

**Current Implementation**:
- Slot marked as 'HELD' with session ID and timestamp
- `slots.held_by_session` and `slots.held_at` fields exist
- Constants defined in `constants/AppConfig.ts`

**Missing**:
- Automatic timeout cleanup job
- Background process to release expired holds

**Recommended Implementation**:
- Supabase Edge Function or database trigger
- Runs every 5 minutes
- Checks for holds older than 15 minutes
- Resets status to 'OPEN' and clears hold fields

**SQL for cleanup (to be implemented)**:
```sql
UPDATE slots
SET status = 'OPEN',
    held_by_session = NULL,
    held_at = NULL
WHERE status = 'HELD'
  AND held_at < NOW() - INTERVAL '15 minutes';
```

---

### US-SYS-03: Notifications
**Status**: ✅ Implemented (Database Only)

**Location**: Database: `notifications` table

**Implementation Details**:
- Notification records created for all status changes:
  - Slot selected (to host)
  - Approval request (to approver)
  - Approved (to guest and host)
  - Rejected (to guest and host)
  - Offer closed (to affected parties)
- Each notification includes:
  - Recipient email
  - Recipient type (HOST, GUEST, APPROVER)
  - Notification type
  - Subject and message
  - Related match/slot IDs
  - Sent status

**Current Status**:
- ✅ Notification records created in database
- ⚠️ Email sending not implemented (requires email service)

**To Complete**:
- Integrate email service (SendGrid, AWS SES, etc.)
- Background job to process unsent notifications
- Mark notifications as sent after delivery
- Handle delivery failures

---

## Additional Features Implemented

### Real-time Updates
- Supabase real-time subscriptions on slot changes
- Automatic UI refresh when slots are updated
- Prevents stale data and race conditions

### Data Validation
- All forms have proper validation
- Required field checking
- Email format validation
- Clear error messages

### User Feedback
- Loading states on all async operations
- Success/error alerts
- Confirmation dialogs for destructive actions
- Pull-to-refresh on list views

### Responsive UI
- Football-specific icons and terminology
- Color-coded status indicators
- Clear visual hierarchy
- Accessible touch targets

---

## Testing Checklist

### Host Flow
- [ ] Create match offer with all details
- [ ] Add multiple time slots
- [ ] Verify shareable link is generated
- [ ] Copy link to clipboard
- [ ] View match offers in Manage tab
- [ ] Check slot statuses are displayed correctly
- [ ] Close an active offer
- [ ] Verify closed offer doesn't accept bookings

### Guest Flow
- [ ] Open shareable link
- [ ] View match details (no login)
- [ ] Select available time slot
- [ ] Enter team details in booking form
- [ ] Submit booking request
- [ ] Try booking already-taken slot (should show error)
- [ ] Verify slot status shows "Pending Approval"

### Approver Flow
- [ ] Open approval link from email
- [ ] Review all booking details
- [ ] Approve a booking (verify all slots lock)
- [ ] Reject a booking with notes (verify slot opens again)
- [ ] Try accessing already-processed approval

### System Features
- [ ] Verify no double bookings possible
- [ ] Check real-time slot updates work
- [ ] Verify notifications are created in database
- [ ] Test slot hold mechanism

---

## Database Schema Alignment

All user stories are backed by a comprehensive database schema:

### Tables
1. `match_offers` - Host's match offers
2. `slots` - Time slot options
3. `approvals` - Approval workflow
4. `notifications` - System notifications

### Indexes
- Share tokens (for quick lookups)
- Approval tokens (for quick lookups)
- Slot status (for filtering)
- Match offer IDs (for joins)

### Row Level Security (RLS)
- Enabled on all tables
- Public access for MVP (no authentication)
- Ready for user authentication in production

---

## Future Enhancements

### Priority 1 (Complete MVP)
- [ ] Implement slot hold timeout cleanup
- [ ] Integrate email notification service
- [ ] Add email templates

### Priority 2 (User Experience)
- [ ] User authentication for hosts
- [ ] Push notifications (mobile)
- [ ] In-app notification center
- [ ] Match history and statistics

### Priority 3 (Advanced Features)
- [ ] Calendar integration
- [ ] In-app messaging between coaches
- [ ] Match reminders
- [ ] Recurring match offers
- [ ] Team profiles and ratings

---

## Notes

- All monetary transactions are out of scope
- No payment processing required
- Focus is on scheduling and coordination
- Suitable for club-level youth football
