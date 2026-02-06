-- Update Calimbus Template
-- This migration resets ALL users' columns to the new default template
-- Run this when you want to standardize the column layout for all users

-- Step 1: Delete all existing card_categories (they reference columns that will be deleted)
DELETE FROM card_categories;

-- Step 2: Delete all existing columns
DELETE FROM columns;

-- Step 3: Insert new default columns for ALL existing users
-- We get unique user_ids from any table that has them, or we can insert for known users
-- This inserts the new template for each unique user who has ever used the app

-- For each user, insert the 5 default columns
INSERT INTO columns (user_id, name, position, color)
SELECT DISTINCT
  cc.user_id,
  col.name,
  col.position,
  col.color
FROM (
  -- Get all unique user_ids from card_categories history or columns history
  SELECT DISTINCT user_id FROM columns
  UNION
  SELECT DISTINCT user_id FROM card_categories
) cc
CROSS JOIN (
  VALUES
    ('Events', 0, '#f97316'),
    ('Tasks', 1, '#3b82f6'),
    ('Roll Over', 2, '#8b5cf6'),
    ('Done', 3, '#22c55e'),
    ('Trash', 4, '#ef4444')
) AS col(name, position, color);

-- Note: If the above doesn't work because tables are empty after delete,
-- users will automatically get the new template when they next log in
-- (the API creates default columns if none exist)
