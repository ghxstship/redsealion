import { createClient } from '@/lib/supabase/server';
import { getInitials } from '@/lib/utils';
import ProfileEditForm from '@/components/portal/ProfileEditForm';
import NotificationToggles from '@/components/portal/NotificationToggles';
import type { Metadata } from 'next';
import FormInput from '@/components/ui/FormInput';

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase.from('organizations').select('name').eq('slug', orgSlug).single();
  return { title: `Account | ${org?.name ?? orgSlug}` };
}

export default async function AccountPage({ params }: PageProps) {
  const { orgSlug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get org info
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, contact_email')
    .eq('slug', orgSlug)
    .single();

  const orgName = org?.name ?? orgSlug
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // If authenticated, try to load client contact profile
  const clientProfile = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    company: '',
    companyAddress: '',
  };

  if (user && org) {
    const { data: contact } = await supabase
      .from('client_contacts')
      .select('first_name, last_name, email, phone, title, client_id')
      .eq('email', user.email ?? '')
      .limit(1)
      .maybeSingle();

    if (contact) {
      clientProfile.firstName = contact.first_name;
      clientProfile.lastName = contact.last_name;
      clientProfile.email = contact.email;
      clientProfile.phone = contact.phone ?? '';
      clientProfile.title = contact.title ?? '';

      const { data: client } = await supabase
        .from('clients')
        .select('company_name, billing_address')
        .eq('id', contact.client_id)
        .single();

      if (client) {
        clientProfile.company = client.company_name;
        const addr = client.billing_address as Record<string, string> | null;
        clientProfile.companyAddress = addr
          ? [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')
          : '';
      }
    } else {
      clientProfile.email = user.email ?? '';
      clientProfile.firstName = (user.user_metadata?.first_name as string) ?? '';
      clientProfile.lastName = (user.user_metadata?.last_name as string) ?? '';
    }
  }

  // Notification preferences
  const notificationDefaults = [
    { id: 'n-1', label: 'Proposal updates', description: 'When a proposal status changes or new content is shared', enabled: true },
    { id: 'n-2', label: 'Milestone completions', description: 'When a milestone gate is completed or requires your action', enabled: true },
    { id: 'n-3', label: 'Invoice reminders', description: 'Payment due date reminders and receipt confirmations', enabled: true },
    { id: 'n-4', label: 'New comments', description: 'When someone replies to a comment thread you are part of', enabled: false },
    { id: 'n-5', label: 'File uploads', description: 'When new files or deliverables are shared with you', enabled: false },
  ];

  let notifications = notificationDefaults;
  if (user && org) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('event_type, enabled')
      .eq('user_id', user.id)
      .eq('organization_id', org.id);

    if (prefs && prefs.length > 0) {
      const prefMap = new Map(prefs.map((p) => [p.event_type, p.enabled]));
      notifications = notificationDefaults.map((n) => ({
        ...n,
        enabled: prefMap.has(n.id) ? prefMap.get(n.id)! : n.enabled,
      }));
    }
  }

  const fullName = [clientProfile.firstName, clientProfile.lastName].filter(Boolean).join(' ') || 'Guest';
  const initials = getInitials(fullName);

  // Resolve org support contact — fall back to org slug-based email
  const supportEmail = (org as Record<string, unknown>)?.contact_email as string | undefined;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Account</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your profile and notification preferences.
        </p>
      </div>

      {/* Profile section */}
      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-5">Profile</h2>

        <div className="flex items-start gap-5">
          <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-700 shrink-0">
            {initials}
          </div>

          <div className="flex-1">
            <ProfileEditForm
              firstName={clientProfile.firstName}
              lastName={clientProfile.lastName}
              email={clientProfile.email}
              phone={clientProfile.phone}
              title={clientProfile.title}
            />
          </div>
        </div>
      </section>

      {/* Company section */}
      {clientProfile.company && (
        <section className="rounded-lg border border-border bg-background p-6">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-5">Company</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Company Name</label>
              <FormInput
                type="text"
                defaultValue={clientProfile.company}
                readOnly
                className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Address</label>
              <FormInput
                type="text"
                defaultValue={clientProfile.companyAddress}
                readOnly
                className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </section>
      )}

      {/* Notification preferences */}
      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-5">
          Notification Preferences
        </h2>

        <NotificationToggles
          notifications={notifications}
          organizationId={org?.id ?? ''}
        />
      </section>

      {/* Contact info */}
      <section className="rounded-lg border border-border bg-background p-6">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">
          Contact {orgName}
        </h2>
        <p className="text-sm text-text-secondary">
          Need help or have questions about your project? Reach out to your project team.
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href={`mailto:${supportEmail || `hello@${orgSlug}.com`}`}
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Email Support
          </a>
        </div>
      </section>
    </div>
  );
}
