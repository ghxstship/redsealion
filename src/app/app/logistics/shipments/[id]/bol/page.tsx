import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

import { RoleGate } from '@/components/shared/RoleGate';
async function getShipment(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;

  const { data } = await supabase
    .from('shipments')
    .select('*, shipment_line_items(*), organizations(name, slug)')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  return data as any;
}

export default async function BillOfLadingPrintablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await getShipment(id);

  if (!shipment) notFound();

  return (
    <RoleGate>
    <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: letter; margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          nav, header:not(.print-header), footer, aside { display: none !important; }
        }
      `}} />

      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-black">Straight Bill of Lading</h1>
          <p className="text-sm font-medium mt-1">Short Form — Original — Not Negotiable</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">BOL # {shipment.shipment_number}</p>
          <p className="text-sm mt-1">Date: {shipment.ship_date ? formatDate(shipment.ship_date) : formatDate(new Date().toISOString())}</p>
          {shipment.bol_generated_at && <p className="text-xs">Printed: {new Date(shipment.bol_generated_at).toLocaleString()}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-2 border-black mb-6">
        <div className="p-4 border-r-2 border-black">
          <h3 className="font-bold text-xs uppercase mb-2">Ship From</h3>
          <p className="text-sm font-medium">{shipment.organizations?.name}</p>
          <p className="text-sm whitespace-pre-wrap">{shipment.origin_address ?? '—'}</p>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-xs uppercase mb-2">Ship To (Consignee)</h3>
          <p className="text-sm whitespace-pre-wrap">{shipment.destination_address ?? '—'}</p>
        </div>
      </div>

      <div className="border-2 border-black mb-6 flex divide-x-2 divide-black">
         <div className="p-4 flex-1">
           <h3 className="font-bold text-xs uppercase mb-1">Carrier Name</h3>
           <p className="text-sm font-medium">{shipment.carrier ?? '—'}</p>
         </div>
         <div className="p-4 flex-1">
           <h3 className="font-bold text-xs uppercase mb-1">Tracking / PRO #</h3>
           <p className="text-sm font-medium">{shipment.tracking_number ?? '—'}</p>
         </div>
      </div>

      <div className="border-2 border-black mb-6">
        <div className="p-2 border-b-2 border-black bg-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase">Special Instructions</h3>
          {shipment.is_hazardous && <span className="font-bold text-xs uppercase text-black border border-black px-1">⚠️ Hazmat</span>}
        </div>
        <div className="p-4 min-h-[80px]">
           <p className="text-sm whitespace-pre-wrap">{shipment.bol_special_instructions ?? 'No special handling instructions.'}</p>
        </div>
      </div>

      <Table className="w-full text-sm border-2 border-black mb-6 divide-y divide-black">
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x divide-black text-left">
            <TableHead className="p-2 font-bold uppercase text-xs w-16">Pieces</TableHead>
            <TableHead className="p-2 font-bold uppercase text-xs w-20 text-center">HM</TableHead>
            <TableHead className="p-2 font-bold uppercase text-xs">Description of Articles, Special Marks & Exceptions</TableHead>
            <TableHead className="p-2 font-bold uppercase text-xs w-24">Weight (lbs)</TableHead>
            <TableHead className="p-2 font-bold uppercase text-xs w-20 text-center">Class</TableHead>
            <TableHead className="p-2 font-bold uppercase text-xs w-24 text-center">NMFC #</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-black">
          {shipment.shipment_line_items?.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="p-4 text-center italic">No items listed.</TableCell></TableRow>
          ) : (
            shipment.shipment_line_items?.map((item: any) => (
              <TableRow key={item.id} className="divide-x divide-black">
                <TableCell className="p-2 text-center">{item.quantity}</TableCell>
                <TableCell className="p-2 text-center">{shipment.is_hazardous ? 'X' : ''}</TableCell>
                <TableCell className="p-2">{item.description}</TableCell>
                <TableCell className="p-2 text-right">{item.weight_lbs ?? '—'}</TableCell>
                <TableCell className="p-2 text-center">{shipment.freight_class ?? '—'}</TableCell>
                <TableCell className="p-2 text-center">{shipment.nmfc_code ?? '—'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <tfoot className="border-t-2 border-black bg-gray-50">
          <TableRow className="divide-x divide-black">
            <TableCell colSpan={3} className="p-2 text-right font-bold text-xs uppercase">Totals:</TableCell>
            <TableCell className="p-2 text-right font-bold">{shipment.weight_lbs ?? '—'}</TableCell>
            <TableCell colSpan={2}></TableCell>
          </TableRow>
        </tfoot>
      </Table>

      {shipment.declared_value_cents > 0 && (
        <div className="text-xs mb-6">
          <strong>NOTE:</strong> Where the rate is dependent on value, shippers are required to state specifically in writing the agreed or declared value of the property. The agreed or declared value of the property is hereby specifically stated by the shipper to be not exceeding <strong>${(shipment.declared_value_cents / 100).toFixed(2)}</strong>.
        </div>
      )}

      <div className="grid grid-cols-2 gap-8 text-xs">
        <div>
          <p className="mb-8"><strong>Shipper Signature</strong> ___________________________ Date ______</p>
          <p className="text-text-secondary italic">This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the DOT.</p>
        </div>
        <div>
          <p className="mb-8"><strong>Carrier Signature</strong> ___________________________ Date ______</p>
          <p className="text-text-secondary italic">Carrier acknowledges receipt of packages and required placards. Carrier certifies emergency response information was made available and/or carrier has the DOT emergency response guidebook or equivalent documentation in the vehicle.</p>
        </div>
      </div>

      {/* Auto-print script */}
      <script dangerouslySetInnerHTML={{ __html: `setTimeout(() => window.print(), 500);` }} />
    </div>
  </RoleGate>
  );
}
