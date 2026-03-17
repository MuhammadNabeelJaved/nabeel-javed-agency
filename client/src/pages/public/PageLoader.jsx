import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const STEPS = [
  { pct: 0, msg: 'Booting system...' },
  { pct: 20, msg: 'Loading core modules...' },
  { pct: 45, msg: 'Connecting to services...' },
  { pct: 70, msg: 'Rendering interface...' },
  { pct: 90, msg: 'Almost there...' },
];

const DURATION_MS = 3000;
const TICK_MS = 30;

export default function PageLoader({ onEnter }) {
  const [pct, setPct] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += (100 / (DURATION_MS / TICK_MS));
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setPct(100);
        setTimeout(() => setDone(true), 300);
        return;
      }
      setPct(current);
      const stepIdx = STEPS.filter((s) => s.pct <= current).length - 1;
      setActiveStep(Math.max(0, stepIdx));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-8">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(124,58,237,0.04) 0px, rgba(124,58,237,0.04) 1px, transparent 1px, transparent 60px),
            repeating-linear-gradient(90deg, rgba(124,58,237,0.04) 0px, rgba(124,58,237,0.04) 1px, transparent 1px, transparent 60px)
          `,
        }}
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Percentage Counter */}
        <motion.div
          className="text-[clamp(80px,20vw,160px)] font-black leading-none tabular-nums mb-4"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, rgba(124,58,237,0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {Math.round(pct)}%
        </motion.div>

        {/* Progress Bar */}
        <div
          className="w-full h-0.5 mb-8 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 12px rgba(124,58,237,0.8)',
            }}
            transition={{ duration: 0.03 }}
          />
        </div>

        {/* Step Messages */}
        <div className="flex flex-col gap-2 mb-10 min-h-[140px]">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: i <= activeStep ? 1 : 0.15,
                x: 0,
              }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3 text-sm font-mono"
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: i < activeStep
                    ? '#22c55e'
                    : i === activeStep
                    ? '#a855f7'
                    : 'rgba(255,255,255,0.2)',
                  boxShadow: i === activeStep ? '0 0 8px rgba(168,85,247,0.8)' : 'none',
                }}
              />
              <span
                style={{
                  color: i < activeStep
                    ? 'rgba(34,197,94,0.7)'
                    : i === activeStep
                    ? 'rgba(168,85,247,0.9)'
                    : 'rgba(255,255,255,0.2)',
                }}
              >
                {i < activeStep ? '[DONE] ' : i === activeStep ? '[LOADING] ' : '[PENDING] '}
                {step.msg}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Enter Site Button */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Button
                variant="glow"
                size="xl"
                onClick={onEnter}
                className="mx-auto"
              >
                Enter Site <ArrowRight className="w-6 h-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
