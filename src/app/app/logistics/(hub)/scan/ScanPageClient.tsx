'use client';

import React, { useState, useCallback } from 'react';
import QRScanner from '@/components/admin/equipment/QRScanner';
import QRGenerator from '@/components/admin/equipment/QRGenerator';
import CheckInOut from '@/components/admin/equipment/CheckInOut';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import Alert from '@/components/ui/Alert';
import StatusBadge, { EQUIPMENT_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { formatLabel, formatCurrency } from '@/lib/utils';

interface AssetResult {
  id: string;
  name: string;
  category?: string;
  barcode?: string;
  serial_number?: string;
  status?: string;
  condition?: string;
  current_location?: string;
  current_value?: number;
  warranty_end_date?: string;
  quantity?: number;
}

interface ReservationResult {
  id: string;
  status: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

interface MaintenanceAlert {
  id: string;
  maintenance_type: string;
  next_due_at: string;
  is_overdue: boolean;
}

interface ScanEntry {
  value: string;
  timestamp: Date;
  asset?: AssetResult;
  error?: string;
}

type Tab = 'scan' | 'recent';
type ActionPanel = null | 'move' | 'condition' | 'maintenance' | 'count';

const CONDITION_OPTIONS = ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'] as const;

export default function ScanPageClient() {
  const [tab, setTab] = useState<Tab>('scan');
  const [loading, setLoading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<AssetResult | null>(null);
  const [activeReservation, setActiveReservation] = useState<ReservationResult | null>(null);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);
  const [actionPanel, setActionPanel] = useState<ActionPanel>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const lookupAsset = useCallback(async (value: string) => {
    setLoading(true);
    setLookupError(null);
    setCurrentAsset(null);
    setActiveReservation(null);
    setMaintenanceAlerts([]);
    setActionPanel(null);
    setActionSuccess(null);

    try {
      let lookupValue = value;
      const urlMatch = value.match(/\/equipment\/([0-9a-f-]+)/i);
      if (urlMatch) lookupValue = urlMatch[1];

      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lookupValue) || urlMatch;
      const param = isId ? `id=${encodeURIComponent(lookupValue)}` : `barcode=${encodeURIComponent(lookupValue)}`;

      const res = await fetch(`/api/equipment/lookup?${param}`);
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || 'Asset not found.';
        setLookupError(errMsg);
        setRecentScans((prev) => [{ value, timestamp: new Date(), error: errMsg }, ...prev.slice(0, 49)]);
        return;
      }

      setCurrentAsset(data.asset);
      setActiveReservation(data.activeReservation ?? null);
      setRecentScans((prev) => [{ value, timestamp: new Date(), asset: data.asset }, ...prev.slice(0, 49)]);

      // Fetch maintenance schedules
      if (data.asset?.id) {
        try {
          const schedRes = await fetch(`/api/equipment/maintenance/schedules?assetId=${data.asset.id}&active=true`);
          const schedData = await schedRes.json();
          if (schedData.schedules) {
            setMaintenanceAlerts(
              schedData.schedules
                .filter((s: MaintenanceAlert) => s.is_overdue)
                .map((s: MaintenanceAlert) => ({
                  id: s.id,
                  maintenance_type: s.maintenance_type,
                  next_due_at: s.next_due_at,
                  is_overdue: true,
                })),
            );
          }
        } catch { /* non-critical */ }
      }
    } catch {
      setLookupError('Network error. Could not look up asset.');
      setRecentScans((prev) => [{ value, timestamp: new Date(), error: 'Network error' }, ...prev.slice(0, 49)]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScan = useCallback((value: string) => { lookupAsset(value); }, [lookupAsset]);

  const handleCheckInOutComplete = () => {
    if (currentAsset) lookupAsset(currentAsset.id);
  };

  async function handleQuickAction(action: string, payload: Record<string, unknown> = {}) {
    if (!currentAsset) return;
    setActionLoading(true);
    setActionSuccess(null);

    try {
      if (action === 'condition') {
        await fetch(`/api/assets/${currentAsset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ condition: payload.condition }),
        });
        setActionSuccess(`Condition updated to ${formatLabel(payload.condition as string)}`);
      } else if (action === 'location') {
        await fetch(`/api/assets/${currentAsset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_location: { type: payload.location } }),
        });
        setActionSuccess(`Moved to ${payload.location}`);
      } else if (action === 'maintenance') {
        await fetch('/api/equipment/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asset_id: currentAsset.id,
            type: payload.type || 'inspection',
            description: payload.description || 'Field inspection via QR scan',
            scheduled_date: new Date().toISOString().split('T')[0],
          }),
        });
        setActionSuccess('Maintenance record created');
      } else if (action === 'count') {
        // Record count in inventory
        setActionSuccess(`Counted: ${currentAsset.name} ✓`);
      }

      // Re-fetch asset
      setTimeout(() => lookupAsset(currentAsset.id), 500);
    } catch {
      setActionSuccess(null);
    } finally {
      setActionLoading(false);
      setActionPanel(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        <Button
          onClick={() => setTab('scan')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'scan' ? 'text-foreground border-b-2 border-foreground' : 'text-text-muted hover:text-foreground'
          }`}
        >
          Scan
        </Button>
        <Button
          onClick={() => setTab('recent')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            tab === 'recent' ? 'text-foreground border-b-2 border-foreground' : 'text-text-muted hover:text-foreground'
          }`}
        >
          Recent Scans
          {recentScans.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-foreground text-white">
              {recentScans.length}
            </span>
          )}
        </Button>
      </div>

      {/* Scan tab */}
      {tab === 'scan' && (
        <div className="space-y-6">
          <QRScanner onScan={handleScan} />

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <span className="ml-3 text-sm text-text-muted">Looking up asset...</span>
            </div>
          )}

          {lookupError && !loading && <Alert>{lookupError}</Alert>}

          {/* Asset card with action menu */}
          {currentAsset && !loading && (
            <div className="space-y-4">
              {/* Overdue maintenance alert */}
              {maintenanceAlerts.length > 0 && (
                <Alert variant="warning">
                  {maintenanceAlerts.length} overdue maintenance task{maintenanceAlerts.length > 1 ? 's' : ''} — {maintenanceAlerts.map((a) => formatLabel(a.maintenance_type)).join(', ')}
                </Alert>
              )}

              {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

              <div className="bg-background border border-border rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{currentAsset.name}</h3>
                    {currentAsset.category && (
                      <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary mt-1">
                        {currentAsset.category}
                      </span>
                    )}
                  </div>
                  {currentAsset.status && (
                    <StatusBadge status={currentAsset.status} colorMap={EQUIPMENT_STATUS_COLORS} />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {currentAsset.serial_number && (
                    <div>
                      <span className="text-text-muted">Serial:</span>{' '}
                      <span className="font-mono text-foreground">{currentAsset.serial_number}</span>
                    </div>
                  )}
                  {currentAsset.barcode && (
                    <div>
                      <span className="text-text-muted">Barcode:</span>{' '}
                      <span className="font-mono text-foreground">{currentAsset.barcode}</span>
                    </div>
                  )}
                  {currentAsset.condition && (
                    <div>
                      <span className="text-text-muted">Condition:</span>{' '}
                      <span className="text-foreground">{formatLabel(currentAsset.condition)}</span>
                    </div>
                  )}
                  {currentAsset.current_value != null && (
                    <div>
                      <span className="text-text-muted">Value:</span>{' '}
                      <span className="font-medium tabular-nums text-foreground">{formatCurrency(currentAsset.current_value)}</span>
                    </div>
                  )}
                  {currentAsset.current_location && (
                    <div>
                      <span className="text-text-muted">Location:</span>{' '}
                      <span className="text-foreground">{currentAsset.current_location}</span>
                    </div>
                  )}
                  {currentAsset.warranty_end_date && (
                    <div>
                      <span className="text-text-muted">Warranty:</span>{' '}
                      <span className={`text-foreground ${new Date(currentAsset.warranty_end_date) < new Date() ? 'text-red-700' : 'text-green-700'}`}>{
                        new Date(currentAsset.warranty_end_date) > new Date() ? 'Active' : 'Expired'
                      }</span>
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Button variant="secondary" size="sm" href={`/app/equipment/${currentAsset.id}`}>
                      View Details
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setActionPanel('condition')}>
                      Update Condition
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setActionPanel('move')}>
                      Move Location
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setActionPanel('maintenance')}>
                      Log Maintenance
                    </Button>
                  </div>
                </div>

                {/* Inline action panels */}
                {actionPanel === 'condition' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Set Condition</p>
                    <div className="flex flex-wrap gap-2">
                      {CONDITION_OPTIONS.map((c) => (
                        <Button
                          key={c}
                          disabled={actionLoading}
                          onClick={() => handleQuickAction('condition', { condition: c })}
                          className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground hover:bg-bg-secondary transition-colors disabled:opacity-50"
                        >
                          {formatLabel(c)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {actionPanel === 'move' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Move to Location</p>
                    <div className="flex flex-wrap gap-2">
                      {['Warehouse A', 'Warehouse B', 'Field', 'Client Site', 'In Transit', 'Shop'].map((loc) => (
                        <Button
                          key={loc}
                          disabled={actionLoading}
                          onClick={() => handleQuickAction('location', { location: loc })}
                          className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground hover:bg-bg-secondary transition-colors disabled:opacity-50"
                        >
                          {loc}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {actionPanel === 'maintenance' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Log Maintenance Type</p>
                    <div className="flex flex-wrap gap-2">
                      {['inspection', 'preventive', 'repair', 'calibration'].map((t) => (
                        <Button
                          key={t}
                          disabled={actionLoading}
                          onClick={() => handleQuickAction('maintenance', { type: t, description: `${formatLabel(t)} logged via QR scan` })}
                          className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground hover:bg-bg-secondary transition-colors disabled:opacity-50"
                        >
                          {formatLabel(t)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QR Label */}
              <div className="flex justify-center">
                <QRGenerator
                  assetId={currentAsset.id}
                  barcode={currentAsset.barcode || currentAsset.serial_number || currentAsset.id}
                  name={currentAsset.name}
                />
              </div>

              {/* Check In/Out  */}
              {activeReservation && (
                <CheckInOut
                  reservationId={activeReservation.id}
                  currentStatus={activeReservation.status}
                  onComplete={handleCheckInOutComplete}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent scans tab */}
      {tab === 'recent' && (
        <div>
          {recentScans.length === 0 ? (
            <EmptyState
              message="No scans yet this session"
              action={<Button className="mt-3" onClick={() => setTab('scan')}>Start Scanning</Button>}
            />
          ) : (
            <div className="space-y-2">
              {recentScans.map((entry, i) => (
                <div
                  key={`${entry.value}-${i}`}
                  className="bg-background border border-border rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    {entry.asset ? (
                      <>
                        <p className="text-sm font-medium text-foreground truncate">{entry.asset.name}</p>
                        <p className="text-xs text-text-muted font-mono truncate">{entry.value}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-mono text-foreground truncate">{entry.value}</p>
                        {entry.error && <p className="text-xs text-red-600">{entry.error}</p>}
                      </>
                    )}
                    <p className="text-xs text-text-muted mt-0.5">{entry.timestamp.toLocaleTimeString()}</p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { lookupAsset(entry.value); setTab('scan'); }}
                  >
                    Re-scan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
