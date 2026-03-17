import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const FAQ_ITEMS = [
  {
    id: '1',
    question: 'How long does it typically take to build a web application?',
    answer:
      'Timeline depends on the scope and complexity of your project. A standard marketing website or landing page takes 2–4 weeks. A full-featured SaaS application or e-commerce platform typically takes 8–16 weeks. During our discovery phase, we provide a detailed project roadmap with specific milestones and delivery dates so you always know what to expect.',
  },
  {
    id: '2',
    question: 'What is your pricing structure?',
    answer:
      'We offer three engagement models: fixed-price projects (best for well-defined scope), time & materials (best for evolving requirements), and a dedicated team model (best for long-term product development). We provide transparent, detailed estimates after the discovery workshop — no surprise charges. Projects start from $3,000 for simpler builds up to $50k+ for complex enterprise platforms.',
  },
  {
    id: '3',
    question: 'Do you provide ongoing support and maintenance after launch?',
    answer:
      "Absolutely. Every project comes with a 30-day post-launch support period at no extra cost. Beyond that, we offer monthly retainer plans covering bug fixes, security patches, performance monitoring, and feature development. You'll have a dedicated Slack channel and guaranteed response times based on your plan tier.",
  },
  {
    id: '4',
    question: 'What technologies do you specialize in?',
    answer:
      'Our core stack includes React, Next.js, Node.js, Express, PostgreSQL, MongoDB, and Redis on the application layer. For AI/ML features we work with OpenAI, Anthropic, and custom model fine-tuning. Infrastructure-wise we use AWS, Vercel, and Docker/Kubernetes for scalable deployments. We also have deep expertise in GraphQL, WebSockets, and real-time applications.',
  },
  {
    id: '5',
    question: 'How do you handle project communication and collaboration?',
    answer:
      'We believe in radical transparency. You get access to a shared Notion workspace with your project roadmap, a private Slack channel for daily communication, bi-weekly video calls with demos, and a staging environment where you can review progress at any time. We use Jira for sprint planning and you receive weekly progress reports every Friday.',
  },
  {
    id: '6',
    question: 'Can you work with our existing codebase or do you start from scratch?',
    answer:
      'Both — and we are equally comfortable with either. We regularly inherit existing codebases, perform code audits, refactor legacy systems, and add new features. If you have an existing product that needs modernization, we start with a thorough technical review and then propose a pragmatic improvement plan that minimizes disruption to your live product.',
  },
  {
    id: '7',
    question: 'Do you sign NDAs and protect our intellectual property?',
    answer:
      'Yes, absolutely. We sign NDAs before any project discussions involving proprietary ideas. All work product created during the engagement is 100% owned by you — our contracts explicitly transfer all intellectual property rights to the client upon final payment. We also follow strict internal security protocols including encrypted storage, role-based access, and compartmentalized project teams.',
  },
  {
    id: '8',
    question: 'How do I get started?',
    answer:
      "Simple — just hit the 'Start Your Project' button and fill out a short brief about your idea. We'll respond within 24 hours to schedule a free 45-minute discovery call. On that call we learn about your goals, answer your questions, and if we're a good fit, we send a detailed proposal within 3 business days. No commitment required.",
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden transition-all duration-300',
        isOpen ? 'ring-1 ring-violet-500/30' : 'ring-1 ring-transparent',
      )}
      style={{
        background: isOpen ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isOpen ? '1px solid rgba(124,58,237,0.25)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isOpen ? '0 8px 32px rgba(124,58,237,0.12)' : 'none',
      }}
    >
      {/* Question row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left group"
      >
        <span
          className={cn(
            'font-semibold text-base sm:text-lg leading-snug transition-colors duration-200',
            isOpen ? 'text-white' : 'text-white/80 group-hover:text-white',
          )}
        >
          {item.question}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: isOpen ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
            border: isOpen ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Plus className="w-4 h-4 text-white/70" />
        </motion.div>
      </button>

      {/* Answer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <div
                className="h-px w-full mb-4"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              />
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">{item.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openId, setOpenId] = useState('1');

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 100%, rgba(109,40,217,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
            FAQ
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
            Frequently Asked Questions
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Everything you need to know before getting started. Can't find your answer?{' '}
            <a href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">
              Just ask us.
            </a>
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
            >
              <FAQItem
                item={item}
                isOpen={openId === item.id}
                onToggle={() => toggle(item.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
