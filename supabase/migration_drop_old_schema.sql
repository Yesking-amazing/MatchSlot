-- Migration Script: Drop Old Schema
-- Run this FIRST before running schema.sql

-- WARNING: This will delete all existing data!
-- Make sure to backup your data if needed before running this.

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS matches CASCADE;

-- Drop any other old tables that might exist
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS match_offers CASCADE;

-- Drop any old functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now you can run the main schema.sql file to create the new tables
