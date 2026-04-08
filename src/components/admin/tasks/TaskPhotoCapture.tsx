'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { PHOTO_TYPE_COLORS } from '@/components/ui/StatusBadge';
import FormSelect from '@/components/ui/FormSelect';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import EmptyState from '@/components/ui/EmptyState';

interface Photo {
  id: string;
  file_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  photo_type: string;
  taken_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  before: 'Before',
  progress: 'Progress',
  completion: 'Completion',
  issue: 'Issue',
  reference: 'Reference',
};



interface TaskPhotoCaptureProps {
  taskId: string;
}

export default function TaskPhotoCapture({ taskId }: TaskPhotoCaptureProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    file_url: '',
    caption: '',
    photo_type: 'progress',
  });

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/photos`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  async function handleUpload() {
    if (!newPhoto.file_url) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhoto),
      });
      if (res.ok) {
        setNewPhoto({ file_url: '', caption: '', photo_type: 'progress' });
        setShowUpload(false);
        await fetchPhotos();
      }
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">Job-Site Photos</h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-bg-secondary transition-colors"
        >
          {showUpload ? 'Cancel' : '+ Add Photo'}
        </button>
      </div>

      {showUpload && (
        <div className="border-b border-border bg-bg-secondary/30 px-5 py-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <FormLabel>Photo URL</FormLabel>
              <FormInput
                type="url"
                value={newPhoto.file_url}
                onChange={(e) => setNewPhoto((p) => ({ ...p, file_url: e.target.value }))}
                placeholder="https://storage.example.com/photo.jpg" />
            </div>
            <div>
              <FormLabel>Type</FormLabel>
              <FormSelect
                value={newPhoto.photo_type}
                onChange={(e) => setNewPhoto((p) => ({ ...p, photo_type: e.target.value }))}
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </FormSelect>
            </div>
          </div>
          <div>
            <FormLabel>Caption</FormLabel>
            <FormInput
              type="text"
              value={newPhoto.caption}
              onChange={(e) => setNewPhoto((p) => ({ ...p, caption: e.target.value }))}
              placeholder="Describe what this photo shows…" />
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleUpload}
              disabled={uploading || !newPhoto.file_url}>
              {uploading ? 'Uploading…' : 'Add Photo'}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-text-muted">Loading…</div>
      ) : photos.length === 0 ? (
        <EmptyState
          message="No photos yet"
          description="Capture before, during, and after photos for verification."
          className="border-0 shadow-none px-2 py-8"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-border">
              <img
                src={photo.file_url}
                alt={photo.caption || 'Job site photo'}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${PHOTO_TYPE_COLORS[photo.photo_type] ?? PHOTO_TYPE_COLORS.progress}`}>
                  {TYPE_LABELS[photo.photo_type] ?? photo.photo_type}
                </span>
                {photo.caption && (
                  <p className="text-[11px] text-white/90 mt-0.5 truncate">{photo.caption}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
