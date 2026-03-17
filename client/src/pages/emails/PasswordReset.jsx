import React from 'react';
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
 * Email template preview: Password Reset
 */
export default function PasswordReset() {
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
                backgroundColor: '#fef3c7',
                fontSize: '28px',
              }}
            >
              🔑
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
            Reset your password
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
            We received a request to reset the password for your Nabeel Agency
            account. Click the button below to choose a new password.
          </p>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <a
              href="#"
              style={{
                display: 'inline-block',
                padding: '14px 36px',
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
              Reset Password
            </a>
          </div>

          {/* Expiry */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '14px' }}>⏱</span>
            <p style={{ fontSize: '13px', color: '#f59e0b', margin: '0', fontWeight: '500' }}>
              This link expires in <strong>1 hour</strong>
            </p>
          </div>

          {/* Security note */}
          <div
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: '10px',
              padding: '16px 20px',
              borderLeft: '3px solid #e5e7eb',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#6b7280',
                margin: '0 0 6px',
                fontWeight: '600',
              }}
            >
              🔒 Security Notice
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0', lineHeight: '1.6' }}>
              If you did not request a password reset, please ignore this email
              and consider changing your password as a precaution. Your account
              security is our priority. We will never ask for your password.
            </p>
          </div>

          <p style={{ fontSize: '13px', color: '#d1d5db', textAlign: 'center', margin: '12px 0 0' }}>
            Or paste this link into your browser:{' '}
            <a href="#" style={{ color: '#7c3aed', textDecoration: 'underline' }}>
              https://nabelagency.com/reset?token=...
            </a>
          </p>
        </div>

        <EmailFooter />
      </motion.div>
    </div>
  );
}
