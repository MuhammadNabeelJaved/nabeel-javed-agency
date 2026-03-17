import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter } from 'lucide-react';
import ProjectCard from '../../components/shared/ProjectCard';
import { Button } from '../../components/ui/Button';

const CATEGORIES = ['All', 'Web', 'Mobile', 'AI', 'Design'];

const allProjects = [
  {
    id: 1,
    title: 'FinTrack Dashboard',
    category: 'Web',
    description: 'Real-time financial analytics platform with complex data visualizations and live market feeds.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    year: '2024',
    slug: 'fintrack-dashboard',
  },
  {
    id: 2,
    title: 'MedPulse Mobile',
    category: 'Mobile',
    description: 'Patient health tracking app with wearable device integration and AI-powered insights.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
    tags: ['React Native', 'Firebase', 'HealthKit'],
    year: '2024',
    slug: 'medpulse-mobile',
  },
  {
    id: 3,
    title: 'NeuralSearch AI',
    category: 'AI',
    description: 'Semantic search engine powered by embeddings and large language models for enterprise knowledge bases.',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=80',
    tags: ['Python', 'OpenAI', 'Pinecone'],
    year: '2024',
    slug: 'neuralsearch-ai',
  },
  {
    id: 4,
    title: 'Luxe Brand System',
    category: 'Design',
    description: 'Complete design system and brand identity for a luxury fashion e-commerce platform.',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
    tags: ['Figma', 'Design System', 'Branding'],
    year: '2023',
    slug: 'luxe-brand-system',
  },
  {
    id: 5,
    title: 'EduLearn Platform',
    category: 'Web',
    description: 'Online learning management system with video streaming, quizzes, and certificates.',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&q=80',
    tags: ['Next.js', 'MongoDB', 'Stripe'],
    year: '2023',
    slug: 'edulearn-platform',
  },
  {
    id: 6,
    title: 'DeliveryNow App',
    category: 'Mobile',
    description: 'Real-time food delivery tracking app with live map, driver chat, and order management.',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80',
    tags: ['Flutter', 'Google Maps', 'Socket.io'],
    year: '2023',
    slug: 'deliverynow-app',
  },
  {
    id: 7,
    title: 'SmartChat Assistant',
    category: 'AI',
    description: 'Intelligent customer support chatbot with context memory and multi-language support.',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&q=80',
    tags: ['LangChain', 'GPT-4', 'React'],
    year: '2023',
    slug: 'smartchat-assistant',
  },
  {
    id: 8,
    title: 'Arcadia UI Kit',
    category: 'Design',
    description: 'Premium UI component library with 200+ components for modern SaaS applications.',
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&q=80',
    tags: ['Figma', 'Storybook', 'Tailwind'],
    year: '2022',
    slug: 'arcadia-ui-kit',
  },
  {
    id: 9,
    title: 'PropVault Web',
    category: 'Web',
    description: 'Real estate listing platform with virtual tours, mortgage calculator, and agent matching.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80',
    tags: ['React', 'AWS', 'Mapbox'],
    year: '2022',
    slug: 'propvault-web',
  },
];

const INITIAL_VISIBLE = 6;
const LOAD_MORE_COUNT = 3;

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: 'easeOut' },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
};

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filtered =
    activeCategory === 'All'
      ? allProjects
      : allProjects.filter((p) => p.category === activeCategory);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.3) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            <Filter className="w-4 h-4" /> Our Portfolio
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl md:text-7xl font-black leading-tight mb-6"
          >
            <span className="text-white">Our </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Work
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl text-white/60 max-w-2xl mx-auto"
          >
            A curated selection of projects that showcase our craft, creativity, and
            technical excellence.
          </motion.p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8 px-6 sticky top-16 z-20" style={{ backdropFilter: 'blur(20px)', background: 'rgba(10,10,15,0.8)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryChange(cat)}
                className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  background:
                    activeCategory === cat
                      ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                      : 'rgba(255,255,255,0.06)',
                  border:
                    activeCategory === cat
                      ? '1px solid rgba(124,58,237,0.6)'
                      : '1px solid rgba(255,255,255,0.1)',
                  color: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: activeCategory === cat ? '0 0 20px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {visible.map((project, i) => (
                <motion.div
                  key={project.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                >
                  <ProjectCard project={project} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Load More */}
          {hasMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mt-12"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={() => setVisibleCount((v) => v + LOAD_MORE_COUNT)}
                className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
              >
                Load More Projects
              </Button>
            </motion.div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-white/40 text-lg">
              No projects found in this category.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
