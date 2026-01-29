/**
 * Application configuration constants
 */

// Age Groups available for football matches
export const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Open'] as const;

// Match Formats (team sizes)
export const MATCH_FORMATS = ['5v5', '7v7', '9v9', '11v11'] as const;

// Match Durations in minutes
export const MATCH_DURATIONS = [60, 70, 80, 90, 100, 120] as const;

// Slot hold timeout in minutes (US-SYS-02)
export const SLOT_HOLD_TIMEOUT_MINUTES = 15;

// Base URL for shareable links (update with your production domain)
export const BASE_URL = 'https://matchslot.app';

// Notification types
export const NOTIFICATION_TYPES = {
  SLOT_SELECTED: 'SLOT_SELECTED',
  APPROVAL_REQUEST: 'APPROVAL_REQUEST',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  OFFER_CLOSED: 'OFFER_CLOSED',
} as const;

// Slot statuses
export const SLOT_STATUSES = {
  OPEN: 'OPEN',
  HELD: 'HELD',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  BOOKED: 'BOOKED',
  REJECTED: 'REJECTED',
} as const;

// Offer statuses
export const OFFER_STATUSES = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

// Approval statuses
export const APPROVAL_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

// Status colors for UI
export const STATUS_COLORS = {
  OPEN: '#4CAF50',      // Green
  HELD: '#FFA500',      // Orange
  PENDING_APPROVAL: '#FFD700', // Gold
  BOOKED: '#2196F3',    // Blue
  REJECTED: '#F44336',  // Red
} as const;

// Default time for new slots (10:00 AM)
export const DEFAULT_SLOT_START_HOUR = 10;
export const DEFAULT_SLOT_START_MINUTE = 0;
