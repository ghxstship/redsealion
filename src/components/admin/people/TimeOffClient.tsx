'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { statusColor } from '@/lib/utils';
import TimeOffRequestModal from './TimeOffRequestModal';
import TimeOffDetailModal from './TimeOffDetailModal';

interface TimeOffRequest {
  id: string;
  userName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
}

interface TimeOffClientProps {
  requests: TimeOffRequest[];
  isAdmin: boolean;
}

export default function TimeOffClient({ requests: initialRequests, isAdmin }: TimeOffClientProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);

  const fetchRequests = async () => {
    // A full implementation would re-fetch or use router.refresh() 
    window.location.reload();
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setIsRequestModalOpen(true)}>
          Request Time Off
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No time-off requests.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Dates</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="transition-colors hover:bg-bg-secondary/50 cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <td className="px-6 py-3.5 text-sm font-medium text-foreground">{req.userName}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{req.days}</td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary max-w-[200px] truncate">{req.reason ?? '-'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(req.status)}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isRequestModalOpen && (
        <TimeOffRequestModal 
          open={isRequestModalOpen} 
          onClose={() => setIsRequestModalOpen(false)} 
          onCreated={fetchRequests} 
        />
      )}

      {selectedRequest && (
        <TimeOffDetailModal 
          open={true} 
          onClose={() => setSelectedRequest(null)} 
          request={selectedRequest}
          isAdmin={isAdmin}
          onReviewed={fetchRequests}
        />
      )}
    </>
  );
}
