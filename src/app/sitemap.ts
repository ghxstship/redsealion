import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/server';

const BASE_URL = 'https://flytedeck.io';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/features`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/use-cases/brand-activations`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/live-events`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/trade-shows`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/pop-up-experiences`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/corporate-events`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/immersive-experiences`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/concerts-festivals`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/film-tv-broadcast`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/use-cases/theatrical-productions`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/compare/spreadsheets`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/compare/project-management-tools`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/compare/productive-io`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/compare/monday`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/compare/asana`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/compare/clickup`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/use-cases`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/compare`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/login`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/signup`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic: Published portal pages
  let portalPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createServiceClient();
    const { data: portals } = await supabase
      .from('project_portals')
      .select(`
        portal_type,
        updated_at,
        projects!inner(slug),
        organizations!inner(slug)
      `)
      .eq('is_published', true)
      .limit(500);

    if (portals) {
      portalPages = portals
        .filter((p) => {
          const org = (p.organizations as unknown) as { slug: string } | null;
          const proj = (p.projects as unknown) as { slug: string } | null;
          return org?.slug && proj?.slug;
        })
        .map((portal) => {
          const proj = (portal.projects as unknown) as { slug: string };
          return {
            // GAP-PTL-14: Use the V1 API endpoint which actually exists
            url: `${BASE_URL}/api/v1/portals/${proj.slug}/${portal.portal_type}`,
            lastModified: portal.updated_at ? new Date(portal.updated_at) : undefined,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          };
        });
    }
  } catch {
    // Silently fall back to static-only sitemap if DB is unavailable
  }

  return [...staticPages, ...portalPages];
}
