import React, { useState } from 'react';
import { motion } from 'framer-motion';

function EmailHeader() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
        padding: '36px 40px',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '800',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        >
          N
        </div>
        <span style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.5px' }}>
          Nabeel Agency
        </span>
      </div>
    </div>
  );
}

function EmailFooter() {
  return (
    <div style={{ borderTop: '1px solid #f3f4f6', padding: '24px 40px', textAlign: 'center' }}>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }}>
        © {new Date().getFullYear()} Nabeel Agency. All rights reserved.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
        {['Privacy Policy', 'Terms of Service', 'Unsubscribe'].map((link) => (
          <a key={link} href="#" style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'none' }}>
            {link}
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Email template preview: Feedback Request
 * Interactive star rating for preview purposes.
 */
export default function FeedbackRequest() {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <EmailHeader />

        {/* Body */}
        <div style={{ padding: '40px 40px 32px' }}>
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#fffbeb',
                fontSize: '28px',
              }}
            >
              💬
            </div>
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#111827',
              textAlign: 'center',
              margin: '0 0 12px',
              letterSpacing: '-0.5px',
            }}
          >
            How was your experience?
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#6b7280',
              textAlign: 'center',
              margin: '0 0 8px',
              lineHeight: '1.6',
            }}
          >
            We worked on{' '}
            <strong style={{ color: '#111827' }}>E-Commerce Platform Redesign</strong>{' '}
            together. Your feedback helps us improve and deliver better work.
          </p>

          <p
            style={{
              fontSize: '13px',
              color: '#9ca3af',
              textAlign: 'center',
              margin: '0 0 32px',
            }}
          >
            It only takes 30 seconds!
          </p>

          {/* Star Rating */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <p
              style={{
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: '500',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Rate your overall experience
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setSelected(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '36px',
                    lineHeight: 1,
                    transition: 'filter 0.15s',
                    filter:
                      star <= (hovered || selected)
                        ? 'none'
                        : 'grayscale(100%) opacity(0.4)',
                  }}
                >
                  ⭐
                </motion.button>
              ))}
            </div>
            {selected > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '13px', color: '#7c3aed', fontWeight: '500', margin: 0 }}
              >
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][selected]}
              </motion.p>
            )}
          </div>

          {/* Rating labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '28px',
              padding: '0 4px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#d1d5db' }}>Poor</span>
            <span style={{ fontSize: '11px', color: '#d1d5db' }}>Excellent</span>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <a
              href="#"
              style={{
                display: 'inline-block',
                padding: '14px 40px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                letterSpacing: '0.2px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              }}
            >
              Submit Feedback
            </a>
          </div>

          <p
            style={{
              fontSize: '13px',
              color: '#9ca3af',
              textAlign: 'center',
              margin: '0',
              lineHeight: '1.6',
            }}
          >
            Your feedback is completely anonymous and helps us serve future
            clients better. Thank you for taking the time!
          </p>
        </div>

        <EmailFooter />
      </motion.div>
    </div>
  );
}
