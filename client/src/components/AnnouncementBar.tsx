/**
 * AnnouncementBar
 * Renders a single announcement bar with its own config.
 * Props: barGroup containing bar config + its announcements.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Settings, ExternalLink, ArrowRight } from 'lucide-react';
import type { AnnouncementBarGroup } from '../api/announcementBars.api';
import type { AnnouncementItem } from '../api/announcements.api';

interface Props {
  barGroup: AnnouncementBarGroup;
  topOffset: number; // px from top of viewport (for stacking)
}

export function AnnouncementBar({ barGroup, topOffset }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { bar, items } = barGroup;

  if (items.length === 0) return null;

  const { bgColor, textColor, scrollEnabled, tickerDuration, textAlign,
    separatorVisible, separatorColor, itemSpacing } = bar;

  const animId = `ticker-${bar._id}`;

  // Ticker: 2 halves with enough copies so the ticker always overfills viewport
  const copiesPerHalf = Math.max(6, Math.ceil(12 / items.length));
  const half = Array.from({ length: copiesPerHalf }, (_, i) => items[i % items.length]).flat();
  const tickerItems = [...half, ...half];

  const alignClass = textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center';

  const sepStyle: React.CSSProperties = {
    marginLeft: itemSpacing,
    marginRight: itemSpacing,
    color: separatorColor || textColor,
    opacity: separatorColor ? 1 : 0.4,
  };

  const renderItem = (item: AnnouncementItem, i: number) => (
    <React.Fragment key={`${item._id ?? i}-${i}`}>
      <span style={sepStyle} className="text-xs" aria-hidden>
        {separatorVisible ? '◆' : ''}
      </span>
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        {item.emoji && <span className="text-base leading-none">{item.emoji}</span>}
        <span style={{ color: textColor }}>{item.text}</span>
        {item.link && (
          item.link.startsWith('http') ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2 hover:no-underline ml-1 pointer-events-auto"
              style={{ color: textColor }}
              onClick={e => e.stopPropagation()}
            >
              {item.linkLabel || 'Learn More'}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ) : (
            <Link
              to={item.link}
              className="inline-flex items-center gap-1 text-xs font-bold underline underline-offset-2 hover:no-underline ml-1 pointer-events-auto"
              style={{ color: textColor }}
              onClick={e => e.stopPropagation()}
            >
              {item.linkLabel || 'Learn More'}
              <ArrowRight className="h-3 w-3 opacity-70" />
            </Link>
          )
        )}
      </span>
    </React.Fragment>
  );

  return (
    <>
      {scrollEnabled && (
        <style>{`
          @keyframes ${animId} {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-${bar._id} {
            animation: ${animId} ${tickerDuration}s linear infinite;
            will-change: transform;
          }
          .ticker-${bar._id}:hover {
            animation-play-state: paused;
          }
        `}</style>
      )}

      <div
        className="fixed left-0 right-0 z-[70] h-10 flex items-center overflow-hidden select-none"
        style={{ backgroundColor: bgColor, color: textColor, top: topOffset }}
      >
        {/* Admin shortcut */}
        {isAdmin && (
          <Link
            to="/admin/announcements"
            className="absolute left-3 z-20 flex items-center gap-1 text-[10px] font-semibold opacity-70 hover:opacity-100 transition-opacity rounded px-1.5 py-0.5"
            style={{ color: textColor, border: `1px solid ${textColor}40` }}
            title={`Manage: ${bar.name}`}
          >
            <Settings className="h-2.5 w-2.5" />
            <span className="hidden sm:inline">Manage</span>
          </Link>
        )}

        {scrollEnabled ? (
          <>
            {/* Fade edges */}
            <div
              className="absolute left-0 top-0 h-full w-16 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to right, ${bgColor}ff, ${bgColor}00)` }}
            />
            <div
              className="absolute right-0 top-0 h-full w-16 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to left, ${bgColor}ff, ${bgColor}00)` }}
            />
            {/* Ticker track */}
            <div className={`ticker-${bar._id} flex items-center whitespace-nowrap`} style={{ width: 'max-content' }}>
              {tickerItems.map((item, i) => renderItem(item, i))}
            </div>
          </>
        ) : (
          /* Static bar */
          <div className={`w-full flex items-center flex-wrap gap-0 px-16 ${alignClass}`}>
            {items.map((item, i) => renderItem(item, i))}
          </div>
        )}
      </div>
    </>
  );
}
