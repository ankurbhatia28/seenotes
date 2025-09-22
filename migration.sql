-- Migration to add tags column to existing todos table
-- Run this in your Supabase SQL editor if you already have data

-- Add tags column if it doesn't exist
ALTER TABLE todos ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Add GIN index for tag filtering if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN (tags);