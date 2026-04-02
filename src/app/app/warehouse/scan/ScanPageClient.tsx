'use client';

import React, { useState, useCallback } from 'react';
import QRScanner from '@/components/admin/equipment/QRScanner';
import QRGenerator from '@/components/admin/equipment/QRGenerator';
import CheckInOut from '@/components/admin/equipment/CheckInOut';

interface AssetResult {
  id: string;
  name: string;
  category?: string;
  barcode?: string;
  serial_number?: string;
  status?: string;
  current_location?: string;
  quantity?: number;
}

interface ReservationResult {
  id: string;
  status: string;
  project_id?: string;
  start_date?: string;
  end_date?: string;
}

interface ScanEntry {
  value: string;
  timestamp: Date;
  asset?: AssetResult;
  error?: string;
}

type Tab = 'scan' | 'recent';

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-50 text-green-700',
  deployed: 'bg-blue-50 text-blue-700',
  checked_out: 'bg-blue-50 text-blue-700',
  maintenance: 'bg-red-50 text-red-700',
  reserved: 'bg-yellow-50 text-yellow-700',
};

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ScanPageClient() {
  const [tab, setTab] = useState<Tab>('scan');
  const [loading, setLoading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<AssetResult | null>(null);
  const [activeReservation, setActiveReservation] = useState<ReservationResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);

  const lookupAsset = useCallback(async (value: string) => {
    setLoading(true);
    setLookupError(null);
    setCurrentAsset(null);
    setActiveReservation(null);

    try {
      // Determine if the value looks like a UUID (id) or a barcode
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

      // Also check if value is a URL containing an asset ID
      let lookupValue = value;
      const urlMatch = value.match(/\/equipment\/([0-9a-f-]+)/i);
      if (urlMatch) {
        lookupValue = urlMatch[1];
      }

      const isId = isUuid || urlMatch;
      const param = isId ? `id=${encodeURIComponent(lookupValue)}` : `barcode=${encodeURIComponent(lookupValue)}`;

      const res = await fetch(`/api/equipment/lookup?${param}`);
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || 'Asset not found.';
        setLookupError(errMsg);
        setRecentScans((prev) => [
          { value, timestamp: new Date(), error: errMsg },
          ...prev.slice(0, 49),
        ]);
        return;
      }

      setCurrentAsset(data.asset);
      setActiveReservation(data.activeReservation ?? null);
      setRecentScans((prev) => [
        { value, timestamp: new Date(), asset: data.asset },
        ...prev.slice(0, 49),
      ]);
    } catch {
      setLookupError('Network error. Could not look up asset.');
      setRecentScans((prev) => [
        { value, timestamp: new Date(), error: 'Network error' },
        ...prev.slice(0, 49),
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScan = useCallback(
    (value: string) => {
      lookupAsset(value);
    },
    [lookupAsset],
  );

  const handleCheckInOutComplete = () => {
    // Re-fetch the asset to get updated status
    if (currentAsset) {
      lookupAsset(currentAsset.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('scan')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'scan'
              ? 'text-foreground border-b-2 border-foreground'
              : 'text-text-muted hover:text-foreground'
          }`}
        >
          Scan
        </button>
        <button
          onClick={() => setTab('recent')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
            tab === 'recent'
              ? 'text-foreground border-b-2 border-foreground'
              : 'text-text-muted hover:text-foreground'
          }`}
        >
          Recent Scans
          {recentScans.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-foreground text-white">
              {recentScans.length}
            </span>
          )}
        </button>
      </div>

      {/* Scan tab */}
      {tab === 'scan' && (
        <div className="space-y-6">
          <QRScanner onScan={handleScan} />

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <span className="ml-3 text-sm text-text-muted">Looking up asset...</span>
            </div>
          )}

          {/* Error */}
          {lookupError && !loading && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {lookupError}
            </div>
          )}

          {/* Asset details */}
          {currentAsset && !loading && (
            <div className="space-y-4">
              <div className="bg-white border border-border rounded-lg shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {currentAsset.name}
                    </h3>
                    {currentAsset.category && (
                      <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary mt-1">
                        {currentAsset.category}
                      </span>
                    )}
                  </div>
                  {currentAsset.status && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[currentAsset.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {formatLabel(currentAsset.status)}
                    </span>
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
                  {currentAsset.current_location && (
                    <div>
                      <span className="text-text-muted">Location:</span>{' '}
                      <span className="text-foreground">{currentAsset.current_location}</span>
                    </div>
                  )}
                  {currentAsset.quantity != null && (
                    <div>
                      <span className="text-text-muted">Qty:</span>{' '}
                      <span className="tabular-nums text-foreground">{currentAsset.quantity}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex gap-2">
                  <a
                    href={`/app/equipment/${currentAsset.id}`}
                    className="flex-1 text-center px-3 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-bg-secondary transition-colors"
                  >
                    View Details
                  </a>
                </div>
              </div>

              {/* Barcode label */}
              <div className="flex justify-center">
                <QRGenerator
                  assetId={currentAsset.id}
                  barcode={currentAsset.barcode || currentAsset.serial_number || currentAsset.id}
                  name={currentAsset.name}
                />
              </div>

              {/* Check In/Out */}
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
            <div className="text-center py-12">
              <p className="text-sm text-text-muted">No scans yet this session.</p>
              <button
                onClick={() => setTab('scan')}
                className="mt-3 px-4 py-2 text-sm rounded-lg bg-foreground text-white hover:opacity-90 transition-opacity"
              >
                Start Scanning
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentScans.map((entry, i) => (
                <div
                  key={`${entry.value}-${i}`}
                  className="bg-white border border-border rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    {entry.asset ? (
                      <>
                        <p className="text-sm font-medium text-foreground truncate">
                          {entry.asset.name}
                        </p>
                        <p className="text-xs text-text-muted font-mono truncate">
                          {entry.value}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-mono text-foreground truncate">
                          {entry.value}
                        </p>
                        {entry.error && (
                          <p className="text-xs text-red-600">{entry.error}</p>
                        )}
                      </>
                    )}
                    <p className="text-xs text-text-muted mt-0.5">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      lookupAsset(entry.value);
                      setTab('scan');
                    }}
                    className="ml-3 shrink-0 px-3 py-1.5 text-xs rounded-lg border border-border text-foreground hover:bg-bg-secondary transition-colors"
                  >
                    Re-scan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
