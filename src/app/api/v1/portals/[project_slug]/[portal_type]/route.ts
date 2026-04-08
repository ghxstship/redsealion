import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('portals-api');

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ project_slug: string; portal_type: string }> }
) {
  try {
    const { project_slug, portal_type } = await context.params;

    // Use the service client. Since this is a public endpoint, we could use the anon client, 
    // but the service client guarantees we can fetch the project regardless of its RLS, 
    // and then we filter the portal by is_published.
    const supabase = await createServiceClient();

    // Fetch the project by slug or project_code
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, subtitle, presenter, project_code, starts_at, ends_at, venue_name, venue_address, site_map_url, capacity, doors_time, daily_hours, general_email')
      .or(`slug.eq.${project_slug},project_code.eq.${project_slug}`)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch the specific portal
    const { data: portal, error: portalError } = await supabase
      .from('project_portals')
      .select('*')
      .eq('project_id', project.id)
      .eq('portal_type', portal_type)
      .eq('is_published', true)
      .single();

    if (portalError || !portal) {
      return NextResponse.json({ error: 'Portal not found or unavailable' }, { status: 404 });
    }

    // Compile payload
    const payload = {
      project: {
        title: project.name,
        subtitle: project.subtitle,
        presenter: project.presenter,
        project_code: project.project_code,
        date: project.starts_at,
        venue: {
          name: project.venue_name,
          address: project.venue_address,
          site_map_url: project.site_map_url,
          capacity: project.capacity,
        },
        timings: {
          doors_time: project.doors_time,
          daily_hours: project.daily_hours,
        },
        contact: {
          general_email: project.general_email,
        }
      },
      portal: {
        type: portal.portal_type,
        call_time: portal.call_time,
        pre_arrival_checklist: portal.pre_arrival_checklist,
        wayfinding: {
          parking_instructions: portal.parking_instructions,
          rideshare_instructions: portal.rideshare_instructions,
          transit_instructions: portal.transit_instructions,
          check_in_instructions: portal.check_in_instructions,
        },
        faqs: portal.faqs,
        amenities: portal.amenities,
      }
    };

    return NextResponse.json(payload);
  } catch (error) {
    log.error('Error fetching portal', { project_slug: (await context.params).project_slug }, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
