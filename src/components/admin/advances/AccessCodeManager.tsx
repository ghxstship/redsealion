'use client';

import { useState } from 'react';
import { Copy, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormLabel from '@/components/ui/FormLabel';
import ModalShell from '@/components/ui/ModalShell';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import { generateAccessCode } from '@/lib/advances/utils';
import type { AdvanceAccessCode } from '@/types/database';

/* ═══════════════ Types ═══════════════ */

interface AccessCodeManagerProps {
  advanceId: string;
  codes: Array<AdvanceAccessCode & { redemption_count?: number }>;
  onRefresh: () => void;
}

const CODE_TYPE_COLORS: Record<string, string> = {
  single_use: 'bg-violet-50 text-violet-700',
  multi_use: 'bg-blue-50 text-blue-700',
  unlimited: 'bg-emerald-50 text-emerald-700',
};

const ROLE_COLORS: Record<string, string> = {
  contributor: 'bg-sky-50 text-sky-700',
  viewer: 'bg-bg-secondary text-text-muted',
  vendor: 'bg-amber-50 text-amber-700',
  manager: 'bg-indigo-50 text-indigo-700',
};

/* ═══════════════ Component ═══════════════ */

export default function AccessCodeManager({ advanceId, codes, onRefresh }: AccessCodeManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [codeType, setCodeType] = useState<string>('single_use');
  const [role, setRole] = useState<string>('contributor');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [previewCode, setPreviewCode] = useState('');

  function handleOpenModal() {
    setPreviewCode(generateAccessCode('ADV'));
    setCodeType('single_use');
    setRole('contributor');
    setMaxUses(1);
    setExpiresAt('');
    setShowModal(true);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        code: previewCode,
        code_type: codeType,
        collaborator_role: role,
        max_uses: codeType === 'unlimited' ? null : maxUses,
      };
      if (expiresAt) body.expires_at = new Date(expiresAt).toISOString();

      const res = await fetch(`/api/advances/${advanceId}/access-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        onRefresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(codeId: string) {
    const res = await fetch(`/api/advances/${advanceId}/access-codes/${codeId}`, {
      method: 'DELETE',
    });
    if (res.ok) onRefresh();
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  function formatDate(str: string | null) {
    if (!str) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(str));
  }

  const activeCodes = codes.filter((c) => !(c as Record<string, unknown>).revoked_at);
  const revokedCodes = codes.filter((c) => (c as Record<string, unknown>).revoked_at);

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Access Codes</h3>
        <Button size="sm" onClick={handleOpenModal}>Generate Code</Button>
      </div>

      {codes.length === 0 ? (
        <div className="p-4">
          <EmptyState
            message="No access codes"
            description="Generate codes to let external collaborators join this advance."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {/* Active codes */}
          {activeCodes.map((code) => (
            <div key={code.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => handleCopyCode(code.code)}
                    className="font-mono text-sm font-semibold text-foreground hover:text-brand-600 transition-colors"
                    title="Click to copy"
                  >
                    {code.code}
                  </button>
                  <StatusBadge status={code.code_type ?? 'single_use'} colorMap={CODE_TYPE_COLORS} />
                  <StatusBadge status={code.collaborator_role ?? 'contributor'} colorMap={ROLE_COLORS} />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-text-muted">
                  {code.max_uses !== null && (
                    <span>Uses: {code.redemption_count ?? (code as Record<string, unknown>).times_used as number ?? 0}/{code.max_uses}</span>
                  )}
                  {code.max_uses === null && (
                    <span>Uses: {code.redemption_count ?? (code as Record<string, unknown>).times_used as number ?? 0}/∞</span>
                  )}
                  {code.expires_at && (
                    <span>Expires: {formatDate(code.expires_at)}</span>
                  )}
                  <span>Created: {formatDate(code.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyCode(code.code)}
                  className="rounded-md p-1.5 text-text-muted hover:bg-bg-secondary hover:text-foreground transition-colors"
                  title="Copy code"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => handleRevoke(code.id)}
                  className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                  title="Revoke code"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Revoked codes */}
          {revokedCodes.length > 0 && (
            <div className="px-4 py-2 bg-bg-secondary/50">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Revoked</p>
              {revokedCodes.map((code) => (
                <div key={code.id} className="flex items-center gap-2 py-1 opacity-50">
                  <span className="font-mono text-xs text-text-muted line-through">{code.code}</span>
                  <StatusBadge status={code.code_type ?? 'single_use'} colorMap={CODE_TYPE_COLORS} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Generate Modal */}
      {showModal && (
        <ModalShell open={showModal} title="Generate Access Code" onClose={() => setShowModal(false)}>
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Preview Code */}
            <div className="rounded-lg bg-bg-secondary p-4 text-center">
              <p className="text-xs text-text-muted mb-1">Access Code</p>
              <p className="text-2xl font-mono font-bold tracking-wider text-brand-600">{previewCode}</p>
              <button
                type="button"
                onClick={() => setPreviewCode(generateAccessCode('ADV'))}
                className="mt-1 text-xs text-text-muted hover:text-brand-600 transition-colors"
              >
                ↻ Regenerate
              </button>
            </div>

            <div>
              <FormLabel>Code Type</FormLabel>
              <FormSelect value={codeType} onChange={(e) => setCodeType(e.target.value)}>
                <option value="single_use">Single Use</option>
                <option value="multi_use">Multi Use</option>
                <option value="unlimited">Unlimited</option>
              </FormSelect>
            </div>

            <div>
              <FormLabel>Access Role</FormLabel>
              <FormSelect value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="contributor">Contributor — Can submit items</option>
                <option value="viewer">Viewer — Read-only access</option>
                <option value="vendor">Vendor — Vendor access with pricing</option>
                <option value="manager">Manager — Can approve/manage</option>
              </FormSelect>
            </div>

            {codeType === 'multi_use' && (
              <div>
                <FormLabel>Maximum Uses</FormLabel>
                <FormInput
                  type="number"
                  min={2}
                  value={maxUses}
                  onChange={(e) => setMaxUses(Math.max(2, Number(e.target.value)))}
                />
              </div>
            )}

            <div>
              <FormLabel>Expires</FormLabel>
              <FormInput
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-[11px] text-text-muted mt-1">Leave empty for no expiration</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={loading} className="flex-1">
                Generate
              </Button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}
