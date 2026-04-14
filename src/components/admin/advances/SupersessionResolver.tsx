import { useSupersession } from '@/hooks/useSupersession';
import Button from '@/components/ui/Button';

export function SupersessionResolver({ itemId, onSelectLatest }: { itemId: string; onSelectLatest: (newItemId: string) => void }) {
  const { chain, latestItem, loading } = useSupersession(itemId);

  if (loading) return <div className="animate-pulse space-y-2"><div className="h-4 bg-bg-secondary w-full"></div></div>;
  if (!chain || chain.length <= 1) return null;

  const currentItem = chain.find(c => c.chain_position === 0);
  const hasMovedForward = currentItem && latestItem && latestItem.chain_position > 0;

  return (
    <div className="bg-yellow-50 p-4 rounded border border-yellow-200 mt-4 text-yellow-900">
      <h4 className="text-sm font-semibold mb-2">Item Discontinued</h4>
      <p className="text-xs mb-3">This item has been replaced in the catalog. Review the lineage to determine if you want to use the latest model.</p>
      
      <div className="space-y-2 relative border-l-2 border-yellow-300 ml-2 pl-4 py-1">
        {chain.map((node) => (
          <div key={node.item_id} className={`text-sm ${node.chain_position === 0 ? 'font-bold' : ''}`}>
            <span className="absolute -left-1.5 w-3 h-3 bg-yellow-400 rounded-full mt-1.5 border border-yellow-100" />
            <div className="flex justify-between">
              <span>{node.item_name} <span className="text-xs opacity-75">({node.status})</span></span>
              {node.change_summary && <span className="text-xs bg-yellow-100 px-1.5 py-0.5 rounded ml-2">{node.change_summary}</span>}
            </div>
          </div>
        ))}
      </div>

      {hasMovedForward && (
        <div className="mt-4 flex gap-3">
          <Button size="sm" onClick={() => onSelectLatest(latestItem.item_id)}>
            Update
          </Button>
        </div>
      )}
    </div>
  );
}
