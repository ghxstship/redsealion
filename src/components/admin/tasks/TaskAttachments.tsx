'use client';

/**
 * Task file attachments — general file upload/listing for task detail.
 *
 * Supports any file type (documents, images, PDFs, etc.) via URL.
 * Distinct from TaskPhotoCapture which is job-site specific.
 *
 * @module components/admin/tasks/TaskAttachments
 */

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import { Paperclip, File, Image, FileText, Download, Trash2, Plus } from 'lucide-react';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by_name: string | null;
  created_at: string;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  image: <Image size={16} className="text-purple-500" />,
  pdf: <FileText size={16} className="text-red-500" />,
  document: <FileText size={16} className="text-blue-500" />,
  default: <File size={16} className="text-text-muted" />,
};

function getFileIcon(type: string | null, name: string): React.ReactNode {
  if (type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name))
    return FILE_ICONS.image;
  if (type === 'application/pdf' || name.endsWith('.pdf'))
    return FILE_ICONS.pdf;
  if (/\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(name))
    return FILE_ICONS.document;
  return FILE_ICONS.default;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface TaskAttachmentsProps {
  taskId: string;
}

export default function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newFile, setNewFile] = useState({ file_name: '', file_url: '' });

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments ?? []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchAttachments(); }, [fetchAttachments]);

  async function handleAdd() {
    if (!newFile.file_url.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_name: newFile.file_name || newFile.file_url.split('/').pop() || 'file',
          file_url: newFile.file_url,
        }),
      });
      if (res.ok) {
        setNewFile({ file_name: '', file_url: '' });
        setShowAdd(false);
        await fetchAttachments();
      }
    } catch { /* silent */ } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/tasks/${taskId}/attachments/${id}`, { method: 'DELETE' });
    } catch {
      await fetchAttachments();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Paperclip size={14} className="text-text-muted" />
          Attachments
          {attachments.length > 0 && (
            <span className="text-text-muted font-normal">
              ({attachments.length})
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs font-medium text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="border-b border-border bg-bg-secondary/30 px-5 py-4 space-y-3">
          <div>
            <FormLabel>File URL</FormLabel>
            <FormInput
              type="url"
              value={newFile.file_url}
              onChange={(e) => setNewFile((p) => ({ ...p, file_url: e.target.value }))}
              placeholder="https://storage.example.com/file.pdf"
              autoFocus
            />
          </div>
          <div>
            <FormLabel>Display Name (optional)</FormLabel>
            <FormInput
              type="text"
              value={newFile.file_name}
              onChange={(e) => setNewFile((p) => ({ ...p, file_name: e.target.value }))}
              placeholder="Design mockup v2.pdf"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={adding || !newFile.file_url.trim()}>
              {adding ? 'Adding…' : 'Attach File'}
            </Button>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="px-5 py-6 text-center text-xs text-text-muted">Loading…</div>
        ) : attachments.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <Paperclip size={20} className="mx-auto text-text-muted/50 mb-1" />
            <p className="text-xs text-text-muted">No files attached.</p>
          </div>
        ) : (
          attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-3 px-5 py-3 group hover:bg-bg-secondary/30 transition-colors">
              {getFileIcon(att.file_type, att.file_name)}
              <div className="flex-1 min-w-0">
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:underline truncate block"
                >
                  {att.file_name}
                </a>
                <p className="text-[11px] text-text-muted">
                  {att.uploaded_by_name && <>{att.uploaded_by_name} · </>}
                  {formatFileSize(att.file_size)}
                  {att.file_size && ' · '}
                  {new Date(att.created_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-foreground transition-all"
                title="Download"
              >
                <Download size={14} />
              </a>
              <button
                onClick={() => handleDelete(att.id)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-600 transition-all"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
