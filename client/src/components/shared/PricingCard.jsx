import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';

/**
 * PricingCard
 * @param {{ plan: { name: string, price: string, period: string, description: string, features: string[], cta: string, popular: boolean } }} props
 */
export default function PricingCard({ plan }) {
  const [hovered, setHovered] = useState(false);

  const { name, price, period, description, features = [], cta, popular } = plan;

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col rounded-2xl overflow-hidden h-full"
      style={{
        background: popular
          ? 'linear-gradient(160deg, rgba(124,58,237,0.18) 0%, rgba(9,9,11,0.95) 60%)'
          : 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: popular
          ? '1px solid rgba(124,58,237,0.6)'
          : hovered
          ? '1px solid rgba(124,58,237,0.3)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: popular
          ? '0 0 50px rgba(124,58,237,0.3), 0 20px 50px rgba(0,0,0,0.4)'
          : hovered
          ? '0 0 30px rgba(124,58,237,0.15), 0 20px 40px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(0,0,0,0.2)',
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Popular badge */}
      {popular && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            boxShadow: '0 0 20px rgba(124,58,237,0.5)',
          }}
        >
          <Zap className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-bold tracking-wide uppercase">Most Popular</span>
        </div>
      )}

      {/* Neon top line for popular */}
      {popular && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: 'linear-gradient(90deg, transparent, #7c3aed, #a855f7, transparent)',
          }}
        />
      )}

      {/* Glow overlay on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(124,58,237,0.1) 0%, transparent 65%)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-5 p-7 h-full">
        {/* Header */}
        <div className={`flex flex-col gap-1 ${popular ? 'pt-4' : ''}`}>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: popular ? 'rgba(168,85,247,0.9)' : 'rgba(255,255,255,0.4)' }}
          >
            {name}
          </span>

          <div className="flex items-end gap-1 mt-2">
            <span className="text-4xl font-extrabold text-white leading-none">{price}</span>
            {period && (
              <span className="text-white/40 text-sm mb-1 ml-1">/ {period}</span>
            )}
          </div>

          {description && (
            <p className="text-white/55 text-sm leading-relaxed mt-1">{description}</p>
          )}
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{
            background: popular
              ? 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)'
              : 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Features */}
        <ul className="flex flex-col gap-3 flex-1">
          {features.map((feature, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              viewport={{ once: true }}
              className="flex items-start gap-3"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: popular ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                  border: popular ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Check
                  className="w-3 h-3"
                  style={{ color: popular ? '#a855f7' : 'rgba(255,255,255,0.5)' }}
                />
              </span>
              <span className="text-white/75 text-sm leading-relaxed">{feature}</span>
            </motion.li>
          ))}
        </ul>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="mt-auto w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all"
          style={
            popular
              ? {
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  boxShadow: hovered ? '0 0 30px rgba(124,58,237,0.6)' : '0 0 20px rgba(124,58,237,0.35)',
                  transition: 'box-shadow 0.3s ease',
                }
              : {
                  background: hovered ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                }
          }
        >
          {cta || 'Get Started'}
        </motion.button>
      </div>
    </motion.div>
  );
}
