import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RefreshCw, Terminal } from 'lucide-react';
import { Button } from '../../components/ui/Button';

function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/\\';
    const fontSize = 13;
    let columns = Math.floor(canvas.width / fontSize);
    let drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(10,10,15,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(124,58,237,0.6)';
      ctx.font = `${fontSize}px monospace`;

      columns = Math.floor(canvas.width / fontSize);
      if (drops.length !== columns) drops = Array(columns).fill(1);

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.95 ? 'rgba(168,85,247,0.9)' : 'rgba(124,58,237,0.5)';
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 40);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.3 }}
    />
  );
}

const errorLog = [
  { time: '03:47:22', level: 'FATAL', msg: 'Unhandled exception in request pipeline' },
  { time: '03:47:22', level: 'ERROR', msg: 'Memory allocation failed: heap overflow' },
  { time: '03:47:23', level: 'ERROR', msg: 'Database connection pool exhausted' },
  { time: '03:47:23', level: 'WARN', msg: 'Fallback handler triggered' },
  { time: '03:47:24', level: 'INFO', msg: 'Error report sent to monitoring system' },
  { time: '03:47:24', level: 'INFO', msg: 'Attempting graceful recovery...' },
];

const levelColors = {
  FATAL: '#ef4444',
  ERROR: '#f87171',
  WARN: '#fbbf24',
  INFO: 'rgba(124,58,237,0.8)',
};

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center px-6 py-20">
      <MatrixRain />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* 500 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-[160px] font-black leading-none mb-2"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.9) 0%, rgba(124,58,237,0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 40px rgba(239,68,68,0.3))',
          }}
        >
          500
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-semibold"
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.35)',
              color: '#f87171',
            }}
          >
            <Terminal className="w-4 h-4" /> SYSTEM FAILURE
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Internal Server Error</h1>
          <p className="text-white/50 mb-8">
            Something went catastrophically wrong on our end. Our team has been notified and is working on a fix.
          </p>
        </motion.div>

        {/* Error Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-left p-5 rounded-xl mb-8 font-mono text-xs"
          style={{
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(239,68,68,0.2)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-2 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-white/30 ml-2">server.error.log</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {errorLog.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex gap-3"
              >
                <span className="text-white/25 shrink-0">[{entry.time}]</span>
                <span
                  className="shrink-0 font-bold w-10"
                  style={{ color: levelColors[entry.level] }}
                >
                  {entry.level}
                </span>
                <span className="text-white/60">{entry.msg}</span>
              </motion.div>
            ))}
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-red-400"
            >
              _
            </motion.span>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.reload()}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-5 h-5" /> Retry
          </Button>
          <Button variant="glow" size="lg" onClick={() => navigate('/')}>
            <Home className="w-5 h-5" /> Go Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
