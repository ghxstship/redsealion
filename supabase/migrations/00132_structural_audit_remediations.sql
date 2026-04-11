-- Migration 00132: Structural Audit Remediations

-- Gap #32: Soft-delete for production schedules
ALTER TABLE "public"."production_schedules" 
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster querying of non-deleted schedules
CREATE INDEX IF NOT EXISTS "idx_production_schedules_deleted_at" ON "public"."production_schedules" ("deleted_at");

-- Update RLS policies to respect soft-deletes
DROP POLICY IF EXISTS "Enable read access for organization users" ON "public"."production_schedules";
CREATE POLICY "Enable read access for organization users" ON "public"."production_schedules"
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- Gap #33: Status lifecycle for resource allocations
ALTER TABLE "public"."resource_allocations" 
ADD COLUMN IF NOT EXISTS "status" VARCHAR DEFAULT 'confirmed';

-- Constraint to pseudo-enum
ALTER TABLE "public"."resource_allocations"
ADD CONSTRAINT "resource_allocations_status_check" CHECK (status IN ('draft', 'confirmed', 'cancelled'));

-- Gap #1: Schedule status enum
-- Convert existing valid statuses, and provide a lookup or type if desired
-- We'll just enforce the constraint for now without dropping the whole column
ALTER TABLE "public"."production_schedules"
DROP CONSTRAINT IF EXISTS "production_schedules_status_check";

ALTER TABLE "public"."production_schedules"
ADD CONSTRAINT "production_schedules_status_check" CHECK (status IN ('draft', 'published', 'active', 'live', 'completed', 'cancelled'));

-- Gap #18: Schedule type enum
ALTER TABLE "public"."production_schedules"
DROP CONSTRAINT IF EXISTS "production_schedules_type_check";

ALTER TABLE "public"."production_schedules"
ADD CONSTRAINT "production_schedules_type_check" CHECK (schedule_type IN ('build_strike', 'run_of_show', 'rehearsal', 'general'));
