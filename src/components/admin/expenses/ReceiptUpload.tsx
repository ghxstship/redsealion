'use client';

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface ReceiptUploadProps {
  expenseId: string;
}

export default function ReceiptUpload({ expenseId }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const filePath = `expenses/${expenseId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      // Link receipt to expense
      await supabase.from('expense_receipts').insert({
        expense_id: expenseId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      setFileName(file.name);
      setUploaded(true);
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span>✓ {fileName} uploaded</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          className="text-xs text-text-secondary file:mr-2 file:rounded-md file:border file:border-border file:bg-bg-secondary file:px-2 file:py-1 file:text-xs file:text-foreground file:cursor-pointer"
        />
        <Button size="sm" variant="secondary" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
