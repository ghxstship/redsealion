import { redirect } from 'next/navigation';

/**
 * Settings → Integrations redirect.
 *
 * The canonical integrations management UI lives at /app/integrations.
 * This settings sub-page redirects there to avoid dual navigation.
 */
export default function IntegrationsSettingsPage() {
  redirect('/app/integrations');
}
