-- Sprint C: E-Signatures + Notifications

CREATE TABLE public.esignature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  document_type text NOT NULL,
  document_title text NOT NULL,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'signed', 'declined', 'expired')),
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  signature_data text,
  ip_address text,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_type, channel)
);

CREATE INDEX idx_esignature_requests_org ON public.esignature_requests(organization_id);
CREATE INDEX idx_esignature_requests_token ON public.esignature_requests(token);
CREATE INDEX idx_esignature_requests_proposal ON public.esignature_requests(proposal_id);
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_org ON public.notification_preferences(organization_id);

ALTER TABLE public.esignature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "esignature_requests_org_access" ON public.esignature_requests
  FOR ALL USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "notification_preferences_user_access" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());
