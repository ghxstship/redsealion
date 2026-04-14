import React from 'react';

export function CatalogItemSpecCard({ item }: { item: { specifications?: unknown; vendor_availability?: string[]; msrp_usd?: number; rental_rate_daily?: number; product_type?: string; id?: string } }) {
  if (!item) return null;

  const specs = (item.specifications && typeof item.specifications === 'object' && !Array.isArray(item.specifications)) ? item.specifications as Record<string, string> : null;
  const { vendor_availability, msrp_usd, rental_rate_daily } = item;

  return (
    <div className="bg-bg-secondary p-4 rounded-lg border border-border">
      <h3 className="text-sm font-semibold mb-4 text-text-primary">Intelligence &amp; Specifications</h3>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        {msrp_usd && (
          <div>
            <span className="block text-xs text-text-muted uppercase">Estimated MSRP</span>
            <span className="font-medium">${msrp_usd.toLocaleString()}</span>
          </div>
        )}
        {rental_rate_daily && (
          <div>
            <span className="block text-xs text-text-muted uppercase">Avg Day Rate</span>
            <span className="font-medium">${rental_rate_daily.toLocaleString()}</span>
          </div>
        )}

        {vendor_availability && vendor_availability.length > 0 && (
          <div className="col-span-2">
            <span className="block text-xs text-text-muted uppercase mb-1">Common Vendors</span>
            <div className="flex gap-2 flex-wrap">
              {vendor_availability.map((v: string) => (
                <span key={v} className="bg-background border border-border px-2 py-0.5 rounded text-xs">{v}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {specs && Object.keys(specs).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2">Technical Specs</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key}>
                <dt className="text-text-muted capitalize">{key.replace(/_/g, ' ')}</dt>
                <dd className="font-medium text-foreground">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
