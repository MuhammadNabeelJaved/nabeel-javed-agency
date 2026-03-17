import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Chatbot from '../components/shared/Chatbot';
import CookieConsent from '../components/shared/CookieConsent';
import { Toaster } from 'sonner';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
      <CookieConsent />
      <Toaster richColors position="top-right" />
    </div>
  );
}
