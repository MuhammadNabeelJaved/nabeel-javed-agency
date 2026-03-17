import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useContent } from '../../contexts/ContentContext';

const TECH_GROUPS = [
  {
    label: 'Frontend',
    category: 'Frontend',
    extra: [
      { name: 'Angular', icon: '🅰️', description: 'SPA Framework' },
      { name: 'Svelte', icon: '🔶', description: 'Compiler Framework' },
    ],
  },
  {
    label: 'Backend',
    category: 'Backend',
    extra: [],
  },
  {
    label: 'AI & Infrastructure',
    category: 'AI',
    extra: [
      { name: 'GitHub Actions', icon: '⚙️', description: 'CI/CD' },
      { name: 'Kubernetes', icon: '☸️', description: 'Orchestration' },
      { name: 'Terraform', icon: '🏗️', description: 'IaC' },
    ],
  },
];

function TechBadge({ tech }) {
  const ref = useRef(null);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setSpotlight({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const handleMouseLeave = () => setSpotlight((s) => ({ ...s, visible: false }));

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-default select-none overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Spotlight */}
      {spotlight.visible && (
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(120px circle at ${spotlight.x}px ${spotlight.y}px, rgba(139,92,246,0.18), transparent 70%)`,
          }}
        />
      )}
      <span className="text-xl leading-none">{tech.icon}</span>
      <span className="text-sm font-semibold text-white/85 whitespace-nowrap">{tech.name}</span>
    </div>
  );
}

function MarqueeRow({ items, reverse = false, speed = 40 }) {
  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden w-full" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
      <div
        className={cn('flex gap-3 w-max', reverse ? 'animate-scroll-reverse' : 'animate-scroll')}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((tech, i) => (
          <TechBadge key={`${tech.name}-${i}`} tech={tech} />
        ))}
      </div>
    </div>
  );
}

export default function TechStack() {
  const { techStack } = useContent();

  const groups = TECH_GROUPS.map((group) => {
    const fromContext = techStack.filter((t) => t.category === group.category);
    const combined = [...fromContext, ...group.extra];
    // Ensure minimum items for seamless marquee
    while (combined.length < 6) combined.push(...combined);
    return { ...group, items: combined };
  });

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% 50%, rgba(109,40,217,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa',
            }}
          >
            Our Stack
          </span>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #ffffff 30%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Powered by Modern Technology
          </h2>
        </motion.div>

        {/* Tech groups */}
        <div className="flex flex-col gap-10">
          {groups.map((group, gi) => (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: gi * 0.1, ease: 'easeOut' }}
              className="flex flex-col gap-3"
            >
              {/* Group label */}
              <div className="flex items-center gap-3 px-1">
                <div
                  className="h-px flex-1"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <span
                  className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                  style={{
                    color: '#c4b5fd',
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  {group.label}
                </span>
                <div
                  className="h-px flex-1"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>

              {/* Two marquee rows alternating direction */}
              <div className="flex flex-col gap-3">
                <MarqueeRow items={group.items} reverse={false} speed={36 + gi * 4} />
                <MarqueeRow items={[...group.items].reverse()} reverse={true} speed={40 + gi * 4} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
