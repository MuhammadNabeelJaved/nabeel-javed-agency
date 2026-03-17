import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Construction, Bell, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const LAUNCH_DATE = 'April 30, 2025';
const PROGRESS = 60;

export default function UnderConstruction() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubscribed(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Blueprint Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(124,58,237,0.06) 0px, rgba(124,58,237,0.06) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(90deg, rgba(124,58,237,0.06) 0px, rgba(124,58,237,0.06) 1px, transparent 1px, transparent 40px)
          `,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(10,10,15,0.5) 0%, rgba(10,10,15,0.95) 100%)',
        }}
      />

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Animated Rings */}
        <div className="flex justify-center mb-8">
          <div className="relative" style={{ width: 160, height: 160 }}>
            {[160, 120, 80].map((size, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  top: (160 - size) / 2,
                  left: (160 - size) / 2,
                  border: `2px ${i === 0 ? 'dashed' : 'solid'} rgba(124,58,237,${0.2 + i * 0.1})`,
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 12 - i * 3, repeat: Infinity, ease: 'linear' }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.25))',
                  border: '1px solid rgba(124,58,237,0.5)',
                  boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                }}
              >
                <Construction className="w-7 h-7 text-violet-400" />
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-semibold"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            <Construction className="w-4 h-4" /> Work in Progress
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white mb-3">
            Coming{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Soon
            </span>
          </h1>
          <p className="text-white/60 text-lg mb-8">
            We're crafting something extraordinary. Stay tuned for the launch.
          </p>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/40 font-mono">Construction Progress</span>
              <span className="text-violet-400 font-bold font-mono">{PROGRESS}%</span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)', boxShadow: '0 0 12px rgba(124,58,237,0.6)' }}
                initial={{ width: 0 }}
                animate={{ width: `${PROGRESS}%` }}
                transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/25">
              <span>Foundation</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Estimated Launch */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-8 text-sm"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Calendar className="w-4 h-4 text-violet-400" />
            <span className="text-white/50">Estimated launch:</span>
            <span className="text-white font-semibold">{LAUNCH_DATE}</span>
          </div>

          {/* Email Notify */}
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm mx-auto">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                }}
                className="placeholder:text-white/25 flex-1"
              />
              <Button type="submit" variant="glow" isLoading={loading}>
                <Bell className="w-4 h-4" /> Notify
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-2 text-emerald-400 font-medium"
            >
              <CheckCircle className="w-5 h-5" /> You're on the list!
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
