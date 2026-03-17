import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Database, Eye, Lock, Trash2, Mail } from 'lucide-react';

const lastUpdated = 'March 1, 2024';

const sections = [
  {
    id: 'collection',
    icon: Database,
    title: 'Information We Collect',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    content: [
      {
        subtitle: 'Information you provide directly',
        text: 'When you apply for a position at Nabeel Agency, we collect information you voluntarily submit, including your full name, email address, phone number, LinkedIn profile URL, portfolio URL, resume/CV, cover letter, and your responses to application questions.',
      },
      {
        subtitle: 'Automatically collected information',
        text: 'We may collect certain technical information automatically when you access our careers pages, such as your IP address, browser type, device information, and pages visited. This data is used for security and to improve our application experience.',
      },
    ],
  },
  {
    id: 'use',
    icon: Eye,
    title: 'How We Use Your Information',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    content: [
      {
        subtitle: 'Recruitment and hiring',
        text: 'Your application data is used exclusively to evaluate your candidacy for roles at Nabeel Agency. This includes reviewing your qualifications, scheduling interviews, conducting background checks where required, and communicating with you about the status of your application.',
      },
      {
        subtitle: 'Future opportunities',
        text: 'With your consent, we may retain your application in our talent pool and contact you about future roles that match your skills and experience. You may withdraw this consent at any time by contacting us at careers@nabelagency.com.',
      },
      {
        subtitle: 'Legal obligations',
        text: 'We may use your information to comply with applicable employment laws, equal opportunity regulations, and other legal obligations. We do not use your data for automated decision-making that would have legal effects on you.',
      },
    ],
  },
  {
    id: 'sharing',
    icon: Shield,
    title: 'How We Share Your Information',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    content: [
      {
        subtitle: 'Internal sharing',
        text: 'Your application data is shared only with members of our recruiting team, relevant hiring managers, and interviewers involved in the specific role you applied for. Access is restricted on a need-to-know basis.',
      },
      {
        subtitle: 'Third-party service providers',
        text: 'We use trusted third-party tools to manage our hiring process (such as applicant tracking systems, background check providers, and communication platforms). These providers are contractually bound to protect your data and may not use it for any purpose beyond providing services to us.',
      },
      {
        subtitle: 'Legal requirements',
        text: 'We will disclose your information if required to do so by law, court order, or governmental authority, or if we believe disclosure is necessary to protect the rights, property, or safety of Nabeel Agency, our employees, or others.',
      },
    ],
  },
  {
    id: 'retention',
    icon: Lock,
    title: 'Data Retention & Security',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    content: [
      {
        subtitle: 'Retention period',
        text: 'If your application is unsuccessful, we retain your personal data for up to 12 months after the recruitment process concludes, unless you consent to a longer retention period for future opportunities. Successful applicants\' data is incorporated into their employment record and retained accordingly.',
      },
      {
        subtitle: 'Security measures',
        text: 'We implement industry-standard technical and organizational security measures to protect your personal data from unauthorized access, disclosure, alteration, or destruction. These include encryption at rest and in transit, access controls, and regular security audits.',
      },
    ],
  },
  {
    id: 'rights',
    icon: Trash2,
    title: 'Your Rights & Choices',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    content: [
      {
        subtitle: 'Access and portability',
        text: 'You have the right to request a copy of the personal data we hold about you in a commonly used, machine-readable format. To make such a request, contact us at privacy@nabelagency.com.',
      },
      {
        subtitle: 'Correction and deletion',
        text: 'You may request that we correct inaccurate information or delete your personal data from our systems. We will fulfill deletion requests within 30 days unless we are required to retain the data by law or for legitimate business purposes.',
      },
      {
        subtitle: 'Withdrawing consent',
        text: 'Where we process your data based on consent (e.g., retaining your profile for future roles), you may withdraw that consent at any time without affecting the lawfulness of processing that took place prior to withdrawal. To exercise any of these rights, email us at privacy@nabelagency.com.',
      },
    ],
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function JobPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 pt-28 pb-20">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/careers/apply"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-violet-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Application
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-5">
            <Shield className="h-3.5 w-3.5" />
            Job Applicant Privacy Policy
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Your Privacy{' '}
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              Matters
            </span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
            This policy explains how Nabeel Agency collects, uses, and protects
            the personal data you provide as a job applicant.
          </p>
          <p className="text-sm text-gray-600 mt-4">
            Last updated: {lastUpdated}
          </p>
        </motion.div>

        {/* Intro card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/8 to-purple-600/4 p-6 mb-10"
        >
          <p className="text-gray-300 leading-relaxed text-sm">
            Nabeel Agency (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your
            personal information. This Job Applicant Privacy Policy applies
            specifically to data collected during the recruitment and hiring
            process and is separate from our general website Privacy Policy. By
            submitting an application, you acknowledge this policy.
          </p>
        </motion.div>

        {/* Table of contents */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 mb-10"
        >
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Contents
          </h2>
          <nav className="space-y-2">
            {sections.map((section, i) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 text-sm text-gray-400 hover:text-violet-300 transition-colors group"
              >
                <span className="text-xs text-gray-600 font-mono w-5">
                  0{i + 1}
                </span>
                <span className="group-hover:underline underline-offset-2">
                  {section.title}
                </span>
              </a>
            ))}
          </nav>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, sIdx) => (
            <motion.div
              key={section.id}
              id={section.id}
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2.5 rounded-xl ${section.bg}`}>
                  <section.icon className={`h-5 w-5 ${section.color}`} />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  <span className="text-gray-600 font-mono text-sm mr-2">
                    0{sIdx + 1}.
                  </span>
                  {section.title}
                </h2>
              </div>

              <div className="space-y-5">
                {section.content.map((block) => (
                  <div key={block.subtitle}>
                    <h3 className="text-sm font-semibold text-gray-200 mb-2">
                      {block.subtitle}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {block.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center"
        >
          <Mail className="h-8 w-8 text-violet-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Questions about your data?
          </h2>
          <p className="text-gray-400 text-sm mb-5 max-w-md mx-auto">
            If you have any questions about this privacy policy or how we handle
            your personal data, please don&apos;t hesitate to reach out.
          </p>
          <a
            href="mailto:privacy@nabelagency.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 transition-colors text-sm font-medium"
          >
            <Mail className="h-4 w-4" />
            privacy@nabelagency.com
          </a>
        </motion.div>
      </div>
    </div>
  );
}
