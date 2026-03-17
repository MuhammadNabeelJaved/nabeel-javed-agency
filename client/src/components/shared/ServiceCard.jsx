import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

/**
 * ServiceCard
 * @param {{ service: { title: string, description: string, icon: React.ReactNode, features: string[], price: string } }} props
 */
export default function ServiceCard({ service }) {
  const [hovered, setHovered] = useState(false);

  const { title, description, icon, features = [], price } = service;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col rounded-2xl overflow-hidden h-full cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: hovered ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: hovered
          ? '0 0 40px rgba(124,58,237,0.25), 0 20px 40px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(0,0,0,0.2)',
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Neon glow overlay on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-5 p-6 h-full">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))',
            border: '1px solid rgba(124,58,237,0.3)',
            boxShadow: '0 0 20px rgba(124,58,237,0.2)',
          }}
        >
          <span className="text-violet-400 [&>svg]:w-7 [&>svg]:h-7">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2">
          {price && (
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(168,85,247,0.9)' }}
            >
              {price}
            </span>
          )}
          <h3 className="text-white font-bold text-xl leading-tight">{title}</h3>
          <p className="text-white/60 text-sm leading-relaxed">{description}</p>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <ul className="flex flex-col gap-2 flex-1">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(124,58,237,0.25)' }}
                >
                  <Check className="w-2.5 h-2.5 text-violet-400" />
                </span>
                <span className="text-white/70 text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: hovered
              ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
              : 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.35)',
            boxShadow: hovered ? '0 0 20px rgba(124,58,237,0.4)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >
          Learn More
          <motion.span animate={{ x: hovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        </motion.button>
      </div>
    </motion.div>
  );
}
