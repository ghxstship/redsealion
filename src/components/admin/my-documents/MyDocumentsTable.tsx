'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { DownloadCloud, Trash2, Upload, File, Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { toast } from 'react-hot-toast';

export interface MyDocumentData {
  id: string;
  file_name: string;
  file_size: number;
  category: string;
  mime_type: string;
  created_at: string;
  version_number?: number;
}

interface MyDocumentsTableProps {
  initialFiles: MyDocumentData[];
}

export default function MyDocumentsTable({ initialFiles }: MyDocumentsTableProps) {
  const [files, setFiles] = useState<MyDocumentData[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(files.map(f => f.category)))];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const currentFile = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('category', 'personal');
    formData.append('is_personal', 'true');

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const { data } = await res.json();
        setFiles(prev => [data, ...prev]);
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
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
        toast.error('Download failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      // API files route does soft-delete if we patch, or hard delete on delete
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.id !== id));
      } else {
        toast.error('Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const filteredFiles = filterCategory === 'all' 
    ? files 
    : files.filter(f => f.category === filterCategory);

  if (files.length === 0 && !isUploading) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <EmptyState
          icon={<File size={24} />}
          message="No personal documents uploaded"
          description="Upload documents such as receipts, certifications, or personal forms securely."
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
    <Card className="overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border bg-bg-secondary/50 px-6 py-4 gap-4">
        <div className="flex items-center space-x-2">
          <FormSelect 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm rounded-md border border-border bg-background px-2 py-1"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </FormSelect>
        </div>
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
        <Table >
          <TableHeader className="bg-bg-secondary/30 text-text-muted">
            <TableRow>
              <TableHead className="px-6 py-3 font-medium">Name</TableHead>
              <TableHead className="px-6 py-3 font-medium">Size</TableHead>
              <TableHead className="px-6 py-3 font-medium">Category</TableHead>
              <TableHead className="px-6 py-3 font-medium">Version</TableHead>
              <TableHead className="px-6 py-3 font-medium">Uploaded</TableHead>
              <TableHead className="px-6 py-3 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {filteredFiles.map(file => (
              <TableRow key={file.id} className="hover:bg-bg-secondary/20 transition-colors">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <File className="text-text-muted" size={16} />
                    <span className="font-medium text-foreground">{file.file_name}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 text-text-secondary">
                  {(file.file_size / 1024 / 1024).toFixed(2)} MB
                </TableCell>
                <TableCell className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary capitalize">
                    {file.category}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-text-secondary">
                  v{file.version_number ?? 1}
                </TableCell>
                <TableCell className="px-6 py-4 text-text-secondary">
                  {new Date(file.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
