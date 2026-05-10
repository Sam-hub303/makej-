-- Shift offer workflow: add type + metadata to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- type: 'text' (default) | 'shift_offer'
-- metadata for shift_offer: { role, date, time, pay, location }
