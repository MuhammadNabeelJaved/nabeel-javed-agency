import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using the services provided by NabeelDev Agency ("we," "us," or "our"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not use our services.

We may revise these terms at any time without prior notice. By continuing to use our services after revisions are posted, you agree to be bound by the updated terms. It is your responsibility to check this page periodically for changes.

These terms apply to all visitors, users, clients, and others who access or use our services, including but not limited to web development, design, consulting, and software delivery services.`,
  },
  {
    id: 'services',
    title: '2. Services',
    content: `NabeelDev Agency provides professional digital services including:

• **Web development**: Custom web applications, APIs, and backend systems
• **Mobile development**: iOS and Android applications using React Native and Flutter
• **UI/UX design**: User interface design, prototyping, and design systems
• **AI & machine learning solutions**: Chatbots, automation, and data analytics
• **Cloud & DevOps**: Infrastructure setup, CI/CD pipelines, and monitoring
• **E-commerce solutions**: Online stores, payment integrations, and inventory systems

Specific deliverables, timelines, and pricing are defined in individual project agreements or statements of work (SOW). We reserve the right to refuse service to any party at our discretion.`,
  },
  {
    id: 'payment',
    title: '3. Payment Terms',
    content: `Payment terms are specified in your project agreement. General terms include:

• **Deposits**: A non-refundable deposit of 30-50% is required before project work begins.
• **Milestone payments**: For larger projects, payments may be tied to project milestones as defined in the SOW.
• **Final payment**: The remaining balance is due upon project completion and before final delivery of files.
• **Late payments**: Invoices unpaid after 30 days will incur a 1.5% monthly late fee.
• **Currency**: All payments are in USD unless otherwise agreed in writing.
• **Taxes**: Clients are responsible for any applicable taxes in their jurisdiction.

We accept bank transfers, major credit cards, and approved payment platforms. Disputed charges must be raised within 14 days of invoice date.`,
  },
  {
    id: 'intellectual-property',
    title: '4. Intellectual Property',
    content: `Upon receipt of full payment, you receive full ownership of all custom deliverables created specifically for your project. The following conditions apply:

• **Client ownership**: Custom code, designs, and content created uniquely for your project transfer to you upon full payment.
• **Third-party components**: Open-source libraries, licensed fonts, stock assets, and frameworks remain subject to their original licenses.
• **Agency portfolio rights**: We retain the right to display your project in our portfolio and case studies unless you request confidentiality in writing.
• **Pre-existing work**: Any tools, frameworks, or boilerplate code we developed prior to your project remain our property.
• **No transfer before full payment**: Intellectual property rights do not transfer until all outstanding balances are paid in full.

You represent that any materials you provide to us do not infringe on any third-party rights.`,
  },
  {
    id: 'limitation-liability',
    title: '5. Limitation of Liability',
    content: `To the maximum extent permitted by applicable law, NabeelDev Agency shall not be liable for:

• **Indirect damages**: Lost profits, revenue, data, or business opportunities, even if we were advised of the possibility of such damages.
• **Third-party actions**: Issues arising from third-party services, APIs, or platforms integrated into your project.
• **Force majeure**: Delays or failures resulting from circumstances beyond our reasonable control.
• **User errors**: Issues caused by improper use, modification, or mismanagement of delivered software.

Our total liability for any claims arising out of or related to our services shall not exceed the total fees paid by you in the three months preceding the claim.

This limitation applies regardless of the legal theory on which the claim is based, whether breach of contract, tort, negligence, strict liability, or otherwise.`,
  },
  {
    id: 'governing-law',
    title: '6. Governing Law',
    content: `These Terms of Service are governed by and construed in accordance with the laws of the State of California, United States, without regard to conflict of law principles.

Any disputes arising under these terms shall be resolved as follows:

• **Informal resolution**: Both parties agree to first attempt to resolve disputes through good-faith negotiation for at least 30 days.
• **Mediation**: If informal resolution fails, disputes shall be submitted to non-binding mediation before any litigation.
• **Jurisdiction**: If mediation fails, disputes shall be resolved exclusively in the state or federal courts located in San Francisco County, California.
• **Class action waiver**: You waive any right to participate in class action lawsuits or class-wide arbitration.

For inquiries regarding these terms, contact legal@nabeeljaved.dev. These Terms of Service were last updated on March 1, 2025.`,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.5, ease: 'easeOut' },
  }),
};

function parseContent(text) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('•')) {
      const content = line.slice(1).trim();
      const parts = content.split(/\*\*(.+?)\*\*/g);
      return (
        <li key={i} className="flex items-start gap-2 mb-2">
          <span className="text-violet-400 mt-1 shrink-0">•</span>
          <span>
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-white font-semibold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </span>
        </li>
      );
    }
    if (line.trim() === '') return <br key={i} />;
    return (
      <p key={i} className="mb-2">
        {line}
      </p>
    );
  });
}

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-medium"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            <FileText className="w-4 h-4" /> Legal
          </div>
          <h1 className="text-5xl font-black text-white mb-3">Terms of Service</h1>
          <p className="text-white/50">
            Effective date: <span className="text-white">March 1, 2025</span>
          </p>
        </motion.div>

        <div className="flex gap-10 items-start">
          {/* Sidebar TOC */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block w-56 shrink-0 sticky top-24"
          >
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">
              Contents
            </p>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-left text-sm py-2 px-3 rounded-lg transition-all"
                  style={{
                    color: activeSection === s.id ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                    background: activeSection === s.id ? 'rgba(124,58,237,0.12)' : 'transparent',
                    borderLeft: activeSection === s.id ? '2px solid #7c3aed' : '2px solid transparent',
                  }}
                >
                  {s.title}
                </button>
              ))}
            </nav>
          </motion.aside>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {SECTIONS.map((section, i) => (
              <motion.div
                key={section.id}
                id={section.id}
                ref={(el) => (sectionRefs.current[section.id] = el)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="mb-12 scroll-mt-28"
              >
                <h2 className="text-2xl font-black text-white mb-5 flex items-center gap-3">
                  <div
                    className="w-1.5 h-7 rounded-full shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                  />
                  {section.title}
                </h2>
                <div className="text-white/60 leading-relaxed text-sm">
                  <ul className="list-none">{parseContent(section.content)}</ul>
                </div>
                {i < SECTIONS.length - 1 && (
                  <div
                    className="mt-10"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
