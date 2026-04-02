import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';

interface PersonDetail {
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  phone: string | null;
  created_at: string;
}

async function getPerson(id: string): Promise<PersonDetail | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('users')
      .select('full_name, email, role, title, phone, created_at')
      .eq('id', id)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function PersonDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const person = await getPerson(id);

  if (!person) {
    return (
      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Person not found.</p>
      </div>
    );
  }

  const fields = [
    { label: 'Email', value: person.email },
    { label: 'Role', value: person.role.replace(/_/g, ' ') },
    { label: 'Title', value: person.title ?? '-' },
    { label: 'Phone', value: person.phone ?? '-' },
    { label: 'Joined', value: new Date(person.created_at).toLocaleDateString() },
  ];

  return (
    <TierGate feature="people_hr">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {person.full_name}
        </h1>
        <p className="mt-1 text-sm text-text-secondary capitalize">
          {person.title ?? person.role.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white divide-y divide-border">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-text-secondary">{field.label}</span>
            <span className="text-sm font-medium text-foreground capitalize">{field.value}</span>
          </div>
        ))}
      </div>
    </TierGate>
  );
}
