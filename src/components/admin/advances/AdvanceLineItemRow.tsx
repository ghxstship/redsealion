'use client';

import StatusBadge from '@/components/ui/StatusBadge';
import { FULFILLMENT_STATUS_COLORS, ADVANCE_PRIORITY_COLORS } from './AdvanceStatusBadge';
import { formatCents, formatUnitOfMeasure } from '@/lib/advances/utils';
import type { AdvanceLineItem } from '@/types/database';
import Button from '@/components/ui/Button';

interface AdvanceLineItemRowProps {
  item: AdvanceLineItem;
  showApproval?: boolean;
  onApprove?: (itemId: string) => void;
  onReject?: (itemId: string) => void;
}

export default function AdvanceLineItemRow({ item, showApproval, onApprove, onReject }: AdvanceLineItemRowProps) {
  return (
    <tr className="transition-colors hover:bg-bg-secondary/30">
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">{item.item_name}</p>
          {item.variant_name && <p className="text-[11px] text-text-muted">{item.variant_name}</p>}
          {item.item_code && <p className="text-[11px] text-text-muted">{item.item_code}</p>}
        </div>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-text-secondary">
        {item.quantity} {formatUnitOfMeasure(item.unit_of_measure ?? 'each')}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-text-secondary text-right">
        {item.unit_price_cents !== null ? formatCents(item.unit_price_cents) : '—'}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.fulfillment_status ?? 'pending'} colorMap={FULFILLMENT_STATUS_COLORS} />
      </td>
      {showApproval && (
        <td className="px-4 py-3">
          {item.approval_status === 'pending' && onApprove && onReject ? (
            <div className="flex gap-1">
              <Button onClick={() => onApprove(item.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Approve</Button>
              <span className="text-text-muted">·</span>
              <Button onClick={() => onReject(item.id)} className="text-xs text-red-600 hover:text-red-700 font-medium">Reject</Button>
            </div>
          ) : (
            <StatusBadge status={item.approval_status ?? 'pending'} colorMap={{ pending: 'bg-amber-50 text-amber-700', approved: 'bg-green-50 text-green-700', rejected: 'bg-red-500/10 text-red-700', modified: 'bg-blue-50 text-blue-700' }} />
          )}
        </td>
      )}
      <td className="px-4 py-3 text-sm tabular-nums font-medium text-foreground text-right">
        {item.line_total_cents !== null ? formatCents(item.line_total_cents) : '—'}
      </td>
    </tr>
  );
}
