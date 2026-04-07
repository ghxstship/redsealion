'use client';

import StatusBadge from '@/components/ui/StatusBadge';
import { FULFILLMENT_STATUS_COLORS } from './AdvanceStatusBadge';

interface FulfillmentStatusBadgeProps {
  status: string;
  className?: string;
}

export default function FulfillmentStatusBadge({ status, className }: FulfillmentStatusBadgeProps) {
  return <StatusBadge status={status} colorMap={FULFILLMENT_STATUS_COLORS} className={className} />;
}
