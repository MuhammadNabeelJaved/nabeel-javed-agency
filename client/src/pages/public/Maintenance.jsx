import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock } from 'lucide-react';

function Gear({ size, cx, cy, duration, reverse = false, color }) {
  const teeth = 8;
  const outerR = size / 2;
  const innerR = outerR * 0.75;
  const toothW = (2 * Math.PI * outerR) / (teeth * 2.5);

  const points = [];
  for (let i = 0; i < teeth; i++) {
    const angleStep = (2 * Math.PI) / teeth;
    const a1 = i * angleStep - toothW / outerR / 2;
    const a2 = i * angleStep + toothW / outerR / 2;
    const a3 = i * angleStep + angleStep * 0.3 + toothW / outerR / 2;
    const a4 = i * angleStep + angleStep * 0.3 - toothW / outerR / 2;

    points.push(
      `${cx + outerR * 1.18 * Math.cos(a1)},${cy + outerR * 1.18 * Math.sin(a1)}`,
      `${cx + outerR * 1.18 * Math.cos(a2)},${cy + outerR * 1.18 * Math.sin(a2)}`,
      `${cx + innerR * Math.cos(a3)},${cy + innerR * Math.sin(a3)}`,
      `${cx + innerR * Math.cos(a4)},${cy + innerR * Math.sin(a4)}`
    );
  }

  return (
    <motion.g
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      <polygon
        points={points.join(' ')}
        fill={color}
        stroke="rgba(124,58,237,0.3)"
        strokeWidth="0.5"
        opacity="0.9"
      />
      <circle cx={cx} cy={cy} r={size * 0.28} fill="rgba(10,10,15,0.9)" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r={size * 0.1} fill="rgba(124,58,237,0.6)" />
    </motion.g>
  );
}

const ESTIMATED_MINUTES = 45;
const PROGRESS = 35;

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-xl w-full text-center">
        {/* Gears Cluster */}
        <div className="flex justify-center mb-6">
          <svg width="240" height="160" viewBox="0 0 240 160">
            <Gear size={80} cx={90} cy={80} duration={6} color="rgba(124,58,237,0.4)" />
            <Gear size={52} cx={154} cy={55} duration={4} reverse color="rgba(168,85,247,0.5)" />
            <Gear size={38} cx={165} cy={115} duration={3} color="rgba(196,168,255,0.4)" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-sm font-semibold"
            style={{
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.3)',
              color: '#fbbf24',
            }}
          >
            <Settings className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            System Maintenance
          </div>

          <h1 className="text-5xl font-black text-white mb-3">Under Maintenance</h1>
          <p className="text-white/60 text-lg mb-8 max-w-md mx-auto">
            We're performing scheduled maintenance to improve performance and reliability. We'll be back shortly.
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/40">Maintenance progress</span>
              <span className="text-amber-400 font-bold">{PROGRESS}%</span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  boxShadow: '0 0 12px rgba(251,191,36,0.5)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${PROGRESS}%` }}
                transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Estimated Time */}
          <div
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-sm"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="text-white/60">Estimated completion:</span>
            <span className="text-white font-bold">~{ESTIMATED_MINUTES} minutes</span>
          </div>

          <p className="text-white/25 text-xs mt-8">
            Follow us on Twitter for real-time updates • @nabeeldev
          </p>
        </motion.div>
      </div>
    </div>
  );
}
