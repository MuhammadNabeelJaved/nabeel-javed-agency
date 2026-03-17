import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function ContactSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(34,197,94,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 text-center max-w-md">
        {/* Animated Checkmark */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative"
          >
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* Outer glow ring */}
              <motion.circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke="rgba(34,197,94,0.2)"
                strokeWidth="2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
              {/* Main circle */}
              <motion.circle
                cx="60"
                cy="60"
                r="48"
                fill="rgba(34,197,94,0.12)"
                stroke="rgba(34,197,94,0.5)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              />
              {/* Checkmark */}
              <motion.path
                d="M 36 60 L 52 76 L 84 44"
                fill="none"
                stroke="#22c55e"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
              />
            </svg>

            {/* Pulse rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute inset-0 rounded-full border border-emerald-500/30"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1 + ring * 0.3, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  delay: 1 + ring * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-medium"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.3)',
              color: '#4ade80',
            }}
          >
            Message Received
          </div>
          <h1 className="text-5xl font-black text-white mb-4">
            Message Sent!
          </h1>
          <p className="text-white/60 text-lg leading-relaxed mb-2">
            Thank you for reaching out. We've received your message and will get back to you within{' '}
            <span className="text-white font-semibold">24 hours</span>.
          </p>
          <p className="text-white/40 text-sm mb-10">
            Keep an eye on your inbox — we'll send a confirmation email shortly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="glow" size="lg" onClick={() => navigate('/')}>
              <Home className="w-5 h-5" /> Back to Home
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/portfolio')}>
              View Our Work <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
