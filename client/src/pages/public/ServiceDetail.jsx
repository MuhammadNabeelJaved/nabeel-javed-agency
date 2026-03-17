import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe,
  Smartphone,
  Palette,
  Brain,
  Cloud,
  ShoppingCart,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const serviceData = {
  'web-development': {
    icon: <Globe className="w-8 h-8" />,
    title: 'Web Development',
    tagline: 'Build fast, scalable web applications',
    description:
      "We engineer high-performance web applications using modern frameworks like React, Next.js, and Node.js. Our team follows industry best practices to deliver maintainable, secure, and scalable solutions that grow with your business.",
    longDescription:
      "From complex enterprise platforms to sleek marketing sites, we've built them all. Our web development process starts with a deep understanding of your users, then translates that into beautiful, functional code. We obsess over performance, accessibility, and developer experience.",
    stats: [
      { label: 'Projects Delivered', value: '120+' },
      { label: 'Avg. Performance Score', value: '97' },
      { label: 'Client Satisfaction', value: '99%' },
      { label: 'Avg. Delivery Time', value: '6 wks' },
    ],
    features: [
      'Custom React / Next.js applications',
      'RESTful & GraphQL API development',
      'PostgreSQL, MongoDB, Redis',
      'Authentication & authorization',
      'Payment gateway integrations',
      'SEO & Core Web Vitals optimization',
      'Progressive Web Apps (PWA)',
      'Automated testing & CI/CD',
    ],
    process: [
      { title: 'Requirements Gathering', desc: 'Deep dive into your business goals and technical needs.' },
      { title: 'Architecture Design', desc: 'Plan the system architecture, database schema, and API contracts.' },
      { title: 'Agile Development', desc: '2-week sprints with regular demos and feedback loops.' },
      { title: 'QA & Testing', desc: 'Unit, integration, and E2E tests before every release.' },
      { title: 'Deployment', desc: 'Zero-downtime deployment with monitoring and rollback plans.' },
    ],
    projects: [
      {
        title: 'FinTrack Dashboard',
        category: 'Web App',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
        desc: 'Real-time financial analytics platform with complex data visualizations.',
      },
      {
        title: 'EduLearn Platform',
        category: 'E-Learning',
        image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&q=80',
        desc: 'Online learning management system with 50,000+ active students.',
      },
      {
        title: 'HealthPulse Portal',
        category: 'Healthcare',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80',
        desc: 'Patient management portal with HIPAA-compliant data handling.',
      },
    ],
    testimonial: {
      quote:
        "The team delivered a flawless product ahead of schedule. Our platform handles 10x the traffic now without breaking a sweat.",
      author: 'Sarah Chen',
      role: 'CTO, FinTrack Inc.',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
  },
};

const fallbackService = {
  icon: <Globe className="w-8 h-8" />,
  title: 'Service',
  tagline: 'Professional digital solutions',
  description: 'We provide top-tier digital services tailored to your business needs.',
  longDescription: 'Our expert team delivers high-quality solutions with a focus on performance, scalability, and user experience.',
  stats: [
    { label: 'Projects', value: '100+' },
    { label: 'Satisfaction', value: '99%' },
    { label: 'Experience', value: '5 yrs' },
    { label: 'Support', value: '24/7' },
  ],
  features: ['Custom solutions', 'Expert team', 'Agile process', 'Full support'],
  process: [
    { title: 'Discovery', desc: 'Understanding your needs.' },
    { title: 'Planning', desc: 'Crafting the roadmap.' },
    { title: 'Execution', desc: 'Building with precision.' },
    { title: 'Delivery', desc: 'Launch and beyond.' },
  ],
  projects: [
    {
      title: 'Project Alpha',
      category: 'Web',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
      desc: 'A high-impact digital product.',
    },
    {
      title: 'Project Beta',
      category: 'Mobile',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&q=80',
      desc: 'Streamlined mobile experience.',
    },
    {
      title: 'Project Gamma',
      category: 'Design',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
      desc: 'Beautiful and functional design.',
    },
  ],
  testimonial: {
    quote: 'Outstanding work delivered on time and within budget.',
    author: 'Alex Johnson',
    role: 'CEO, TechCorp',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const service = serviceData[slug] || { ...fallbackService, title: slug?.replace(/-/g, ' ') || 'Service' };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.3) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm"
          >
            ← Back to Services
          </motion.button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.25))',
                border: '1px solid rgba(124,58,237,0.4)',
                boxShadow: '0 0 40px rgba(124,58,237,0.3)',
              }}
            >
              <span className="text-violet-400">{service.icon}</span>
            </motion.div>

            <div>
              <motion.div initial="hidden" animate="visible" custom={0.5} variants={fadeUp}>
                <Badge variant="purple" className="mb-3">Service</Badge>
              </motion.div>
              <motion.h1
                initial="hidden"
                animate="visible"
                custom={1}
                variants={fadeUp}
                className="text-5xl md:text-6xl font-black text-white mb-4"
              >
                {service.title}
              </motion.h1>
              <motion.p
                initial="hidden"
                animate="visible"
                custom={1.5}
                variants={fadeUp}
                className="text-xl text-white/60 max-w-2xl leading-relaxed"
              >
                {service.tagline}
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-3xl font-black text-white mb-6">Overview</h2>
            <p className="text-white/70 leading-relaxed mb-4">{service.description}</p>
            <p className="text-white/50 leading-relaxed">{service.longDescription}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0.2}
            variants={fadeUp}
            className="grid grid-cols-2 gap-4"
          >
            {service.stats.map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div
                  className="text-4xl font-black mb-1"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-white/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl font-black text-white mb-10"
          >
            What's Included
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {service.features.map((feature, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.05}
                variants={fadeUp}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <CheckCircle className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl font-black text-white mb-10"
          >
            Our Process
          </motion.h2>
          <div className="flex flex-col gap-4">
            {service.process.map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="flex items-start gap-6 p-6 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.5), rgba(168,85,247,0.3))',
                    border: '1px solid rgba(124,58,237,0.4)',
                    color: '#a78bfa',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">{step.title}</h3>
                  <p className="text-white/50 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Examples */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-3xl font-black text-white mb-10"
          >
            Related Work
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {service.projects.map((project, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="rounded-2xl overflow-hidden group cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="relative overflow-hidden h-44">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ background: 'rgba(124,58,237,0.7)', backdropFilter: 'blur(8px)' }}
                    >
                      {project.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-white font-bold mb-1">{project.title}</h3>
                  <p className="text-white/50 text-sm">{project.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-8 rounded-3xl text-center relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(124,58,237,0.25)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-white/80 text-xl italic mb-6 leading-relaxed">
                "{service.testimonial.quote}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <img
                  src={service.testimonial.avatar}
                  alt={service.testimonial.author}
                  className="w-12 h-12 rounded-full object-cover"
                  style={{ border: '2px solid rgba(124,58,237,0.5)' }}
                />
                <div className="text-left">
                  <div className="text-white font-semibold">{service.testimonial.author}</div>
                  <div className="text-white/50 text-sm">{service.testimonial.role}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-white/60 mb-8 text-lg">
              Let's discuss your project and build something incredible together.
            </p>
            <Button
              variant="glow"
              size="lg"
              onClick={() => navigate('/contact')}
            >
              Start Your Project <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
