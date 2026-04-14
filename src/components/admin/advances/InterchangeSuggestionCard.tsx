import { useInterchange } from '@/hooks/useInterchange';
import Button from '@/components/ui/Button';

export function InterchangeSuggestionCard({ itemId, onSwap }: { itemId: string; onSwap: (altItem: { is_discontinued?: boolean }) => void }) {
  const { data, loading } = useInterchange(itemId);

  if (loading) return <div className="animate-pulse space-y-2"><div className="h-4 bg-bg-secondary w-full"></div></div>;
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-bg-secondary p-4 rounded-lg border border-border mt-4">
      <h4 className="text-sm font-semibold mb-3">Suitable Alternatives</h4>
      <div className="space-y-3">
        {data.slice(0, 3).map((alt) => (
          <div key={alt.interchange_id} className="flex justify-between items-center bg-background p-3 rounded border border-border border-l-4" style={{borderLeftColor: alt.compatibility_score >= 80 ? 'green' : (alt.compatibility_score >= 50 ? 'orange' : 'red')}}>
            <div>
              <p className="font-medium text-sm">{alt.alternative_item.name}</p>
              <p className="text-xs text-text-muted capitalize">
                {alt.relationship_type.replace('_', ' ')} • {alt.compatibility_score}% Match
              </p>
              {alt.comparison_data && Object.keys(alt.comparison_data).length > 0 && (
                <div className="mt-1 text-xs text-text-secondary flex gap-2 flex-wrap">
                  {Object.entries(alt.comparison_data).map(([k, v]) => (
                    <span key={k} className="bg-bg-tertiary px-1.5 py-0.5 rounded">{k}: {v as string}</span>
                  ))}
                </div>
              )}
            </div>
            <Button size="sm" onClick={() => onSwap(alt.alternative_item)}>Swap In</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
