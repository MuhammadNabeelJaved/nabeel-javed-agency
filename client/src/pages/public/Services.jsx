import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Globe,
  Smartphone,
  Palette,
  Brain,
  Cloud,
  ShoppingCart,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import ServiceCard from '../../components/shared/ServiceCard';
import { Button } from '../../components/ui/Button';

const services = [
  {
    id: 'web-development',
    slug: 'web-development',
    icon: <Globe />,
    title: 'Web Development',
    description:
      'High-performance, scalable web applications built with modern frameworks and best practices.',
    features: [
      'React, Next.js & Node.js expertise',
      'RESTful & GraphQL APIs',
      'Database design & optimization',
      'CI/CD pipelines & DevOps',
    ],
    price: 'Starting from $2,500',
  },
  {
    id: 'mobile-apps',
    slug: 'mobile-apps',
    icon: <Smartphone />,
    title: 'Mobile Apps',
    description:
      'Native and cross-platform mobile applications that deliver seamless user experiences.',
    features: [
      'React Native & Flutter',
      'iOS & Android deployment',
      'Push notifications & offline mode',
      'App Store optimization',
    ],
    price: 'Starting from $3,500',
  },
  {
    id: 'ui-ux-design',
    slug: 'ui-ux-design',
    icon: <Palette />,
    title: 'UI/UX Design',
    description:
      'Beautiful, intuitive interfaces designed to convert visitors into loyal customers.',
    features: [
      'User research & personas',
      'Wireframing & prototyping',
      'Design systems & style guides',
      'Usability testing',
    ],
    price: 'Starting from $1,800',
  },
  {
    id: 'ai-solutions',
    slug: 'ai-solutions',
    icon: <Brain />,
    title: 'AI Solutions',
    description:
      'Integrate intelligent automation and machine learning into your business workflows.',
    features: [
      'LLM integration & fine-tuning',
      'Custom AI chatbots',
      'Data pipeline & analytics',
      'Predictive modeling',
    ],
    price: 'Starting from $4,000',
  },
  {
    id: 'cloud-devops',
    slug: 'cloud-devops',
    icon: <Cloud />,
    title: 'Cloud & DevOps',
    description:
      'Reliable cloud infrastructure with automated deployment pipelines for zero-downtime releases.',
    features: [
      'AWS, GCP & Azure setup',
      'Docker & Kubernetes',
      'Infrastructure as Code',
      'Monitoring & alerting',
    ],
    price: 'Starting from $2,000',
  },
  {
    id: 'e-commerce',
    slug: 'e-commerce',
    icon: <ShoppingCart />,
    title: 'E-Commerce',
    description:
      'Full-featured online stores built to drive sales with optimized checkout flows.',
    features: [
      'Shopify & WooCommerce',
      'Custom payment integrations',
      'Inventory management',
      'Analytics & conversion tracking',
    ],
    price: 'Starting from $3,000',
  },
];

const processSteps = [
  { step: '01', title: 'Discovery', desc: 'We dive deep into your goals and challenges.' },
  { step: '02', title: 'Strategy', desc: 'Crafting a tailored roadmap for your project.' },
  { step: '03', title: 'Build', desc: 'Agile development with weekly progress updates.' },
  { step: '04', title: 'Launch', desc: 'Deployment, testing, and go-live support.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

export default function Services() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.35) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            <CheckCircle className="w-4 h-4" /> What We Offer
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
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
              Services
            </span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            We build digital products that are fast, beautiful, and built to scale. From
            concept to launch, we've got you covered.
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                custom={i * 0.05}
                variants={fadeUp}
              >
                <ServiceCard service={service} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              How We{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Work
              </span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              A proven process that delivers results, every time.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="relative p-6 rounded-2xl text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div
                  className="text-5xl font-black mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.6), rgba(168,85,247,0.4))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {step.step}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-10 rounded-3xl relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(124,58,237,0.3)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,58,237,0.25) 0%, transparent 70%)',
              }}
            />
            <h2 className="text-4xl font-black text-white mb-4 relative z-10">
              Ready to Start?
            </h2>
            <p className="text-white/60 text-lg mb-8 relative z-10">
              Tell us about your project and let's build something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Button
                variant="glow"
                size="lg"
                as={Link}
                to="/contact"
                onClick={() => (window.location.href = '/contact')}
              >
                Get a Free Quote <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = '/portfolio')}
              >
                View Our Work
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
