import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const SECTIONS = [
  {
    id: 'data-collection',
    title: '1. Data Collection',
    content: `We collect information you provide directly to us when you use our services, fill out forms, or communicate with our team. This includes:

• **Personal identifiers**: Name, email address, phone number, and company name when you contact us or sign up for services.
• **Usage data**: Information about how you interact with our website, including pages visited, time spent, and actions taken, collected automatically via cookies and analytics tools.
• **Technical data**: IP address, browser type and version, device type, operating system, and referral URLs.
• **Communications**: Records of your correspondence with us, including support requests and feedback.
• **Project data**: Information you share when engaging our services, such as project briefs, design assets, and requirements.

We collect this data only when you voluntarily provide it or when your use of our services automatically generates it. We do not collect sensitive personal information unless explicitly required for a specific service.`,
  },
  {
    id: 'data-usage',
    title: '2. How We Use Your Data',
    content: `We use the information we collect for the following purposes:

• **Service delivery**: To provide, maintain, and improve our services, including web development, design, and consulting projects.
• **Communication**: To respond to your inquiries, send project updates, invoices, and important notices.
• **Personalization**: To tailor our website experience and recommendations based on your preferences and past interactions.
• **Analytics**: To understand how our website is used so we can improve performance and user experience.
• **Marketing**: With your consent, to send promotional communications about our services, case studies, and industry insights.
• **Legal compliance**: To comply with applicable laws, regulations, and legal processes.
• **Security**: To detect, prevent, and address technical issues and fraudulent or illegal activities.

We process your data based on legitimate interests, contractual necessity, legal obligation, or your explicit consent.`,
  },
  {
    id: 'data-sharing',
    title: '3. Data Sharing',
    content: `We do not sell, trade, or rent your personal information to third parties. We may share your data only in these circumstances:

• **Service providers**: Trusted third-party vendors who assist us in operating our business (e.g., cloud hosting, payment processors, analytics platforms). These parties are contractually obligated to keep your information confidential.
• **Business transfers**: In connection with a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction. We will notify you before your data becomes subject to a different privacy policy.
• **Legal requirements**: When required by law, court order, or governmental authority, or when we believe disclosure is necessary to protect our rights or the safety of others.
• **With your consent**: In any other cases where you have explicitly agreed to the sharing.

All third-party service providers we work with are selected for their commitment to data protection and are bound by data processing agreements.`,
  },
  {
    id: 'security',
    title: '4. Data Security',
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:

• **Encryption**: All data transmitted to and from our website is encrypted using TLS/SSL protocols. Sensitive stored data is encrypted at rest.
• **Access controls**: Access to personal data is restricted to authorized personnel on a need-to-know basis, with strong authentication requirements.
• **Infrastructure security**: Our servers are hosted on enterprise-grade cloud infrastructure with regular security audits and penetration testing.
• **Data minimization**: We collect and retain only the data necessary for the purposes described in this policy.
• **Incident response**: We have established procedures for detecting, reporting, and investigating data breaches. We will notify you and relevant authorities as required by law.

Despite these safeguards, no internet transmission or electronic storage method is 100% secure. We encourage you to use strong passwords and exercise caution when sharing sensitive information online.`,
  },
  {
    id: 'your-rights',
    title: '5. Your Rights',
    content: `Depending on your location, you may have the following rights regarding your personal data:

• **Access**: Request a copy of the personal information we hold about you.
• **Correction**: Request correction of inaccurate or incomplete data.
• **Deletion**: Request deletion of your personal data ("right to be forgotten"), subject to certain exceptions.
• **Portability**: Request transfer of your data to another service provider in a machine-readable format.
• **Objection**: Object to processing of your data for direct marketing or based on legitimate interests.
• **Restriction**: Request restriction of processing in certain circumstances.
• **Withdraw consent**: Where processing is based on consent, you may withdraw it at any time.

To exercise any of these rights, contact us at privacy@nabeeljaved.dev. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority.`,
  },
  {
    id: 'contact',
    title: '6. Contact Us',
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

• **Email**: privacy@nabeeljaved.dev
• **Address**: NabeelDev Agency, 123 Digital Avenue, San Francisco, CA 94102
• **Phone**: +1 (555) 123-4567

For data protection inquiries in the EU, you may also contact our Data Protection Officer at dpo@nabeeljaved.dev.

This Privacy Policy was last updated on March 1, 2025. We reserve the right to update this policy at any time. Significant changes will be communicated via email or a prominent notice on our website.`,
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

export default function PrivacyPolicy() {
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
            <Shield className="w-4 h-4" /> Legal
          </div>
          <h1 className="text-5xl font-black text-white mb-3">Privacy Policy</h1>
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
