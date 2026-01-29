# MatchSlot - Football Match Booking App

A React Native app built with Expo for managing football match bookings between clubs. Coaches can create match offers with multiple time slots, share them with other clubs, and manage approvals.

## Features

### For Host Coaches
- **US-HC-01**: Create match offers with location, age group, format (5v5, 7v7, 9v9, 11v11), duration, and multiple time slots
- **US-HC-02**: Generate shareable links for match offers
- **US-HC-03**: View slot statuses (Open, Held, Pending Approval, Booked, Rejected)
- **US-HC-04**: Cancel or close match offers

### For Guest Coaches
- **US-GC-01**: View match offers via shareable link (no login required)
- **US-GC-02**: Select available time slots (temporarily held during booking)
- **US-GC-03**: Enter team and contact details for booking
- **US-GC-04**: Receive notifications if a slot becomes unavailable

### For Approvers
- **US-AP-01**: Receive approval requests via email with direct link
- **US-AP-02**: Approve match bookings (locks all other slots)
- **US-AP-03**: Reject match bookings (slot becomes available again)

### System Features
- **US-SYS-01**: Prevents double booking
- **US-SYS-02**: Automatic slot hold timeout
- **US-SYS-03**: Notifications for status changes

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL)
- **Navigation**: Expo Router (file-based routing)
- **UI**: Custom components with Ionicons

## Project Structure

```
/app
  /(tabs)
    - index.tsx           # Home screen
    - manage.tsx          # My Matches screen (Host view)
  /match
    - create.tsx          # Create match offer form
  /offer
    - [token].tsx         # Guest view of match offer
    /book
      - [slotId].tsx      # Booking form for guests
  /approve
    - [token].tsx         # Approval screen for approvers

/components
  /ui
    - Button.tsx          # Custom button component
    - Card.tsx            # Card component
    - Input.tsx           # Input field component

/lib
  - supabase.ts           # Supabase client configuration
  - shareLink.ts          # Link generation utilities

/types
  - database.ts           # TypeScript types for database models

/supabase
  - schema.sql            # Database schema
```

## Database Schema

### Tables

1. **match_offers** - Match offers created by host coaches
   - Host info (name, club, contact)
   - Match details (age_group, format, duration, location)
   - Share token for public links
   - Status (OPEN, CLOSED, CANCELLED)

2. **slots** - Time slots for each match offer
   - Start/end times
   - Status (OPEN, HELD, PENDING_APPROVAL, BOOKED, REJECTED)
   - Guest team info (when booked)
   - Hold information

3. **approvals** - Approval requests for bookings
   - Approval token for unique links
   - Approver email
   - Status (PENDING, APPROVED, REJECTED)
   - Decision notes

4. **notifications** - System notifications
   - Recipient info and type
   - Notification type and content
   - Sent status

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd MatchSlot
```

2. Install dependencies
```bash
npm install
```

3. Set up Supabase
   - Create a new Supabase project
   - Run the SQL schema from `/supabase/schema.sql`
   - Copy your Supabase URL and Anon Key

4. Configure environment variables
   - Update `/lib/supabase.ts` with your Supabase credentials

5. Start the development server
```bash
npm start
```

6. Run on your device
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator or `a` for Android emulator

## Usage

### Creating a Match Offer (Host)

1. Open the app and tap "Create Match"
2. Enter your details (name, club, contact)
3. Select match details:
   - Age Group (U8, U10, U12, U14, U16, U18, Open)
   - Format (5v5, 7v7, 9v9, 11v11)
   - Duration (60, 70, 80, 90, 100, 120 minutes)
   - Location
4. Add one or more time slots
5. Tap "Create Match Offer"
6. Share the generated link with other coaches

### Booking a Match (Guest)

1. Open the shareable link received from host
2. View match details and available slots
3. Select a time slot
4. Enter your team details:
   - Your name
   - Club name
   - Contact info
   - Optional notes
5. Enter approver's email address
6. Submit booking request

### Approving a Booking (Approver)

1. Open the approval link from email
2. Review match and team details
3. Choose to Approve or Reject
4. Add decision notes (required for rejection)
5. Confirm decision

## Football-Specific Features

This app is exclusively for football (soccer) matches:
- Age groups aligned with youth football divisions
- Match formats (5v5, 7v7, 9v9, 11v11) common in football
- Football icon throughout the UI
- Terminology specific to football clubs and coaches

## Environment Variables

Create a `.env` file (or update `/lib/supabase.ts`) with:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Future Enhancements

- User authentication for host coaches
- Push notifications for real-time updates
- Calendar integration
- Match history and statistics
- In-app messaging between coaches
- Multi-language support
- Automated email notifications
- Slot hold timeout implementation

## License

MIT

## Support

For issues or questions, please contact [your-email@example.com]
