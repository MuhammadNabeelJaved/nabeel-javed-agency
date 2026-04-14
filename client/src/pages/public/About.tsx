/**
 * About Us Page
 * Company story, mission, values, stats, and team preview.
 * All content driven by CMS (ContentContext.about).
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Target, Heart, Zap, Shield, Users, Award,
  ArrowRight, CheckCircle, Lightbulb, Globe,
  Star, Rocket, Code, Clock, Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { TransformCTA } from '../../components/TransformCTA';
import { useContent } from '../../contexts/ContentContext';

const ICON_MAP: Record<string, React.ElementType> = {
  Target, Heart, Zap, Shield, Users, Award, ArrowRight, CheckCircle,
  Lightbulb, Globe, Star, Rocket, Code, Clock, Lock,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Star;
  return <Icon className={className} />;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function About() {
  const { about, processSteps } = useContent();

  return (
    <div className="bg-background min-h-screen">

      {/* ── Hero ── */}
      <section className="relative py-24 md:py-36 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeUp()} className="flex items-center gap-2 mb-6">
            <div className="h-1 w-10 bg-primary rounded-full" />
            <span className="text-primary text-sm font-bold tracking-widest uppercase">About Us</span>
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 max-w-4xl">
            We Build Digital Products{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-blue-600 dark:from-white dark:via-white dark:to-white/50">
              That Matter
            </span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
            {about.heroSubtitle}
          </motion.p>
          <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-4">
            <Link to="/portfolio">
              <Button size="lg" className="rounded-full px-8 gap-2 group">
                See Our Work <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="rounded-full px-8 border-border/50">
                Work With Us
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      {about.stats.length > 0 && (
        <section className="py-16 border-y border-border/50 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {about.stats
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((stat, i) => (
                  <motion.div key={stat._id || i} {...fadeUp(i * 0.1)} className="text-center">
                    <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Our Story ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp()}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <span className="text-primary text-sm font-bold tracking-widest uppercase">Our Story</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight">
                {about.storyTitle}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {about.storyParagraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
              {about.storyPoints.length > 0 && (
                <div className="mt-8 space-y-3">
                  {about.storyPoints.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Timeline */}
            {about.milestones.length > 0 && (
              <motion.div {...fadeUp(0.2)} className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-8">
                  {about.milestones
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                    .map((m, i) => (
                      <motion.div key={m._id || i} {...fadeUp(i * 0.07)} className="pl-12 relative">
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <span className="text-xs font-mono text-primary font-bold">{m.year}</span>
                        <h3 className="font-semibold text-foreground mt-0.5">{m.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      {about.values.length > 0 && (
        <section className="py-20 bg-muted/20 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <span className="text-primary text-sm font-bold tracking-widest uppercase">Core Values</span>
                <div className="h-1 w-8 bg-primary rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">What We Stand For</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {about.values
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((v, i) => (
                  <motion.div key={v._id || i} {...fadeUp(i * 0.07)} className="rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <DynamicIcon name={v.iconName} className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How We Work (from shared Process CMS) ── */}
      {processSteps.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div {...fadeUp()} className="text-center mb-14">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <span className="text-primary text-sm font-bold tracking-widest uppercase">Our Process</span>
                <div className="h-1 w-8 bg-primary rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">How We Turn Ideas Into Reality</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.slice(0, 8).map((step, i) => (
                <motion.div key={i} {...fadeUp(i * 0.07)} className="relative">
                  <div className="rounded-2xl border border-border/50 bg-card p-6 h-full hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary font-bold text-sm">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-bold text-foreground mb-2 text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                  {i < processSteps.slice(0, 8).length - 1 && (
                    <div className="hidden lg:block absolute top-8 -right-3 z-10">
                      <ArrowRight className="h-5 w-5 text-border" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Meet the Team CTA ── */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="rounded-3xl border border-border/50 bg-card p-10 md:p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Meet the People Behind the Work</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
              Our team is our greatest asset. Get to know the designers, engineers, and strategists who make it all happen.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/our-team">
                <Button size="lg" className="rounded-full px-8 gap-2 group">
                  Meet the Team <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/careers">
                <Button size="lg" variant="outline" className="rounded-full px-8 border-border/50">
                  <Award className="h-4 w-4 mr-2" />
                  Join Our Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <TransformCTA />
    </div>
  );
}
