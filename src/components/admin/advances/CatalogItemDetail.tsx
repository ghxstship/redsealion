'use client';

import { useState, useMemo, useCallback } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormLabel from '@/components/ui/FormLabel';
import type { AdvanceCatalogVariant, AdvanceModifierList, AdvanceModifierOption } from '@/types/database';
import type { CatalogItemFull } from './CatalogBrowse';
import type { CartItem, CartModifierSelection } from '@/lib/advances/types';
import { formatCents, calculateModifierTotal, calculateLineTotal } from '@/lib/advances/utils';

interface CatalogItemDetailProps {
  item: CatalogItemFull;
  onAddToCart: (cartItem: CartItem) => void;
  onClose: () => void;
}

export default function CatalogItemDetail({ item, onAddToCart, onClose }: CatalogItemDetailProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    item.variants[0]?.id ?? ''
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [modifierSelections, setModifierSelections] = useState<Record<string, string>>({});

  const selectedVariant = item.variants.find((v) => v.id === selectedVariantId) ?? item.variants[0];
  const unitPrice = selectedVariant?.price_cents ?? item.base_price_cents ?? null;

  // Build modifier selections
  const cartModifiers = useMemo<CartModifierSelection[]>(() => {
    const result: CartModifierSelection[] = [];
    for (const ml of item.modifier_lists) {
      const selectedOptId = modifierSelections[ml.id];
      if (!selectedOptId) continue;
      const opt = ml.options.find((o: AdvanceModifierOption) => o.id === selectedOptId);
      if (!opt || (opt.price_adjustment_cents ?? 0) === 0) continue;
      result.push({
        list_id: ml.id,
        list_name: ml.name,
        option_id: opt.id,
        option_name: opt.name,
        pre_modifier: null,
        price_adjustment_cents: opt.price_adjustment_cents ?? 0,
        quantity: 1,
      });
    }
    return result;
  }, [item.modifier_lists, modifierSelections]);

  const modifierTotal = useMemo(() => calculateModifierTotal(cartModifiers), [cartModifiers]);
  const lineTotal = useMemo(
    () => calculateLineTotal(unitPrice ?? null, quantity, modifierTotal),
    [unitPrice, quantity, modifierTotal]
  );

  const handleAdd = useCallback(() => {
    const cartItem: CartItem = {
      cartId: crypto.randomUUID(),
      catalogItemId: item.id,
      catalogVariantId: selectedVariant?.id ?? null,
      itemName: item.name,
      itemCode: item.item_code,
      variantName: selectedVariant?.name ?? null,
      variantSku: selectedVariant?.sku ?? null,
      itemDescription: item.description,
      specificationsSnapshot: {},
      quantity,
      unitOfMeasure: (item.default_unit_of_measure ?? 'each') as CartItem['unitOfMeasure'],
      makeModel: null,
      selectedModifiers: cartModifiers,
      serviceStartDate: null,
      serviceEndDate: null,
      loadInDate: null,
      strikeDate: null,
      purpose: null,
      specialConsiderations: null,
      notes: notes || null,
      specialRequest: null,
      unitPriceCents: unitPrice ?? null,
      modifierTotalCents: modifierTotal,
      lineTotalCents: lineTotal,
      isAdHoc: false,
    };
    onAddToCart(cartItem);
  }, [item, selectedVariant, quantity, notes, cartModifiers, unitPrice, modifierTotal, lineTotal, onAddToCart]);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-bg-secondary/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{item.name}</h2>
            {item.item_code && (
              <p className="text-xs text-text-muted font-mono mt-0.5">{item.item_code}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
        {item.description && (
          <p className="text-sm text-text-secondary mt-2">{item.description}</p>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Variant Selector */}
        {item.variants.length > 1 && (
          <div>
            <FormLabel>Variant</FormLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
              {item.variants
                .filter((v) => v.is_active !== false)
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                .map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`rounded-lg border p-2.5 text-left transition-all ${
                      selectedVariantId === v.id
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-border hover:border-brand-300 hover:bg-bg-secondary'
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{v.name}</p>
                    <p className="text-xs tabular-nums text-brand-600 mt-0.5">
                      {formatCents(v.price_cents ?? 0)}
                    </p>
                    {v.sku && (
                      <p className="text-[10px] text-text-muted font-mono mt-0.5">{v.sku}</p>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Modifier Pickers */}
        {item.modifier_lists.length > 0 && (
          <div className="space-y-3">
            <FormLabel>Options & Add-Ons</FormLabel>
            {item.modifier_lists
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((ml) => (
                <div key={ml.id}>
                  <label className="block text-xs font-medium text-text-secondary mb-1">{ml.name}</label>
                  <FormSelect
                    value={modifierSelections[ml.id] ?? ''}
                    onChange={(e) =>
                      setModifierSelections((prev) => ({ ...prev, [ml.id]: e.target.value }))
                    }
                  >
                    <option value="">— None —</option>
                    {ml.options
                      .filter((o: AdvanceModifierOption) => o.is_active !== false)
                      .sort((a: AdvanceModifierOption, b: AdvanceModifierOption) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                      .map((o: AdvanceModifierOption) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                          {(o.price_adjustment_cents ?? 0) > 0 ? ` (+${formatCents(o.price_adjustment_cents ?? 0)})` : ''}
                        </option>
                      ))}
                  </FormSelect>
                </div>
              ))}
          </div>
        )}

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Quantity</FormLabel>
            <FormInput
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div>
            <FormLabel>Unit</FormLabel>
            <p className="text-sm text-text-secondary mt-2 capitalize">{item.default_unit_of_measure ?? 'each'}</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <FormLabel>Notes (optional)</FormLabel>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special instructions, preferences..."
            rows={2}
          />
        </div>

        {/* Price breakdown */}
        <div className="rounded-lg bg-bg-secondary p-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Unit Price</span>
            <span className="tabular-nums">{formatCents(unitPrice ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Qty</span>
            <span className="tabular-nums">× {quantity}</span>
          </div>
          {modifierTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Modifiers</span>
              <span className="tabular-nums text-amber-600">+{formatCents(modifierTotal)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-border">
            <span className="text-foreground">Line Total</span>
            <span className="tabular-nums text-brand-600">{lineTotal !== null ? formatCents(lineTotal) : 'TBD'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd} className="flex-1">
            Add to Advance
          </Button>
        </div>
      </div>
    </div>
  );
}
