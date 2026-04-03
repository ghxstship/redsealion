-- ============================================================
-- BEDROCK M-004: ENUM Type Creation & Column Conversion
-- Risk: MODERATE — ALTER TYPE on existing columns
-- Rollback: ALTER COLUMN TYPE TEXT for each, DROP TYPE
-- ============================================================

-- 1. Create all missing ENUM types
DO $$ BEGIN CREATE TYPE task_status AS ENUM ('todo','in_progress','review','done','blocked','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE expense_status AS ENUM ('pending','approved','rejected','reimbursed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE po_status AS ENUM ('draft','sent','acknowledged','received','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE timesheet_status AS ENUM ('draft','submitted','approved','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE time_off_status AS ENUM ('pending','approved','rejected','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE change_order_status AS ENUM ('draft','submitted','approved','rejected','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE integration_status AS ENUM ('disconnected','connecting','connected','error','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE availability_status AS ENUM ('available','unavailable','tentative'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('offered','accepted','declined','confirmed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE crew_rate_type AS ENUM ('hourly','day','overtime','per_diem','travel','flat'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE reservation_status AS ENUM ('reserved','checked_out','returned','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maintenance_type AS ENUM ('repair','inspection','cleaning','calibration'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE maintenance_status AS ENUM ('scheduled','in_progress','complete','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE esign_status AS ENUM ('pending','viewed','signed','declined','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','converted','lost'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_link_status AS ENUM ('active','paid','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE onboarding_doc_type AS ENUM ('w9','nda','i9','direct_deposit','emergency_contact','other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE onboarding_doc_status AS ENUM ('pending','uploaded','verified','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE transfer_status AS ENUM ('pending','in_transit','received','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE custom_field_type AS ENUM ('text','textarea','number','currency','date','datetime','boolean','select','multi_select','url','email','phone','file','user','relation'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Convert TEXT columns to ENUM types
-- Each conversion: drop CHECK if exists, then ALTER TYPE

-- tasks.status
DO $$ BEGIN
  ALTER TABLE public.tasks ALTER COLUMN status TYPE task_status USING status::task_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- tasks.priority
DO $$ BEGIN
  ALTER TABLE public.tasks ALTER COLUMN priority TYPE task_priority USING priority::task_priority;
EXCEPTION WHEN others THEN NULL; END $$;

-- expenses.status
DO $$ BEGIN
  ALTER TABLE public.expenses ALTER COLUMN status TYPE expense_status USING status::expense_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- purchase_orders.status
DO $$ BEGIN
  ALTER TABLE public.purchase_orders ALTER COLUMN status TYPE po_status USING status::po_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- timesheets.status
DO $$ BEGIN
  ALTER TABLE public.timesheets ALTER COLUMN status TYPE timesheet_status USING status::timesheet_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- time_off_requests.status (drop CHECK first)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.time_off_requests DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'time_off_requests'
      AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.time_off_requests ALTER COLUMN status TYPE time_off_status USING status::time_off_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- change_orders.status
DO $$ BEGIN
  ALTER TABLE public.change_orders ALTER COLUMN status TYPE change_order_status USING status::change_order_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- integrations.status
DO $$ BEGIN
  ALTER TABLE public.integrations ALTER COLUMN status TYPE integration_status USING status::integration_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- crew_availability.status (drop CHECK first)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.crew_availability DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'crew_availability' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.crew_availability ALTER COLUMN status TYPE availability_status USING status::availability_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- crew_bookings.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.crew_bookings DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'crew_bookings' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.crew_bookings ALTER COLUMN status TYPE booking_status USING status::booking_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- crew_bookings.rate_type (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.crew_bookings DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'crew_bookings' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%rate_type%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.crew_bookings ALTER COLUMN rate_type TYPE crew_rate_type USING rate_type::crew_rate_type;
EXCEPTION WHEN others THEN NULL; END $$;

-- equipment_reservations.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.equipment_reservations DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'equipment_reservations' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.equipment_reservations ALTER COLUMN status TYPE reservation_status USING status::reservation_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- maintenance_records.type (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.maintenance_records DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'maintenance_records' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%type%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.maintenance_records ALTER COLUMN type TYPE maintenance_type USING type::maintenance_type;
EXCEPTION WHEN others THEN NULL; END $$;

-- maintenance_records.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.maintenance_records DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'maintenance_records' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.maintenance_records ALTER COLUMN status TYPE maintenance_status USING status::maintenance_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- esignature_requests.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.esignature_requests DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'esignature_requests' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.esignature_requests ALTER COLUMN status TYPE esign_status USING status::esign_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- leads.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.leads DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'leads' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.leads ALTER COLUMN status TYPE lead_status USING status::lead_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- payment_links.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.payment_links DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'payment_links' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.payment_links ALTER COLUMN status TYPE payment_link_status USING status::payment_link_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- onboarding_documents.type (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.onboarding_documents DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'onboarding_documents' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%type%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.onboarding_documents ALTER COLUMN type TYPE onboarding_doc_type USING type::onboarding_doc_type;
EXCEPTION WHEN others THEN NULL; END $$;

-- onboarding_documents.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.onboarding_documents DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'onboarding_documents' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.onboarding_documents ALTER COLUMN status TYPE onboarding_doc_status USING status::onboarding_doc_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- warehouse_transfers.status (drop CHECK)
DO $$ BEGIN
  EXECUTE (
    SELECT format('ALTER TABLE public.warehouse_transfers DROP CONSTRAINT %I', con.conname)
    FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'warehouse_transfers' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LIMIT 1
  );
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.warehouse_transfers ALTER COLUMN status TYPE transfer_status USING status::transfer_status;
EXCEPTION WHEN others THEN NULL; END $$;

-- esignature_requests.ip_address: TEXT → INET
DO $$ BEGIN
  ALTER TABLE public.esignature_requests ALTER COLUMN ip_address TYPE INET USING ip_address::INET;
EXCEPTION WHEN others THEN NULL; END $$;
