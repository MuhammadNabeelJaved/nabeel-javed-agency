import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useContent } from '../../contexts/ContentContext';

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' },
  }),
};

export default function Process() {
  const { processSteps } = useContent();
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 85%', 'end 20%'],
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    restDelta: 0.001,
  });

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(109,40,217,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-20"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa',
            }}
          >
            How We Work
          </span>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #ffffff 30%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Our Process
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            A proven methodology that turns ideas into impactful digital products, every time.
          </p>
        </motion.div>

        {/* Timeline */}
        <div ref={containerRef} className="relative">
          {/* Vertical line track */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />
          {/* Animated fill line */}
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 origin-top hidden md:block"
            style={{
              scaleY,
              background: 'linear-gradient(to bottom, #7c3aed, #a855f7, #ec4899)',
            }}
          />

          {/* Mobile line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px block md:hidden"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />

          <div className="flex flex-col gap-12 md:gap-16">
            {processSteps.map((step, i) => {
              const isLeft = i % 2 === 0;

              return (
                <motion.div
                  key={step.id}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  variants={cardVariants}
                  className={cn(
                    'relative flex items-center gap-6',
                    'flex-row md:flex-row',
                    isLeft ? 'md:justify-start' : 'md:justify-end',
                    'pl-14 md:pl-0',
                  )}
                >
                  {/* Center dot (desktop) */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 hidden md:block z-10"
                    style={{
                      background: `linear-gradient(135deg, ${step.color?.split(' ')[1] ?? '#7c3aed'}, ${step.color?.split(' ')[3] ?? '#a855f7'})`,
                      borderColor: 'rgba(255,255,255,0.15)',
                      boxShadow: '0 0 12px rgba(124,58,237,0.6)',
                    }}
                  />

                  {/* Mobile dot */}
                  <div
                    className="absolute left-4 w-4 h-4 rounded-full border-2 block md:hidden z-10 -translate-x-1/2"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      borderColor: 'rgba(255,255,255,0.15)',
                      boxShadow: '0 0 10px rgba(124,58,237,0.5)',
                    }}
                  />

                  {/* Card — left side on even, right side on odd */}
                  <div
                    className={cn(
                      'w-full md:w-[calc(50%-40px)]',
                      isLeft ? 'md:mr-auto' : 'md:ml-auto',
                    )}
                  >
                    <div
                      className="relative p-6 rounded-2xl group hover:scale-[1.02] transition-transform duration-300"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      }}
                    >
                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, rgba(124,58,237,0.06), rgba(168,85,247,0.03))`,
                          border: '1px solid rgba(124,58,237,0.2)',
                        }}
                      />

                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br', step.color ?? 'from-violet-500 to-purple-500')}
                          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
                        >
                          {step.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Step number + title */}
                          <div className="flex items-center gap-3 mb-1">
                            <span
                              className="text-xs font-bold tracking-widest"
                              style={{
                                background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}
                            >
                              {step.step}
                            </span>
                          </div>
                          <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                          <p className="text-white/55 text-sm leading-relaxed mb-4">
                            {step.description}
                          </p>

                          {/* Bullet list */}
                          {step.details && step.details.length > 0 && (
                            <ul className="flex flex-col gap-1.5">
                              {step.details.map((detail, di) => (
                                <li key={di} className="flex items-center gap-2 text-sm text-white/50">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }}
                                  />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
