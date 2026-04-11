import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import Button from '@/components/ui/Button';

async function getActiveOrders() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('fabrication_orders')
      .select('id, order_number, name, status, priority, order_type')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['pending', 'in_production', 'quality_check'])
      .order('priority', { ascending: false });
    return data ?? [];
  } catch { return []; }
}

export default async function KioskPage() {
  const orders = await getActiveOrders();

  return (
    <TierGate feature="equipment">
      <div className="min-h-[80vh] flex flex-col items-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-3xl mb-8 flex justify-between items-center text-foreground">
          <h1 className="text-2xl font-bold">Shop Floor Kiosk</h1>
          <a href="/app/fabrication/shop-floor" className="text-sm bg-bg-secondary px-4 py-2 rounded-lg font-medium">Exit Kiosk</a>
        </div>

        <div className="w-full max-w-3xl space-y-6">
          <p className="text-sm text-text-secondary">Scan a barcode or tap an active priority order below to log your status.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-background border border-border p-5 rounded-2xl shadow-sm hover:border-foreground/20 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono font-medium text-blue-600">{o.order_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${o.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-bg-secondary text-text-muted'}`}>
                    {o.priority.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-4">{o.name}</h3>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Button variant="outline" className="flex-1 bg-blue-50 text-blue-700 border-transparent hover:bg-blue-100 font-semibold" size="sm">Start</Button>
                  <Button variant="outline" className="flex-1 bg-yellow-50 text-yellow-700 border-transparent hover:bg-yellow-100 font-semibold" size="sm">Pause</Button>
                  <Button variant="outline" className="flex-1 bg-green-50 text-green-700 border-transparent hover:bg-green-100 font-semibold" size="sm">QC / Finish</Button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed border-border rounded-2xl">
                <p className="text-text-muted text-lg">No active production orders.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TierGate>
  );
}
