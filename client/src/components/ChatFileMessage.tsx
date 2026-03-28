/**
 * ChatFileMessage
 * Renders a file attachment in chat with inline preview:
 *  - Images  → inline thumbnail, click to open full
 *  - Video   → HTML5 <video> player inline
 *  - Audio   → HTML5 <audio> player inline
 *  - PDF     → iframe preview + open link
 *  - Others  → styled file card with type badge
 */
import React, { useState } from 'react';
import { ExternalLink, FileText, FileImage, Film, Music, Archive, File, Maximize2 } from 'lucide-react';

interface Props {
  fileUrl: string;
  fileName: string;
  fileMime?: string;
  isMe: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImageFile(mime?: string, name?: string): boolean {
  if (mime && mime.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif|ico|tiff)$/i.test(name ?? '');
}

function isVideoFile(mime?: string, name?: string): boolean {
  if (mime && mime.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|avi|mkv|ogv)$/i.test(name ?? '');
}

function isAudioFile(mime?: string, name?: string): boolean {
  if (mime && mime.startsWith('audio/')) return true;
  return /\.(mp3|wav|ogg|flac|m4a|aac|opus)$/i.test(name ?? '');
}

function isPdfFile(mime?: string, name?: string): boolean {
  return mime === 'application/pdf' || /\.pdf$/i.test(name ?? '');
}

function getFileExt(name: string): string {
  return (name.split('.').pop() ?? 'FILE').toUpperCase().slice(0, 5);
}

function getFileStyle(mime?: string, name?: string): { bg: string; text: string } {
  const ext = (name?.split('.').pop() ?? '').toLowerCase();
  if (mime?.startsWith('video/') || /^(mp4|mov|avi|mkv|webm)$/.test(ext))
    return { bg: 'bg-blue-500/15', text: 'text-blue-500' };
  if (mime?.startsWith('audio/') || /^(mp3|wav|ogg|flac|m4a)$/.test(ext))
    return { bg: 'bg-green-500/15', text: 'text-green-500' };
  if (mime === 'application/pdf' || ext === 'pdf')
    return { bg: 'bg-red-500/15', text: 'text-red-500' };
  if (/^(doc|docx)$/.test(ext))
    return { bg: 'bg-blue-600/15', text: 'text-blue-600' };
  if (/^(xls|xlsx|csv)$/.test(ext))
    return { bg: 'bg-green-600/15', text: 'text-green-600' };
  if (/^(ppt|pptx)$/.test(ext))
    return { bg: 'bg-orange-500/15', text: 'text-orange-500' };
  if (/^(fig|figma)$/.test(ext))
    return { bg: 'bg-purple-500/15', text: 'text-purple-500' };
  if (/^(ai|eps|sketch)$/.test(ext))
    return { bg: 'bg-orange-600/15', text: 'text-orange-600' };
  if (/^(zip|rar|7z|tar|gz)$/.test(ext))
    return { bg: 'bg-amber-500/15', text: 'text-amber-500' };
  return { bg: 'bg-muted', text: 'text-muted-foreground' };
}

function FileTypeIcon({ mime, name, className }: { mime?: string; name?: string; className?: string }) {
  const ext = (name?.split('.').pop() ?? '').toLowerCase();
  if (mime?.startsWith('image/') || /^(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/.test(ext))
    return <FileImage className={className} />;
  if (mime?.startsWith('video/') || /^(mp4|mov|avi|webm)$/.test(ext))
    return <Film className={className} />;
  if (mime?.startsWith('audio/') || /^(mp3|wav|ogg|flac)$/.test(ext))
    return <Music className={className} />;
  if (/^(zip|rar|7z|tar)$/.test(ext))
    return <Archive className={className} />;
  if (mime === 'application/pdf' || /^(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/.test(ext))
    return <FileText className={className} />;
  return <File className={className} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatFileMessage({ fileUrl, fileName, fileMime, isMe }: Props) {

  // ── Image ──────────────────────────────────────────────────────────────────
  if (isImageFile(fileMime, fileName)) {
    return (
      <a href={fileUrl} target="_blank" rel="noreferrer" className="block group">
        <div className="relative overflow-hidden rounded-xl border border-white/10 max-w-[280px]">
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full max-h-[220px] object-cover rounded-xl group-hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
            <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-90 transition-opacity drop-shadow" />
          </div>
        </div>
        <p className={`text-[10px] mt-1 truncate max-w-[280px] ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
          {fileName}
        </p>
      </a>
    );
  }

  // ── Video ──────────────────────────────────────────────────────────────────
  if (isVideoFile(fileMime, fileName)) {
    return (
      <div className="max-w-[280px]">
        <video
          src={fileUrl}
          controls
          className="w-full rounded-xl max-h-[200px] object-cover"
          preload="metadata"
        />
        <div className="flex items-center justify-between mt-1">
          <p className={`text-[10px] truncate flex-1 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
            {fileName}
          </p>
          <a href={fileUrl} target="_blank" rel="noreferrer" className={`ml-2 shrink-0 ${isMe ? 'text-primary-foreground/50 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
  if (isAudioFile(fileMime, fileName)) {
    return (
      <div className={`rounded-xl p-3 min-w-[220px] max-w-[280px] ${isMe ? 'bg-white/10 border border-white/10' : 'bg-muted/60 border border-border/50'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-green-500/15`}>
            <Music className="h-4 w-4 text-green-500" />
          </div>
          <p className={`text-xs font-medium truncate ${isMe ? 'text-primary-foreground' : 'text-foreground'}`}>
            {fileName}
          </p>
        </div>
        <audio src={fileUrl} controls className="w-full h-8" preload="metadata" />
      </div>
    );
  }

  // ── PDF preview ────────────────────────────────────────────────────────────
  if (isPdfFile(fileMime, fileName)) {
    return (
      <div className="max-w-[280px]">
        <div className={`rounded-xl overflow-hidden border ${isMe ? 'border-white/10' : 'border-border/50'}`}>
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-[180px]"
            title={fileName}
          />
        </div>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-1.5 mt-1.5 text-[10px] hover:underline ${isMe ? 'text-primary-foreground/70' : 'text-primary'}`}
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{fileName}</span>
        </a>
      </div>
    );
  }

  // ── Generic file card ──────────────────────────────────────────────────────
  const { bg, text } = getFileStyle(fileMime, fileName);
  const ext = getFileExt(fileName);

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2.5 rounded-xl p-2.5 min-w-[180px] max-w-[260px] group transition-opacity hover:opacity-80 ${
        isMe
          ? 'bg-white/10 border border-white/10'
          : 'bg-muted/60 border border-border/50'
      }`}
    >
      <div className={`h-10 w-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${bg}`}>
        <FileTypeIcon mime={fileMime} name={fileName} className={`h-4 w-4 ${text}`} />
        <span className={`text-[8px] font-bold leading-none mt-0.5 ${text}`}>{ext}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate leading-tight ${isMe ? 'text-primary-foreground' : 'text-foreground'}`}>
          {fileName}
        </p>
        <p className={`text-[10px] mt-0.5 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`}>
          Tap to open
        </p>
      </div>
      <ExternalLink className={`h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity ${isMe ? 'text-primary-foreground' : 'text-foreground'}`} />
    </a>
  );
}
