import React from 'react';
import { motion } from 'framer-motion';

const DEMO_CODE = '482917';

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
 * Email template preview: Email Verification (OTP code style)
 */
export default function EmailVerification() {
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
                backgroundColor: '#f5f3ff',
                fontSize: '28px',
              }}
            >
              🔐
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
            Verify your email address
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: '#6b7280',
              textAlign: 'center',
              margin: '0 0 32px',
              lineHeight: '1.6',
            }}
          >
            Use the 6-digit verification code below to complete your sign-in.
            Do not share this code with anyone.
          </p>

          {/* OTP Boxes */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            {DEMO_CODE.split('').map((digit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                style={{
                  width: '52px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: '800',
                  color: '#7c3aed',
                  backgroundColor: '#f5f3ff',
                  borderRadius: '10px',
                  border: '2px solid #ddd6fe',
                  letterSpacing: '0',
                  fontFamily: "'Inter', monospace",
                }}
              >
                {digit}
              </motion.div>
            ))}
          </div>

          {/* Expiry note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '28px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#ef4444' }}>⏱</span>
            <p
              style={{
                fontSize: '13px',
                color: '#ef4444',
                margin: '0',
                fontWeight: '500',
              }}
            >
              This code expires in{' '}
              <strong>10 minutes</strong>
            </p>
          </div>

          {/* Security note */}
          <div
            style={{
              backgroundColor: '#fefce8',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '14px 18px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#92400e',
                margin: '0',
                lineHeight: '1.6',
              }}
            >
              <strong>Security tip:</strong> Nabeel Agency will never ask for
              this code via phone, chat, or email. Never share your verification
              code with anyone.
            </p>
          </div>

          <p
            style={{
              fontSize: '13px',
              color: '#9ca3af',
              textAlign: 'center',
              margin: '20px 0 0',
            }}
          >
            Didn&apos;t request this? You can safely ignore this email.
          </p>
        </div>

        <EmailFooter />
      </motion.div>
    </div>
  );
}
