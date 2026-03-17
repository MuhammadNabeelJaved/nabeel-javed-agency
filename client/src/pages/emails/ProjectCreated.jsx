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

// Demo project data
const demoProject = {
  name: 'E-Commerce Platform Redesign',
  id: 'PRJ-2024-001',
  type: 'Web Development',
  startDate: 'March 20, 2024',
  estimatedDelivery: 'June 15, 2024',
  projectManager: 'Nabeel Javed',
};

/**
 * Email template preview: Project Created
 */
export default function ProjectCreated() {
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
              🚀
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
            Your project has been created
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
            Great news — your project is now set up and our team is ready to
            begin. Here&apos;s a summary of what&apos;s been configured.
          </p>

          {/* Project Details Card */}
          <div
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h2
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                margin: '0 0 16px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Project Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Project Name', value: demoProject.name },
                { label: 'Project ID', value: demoProject.id },
                { label: 'Type', value: demoProject.type },
                { label: 'Start Date', value: demoProject.startDate },
                { label: 'Est. Delivery', value: demoProject.estimatedDelivery },
                { label: 'Project Manager', value: demoProject.projectManager },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', color: '#111827', fontWeight: '500' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline notification */}
          <div
            style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '10px',
              padding: '16px 20px',
              marginBottom: '28px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '18px' }}>📅</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#166534', margin: '0 0 4px' }}>
                Timeline Started
              </p>
              <p style={{ fontSize: '13px', color: '#16a34a', margin: '0', lineHeight: '1.5' }}>
                Your project timeline officially started on{' '}
                <strong>{demoProject.startDate}</strong>. You&apos;ll receive progress
                updates as we hit key milestones.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center' }}>
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
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)',
              }}
            >
              View Project Dashboard
            </a>
          </div>

          <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '20px 0 0' }}>
            Questions? Reply to this email or contact your project manager directly.
          </p>
        </div>

        <EmailFooter />
      </motion.div>
    </div>
  );
}
