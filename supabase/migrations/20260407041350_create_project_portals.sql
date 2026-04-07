-- Extend projects table
alter table "public"."projects"
  add column if not exists "venue_name" text,
  add column if not exists "venue_address" jsonb,
  add column if not exists "venue_phone" text,
  add column if not exists "site_map_url" text,
  add column if not exists "subtitle" text,
  add column if not exists "presenter" text,
  add column if not exists "project_code" text,
  add column if not exists "capacity" integer,
  add column if not exists "doors_time" text,
  add column if not exists "daily_hours" text,
  add column if not exists "general_email" text;

-- Create enum for portal types
create type "public"."portal_type" as enum ('production', 'operations', 'food_beverage', 'talent', 'guest', 'temporary');

-- Create project_portals table
create table "public"."project_portals" (
  "id" uuid not null default extensions.uuid_generate_v4(),
  "project_id" uuid not null references public.projects(id) on delete cascade,
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "portal_type" public.portal_type not null,
  "is_published" boolean not null default false,
  "call_time" text,
  "pre_arrival_checklist" jsonb default '[]'::jsonb,
  "parking_instructions" text,
  "rideshare_instructions" text,
  "transit_instructions" text,
  "check_in_instructions" text,
  "faqs" jsonb default '[]'::jsonb,
  "amenities" jsonb default '{}'::jsonb,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  primary key ("id"),
  unique ("project_id", "portal_type")
);

-- Enable RLS
alter table "public"."project_portals" enable row level security;

-- Set up policies
create policy "Enable read access for all if published"
on "public"."project_portals"
for select
using (is_published = true);

create policy "Users can view portals in their orgs"
on "public"."project_portals"
for select
to authenticated
using (
  exists (
    select 1 from public.organization_memberships om
    where om.organization_id = project_portals.organization_id
    and om.user_id = auth.uid()
  )
);

create policy "Users can modify portals in their orgs"
on "public"."project_portals"
for insert
to authenticated
with check (
  exists (
    select 1 from public.organization_memberships om
    where om.organization_id = project_portals.organization_id
    and om.user_id = auth.uid()
  )
);

create policy "Users can update portals in their orgs"
on "public"."project_portals"
for update
to authenticated
using (
  exists (
    select 1 from public.organization_memberships om
    where om.organization_id = project_portals.organization_id
    and om.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.organization_memberships om
    where om.organization_id = project_portals.organization_id
    and om.user_id = auth.uid()
  )
);

create policy "Users can delete portals in their orgs"
on "public"."project_portals"
for delete
to authenticated
using (
  exists (
    select 1 from public.organization_memberships om
    where om.organization_id = project_portals.organization_id
    and om.user_id = auth.uid()
  )
);


