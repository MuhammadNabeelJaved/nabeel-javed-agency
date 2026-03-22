/**
 * AnnouncementBar
 * Infinite-scroll ticker fixed at the top of the page.
 * Active announcements from the backend are looped seamlessly.
 * Admins see an extra "Manage" button.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../contexts/ContentContext';
import { useAuth } from '../contexts/AuthContext';
import { Settings, ExternalLink, ArrowRight } from 'lucide-react';

export function AnnouncementBar() {
  const { announcements } = useContent();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (announcements.length === 0) return null;

  // Use the first announcement's colors as the bar bg
  // (or default to primary violet if only one color is needed for the whole bar)
  // Each individual item keeps its own color for text/accent
  const barBg = announcements[0]?.bgColor || '#7c3aed';
  const barText = announcements[0]?.textColor || '#ffffff';

  // Speed: ~6s per item, min 20s, max 80s
  const duration = Math.min(Math.max(announcements.length * 8, 20), 80);

  // Duplicate items 2x for seamless loop (50% translateX trick)
  const tickerItems = [...announcements, ...announcements];

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] h-10 flex items-center overflow-hidden select-none"
      style={{ backgroundColor: barBg, color: barText }}
    >
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 h-full w-16 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${barBg}, transparent)` }}
      />
      <div
        className="absolute right-0 top-0 h-full w-16 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to left, ${barBg}, transparent)` }}
      />

      {/* Admin shortcut */}
      {isAdmin && (
        <Link
          to="/admin/announcements"
          className="absolute left-3 z-20 flex items-center gap-1 text-[10px] font-semibold opacity-70 hover:opacity-100 transition-opacity rounded px-1.5 py-0.5"
          style={{ color: barText, border: `1px solid ${barText}40` }}
          title="Manage Announcements"
        >
          <Settings className="h-2.5 w-2.5" />
          <span className="hidden sm:inline">Manage</span>
        </Link>
      )}

      {/* Ticker track */}
      <div
        className="animate-ticker flex items-center whitespace-nowrap"
        style={{ '--ticker-duration': `${duration}s` } as React.CSSProperties}
      >
        {tickerItems.map((item, i) => (
          <React.Fragment key={`${item._id}-${i}`}>
            {/* Separator */}
            <span className="mx-6 opacity-40 text-xs">◆</span>

            {/* Item */}
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              {item.emoji && <span className="text-base leading-none">{item.emoji}</span>}
              <span style={{ color: barText }}>{item.text}</span>
              {item.link && (
                item.link.startsWith('http') ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:no-underline ml-1 pointer-events-auto"
                    style={{ color: barText }}
                    onClick={e => e.stopPropagation()}
                  >
                    {item.linkLabel || 'Learn More'}
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                ) : (
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:no-underline ml-1 pointer-events-auto"
                    style={{ color: barText }}
                    onClick={e => e.stopPropagation()}
                  >
                    {item.linkLabel || 'Learn More'}
                    <ArrowRight className="h-3 w-3 opacity-70" />
                  </Link>
                )
              )}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
