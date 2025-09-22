-- Migration to add drag and drop ordering support
-- Run this in your Supabase SQL editor

-- Add order_index column to todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_todos_order ON todos(list_id, order_index);

-- Update existing todos with order_index based on created_at
-- This assigns incremental order starting from 1000 for each list
UPDATE todos
SET order_index = (
  SELECT (ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY created_at ASC)) * 1000
  FROM todos t2
  WHERE t2.id = todos.id
)
WHERE order_index = 0;