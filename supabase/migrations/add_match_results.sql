-- Migration: Add match result fields to slots table
-- Run this in your Supabase SQL Editor to add the new columns

ALTER TABLE slots ADD COLUMN IF NOT EXISTS home_score INTEGER;
ALTER TABLE slots ADD COLUMN IF NOT EXISTS away_score INTEGER;
ALTER TABLE slots ADD COLUMN IF NOT EXISTS result_notes TEXT;
ALTER TABLE slots ADD COLUMN IF NOT EXISTS result_saved_at TIMESTAMPTZ;
