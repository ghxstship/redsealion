import { createClient } from '@/lib/supabase/server';
import { getInitials } from '@/lib/utils';

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function AccountPage({ params }: PageProps) {
  const { orgSlug } = await params;

  const supabase = await createClient();

  // Try to get current user (portal users may or may not be authenticated)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get org info
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  const orgName = org?.name ?? orgSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
    // Look up user as a client contact
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

      // Get client company info
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
      // Fallback: use auth user metadata
      clientProfile.email = user.email ?? '';
      clientProfile.firstName = (user.user_metadata?.first_name as string) ?? '';
      clientProfile.lastName = (user.user_metadata?.last_name as string) ?? '';
    }
  }

  // Fetch notification preferences
  const notificationDefaults = [
    { id: 'n-1', label: 'Proposal updates', description: 'When a proposal status changes or new content is shared', enabled: true },
    { id: 'n-2', label: 'Milestone completions', description: 'When a milestone gate is completed or requires your action', enabled: true },
    { id: 'n-3', label: 'Invoice reminders', description: 'Payment due date reminders and receipt confirmations', enabled: true },
    { id: 'n-4', label: 'New comments', description: 'When someone replies to a comment thread you are part of', enabled: false },
    { id: 'n-5', label: 'File uploads', description: 'When new files or deliverables are shared with you', enabled: false },
  ];

  // If user is authenticated, load saved preferences
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

          <div className="flex-1 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={fullName}
                readOnly
                className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Email</label>
              <input
                type="email"
                defaultValue={clientProfile.email}
                readOnly
                className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Phone</label>
              <input
                type="tel"
                defaultValue={clientProfile.phone}
                readOnly
                className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Title</label>
              <input
                type="text"
                defaultValue={clientProfile.title}
                readOnly
                className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
              />
            </div>
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
              <input
                type="text"
                defaultValue={clientProfile.company}
                readOnly
                className="w-full rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Address</label>
              <input
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

        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="flex items-center justify-between gap-4 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{notif.label}</p>
                <p className="text-xs text-text-muted">{notif.description}</p>
              </div>
              {/* Toggle */}
              <button
                type="button"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  notif.enabled ? 'bg-green-500' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={notif.enabled}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                    notif.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
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
            href="mailto:support@example.com"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Email Support
          </a>
          <a
            href="tel:+15035550100"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
          >
            Call Us
          </a>
        </div>
      </section>
    </div>
  );
}
