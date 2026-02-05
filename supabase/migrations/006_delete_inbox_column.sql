-- Delete the Inbox column since it's no longer needed
-- Items now auto-segregate into Events and Tasks columns

-- First, reassign any card_categories that reference the Inbox column
-- to the first available column (by position)
UPDATE card_categories
SET column_id = (
  SELECT c.id FROM columns c
  WHERE c.user_id = card_categories.user_id
    AND LOWER(c.name) != 'inbox'
  ORDER BY c.position
  LIMIT 1
)
WHERE column_id IN (
  SELECT id FROM columns WHERE LOWER(name) = 'inbox'
);

-- Delete the Inbox column
DELETE FROM columns WHERE LOWER(name) = 'inbox';
