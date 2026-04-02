import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import type { OrganizationRole } from '@/types/database';

const VALID_ROLES: OrganizationRole[] = [
  'org_admin',
  'project_manager',
  'designer',
  'fabricator',
  'installer',
  'client_primary',
  'client_viewer',
];

export async function POST(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role } = body;

  // Validate email
  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 },
    );
  }

  // Validate role
  if (!role || !VALID_ROLES.includes(role as OrganizationRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 },
    );
  }

  // In a full implementation, this would:
  // 1. Check if the user already exists in the org
  // 2. Create an invitation record in an `invitations` table
  // 3. Send an invitation email via a transactional email service
  // For now, return success with the validated data.

  return NextResponse.json({
    success: true,
    invitation: {
      email: email.trim().toLowerCase(),
      role,
      organization_id: perm.organizationId,
      invited_by: perm.userId,
      status: 'pending',
    },
  });
}
