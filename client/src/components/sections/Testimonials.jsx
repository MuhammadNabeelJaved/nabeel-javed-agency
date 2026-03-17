import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const TESTIMONIALS = [
  {
    id: '1',
    quote:
      'Working with this team was a game-changer. They delivered our entire SaaS platform 2 weeks ahead of schedule and the code quality was exceptional. We doubled our conversion rate within a month of launch.',
    name: 'Sarah Chen',
    role: 'CEO',
    company: 'NovaPay',
    initials: 'SC',
    color: '#7c3aed',
  },
  {
    id: '2',
    quote:
      "The UI/UX design they crafted is simply stunning. Our users constantly compliment how intuitive and beautiful the product is. It's now a key differentiator in our market.",
    name: 'Marcus Rodriguez',
    role: 'CTO',
    company: 'AeroFlow Inc.',
    initials: 'MR',
    color: '#0ea5e9',
  },
  {
    id: '3',
    quote:
      'I was skeptical about outsourcing our core product development, but these guys proved every doubt wrong. Transparent communication, clean architecture, and zero surprises. Highly recommend.',
    name: 'Priya Patel',
    role: 'Founder',
    company: 'GreenLeaf',
    initials: 'PP',
    color: '#059669',
  },
  {
    id: '4',
    quote:
      "We needed an AI-powered feature built fast. They shipped it in 3 weeks — fully tested, documented, and integrated seamlessly into our existing stack. That's rare.",
    name: 'James Okafor',
    role: 'VP Engineering',
    company: 'Luminary AI',
    initials: 'JO',
    color: '#be185d',
  },
  {
    id: '5',
    quote:
      "The mobile app they built for us hit 200k downloads in the first month. Performance is buttery smooth on both iOS and Android. The team's attention to detail is unmatched.",
    name: 'Ava Thompson',
    role: 'Product Lead',
    company: 'Ignite Fitness',
    initials: 'AT',
    color: '#ea580c',
  },
  {
    id: '6',
    quote:
      "Our old site was a disaster — slow, ugly, and converting terribly. After the redesign and rebuild, page speed went from 43 to 97 on Lighthouse and leads tripled. Incredible ROI.",
    name: 'Daniel Kim',
    role: 'Marketing Director',
    company: 'TrueScale',
    initials: 'DK',
    color: '#7c3aed',
  },
  {
    id: '7',
    quote:
      'They understood our brand vision from day one and translated it perfectly into a digital experience. Every pixel matters to them — and it shows in the final product.',
    name: 'Natalie Russo',
    role: 'Creative Director',
    company: 'Forme Studio',
    initials: 'NR',
    color: '#a855f7',
  },
  {
    id: '8',
    quote:
      "Best investment we made for our startup. They built our MVP in 6 weeks, helped us raise our seed round with the demo, and are still our go-to team for every technical challenge.",
    name: 'Ethan Brooks',
    role: 'Co-Founder',
    company: 'PivotDesk',
    initials: 'EB',
    color: '#0ea5e9',
  },
];

function StarRating({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber-400 text-sm">★</span>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <div
      className="flex-shrink-0 w-80 sm:w-96 p-6 rounded-2xl mx-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* Stars */}
      <StarRating />

      {/* Quote */}
      <p className="text-white/70 text-sm leading-relaxed mt-4 mb-5">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${testimonial.color}, ${testimonial.color}88)`,
            boxShadow: `0 0 16px ${testimonial.color}40`,
          }}
        >
          {testimonial.initials}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{testimonial.name}</p>
          <p className="text-white/45 text-xs">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, reverse = false }) {
  const doubled = [...items, ...items];

  return (
    <div
      className="overflow-hidden"
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div
        className={cn('flex w-max', reverse ? 'animate-scroll-reverse' : 'animate-scroll')}
        style={{ animationDuration: '55s' }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.id}-${i}`} testimonial={t} />
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const row1 = TESTIMONIALS.slice(0, 4);
  const row2 = TESTIMONIALS.slice(4);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(109,40,217,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-14"
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              color: '#a78bfa',
            }}
          >
            Client Love
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
            What Our Clients Say
          </h2>
        </motion.div>
      </div>

      {/* Marquee rows — full-width outside container */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7 }}
        className="flex flex-col gap-5"
      >
        <MarqueeRow items={row1} reverse={false} />
        <MarqueeRow items={row2} reverse={true} />
      </motion.div>
    </section>
  );
}
