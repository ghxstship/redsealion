import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import { Star } from 'lucide-react';
import Link from 'next/link';

async function getRecentItems() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { proposals: [], events: [], tasks: [], clients: [] };

    const [proposalRes, eventRes, taskRes, clientRes] = await Promise.all([
      supabase.from('proposals').select('id, name, status, updated_at').eq('organization_id', ctx.organizationId).order('updated_at', { ascending: false }).limit(5),
      supabase.from('events').select('id, name, status, start_date').eq('organization_id', ctx.organizationId).order('updated_at', { ascending: false }).limit(5),
      supabase.from('tasks').select('id, title, status, due_date').eq('organization_id', ctx.organizationId).order('updated_at', { ascending: false }).limit(5),
      supabase.from('clients').select('id, name, status').eq('organization_id', ctx.organizationId).order('updated_at', { ascending: false }).limit(5),
    ]);

    return {
      proposals: (proposalRes.data ?? []) as Array<{ id: string; name: string; status: string; updated_at: string }>,
      events: (eventRes.data ?? []) as Array<{ id: string; name: string; status: string; start_date: string | null }>,
      tasks: (taskRes.data ?? []) as Array<{ id: string; title: string; status: string; due_date: string | null }>,
      clients: (clientRes.data ?? []) as Array<{ id: string; name: string; status: string }>,
    };
  } catch { return { proposals: [], events: [], tasks: [], clients: [] }; }
}

const SECTIONS = [
  { key: 'proposals' as const, label: 'Recent Proposals', href: '/app/proposals', nameField: 'name' as const },
  { key: 'events' as const, label: 'Recent Events', href: '/app/events', nameField: 'name' as const },
  { key: 'tasks' as const, label: 'Recent Tasks', href: '/app/tasks', nameField: 'title' as const },
  { key: 'clients' as const, label: 'Recent Clients', href: '/app/clients', nameField: 'name' as const },
];

export default async function FavoritesPage() {
  const data = await getRecentItems();

  return (
    <div>
      <PageHeader title="Favorites" subtitle="Quick access to your most recently updated items across the platform." />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const items = data[section.key];
          return (
            <div key={section.key} className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="px-5 py-3 bg-bg-secondary border-b border-border flex items-center justify-between">
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{section.label}</h3>
                <Link href={section.href} className="text-xs font-medium text-blue-600 hover:underline">View all</Link>
              </div>
              {items.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Star className="w-6 h-6 text-text-muted mx-auto mb-2" />
                  <p className="text-xs text-text-secondary">No recent {section.key}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {items.map((item: Record<string, unknown>) => (
                    <Link key={item.id as string} href={`${section.href}/${item.id}`} className="block px-5 py-3 hover:bg-bg-secondary/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{item[section.nameField] as string}</p>
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-bg-secondary text-gray-700 capitalize">{(item.status as string)?.replace('_', ' ')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
