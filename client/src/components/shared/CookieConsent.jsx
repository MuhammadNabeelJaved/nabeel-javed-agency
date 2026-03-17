import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay so it doesn't pop up instantly on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed bottom-6 left-1/2 z-50 w-full max-w-lg px-4"
          style={{ transform: 'translateX(-50%)' }}
          // Override transform since we're using framer motion + centering trick
        >
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: 'rgba(9, 9, 11, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.15)',
            }}
          >
            {/* Top row */}
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5" role="img" aria-label="Cookie">
                🍪
              </span>
              <div>
                <h3 className="text-white font-semibold text-sm mb-1">We use cookies</h3>
                <p className="text-white/60 text-xs leading-relaxed">
                  We use cookies to enhance your experience, analyze site traffic, and personalize
                  content. By clicking "Accept All", you consent to our use of cookies as described
                  in our{' '}
                  <a
                    href="/privacy"
                    className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.35)',
                }}
              >
                Accept All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDecline}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                Decline
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
