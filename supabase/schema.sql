-- Create tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Match Offers Table (Host Coach creates these - US-HC-01)
CREATE TABLE match_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Host Coach Info
    host_name TEXT NOT NULL,
    host_club TEXT,
    host_contact TEXT,
    
    -- Match Details (US-HC-01)
    age_group TEXT NOT NULL, -- 'U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'Open'
    format TEXT NOT NULL, -- '5v5', '7v7', '9v9', '11v11'
    duration INTEGER NOT NULL, -- Duration in minutes (e.g., 60, 90, 120)
    location TEXT NOT NULL,
    approver_email TEXT NOT NULL,
    
    -- Offer Status
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'CANCELLED'
    
    -- Shareable Link (US-HC-02)
    share_token TEXT UNIQUE NOT NULL, -- Unique token for shareable link
    
    -- Additional Info
    notes TEXT
);

-- Slots Table (Multiple time options per match offer - US-HC-01)
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_offer_id UUID REFERENCES match_offers(id) ON DELETE CASCADE,
    
    -- Time
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Status (US-HC-03, US-SYS-01, US-SYS-02)
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'HELD', 'PENDING_APPROVAL', 'BOOKED', 'REJECTED'
    
    -- Hold Info (US-GC-02, US-SYS-02)
    held_by_session TEXT, -- Session ID for temporary hold
    held_at TIMESTAMPTZ, -- When the hold was placed
    
    -- Guest Team Info (US-GC-03)
    guest_name TEXT,
    guest_club TEXT,
    guest_contact TEXT,
    guest_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approvals Table (US-AP-01, US-AP-02, US-AP-03)
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
    match_offer_id UUID REFERENCES match_offers(id) ON DELETE CASCADE,
    
    -- Approval Token (US-AP-01)
    approval_token TEXT UNIQUE NOT NULL,
    
    -- Approver Info
    approver_email TEXT NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    decision_at TIMESTAMPTZ,
    decision_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table (US-SYS-03)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT,
    recipient_type TEXT NOT NULL, -- 'HOST', 'GUEST', 'APPROVER'
    notification_type TEXT NOT NULL, -- 'SLOT_SELECTED', 'APPROVAL_REQUEST', 'APPROVED', 'REJECTED', 'OFFER_CLOSED'
    
    -- Related Data
    match_offer_id UUID REFERENCES match_offers(id) ON DELETE CASCADE,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    
    -- Content
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Status
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_match_offers_share_token ON match_offers(share_token);
CREATE INDEX idx_match_offers_status ON match_offers(status);
CREATE INDEX idx_slots_match_offer_id ON slots(match_offer_id);
CREATE INDEX idx_slots_status ON slots(status);
CREATE INDEX idx_approvals_token ON approvals(approval_token);
CREATE INDEX idx_approvals_slot_id ON approvals(slot_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_match_offers_updated_at BEFORE UPDATE ON match_offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Simplified for MVP - no authentication required)
-- This allows the app to work without user login

ALTER TABLE match_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Match Offers Policies
CREATE POLICY "Public Read Match Offers" ON match_offers FOR SELECT USING (true);
CREATE POLICY "Public Insert Match Offers" ON match_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Match Offers" ON match_offers FOR UPDATE USING (true);

-- Slots Policies
CREATE POLICY "Public Read Slots" ON slots FOR SELECT USING (true);
CREATE POLICY "Public Insert Slots" ON slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Slots" ON slots FOR UPDATE USING (true);

-- Approvals Policies
CREATE POLICY "Public Read Approvals" ON approvals FOR SELECT USING (true);
CREATE POLICY "Public Insert Approvals" ON approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Approvals" ON approvals FOR UPDATE USING (true);

-- Notifications Policies
CREATE POLICY "Public Read Notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public Insert Notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Notifications" ON notifications FOR UPDATE USING (true);
