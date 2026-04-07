'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  assetId: string;
  assetName: string;
}

export default function MaintenanceScheduleModal({
  open,
  onClose,
  onCreated,
  assetId,
  assetName,
}: ScheduleModalProps) {
  const [scheduleType, setScheduleType] = useState('time_based');
  const [intervalDays, setIntervalDays] = useState('90');
  const [intervalUsage, setIntervalUsage] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('preventive');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/equipment/maintenance/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: assetId,
          schedule_type: scheduleType,
          interval_days: scheduleType === 'time_based' ? parseInt(intervalDays) : null,
          interval_usage: scheduleType === 'usage_based' ? parseInt(intervalUsage) : null,
          maintenance_type: maintenanceType,
          description: description || null,
          estimated_duration_hours: estimatedHours ? parseFloat(estimatedHours) : null,
          estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
          assigned_to: assignedTo || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create schedule');
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Create Maintenance Schedule" subtitle={assetName}>
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Schedule Type *</FormLabel>
            <FormSelect value={scheduleType} onChange={(e) => setScheduleType(e.target.value)}>
              <option value="time_based">Time Based</option>
              <option value="usage_based">Usage Based</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Maintenance Type *</FormLabel>
            <FormSelect value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)}>
              <option value="preventive">Preventive</option>
              <option value="inspection">Inspection</option>
              <option value="calibration">Calibration</option>
            </FormSelect>
          </div>
        </div>

        {scheduleType === 'time_based' ? (
          <div>
            <FormLabel>Interval (days) *</FormLabel>
            <FormInput
              type="number"
              required
              min="1"
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              placeholder="90"
            />
            <p className="text-xs text-text-muted mt-1">How often this maintenance should recur.</p>
          </div>
        ) : (
          <div>
            <FormLabel>Interval (deployments) *</FormLabel>
            <FormInput
              type="number"
              required
              min="1"
              value={intervalUsage}
              onChange={(e) => setIntervalUsage(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-text-muted mt-1">Trigger after this many deployments.</p>
          </div>
        )}

        <div>
          <FormLabel>Description</FormLabel>
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What should be done during this maintenance..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Estimated Hours</FormLabel>
            <FormInput type="number" min="0" step="0.5" value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)} placeholder="2.0" />
          </div>
          <div>
            <FormLabel>Estimated Cost</FormLabel>
            <FormInput type="number" min="0" step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="500.00" />
          </div>
        </div>

        <div>
          <FormLabel>Assigned To</FormLabel>
          <FormInput type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="e.g. Tech Services Inc." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
