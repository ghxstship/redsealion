-- Allow standalone equipment (assets) without a proposal
-- This enables the Equipment page's "Add Equipment" workflow
ALTER TABLE assets ALTER COLUMN proposal_id DROP NOT NULL;

-- Add serial_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'serial_number'
  ) THEN
    ALTER TABLE assets ADD COLUMN serial_number TEXT;
  END IF;
END $$;
