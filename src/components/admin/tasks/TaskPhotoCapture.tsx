'use client';

import { useState, useEffect, useCallback } from 'react';

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

const TYPE_COLORS: Record<string, string> = {
  before: 'bg-gray-100 text-gray-600',
  progress: 'bg-blue-50 text-blue-700',
  completion: 'bg-green-50 text-green-700',
  issue: 'bg-red-50 text-red-700',
  reference: 'bg-purple-50 text-purple-700',
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
    <div className="rounded-xl border border-border bg-white">
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
              <label className="block text-xs font-medium text-text-secondary mb-1">Photo URL</label>
              <input
                type="url"
                value={newPhoto.file_url}
                onChange={(e) => setNewPhoto((p) => ({ ...p, file_url: e.target.value }))}
                placeholder="https://storage.example.com/photo.jpg"
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
              <select
                value={newPhoto.photo_type}
                onChange={(e) => setNewPhoto((p) => ({ ...p, photo_type: e.target.value }))}
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Caption</label>
            <input
              type="text"
              value={newPhoto.caption}
              onChange={(e) => setNewPhoto((p) => ({ ...p, caption: e.target.value }))}
              placeholder="Describe what this photo shows…"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading || !newPhoto.file_url}
              className="rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Add Photo'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-text-muted">Loading…</div>
      ) : photos.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-text-muted">No photos yet.</p>
          <p className="text-xs text-text-muted mt-1">Capture before, during, and after photos for verification.</p>
        </div>
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
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[photo.photo_type] ?? TYPE_COLORS.progress}`}>
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
