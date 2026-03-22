/**
 * Public Layout
 * Wraps all public facing pages
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Chatbot } from '../components/Chatbot';
import { ScrollToTop } from '../components/ScrollToTop';
import { PageStatusGate } from '../components/PageStatusGate';
import { AnnouncementBar } from '../components/AnnouncementBar';
import { useContent } from '../contexts/ContentContext';

export function PublicLayout() {
  const { hasActiveAnnouncements } = useContent();

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      {/* pt accounts for: navbar (64px) + optional announcement bar (40px) */}
      <main className={`flex-grow transition-[padding] duration-300 ${hasActiveAnnouncements ? 'pt-[6.5rem]' : 'pt-16'}`}>
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