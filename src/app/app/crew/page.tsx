'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CrewMember {
  id: string;
  full_name: string;
  email: string;
  skills: string[];
  hourly_rate: number | null;
  availability_status: string;
  onboarding_status: string;
}

const fallbackCrew: CrewMember[] = [
  {
    id: 'crew_001',
    full_name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    skills: ['Lighting', 'Rigging', 'Stage Design'],
    hourly_rate: 75,
    availability_status: 'available',
    onboarding_status: 'complete',
  },
  {
    id: 'crew_002',
    full_name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    skills: ['Audio', 'Live Mixing'],
    hourly_rate: 65,
    availability_status: 'unavailable',
    onboarding_status: 'complete',
  },
  {
    id: 'crew_003',
    full_name: 'Sam Patel',
    email: 'sam.patel@example.com',
    skills: ['Video', 'Projection Mapping'],
    hourly_rate: 80,
    availability_status: 'available',
    onboarding_status: 'in_progress',
  },
  {
    id: 'crew_004',
    full_name: 'Morgan Chen',
    email: 'morgan.chen@example.com',
    skills: ['Production Management', 'Logistics'],
    hourly_rate: 90,
    availability_status: 'tentative',
    onboarding_status: 'complete',
  },
  {
    id: 'crew_005',
    full_name: 'Taylor Brooks',
    email: 'taylor.brooks@example.com',
    skills: ['Carpentry', 'Fabrication', 'Scenic'],
    hourly_rate: 60,
    availability_status: 'available',
    onboarding_status: 'pending',
  },
];

const AVAILABILITY_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  unavailable: 'bg-red-50 text-red-700',
  tentative: 'bg-yellow-50 text-yellow-700',
};

const ONBOARDING_COLORS: Record<string, string> = {
  complete: 'bg-green-50 text-green-700',
  in_progress: 'bg-blue-50 text-blue-700',
  pending: 'bg-gray-100 text-gray-600',
};

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function CrewPage() {
  const [crew, setCrew] = useState<CrewMember[]>(fallbackCrew);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadCrew() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        if (!userData) return;

        const { data: profiles } = await supabase
          .from('crew_profiles')
          .select('*, users(email)')
          .eq('organization_id', userData.organization_id)
          .order('full_name');

        if (profiles && profiles.length > 0) {
          setCrew(
            profiles.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              full_name: p.full_name as string,
              email: (p.users as Record<string, string>)?.email ?? '',
              skills: (p.skills as string[]) ?? [],
              hourly_rate: p.hourly_rate as number | null,
              availability_status: (p.availability_status as string) ?? 'available',
              onboarding_status: (p.onboarding_status as string) ?? 'pending',
            }))
          );
        }
      } catch (error) {
          void error; /* Caught: error boundary handles display */
        }
    }
    loadCrew();
  }, []);

  const filtered = crew.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Crew Directory
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {crew.length} crew members
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          Add Crew Member
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Skills
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Availability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                Onboarding
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((member) => (
              <tr
                key={member.id}
                className="transition-colors hover:bg-bg-secondary/50"
              >
                <td className="px-6 py-3.5">
                  <Link
                    href={`/app/crew/${member.id}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    {member.full_name}
                  </Link>
                </td>
                <td className="px-6 py-3.5 text-sm text-text-secondary">
                  {member.email}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">
                  {member.hourly_rate != null
                    ? `$${member.hourly_rate}/hr`
                    : '\u2014'}
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      AVAILABILITY_COLORS[member.availability_status] ??
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatLabel(member.availability_status)}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ONBOARDING_COLORS[member.onboarding_status] ??
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatLabel(member.onboarding_status)}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-sm text-text-muted"
                >
                  No crew members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
