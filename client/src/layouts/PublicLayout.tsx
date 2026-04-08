/**
 * Public Layout
 * Wraps all public facing pages
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Chatbot } from '../components/Chatbot';
import { ScrollToTop } from '../components/ScrollToTop';
import { PageStatusGate } from '../components/PageStatusGate';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { useContent } from '../contexts/ContentContext';

export function PublicLayout() {
  const { announcementBars, isLoading } = useContent();
  const activeBars = announcementBars.filter(g => g.bar.isActive && g.items.length > 0);
  const totalBarHeight = activeBars.length * 40; // each bar is 40px tall

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
        {/* Render stacked announcement bars */}
        {activeBars.map((barGroup, idx) => (
          <AnnouncementBar key={barGroup.bar._id} barGroup={barGroup} topOffset={idx * 40} />
        ))}
        <Navbar />
        {/* pt: navbar (64px) + all announcement bars */}
        <main
          className="flex-grow transition-[padding] duration-300"
          style={{ paddingTop: `${64 + totalBarHeight}px` }}
        >
          <PageStatusGate>
            <Outlet />
          </PageStatusGate>
        </main>
        <Footer />
        <Chatbot />
        <ScrollToTop />
      </div>
  );
}
