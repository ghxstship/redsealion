'use client';

import { getContractorPortalPermission } from '@/lib/permissions';
import { usePortalContext } from '../PortalContext';

interface PortalRoleGateProps {
  /** The permission key to check, e.g. 'work_orders.view', 'bookings.respond' */
  permission: string;
  /** Content to render when authorized */
  children: React.ReactNode;
  /** Optional fallback when unauthorized (defaults to null) */
  fallback?: React.ReactNode;
}

/**
 * PortalRoleGate — guards contractor portal features based on the user's
 * portal role (contractor vs crew) and the CONTRACTOR_PORTAL_PERMISSIONS matrix.
 *
 * Usage:
 *   <PortalRoleGate permission="work_orders.bid">
 *     <BidForm />
 *   </PortalRoleGate>
 */
export default function PortalRoleGate({
  permission,
  children,
  fallback = null,
}: PortalRoleGateProps) {
  const { portalType } = usePortalContext();

  // Client portal users should never see contractor content
  if (portalType !== 'contractor') {
    return <>{fallback}</>;
  }

  // For contractor portal, we default to 'contractor' role
  // The actual role (contractor vs crew) would come from the portal context or DB
  const role: 'contractor' | 'crew' = 'contractor';

  if (!getContractorPortalPermission(role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
