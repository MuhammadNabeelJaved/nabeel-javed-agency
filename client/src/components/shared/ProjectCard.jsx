import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Calendar, Tag } from 'lucide-react';

/**
 * ProjectCard
 * @param {{ project: { title: string, category: string, description: string, image: string, tags: string[], year: string|number } }} props
 */
export default function ProjectCard({ project }) {
  const [hovered, setHovered] = useState(false);

  const { title, category, description, image, tags = [], year } = project;

  const truncated =
    description && description.length > 100 ? description.slice(0, 100) + '…' : description;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer h-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: hovered ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: hovered
          ? '0 0 40px rgba(124,58,237,0.2), 0 20px 40px rgba(0,0,0,0.35)'
          : '0 4px 24px rgba(0,0,0,0.2)',
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Image with overlay */}
      <div className="relative overflow-hidden" style={{ height: 200 }}>
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.07)' : 'scale(1)' }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.15))',
            }}
          />
        )}

        {/* Overlay on hover */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
        >
          <motion.div
            animate={{ scale: hovered ? 1 : 0.85, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <ArrowUpRight className="w-6 h-6 text-white" />
          </motion.div>
        </motion.div>

        {/* Category badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(124,58,237,0.7)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                border: '1px solid rgba(168,85,247,0.5)',
              }}
            >
              {category}
            </span>
          </div>
        )}

        {/* Year badge */}
        {year && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-white/70" />
            <span className="text-white/70 text-xs font-medium">{year}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
        {truncated && <p className="text-white/60 text-sm leading-relaxed">{truncated}</p>}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  color: 'rgba(196,168,255,0.9)',
                }}
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all"
          style={{
            background: hovered ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'all 0.3s ease',
          }}
        >
          View Case Study
          <ArrowUpRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
