'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DownloadCloud, Trash2, Upload, File, Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Alert from '@/components/ui/Alert';

export interface FileData {
  id: string;
  file_name: string;
  file_size: number;
  category: string;
  mime_type: string;
  created_at: string;
}

interface FilesDataTableProps {
  initialFiles: FileData[];
}

export default function FilesDataTable({ initialFiles }: FilesDataTableProps) {
  const [files, setFiles] = useState<FileData[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const currentFile = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('category', 'general');

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const { data } = await res.json();
        setFiles(prev => [data, ...prev]);
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Upload failed');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/files/${id}/download`);
      if (res.ok) {
        const { url } = await res.json();
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        setError('Download failed');
      }
    } catch (err) {
      console.error(err);
      setError('Download failed');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
      } else {
        setError('Delete failed');
      }
    } catch (err) {
      console.error(err);
      setError('Delete failed');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  if (files.length === 0 && !isUploading) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <EmptyState
          icon={<File size={24} />}
          message="No files found"
          description="Upload documents to store them securely."
          action={
            <div className="relative inline-block mt-4">
              <Button variant="primary">
                <Upload size={16} className="mr-2" />
                Upload File
              </Button>
              <input
                type="file"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={handleUpload}
              />
            </div>
          }
        />
      </div>
    );
  }

  return (
    <>
    {error && <Alert variant="error" className="mb-4">{error}</Alert>}
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-bg-secondary/50 px-6 py-4">
        <h3 className="font-semibold text-foreground">All Files</h3>
        <div className="relative">
          <Button variant="primary" disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload size={16} className="mr-2" />}
            {isUploading ? 'Uploading...' : 'Upload File'}
          </Button>
          <input
            type="file"
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-secondary/30 text-text-muted">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Size</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Uploaded</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {files.map(file => (
              <tr key={file.id} className="hover:bg-bg-secondary/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <File className="text-text-muted" size={16} />
                    <span className="font-medium text-foreground">{file.file_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-secondary">
                  {(file.file_size / 1024 / 1024).toFixed(2)} MB
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary capitalize">
                    {file.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-text-secondary">
                  {new Date(file.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownload(file.id, file.file_name)}
                    >
                      <DownloadCloud size={16} />
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      disabled={deletingId === file.id}
                      onClick={() => setShowDeleteConfirm(file.id)}
                    >
                      {deletingId === file.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    {showDeleteConfirm && (
      <ConfirmDialog
        open
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => handleDelete(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    )}
    </>
  );
}
