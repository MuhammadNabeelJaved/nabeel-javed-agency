import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import ProjectCard from '../shared/ProjectCard';

const MOCK_PROJECTS = [
  {
    id: '1',
    title: 'NovaPay — FinTech Dashboard',
    category: 'FinTech',
    description:
      'A real-time financial analytics platform with AI-powered insights, live transaction monitoring, and beautiful data visualizations used by 40k+ monthly active users.',
    tags: ['React', 'Node.js', 'PostgreSQL', 'OpenAI'],
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a855f7 100%)',
    accentColor: '#a855f7',
    year: '2024',
    image: '',
  },
  {
    id: '2',
    title: 'AeroFlow — SaaS Platform',
    category: 'SaaS',
    description:
      'End-to-end workflow automation SaaS with drag-and-drop pipeline builder, team collaboration, and 100+ third-party integrations. Scaled to 12k paying subscribers in 6 months.',
    tags: ['Next.js', 'GraphQL', 'Redis', 'AWS'],
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #38bdf8 100%)',
    accentColor: '#38bdf8',
    year: '2024',
    image: '',
  },
  {
    id: '3',
    title: 'GreenLeaf — E-Commerce',
    category: 'E-Commerce',
    description:
      'Sustainable marketplace connecting eco-conscious consumers with certified green brands. Features AI-powered product recommendations and a carbon footprint tracker.',
    tags: ['Vue.js', 'Express', 'MongoDB', 'Stripe'],
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)',
    accentColor: '#34d399',
    year: '2023',
    image: '',
  },
  {
    id: '4',
    title: 'Ignite — Mobile App',
    category: 'Mobile',
    description:
      'A fitness and wellness mobile application with personalized AI coaching, live workout sessions, nutrition tracking, and social challenges. 200k+ downloads on launch.',
    tags: ['React Native', 'Firebase', 'OpenAI', 'Stripe'],
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fb923c 100%)',
    accentColor: '#fb923c',
    year: '2023',
    image: '',
  },
  {
    id: '5',
    title: 'Luminary — AI Content Studio',
    category: 'AI/ML',
    description:
      'AI-powered content creation platform for marketing teams — generates blog posts, social copy, email campaigns, and ad creative using fine-tuned language models.',
    tags: ['Next.js', 'Python', 'OpenAI', 'Vercel'],
    gradient: 'linear-gradient(135deg, #500724 0%, #be185d 50%, #f472b6 100%)',
    accentColor: '#f472b6',
    year: '2024',
    image: '',
  },
];

// Desktop horizontal accordion panel
function AccordionPanel({ project, isActive, onClick }) {
  return (
    <motion.div
      layout
      onClick={onClick}
      animate={{ flex: isActive ? 4 : 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl cursor-pointer flex-shrink-0 min-w-0"
      style={{
        background: project.gradient,
        border: isActive
          ? `1px solid ${project.accentColor}55`
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isActive
          ? `0 0 40px ${project.accentColor}30, 0 20px 60px rgba(0,0,0,0.4)`
          : '0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: isActive
            ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)'
            : 'rgba(0,0,0,0.45)',
        }}
      />

      {/* Collapsed label (vertical) */}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span
              className="text-white font-bold text-sm tracking-wide whitespace-nowrap"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
            >
              {project.title}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded content */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="absolute bottom-0 left-0 right-0 p-6"
          >
            {/* Category badge */}
            <span
              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
              style={{
                background: `${project.accentColor}25`,
                border: `1px solid ${project.accentColor}55`,
                color: project.accentColor,
              }}
            >
              {project.category}
            </span>

            <h3 className="text-white font-bold text-xl mb-2 leading-tight">{project.title}</h3>
            <p className="text-white/65 text-sm leading-relaxed mb-4 line-clamp-3">
              {project.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {project.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.8)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${project.accentColor}55, ${project.accentColor}30)`,
                border: `1px solid ${project.accentColor}50`,
              }}
            >
              View Project
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: `${project.accentColor}30`, border: `1px solid ${project.accentColor}50` }}
        >
          <ArrowUpRight className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}

export default function FeaturedProjects() {
  const [activeId, setActiveId] = useState(MOCK_PROJECTS[0].id);

  const handleToggle = (id) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  // Mobile-friendly project objects for ProjectCard
  const mobileProjects = MOCK_PROJECTS.map((p) => ({
    ...p,
    image: '',
    description: p.description,
    tags: p.tags,
  }));

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(109,40,217,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#a78bfa',
              }}
            >
              Our Work
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
              Featured Projects
            </h2>
          </div>

          <a
            href="/projects"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all duration-200 hover:scale-105 flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            View All Projects
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Desktop Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="hidden md:flex gap-3 h-[480px]"
        >
          {MOCK_PROJECTS.map((project) => (
            <AccordionPanel
              key={project.id}
              project={project}
              isActive={activeId === project.id}
              onClick={() => handleToggle(project.id)}
            />
          ))}
        </motion.div>

        {/* Mobile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:hidden">
          {mobileProjects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mt-10"
        >
          <a
            href="/projects"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 30px rgba(124,58,237,0.35)',
            }}
          >
            View All Projects
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
