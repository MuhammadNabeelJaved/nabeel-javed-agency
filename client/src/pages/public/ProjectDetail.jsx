import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  Tag,
  Layers,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const projectsData = {
  'fintrack-dashboard': {
    title: 'FinTrack Dashboard',
    category: 'Web App',
    client: 'FinTrack Inc.',
    timeline: '8 weeks',
    role: 'Full Stack Development',
    techStack: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'AWS', 'TailwindCSS'],
    heroImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
    challenge:
      'FinTrack needed a real-time dashboard that could handle millions of financial transactions per day while providing instant visualizations and analytics. Their legacy system was slow, crashed frequently under load, and had no mobile support.',
    solution:
      "We re-architected the entire platform using React with Recharts for visualizations, Node.js microservices for the backend, and Redis for real-time data caching. We implemented WebSocket connections for live data updates and optimized PostgreSQL queries that reduced p99 latency from 3s to under 100ms.",
    results: [
      { metric: 'Performance Boost', value: '10x', desc: 'Faster page load times' },
      { metric: 'Uptime', value: '99.99%', desc: 'Zero downtime deployments' },
      { metric: 'User Growth', value: '+340%', desc: 'In the first 6 months' },
    ],
    gallery: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    ],
  },
};

const fallbackProject = {
  title: 'Project',
  category: 'Digital',
  client: 'Client Name',
  timeline: '6 weeks',
  role: 'Full Stack Development',
  techStack: ['React', 'Node.js', 'MongoDB'],
  heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
  challenge: 'The client needed a modern digital solution to replace their outdated systems and improve user experience across all platforms.',
  solution: 'We designed and built a completely new system from the ground up, using modern technologies and best practices to deliver a fast, reliable, and beautiful product.',
  results: [
    { metric: 'Performance', value: '5x', desc: 'Faster load times' },
    { metric: 'Satisfaction', value: '98%', desc: 'Client satisfaction score' },
    { metric: 'Delivery', value: 'On Time', desc: 'Delivered within scope' },
  ],
  gallery: [
    'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&q=80',
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
  ],
};

const nextProjects = [
  { slug: 'medpulse-mobile', title: 'MedPulse Mobile', category: 'Mobile' },
  { slug: 'neuralsearch-ai', title: 'NeuralSearch AI', category: 'AI' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

export default function ProjectDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const project = projectsData[slug] || { ...fallbackProject, title: slug?.replace(/-/g, ' ') || 'Project' };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Banner */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={project.heroImage}
          alt={project.title}
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.35)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.4) 60%, transparent 100%)',
          }}
        />
        <div className="absolute inset-0 flex items-end pb-12 px-6">
          <div className="max-w-6xl mx-auto w-full">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate('/portfolio')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </motion.button>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge variant="purple" className="mb-3">{project.category}</Badge>
              <h1 className="text-5xl md:text-6xl font-black text-white">{project.title}</h1>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <User className="w-5 h-5" />, label: 'Client', value: project.client },
              { icon: <Calendar className="w-5 h-5" />, label: 'Timeline', value: project.timeline },
              { icon: <Layers className="w-5 h-5" />, label: 'Role', value: project.role },
              {
                icon: <Tag className="w-5 h-5" />,
                label: 'Tech Stack',
                value: project.techStack.slice(0, 2).join(', ') + (project.techStack.length > 2 ? '...' : ''),
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-violet-400 mb-2">{item.icon}</div>
                <div className="text-white/40 text-xs mb-1">{item.label}</div>
                <div className="text-white font-semibold text-sm">{item.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Tech Stack Pills */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.4}
            variants={fadeUp}
            className="mt-6 flex flex-wrap gap-2"
          >
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded-full text-sm"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  color: '#c4b5fd',
                }}
              >
                {tech}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Challenge & Solution */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              The Challenge
            </div>
            <h2 className="text-2xl font-black text-white mb-4">What Was the Problem?</h2>
            <p className="text-white/60 leading-relaxed">{project.challenge}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.2}
            variants={fadeUp}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}
            >
              Our Solution
            </div>
            <h2 className="text-2xl font-black text-white mb-4">How We Solved It</h2>
            <p className="text-white/60 leading-relaxed">{project.solution}</p>
          </motion.div>
        </div>
      </section>

      {/* Results */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex items-center gap-3 mb-10"
          >
            <TrendingUp className="w-6 h-6 text-violet-400" />
            <h2 className="text-3xl font-black text-white">Results & Impact</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.results.map((result, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.15}
                variants={fadeUp}
                className="p-8 rounded-2xl text-center relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(124,58,237,0.25)',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
                  }}
                />
                <div
                  className="text-5xl font-black mb-2 relative z-10"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {result.value}
                </div>
                <div className="text-white font-semibold mb-1 relative z-10">{result.metric}</div>
                <div className="text-white/40 text-sm relative z-10">{result.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl font-black text-white mb-8"
          >
            Screenshots
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {project.gallery.map((img, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="rounded-2xl overflow-hidden aspect-video group cursor-pointer"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <img
                  src={img}
                  alt={`Screenshot ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Next Project Navigation */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-6">
            More Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nextProjects.map((p, i) => (
              <motion.button
                key={p.slug}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                whileHover={{ x: 6 }}
                onClick={() => navigate(`/portfolio/${p.slug}`)}
                className="flex items-center justify-between p-6 rounded-2xl text-left transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div>
                  <div className="text-violet-400 text-xs mb-1">{p.category}</div>
                  <div className="text-white font-bold text-lg">{p.title}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
