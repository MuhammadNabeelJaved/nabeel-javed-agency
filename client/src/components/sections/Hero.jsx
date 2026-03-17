import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Zap,
  BarChart3,
  Smartphone,
  Fingerprint,
  Cloud,
  ArrowDown,
  ArrowRight,
} from 'lucide-react';
import { useContent } from '../../contexts/ContentContext';

/* ─── Float animation keyframes injected once ─── */
const FLOAT_STYLE_ID = 'hero-float-keyframes';
if (typeof document !== 'undefined' && !document.getElementById(FLOAT_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = FLOAT_STYLE_ID;
  style.textContent = `
    @keyframes heroFloat {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33%       { transform: translateY(-12px) rotate(2deg); }
      66%       { transform: translateY(-6px) rotate(-1deg); }
    }
    @keyframes blobPulse {
      0%, 100% { transform: scale(1) translate(0, 0); }
      50%       { transform: scale(1.15) translate(20px, -20px); }
    }
    @keyframes blobPulse2 {
      0%, 100% { transform: scale(1) translate(0, 0); }
      50%       { transform: scale(1.1) translate(-15px, 15px); }
    }
    @keyframes greenPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(1.4); }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Floating icon cards around hero ─── */
const floatingCards = [
  { icon: Code,        label: 'Clean Code',    top: '18%', left: '5%',  delay: 0 },
  { icon: Zap,         label: 'Fast & Scalable', top: '12%', right: '7%', delay: 0.5 },
  { icon: BarChart3,   label: 'Data-Driven',   top: '55%', left: '3%',  delay: 1.0 },
  { icon: Smartphone,  label: 'Mobile First',  top: '62%', right: '5%', delay: 0.3 },
  { icon: Fingerprint, label: 'Secure',        top: '82%', left: '12%', delay: 0.8 },
  { icon: Cloud,       label: 'Cloud Native',  top: '80%', right: '10%',delay: 1.2 },
];

/* ─── Stats ─── */
const stats = [
  { value: '50+',  label: 'Projects' },
  { value: '98%',  label: 'Satisfaction' },
  { value: '5★',   label: 'Rating' },
  { value: '24/7', label: 'Support' },
];

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const statVariants = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'backOut' } },
};

export default function Hero() {
  const { heroContent } = useContent();
  const { badge, heading, headingHighlight, headingEnd, subheading, primaryCta, secondaryCta } =
    heroContent;

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#09090b' }}
    >
      {/* ── Gradient blobs ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          left: '-15%',
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 65%)',
          animation: 'blobPulse 8s ease-in-out infinite',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-5%',
          right: '-10%',
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 65%)',
          animation: 'blobPulse2 10s ease-in-out infinite',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '40%',
          left: '50%',
          width: 400,
          height: 400,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* ── Concentric ring decorations ── */}
      {[500, 700, 900].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            transform: 'translate(-50%, -50%)',
            border: `1px solid rgba(124,58,237,${0.08 - i * 0.02})`,
          }}
        />
      ))}

      {/* ── Floating icon cards (hidden on mobile) ── */}
      {floatingCards.map(({ icon: Icon, label, delay, ...pos }, idx) => (
        <div
          key={idx}
          className="absolute hidden lg:flex items-center gap-2 px-3 py-2.5 rounded-xl pointer-events-none"
          style={{
            ...pos,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: `heroFloat ${4 + idx * 0.4}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-white/70 text-xs font-medium whitespace-nowrap">{label}</span>
        </div>
      ))}

      {/* ── Main content ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto gap-6 pt-20 pb-32"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants}>
          <span
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: 'rgba(196,168,255,0.95)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"
              style={{ animation: 'greenPulse 2s ease-in-out infinite' }}
            />
            {badge}
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight"
          style={{ color: '#fff' }}
        >
          {heading}{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {headingHighlight}
          </span>{' '}
          {headingEnd}
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-xl max-w-2xl leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {subheading}
        </motion.p>

        {/* CTA buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mt-2">
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 40px rgba(124,58,237,0.45), 0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            {primaryCta}
            <ArrowRight className="w-4 h-4" />
          </motion.a>
          <motion.a
            href="/projects"
            whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {secondaryCta}
          </motion.a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={statVariants}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="text-2xl sm:text-3xl font-extrabold"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="text-white/30 text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-4 h-4 text-white/30" />
        </motion.div>
      </motion.div>
    </section>
  );
}
