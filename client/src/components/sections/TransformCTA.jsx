import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, Calendar, Star, TrendingUp } from 'lucide-react';

const STATS = [
  { icon: TrendingUp, value: '50+', label: 'Projects Delivered' },
  { icon: Star, value: '4.9/5', label: 'Client Rating' },
  { icon: ArrowUpRight, value: '$10M+', label: 'Revenue Generated' },
];

const RING_CONFIG = [
  { size: 340, duration: '12s', opacity: 0.15, dasharray: '8 16' },
  { size: 500, duration: '20s', opacity: 0.1, dasharray: '4 20' },
  { size: 660, duration: '30s', opacity: 0.07, dasharray: '2 24' },
];

export default function TransformCTA() {
  const sectionRef = useRef(null);

  // Mouse spotlight
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const spotlightLeft = useTransform(springX, (v) => `${v * 100}%`);
  const spotlightTop = useTransform(springY, (v) => `${v * 100}%`);

  const handleMouseMove = useCallback(
    (e) => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative py-32 overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      {/* Deep bg gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 50%, rgba(76,29,149,0.35) 0%, rgba(109,40,217,0.12) 40%, transparent 70%)',
        }}
      />

      {/* Mouse-reactive spotlight */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          left: spotlightLeft,
          top: spotlightTop,
          translateX: '-50%',
          translateY: '-50%',
          width: 700,
          height: 700,
          background:
            'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(124,58,237,0.08) 40%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      {/* Perspective grid floor */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden"
        style={{ height: '55%' }}
      >
        <svg
          className="absolute bottom-0 left-0 right-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ opacity: 0.18 }}
        >
          {/* Horizontal lines converging to horizon */}
          {[0.1, 0.2, 0.35, 0.5, 0.65, 0.8, 1].map((t, i) => {
            const y = 320 * t;
            return (
              <line
                key={`h${i}`}
                x1="0"
                y1={y}
                x2="1440"
                y2={y}
                stroke="url(#gridGradH)"
                strokeWidth="1"
              />
            );
          })}
          {/* Vertical lines fanning from center */}
          {Array.from({ length: 17 }).map((_, i) => {
            const spread = (i - 8) * 100;
            return (
              <line
                key={`v${i}`}
                x1={720 + spread * 0.1}
                y1={0}
                x2={720 + spread}
                y2={320}
                stroke="url(#gridGradV)"
                strokeWidth="1"
              />
            );
          })}
          <defs>
            <linearGradient id="gridGradH" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
              <stop offset="30%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="70%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gridGradV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Orbiting rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {RING_CONFIG.map((ring, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: ring.size,
              height: ring.size,
              border: `1px solid rgba(139,92,246,${ring.opacity})`,
              animation: `spin ${ring.duration} linear infinite`,
              animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
              // dashed-like feel via box-shadow dots not possible; use border
              borderStyle: 'dashed',
              opacity: ring.opacity * 6,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{
              background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#c4b5fd',
            }}
          >
            Let's Build Together
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
        >
          <span className="text-white">Ready to </span>
          <span
            style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Transform
          </span>
          <br />
          <span className="text-white">Your Business?</span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/55 text-lg sm:text-xl max-w-2xl mx-auto mb-10"
        >
          From idea to launch, we build digital products that captivate users, scale effortlessly,
          and drive measurable growth for your business.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          {/* Primary */}
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            Start Your Project
            <ArrowUpRight className="w-5 h-5" />
          </motion.a>

          {/* Secondary */}
          <motion.a
            href="/contact?type=call"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white/80 hover:text-white transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <Calendar className="w-5 h-5" />
            Schedule a Call
          </motion.a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12"
        >
          {STATS.map((stat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.3)',
                }}
              >
                <stat.icon className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-left">
                <p
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(90deg, #ffffff, #c4b5fd)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-white/45 text-xs">{stat.label}</p>
              </div>

              {/* Divider */}
              {i < STATS.length - 1 && (
                <div
                  className="hidden sm:block h-10 w-px ml-6"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
