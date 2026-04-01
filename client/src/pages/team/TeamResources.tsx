/**
 * Team Resources Page
 * Upload files to Cloudinary, store metadata in DB, fetch + display + delete.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload, Trash2, Download, FileText, Image, Film,
  Archive, File, Loader2, Search, Plus, X, CheckSquare, Square,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import ConfirmDeleteDialog from '../../components/ui/ConfirmDeleteDialog';
import { resourcesApi } from '../../api/resources.api';
import { toast } from 'sonner';
import { useBulkSelect } from '../../hooks/useBulkSelect';
import { useDataRealtime } from '../../hooks/useDataRealtime';
import { BulkActionBar } from '../../components/BulkActionBar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resource {
  _id: string;
  name: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  resourceType: string;
  uploadedBy: { _id: string; name: string; photo?: string } | null;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFileIcon(mimeType: string, resourceType: string) {
  if (mimeType?.startsWith('image/') || resourceType === 'image')
    return <Image className="h-8 w-8 text-blue-500" />;
  if (mimeType?.startsWith('video/') || resourceType === 'video')
    return <Film className="h-8 w-8 text-purple-500" />;
  if (mimeType === 'application/pdf')
    return <FileText className="h-8 w-8 text-red-500" />;
  if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('tar'))
    return <Archive className="h-8 w-8 text-amber-500" />;
  if (mimeType?.includes('word') || mimeType?.includes('document') || mimeType?.includes('text'))
    return <FileText className="h-8 w-8 text-sky-500" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function getIconBg(mimeType: string, resourceType: string): string {
  if (mimeType?.startsWith('image/') || resourceType === 'image') return 'bg-blue-500/10';
  if (mimeType?.startsWith('video/') || resourceType === 'video') return 'bg-purple-500/10';
  if (mimeType === 'application/pdf') return 'bg-red-500/10';
  if (mimeType?.includes('zip') || mimeType?.includes('rar')) return 'bg-amber-500/10';
  return 'bg-muted';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamResources() {
  const [resources, setResources]           = useState<Resource[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [uploading, setUploading]           = useState(false);
  const [search, setSearch]                 = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchResources = useCallback(async () => {
    setError(null);
    try {
      const res = await resourcesApi.getAll();
      setResources(res.data.data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      const status = err?.response?.status;
      setError(`API Error ${status ? `(${status})` : ''}: ${msg}`);
      console.error('[Resources] fetch failed:', err?.response || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useDataRealtime('resources', fetchResources);
  useEffect(() => { fetchResources(); }, [fetchResources]);

  // ── Upload ───────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      try {
        await resourcesApi.upload(formData);
        successCount++;
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}`, { description: err?.response?.data?.message || 'Please try again.' });
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded`);
      await fetchResources();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await resourcesApi.delete(deleteTargetId);
      setResources(prev => prev.filter(r => r._id !== deleteTargetId));
      toast.success('File deleted');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error('Failed to delete file', { description: err?.response?.data?.message || 'Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Download ─────────────────────────────────────────────────────────────

  const handleDownload = (resource: Resource) => {
    const a = document.createElement('a');
    a.href = resource.url;
    a.download = resource.originalName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    // Simulate file input change
    const dt = new DataTransfer();
    Array.from(files).forEach(f => dt.items.add(f));
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
      fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  // ── Filtered ─────────────────────────────────────────────────────────────

  const filtered = resources.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.originalName.toLowerCase().includes(search.toLowerCase())
  );

  const bulk = useBulkSelect(filtered);

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await resourcesApi.bulkDelete(bulk.ids);
      toast.success(`${bulk.count} file(s) deleted`);
      bulk.clear();
      fetchResources();
    } catch (err: any) {
      toast.error('Bulk delete failed', { description: err?.response?.data?.message });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Resources</h2>
          <p className="text-muted-foreground">Access shared files and team documents.</p>
        </div>
        <Button
          className="gap-2 shadow-lg shadow-primary/20"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
            : <><Upload className="h-4 w-4" /> Upload New</>
          }
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files…"
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setSearch('')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <X className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-destructive">Failed to load resources</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchResources}>Try Again</Button>
        </div>
      ) : filtered.length === 0 ? (
        /* Drop zone when empty */
        <div
          className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground gap-3 hover:border-primary/40 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Upload className="h-7 w-7 opacity-40" />
          </div>
          <p className="text-lg font-medium">
            {search ? 'No files match your search' : 'No files yet'}
          </p>
          {!search && (
            <p className="text-sm">Click or drag & drop files here to upload</p>
          )}
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {filtered.map(resource => (
            <Card
              key={resource._id}
              className={`group transition-all duration-200 cursor-pointer ${bulk.isSelected(resource._id) ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/40'}`}
              onClick={() => window.open(resource.url, '_blank')}
            >
              <CardContent className="p-5 flex flex-col gap-4">
                {/* Checkbox */}
                <div className="flex items-center justify-between" onClick={e => e.stopPropagation()}>
                  <button onClick={() => bulk.toggle(resource._id)}>
                    {bulk.isSelected(resource._id)
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    }
                  </button>
                </div>
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getIconBg(resource.mimeType, resource.resourceType)}`}>
                  {getFileIcon(resource.mimeType, resource.resourceType)}
                </div>

                {/* Name + size */}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors" title={resource.name}>
                    {resource.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatSize(resource.size)}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                        {resource.uploadedBy?.name?.[0] ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(resource.createdAt)}
                    </span>
                  </div>

                  {/* Actions — stop card click propagation */}
                  <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      title="Download"
                      onClick={() => handleDownload(resource)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => setDeleteTargetId(resource._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {resources.length > 0 && (
        <p className="text-xs text-muted-foreground pt-1">
          {filtered.length} of {resources.length} file{resources.length !== 1 ? 's' : ''}
          {' · '}
          {formatSize(resources.reduce((acc, r) => acc + (r.size || 0), 0))} total
        </p>
      )}

      {/* Confirm Delete */}
      <ConfirmDeleteDialog
        open={!!deleteTargetId}
        onClose={() => !deleting && setDeleteTargetId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        description="This will permanently delete the file from Cloudinary and cannot be undone."
      />

      <BulkActionBar
        count={bulk.count}
        onClear={bulk.clear}
        itemLabel="file"
        actions={[
          {
            label: 'Delete Selected',
            icon: Trash2,
            variant: 'destructive',
            loading: isBulkDeleting,
            onClick: handleBulkDelete,
          },
        ]}
      />
    </div>
  );
}
