'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import PageHeader from '@/components/shared/PageHeader';

import EmptyState from '@/components/ui/EmptyState';

interface CrewAvailability {
  id: string;
  full_name: string;
  availability: Record<string, 'available' | 'unavailable' | 'tentative'>;
}

const CELL_COLORS: Record<string, string> = {
  available: 'bg-green-200',
  unavailable: 'bg-red-200',
  tentative: 'bg-yellow-200',
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function CrewAvailabilityPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [crew, setCrew] = useState<CrewAvailability[]>([]);
  const [loaded, setLoaded] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) {
          setLoaded(true);
          return;
        }

        const supabase = createClient();

        // Fetch crew profiles
        const { data: profiles } = await supabase
          .from('crew_profiles')
          .select('id, full_name')
          .eq('organization_id', ctx.organizationId)
          .order('full_name');

        if (!profiles || profiles.length === 0) {
          setCrew([]);
          setLoaded(true);
          return;
        }

        // Fetch availability records for this month
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

        const { data: records } = await supabase
          .from('crew_availability')
          .select('crew_profile_id, date, status')
          .eq('organization_id', ctx.organizationId)
          .gte('date', startDate)
          .lte('date', endDate);

        // Build availability map
        const availByProfile = new Map<string, Record<string, 'available' | 'unavailable' | 'tentative'>>();
        for (const r of records ?? []) {
          const profileId = r.crew_profile_id as string;
          if (!availByProfile.has(profileId)) {
            availByProfile.set(profileId, {});
          }
          const dateKey = r.date as string;
          availByProfile.get(profileId)![dateKey] = (r.status as 'available' | 'unavailable' | 'tentative') ?? 'available';
        }

        setCrew(
          profiles.map((p) => ({
            id: p.id,
            full_name: p.full_name,
            availability: availByProfile.get(p.id) ?? {},
          }))
        );
      } catch {
        setCrew([]);
      } finally {
        setLoaded(true);
      }
    }

    setLoaded(false);
    fetchAvailability();
  }, [year, month, daysInMonth]);

  function goToPrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  return (
    <>
      <PageHeader
        title="Team Availability"
        subtitle="View crew availability across the month."
      />


      {/* Month navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          &larr; Previous
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          {monthName} {year}
        </h2>
        <button
          onClick={goToNextMonth}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Next &rarr;
        </button>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-muted">Loading availability...</p>
        </div>
      ) : crew.length === 0 ? (
        <EmptyState
          message="No crew members found"
          description="Add crew members to track their availability."
        />
      ) : (
        <>
          {/* Calendar grid */}
          <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="sticky left-0 bg-bg-secondary px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted min-w-[150px]">
                    Crew Member
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className="px-1 py-3 text-center text-xs font-medium text-text-muted min-w-[32px]"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {crew.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-bg-secondary/30">
                    <td className="sticky left-0 bg-background px-4 py-2 text-sm font-medium text-foreground border-r border-border">
                      <Link href={`/app/crew/${member.id}`} className="hover:underline">
                        {member.full_name}
                      </Link>
                    </td>
                    {days.map((d) => {
                      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      const status = member.availability[dateKey] ?? 'available';
                      return (
                        <td key={d} className="px-1 py-2">
                          <div
                            className={`mx-auto h-5 w-5 rounded ${CELL_COLORS[status]}`}
                            title={`${member.full_name} - ${dateKey}: ${status}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-green-200" />
              Available
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-red-200" />
              Unavailable
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-yellow-200" />
              Tentative
            </div>
          </div>
        </>
      )}
    </>
  );
}
