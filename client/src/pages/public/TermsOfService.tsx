/**
 * Terms of Service Page
 * Content fully driven by CMS (ContentContext.termsOfService).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Handshake, FileCheck, AlertCircle, Gavel, Star } from 'lucide-react';
import { useContent } from '../../contexts/ContentContext';

const SECTION_ICONS = [Handshake, FileCheck, AlertCircle, Gavel, Scale, Star];
const SECTION_COLORS = [
  { icon: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  { icon: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: 'text-orange-500', bg: 'bg-orange-500/10' },
  { icon: 'text-slate-500',  bg: 'bg-slate-500/10'  },
  { icon: 'text-green-500',  bg: 'bg-green-500/10'  },
  { icon: 'text-rose-500',   bg: 'bg-rose-500/10'   },
];

export default function TermsOfService() {
  const { termsOfService } = useContent();
  const { lastUpdated, subtitle, contactEmail, sections } = termsOfService;

  const sorted = [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 bg-primary/10 rounded-full">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">Terms of Service</h1>
          {subtitle && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          )}
          {lastUpdated && (
            <p className="mt-4 text-sm text-muted-foreground/60">Last Updated: {lastUpdated}</p>
          )}
        </motion.div>

        {/* Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-lg dark:prose-invert max-w-none space-y-8"
        >
          {sorted.map((section, i) => {
            const IconComp = SECTION_ICONS[i % SECTION_ICONS.length];
            const color = SECTION_COLORS[i % SECTION_COLORS.length];
            return (
              <section
                key={section._id || i}
                className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 ${color.bg} rounded-lg shrink-0 mt-1`}>
                    <IconComp className={`w-6 h-6 ${color.icon}`} />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}

          {/* Contact Footer */}
          <div className="text-center pt-8 border-t border-border/50">
            <p className="text-muted-foreground">
              Have questions about our Terms?{' '}
              <br />
              <a
                href={`mailto:${contactEmail || 'legal@nabeel.agency'}`}
                className="text-primary hover:underline font-medium mt-2 inline-block"
              >
                Contact our Legal Team
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
