import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Radio } from 'lucide-react';
import { Button } from '../../components/ui/Button';

function RadarSVG() {
  const lineRef = useRef(null);

  useEffect(() => {
    let angle = 0;
    let raf;
    const animate = () => {
      angle = (angle + 1.5) % 360;
      if (lineRef.current) {
        const rad = (angle * Math.PI) / 180;
        const x = 100 + 90 * Math.cos(rad);
        const y = 100 + 90 * Math.sin(rad);
        lineRef.current.setAttribute('x2', x.toString());
        lineRef.current.setAttribute('y2', y.toString());
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background fill */}
      <circle cx="100" cy="100" r="95" fill="url(#radarGrad)" stroke="rgba(34,197,94,0.15)" strokeWidth="1" />

      {/* Concentric rings */}
      {[30, 55, 80].map((r) => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(34,197,94,0.25)" strokeWidth="1" strokeDasharray="3 4" />
      ))}

      {/* Cross hairs */}
      <line x1="100" y1="5" x2="100" y2="195" stroke="rgba(34,197,94,0.2)" strokeWidth="1" />
      <line x1="5" y1="100" x2="195" y2="100" stroke="rgba(34,197,94,0.2)" strokeWidth="1" />

      {/* Outer ring */}
      <circle cx="100" cy="100" r="93" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5" filter="url(#glow)" />

      {/* Scanner line */}
      <line
        ref={lineRef}
        x1="100"
        y1="100"
        x2="190"
        y2="100"
        stroke="rgba(34,197,94,0.9)"
        strokeWidth="2"
        filter="url(#glow)"
      />

      {/* Center dot */}
      <circle cx="100" cy="100" r="4" fill="rgba(34,197,94,0.8)" filter="url(#glow)" />

      {/* Random blips */}
      {[[140, 70], [75, 120], [160, 140]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="rgba(34,197,94,0.6)" filter="url(#glow)">
          <animate attributeName="opacity" values="0;1;0" dur={`${1.5 + i * 0.7}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

const terminalLines = [
  '> SYSTEM SCAN INITIATED...',
  '> SEARCHING FOR RESOURCE...',
  '> ERROR: Route not found [404]',
  '> TARGET SIGNAL LOST',
  '> INITIATING FALLBACK PROTOCOL...',
];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6 py-20">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(34,197,94,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Radar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <RadarSVG />
        </motion.div>

        {/* 404 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-9xl font-black leading-none mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(34,197,94,0.9) 0%, rgba(124,58,237,0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(124,58,237,0.4))',
          }}
        >
          404
        </motion.div>

        {/* Signal Lost Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-semibold"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#f87171',
          }}
        >
          <Radio className="w-4 h-4" />
          SIGNAL LOST
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-3xl font-black text-white mb-3"
        >
          Page Not Found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/50 mb-8"
        >
          The coordinates you entered don't exist in our system. The signal has been lost.
        </motion.p>

        {/* Terminal Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-left p-5 rounded-xl mb-8 font-mono text-sm"
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(34,197,94,0.25)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-white/30 text-xs ml-2">system.log</span>
          </div>
          {terminalLines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.12 }}
              className={`leading-loose ${
                line.includes('ERROR') || line.includes('LOST')
                  ? 'text-red-400'
                  : 'text-emerald-400/80'
              }`}
            >
              {line}
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 1.6, duration: 0.8, repeat: Infinity }}
            className="text-emerald-400 inline-block"
          >
            _
          </motion.div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button variant="glow" size="lg" onClick={() => navigate('/')}>
            <Home className="w-5 h-5" /> Return to Base
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" /> Go Back
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
