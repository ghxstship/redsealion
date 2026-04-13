import { redirect } from 'next/navigation';

/**
 * Procurement → Receiving redirect.
 *
 * The canonical goods-receipts list lives at /app/logistics/goods-receipts.
 * This eliminates the duplicate page that was querying the same goods_receipts table.
 */
export default function ProcurementReceivingPage() {
  redirect('/app/logistics/goods-receipts');
}
