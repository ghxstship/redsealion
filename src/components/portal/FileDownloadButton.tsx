'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface FileDownloadButtonProps {
  fileId: string;
  fileName: string;
}

export default function FileDownloadButton({ fileId, fileName }: FileDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/files/${fileId}/download`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Failed to get download link.');
        return;
      }

      const { url } = await res.json();
      window.open(url, '_blank');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
        style={{ color: 'var(--org-primary)' }}
      >
        {loading ? 'Loading…' : 'Open →'}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
