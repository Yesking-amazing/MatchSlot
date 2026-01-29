// Database Types for Football Match Booking App

export type AgeGroup = 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | 'Open';

export type MatchFormat = '5v5' | '7v7' | '9v9' | '11v11';

export type OfferStatus = 'PENDING_APPROVAL' | 'OPEN' | 'CLOSED' | 'CANCELLED';

export type SlotStatus = 'OPEN' | 'HELD' | 'PENDING_APPROVAL' | 'BOOKED' | 'REJECTED';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type NotificationType =
  | 'SLOT_SELECTED'
  | 'APPROVAL_REQUEST'
  | 'OFFER_APPROVAL_REQUEST'
  | 'APPROVED'
  | 'REJECTED'
  | 'OFFER_CLOSED';

export type RecipientType = 'HOST' | 'GUEST' | 'APPROVER';

export interface MatchOffer {
  id: string;
  created_at: string;
  updated_at: string;

  // Host Coach Info
  host_name: string;
  host_club?: string;
  host_contact?: string;

  // Match Details
  age_group: AgeGroup;
  format: MatchFormat;
  duration: number; // minutes
  location: string;
  approver_email: string;

  // Offer Status
  status: OfferStatus;

  // Shareable Link
  share_token: string;

  // Additional Info
  notes?: string;
}

export interface Slot {
  id: string;
  match_offer_id: string;

  // Time
  start_time: string;
  end_time: string;

  // Status
  status: SlotStatus;

  // Hold Info
  held_by_session?: string;
  held_at?: string;

  // Guest Team Info
  guest_name?: string;
  guest_club?: string;
  guest_contact?: string;
  guest_notes?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  slot_id: string;
  match_offer_id: string;

  // Approval Token
  approval_token: string;

  // Approver Info
  approver_email: string;

  // Status
  status: ApprovalStatus;
  decision_at?: string;
  decision_notes?: string;

  // Timestamps
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_email?: string;
  recipient_type: RecipientType;
  notification_type: NotificationType;

  // Related Data
  match_offer_id: string;
  slot_id?: string;

  // Content
  subject: string;
  message: string;

  // Status
  sent: boolean;
  sent_at?: string;

  // Timestamps
  created_at: string;
}

// Helper types for creating records
export interface CreateMatchOfferInput {
  host_name: string;
  host_club?: string;
  host_contact?: string;
  age_group: AgeGroup;
  format: MatchFormat;
  duration: number;
  location: string;
  approver_email: string;
  notes?: string;
  share_token: string;
}

export interface CreateSlotInput {
  match_offer_id: string;
  start_time: string;
  end_time: string;
}

export interface UpdateSlotForBookingInput {
  status: 'HELD' | 'PENDING_APPROVAL';
  held_by_session?: string;
  held_at?: string;
  guest_name?: string;
  guest_club?: string;
  guest_contact?: string;
  guest_notes?: string;
}

export interface MatchOfferWithSlots extends MatchOffer {
  slots: Slot[];
}
