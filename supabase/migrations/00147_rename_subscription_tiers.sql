-- Migration: Rename subscription tiers
-- free → access, starter → core
-- Portal+Free unified into "Access" (free for life)
-- Starter renamed to "Core"

-- Step 1: Add new enum values
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'access';
ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'core';

COMMIT;

-- Step 2: Update existing organization rows
UPDATE organizations SET subscription_tier = 'access' WHERE subscription_tier = 'free';
UPDATE organizations SET subscription_tier = 'core'   WHERE subscription_tier = 'starter';

-- Step 3: Update subscription_plans table
UPDATE subscription_plans SET name = 'Access' WHERE name = 'Free';
UPDATE subscription_plans SET name = 'Core'   WHERE name = 'Starter';
