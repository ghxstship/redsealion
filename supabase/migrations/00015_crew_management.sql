-- Sprint A: Crew Management
-- Add serial_number to assets
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS serial_number text;

-- Crew Profiles
CREATE TABLE public.crew_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  skills text[] NOT NULL DEFAULT '{}',
  certifications jsonb NOT NULL DEFAULT '[]',
  hourly_rate numeric,
  day_rate numeric,
  ot_rate numeric,
  per_diem_rate numeric,
  travel_rate numeric,
  availability_default text NOT NULL DEFAULT 'available' CHECK (availability_default IN ('available', 'unavailable', 'tentative')),
  emergency_contact_name text,
  emergency_contact_phone text,
  onboarding_status text NOT NULL DEFAULT 'not_started' CHECK (onboarding_status IN ('not_started', 'in_progress', 'complete')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Crew Availability
CREATE TABLE public.crew_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'unavailable', 'tentative')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Crew Bookings
CREATE TABLE public.crew_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'declined', 'confirmed', 'cancelled')),
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  call_time timestamptz,
  rate_type text NOT NULL DEFAULT 'hourly' CHECK (rate_type IN ('hourly', 'day', 'overtime', 'per_diem', 'travel', 'flat')),
  rate_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_crew_profiles_org ON public.crew_profiles(organization_id);
CREATE INDEX idx_crew_profiles_user ON public.crew_profiles(user_id);
CREATE INDEX idx_crew_availability_user_date ON public.crew_availability(user_id, date);
CREATE INDEX idx_crew_availability_org ON public.crew_availability(organization_id);
CREATE INDEX idx_crew_bookings_org ON public.crew_bookings(organization_id);
CREATE INDEX idx_crew_bookings_user ON public.crew_bookings(user_id);
CREATE INDEX idx_crew_bookings_proposal ON public.crew_bookings(proposal_id);
CREATE INDEX idx_crew_bookings_shift ON public.crew_bookings(shift_start, shift_end);

-- RLS
ALTER TABLE public.crew_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_profiles_org_access" ON public.crew_profiles
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "crew_availability_org_access" ON public.crew_availability
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "crew_bookings_org_access" ON public.crew_bookings
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));
