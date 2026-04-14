import { useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { FULFILLMENT_STATUS_COLORS, ADVANCE_PRIORITY_COLORS } from './AdvanceStatusBadge';
import { formatCents, formatUnitOfMeasure } from '@/lib/advances/utils';
import type { AdvanceLineItem } from '@/types/database';
import Button from '@/components/ui/Button';
import { ChevronDown, ChevronRight, Zap } from 'lucide-react';
import { InterchangeSuggestionCard } from './InterchangeSuggestionCard';
import { SupersessionResolver } from './SupersessionResolver';
import { CatalogItemSpecCard } from './CatalogItemSpecCard';

interface AdvanceLineItemRowProps {
  item: AdvanceLineItem;
  showApproval?: boolean;
  onApprove?: (itemId: string) => void;
  onReject?: (itemId: string) => void;
}

export default function AdvanceLineItemRow({ item, showApproval, onApprove, onReject }: AdvanceLineItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInterchange, setShowInterchange] = useState(false);

  return (
    <>
      <tr className="transition-colors hover:bg-bg-secondary/30">
        <td className="px-4 py-3">
          <div className="flex gap-3 items-start">
            {item.catalog_item_id && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="mt-0.5 text-text-muted hover:text-foreground">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {item.item_name}
                {item.catalog_item_id && (
                   <button onClick={() => {setIsExpanded(true); setShowInterchange(true);}} className="ml-2 text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5">
                     <Zap size={10} /> Suggest Alternatives
                   </button>
                )}
              </p>
              {item.variant_name && <p className="text-[11px] text-text-muted">{item.variant_name}</p>}
              {item.item_code && <p className="text-[11px] text-text-muted">{item.item_code}</p>}
            </div>
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
      {isExpanded && item.catalog_item_id && (
        <tr className="bg-bg-secondary/10">
          <td colSpan={showApproval ? 6 : 5} className="px-8 py-4 border-b border-border/50">
            <div className="max-w-3xl">
              <SupersessionResolver itemId={item.catalog_item_id} onSelectLatest={(newItem) => console.log('Swap to', newItem)} />
              
              {/* Note: In a complete implementation, this would fetch the full CatalogItemFull from the backend, because AdvanceLineItem does not inherently have all specifications. For now we pass the subset. */}
              <div className="mt-4">
                <CatalogItemSpecCard item={{ ...item, id: item.catalog_item_id } as { specifications?: Record<string, string>; vendor_availability?: string[]; msrp_usd?: number; rental_rate_daily?: number; product_type?: string; id?: string }} />
              </div>

              {showInterchange && (
                <div className="mt-4">
                  <InterchangeSuggestionCard itemId={item.catalog_item_id} onSwap={(alt) => {
                     console.log('Swap alternative', alt);
                     setShowInterchange(false);
                  }} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
