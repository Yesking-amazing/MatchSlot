-- Add created_by column to link match offers to authenticated users
-- This enables cross-device sync: users see their matches on any device they log into

ALTER TABLE match_offers ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Index for fast lookup of a user's matches
CREATE INDEX idx_match_offers_created_by ON match_offers(created_by);

-- Allow delete for match offers (was missing from original schema)
CREATE POLICY "Public Delete Match Offers" ON match_offers FOR DELETE USING (true);
