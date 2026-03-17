import React from 'react';
import { motion } from 'framer-motion';

function EmailHeader() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
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

const completionStats = [
  { label: 'Duration', value: '87 days', icon: '📅' },
  { label: 'Milestones', value: '12 / 12', icon: '✅' },
  { label: 'Deliverables', value: '24 files', icon: '📦' },
  { label: 'On Time', value: '3 days early', icon: '⚡' },
];

/**
 * Email template preview: Project Completed
 */
export default function ProjectCompleted() {
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
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                fontSize: '34px',
              }}
            >
              🎉
            </div>
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: '800',
              color: '#111827',
              textAlign: 'center',
              margin: '0 0 12px',
              letterSpacing: '-0.5px',
            }}
          >
            Project Completed! 🎉
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#6b7280',
              textAlign: 'center',
              margin: '0 0 28px',
              lineHeight: '1.6',
            }}
          >
            Your project{' '}
            <strong style={{ color: '#111827' }}>E-Commerce Platform Redesign</strong>{' '}
            has been successfully delivered. We&apos;re proud of what we built
            together!
          </p>

          {/* Completion Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '28px',
            }}
          >
            {completionStats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '2px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Thank you note */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '28px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '14px', color: '#166534', margin: '0', lineHeight: '1.7' }}>
              It has been a pleasure working with you. Your files and all
              project assets are available for download in your project
              dashboard. We hope to work with you again soon!
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              }}
            >
              ⭐ Leave a Review
            </a>
            <a
              href="#"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                backgroundColor: '#ffffff',
                color: '#374151',
                textDecoration: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1.5px solid #e5e7eb',
              }}
            >
              📥 Download Files
            </a>
          </div>

          <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '20px 0 0' }}>
            Files are available for 90 days after project completion.
          </p>
        </div>

        <EmailFooter />
      </motion.div>
    </div>
  );
}
