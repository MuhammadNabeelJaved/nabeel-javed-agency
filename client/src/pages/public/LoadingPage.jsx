import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

const STATUS_MESSAGES = [
  'Initializing...',
  'Loading assets...',
  'Configuring services...',
  'Almost ready...',
  'Launching...',
];

export default function LoadingPage() {
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1200);
    return () => clearInterval(msgInterval);
  }, []);

  useEffect(() => {
    const progInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 0;
        return p + 0.8;
      });
    }, 50);
    return () => clearInterval(progInterval);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]"
      style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.15) 0%, #0a0a0f 70%)',
      }}
    >
      {/* Concentric Rotating Rings */}
      <div className="relative mb-12" style={{ width: 200, height: 200 }}>
        {[
          { size: 200, duration: 8, color: 'rgba(124,58,237,0.35)', dasharray: '30 10' },
          { size: 150, duration: 5, color: 'rgba(168,85,247,0.45)', dasharray: '20 8', reverse: true },
          { size: 100, duration: 3, color: 'rgba(196,168,255,0.5)', dasharray: '10 6' },
        ].map((ring, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: ring.size,
              height: ring.size,
              top: (200 - ring.size) / 2,
              left: (200 - ring.size) / 2,
              borderRadius: '50%',
            }}
            animate={{ rotate: ring.reverse ? -360 : 360 }}
            transition={{ duration: ring.duration, repeat: Infinity, ease: 'linear' }}
          >
            <svg width={ring.size} height={ring.size} viewBox={`0 0 ${ring.size} ${ring.size}`}>
              <circle
                cx={ring.size / 2}
                cy={ring.size / 2}
                r={ring.size / 2 - 2}
                fill="none"
                stroke={ring.color}
                strokeWidth="2"
                strokeDasharray={ring.dasharray}
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        ))}

        {/* Center CPU */}
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.25))',
              border: '1px solid rgba(124,58,237,0.5)',
              boxShadow: '0 0 30px rgba(124,58,237,0.4)',
            }}
          >
            <Cpu className="w-8 h-8 text-violet-400" />
            {/* Scan line */}
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
            >
              <motion.div
                className="w-full h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.8), transparent)' }}
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="h-8 overflow-hidden mb-8 relative">
        <motion.div
          key={statusIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="text-center font-mono text-sm"
          style={{ color: 'rgba(168,85,247,0.9)' }}
        >
          {STATUS_MESSAGES[statusIndex]}
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="w-64">
        <div
          className="w-full h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 10px rgba(124,58,237,0.6)',
            }}
            transition={{ duration: 0.05 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-white/20 text-xs font-mono">
          <span>Loading</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
