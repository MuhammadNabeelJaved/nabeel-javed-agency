import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Briefcase,
  Monitor,
  DollarSign,
  Calendar,
  CheckCircle2,
  Star,
  Heart,
  Shield,
  Laptop,
  BookOpen,
  Coffee,
  Plane,
  ChevronRight,
  Linkedin,
  Twitter,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useJobs } from '../../hooks/useJobs';

const benefitIconMap = {
  default: Star,
  health: Heart,
  security: Shield,
  remote: Laptop,
  learning: BookOpen,
  perks: Coffee,
  travel: Plane,
};

function getBenefitIcon(benefit) {
  const lower = benefit.toLowerCase();
  if (lower.includes('health') || lower.includes('dental') || lower.includes('vision'))
    return Heart;
  if (lower.includes('remote') || lower.includes('home')) return Laptop;
  if (lower.includes('learn') || lower.includes('develop')) return BookOpen;
  if (lower.includes('travel') || lower.includes('office')) return Plane;
  if (lower.includes('coffee') || lower.includes('perk')) return Coffee;
  return Star;
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getJob } = useJobs();
  const job = getJob(id);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold mb-4">Job Not Found</h1>
          <p className="text-gray-400 mb-8">
            This position may have been filled or the link may be incorrect.
          </p>
          <Button
            variant="glow"
            onClick={() => navigate('/careers')}
            className="shadow-lg shadow-violet-500/25"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Careers
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-20">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-violet-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all positions
          </Link>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ——— LEFT CONTENT (70%) ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 min-w-0"
          >
            {/* Hero */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 mb-6">
              <div className="flex flex-wrap gap-2 mb-5">
                <Badge variant="purple">{job.department}</Badge>
                <Badge variant="outline" className="border-white/10 text-gray-400">
                  {job.type}
                </Badge>
                {job.workMode && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {job.workMode}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-violet-400" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  {job.salaryRange}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-pink-400" />
                  Posted{' '}
                  {new Date(job.postedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                About this Role
              </h2>
              <p className="text-gray-300 leading-relaxed">{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 mb-6">
                <h2 className="text-xl font-semibold text-white mb-5">
                  What You&apos;ll Do
                </h2>
                <ul className="space-y-3">
                  {job.responsibilities.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3 text-gray-300"
                    >
                      <CheckCircle2 className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 mb-6">
                <h2 className="text-xl font-semibold text-white mb-5">
                  What We&apos;re Looking For
                </h2>
                <ul className="space-y-3">
                  {job.requirements.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-3 text-gray-300"
                    >
                      <ChevronRight className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 mb-6">
                <h2 className="text-xl font-semibold text-white mb-5">
                  Perks &amp; Benefits
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.benefits.map((benefit, i) => {
                    const Icon = getBenefitIcon(benefit);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <div className="p-2 rounded-lg bg-violet-500/10">
                          <Icon className="h-4 w-4 text-violet-400" />
                        </div>
                        <span className="text-sm text-gray-300 mt-0.5">
                          {benefit}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Company Culture */}
            <div className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/8 to-purple-600/4 backdrop-blur-sm p-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                Our Culture
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                At Nabeel Agency, we believe the best work happens when talented
                people feel empowered, valued, and inspired. We&apos;re a
                remote-friendly team that values autonomy and trust.
              </p>
              <p className="text-gray-400 leading-relaxed">
                We hold regular virtual team events, transparent all-hands
                meetings, and meaningful 1:1s. Every voice matters here —
                whether you&apos;re day one or year five.
              </p>
            </div>
          </motion.div>

          {/* ——— RIGHT SIDEBAR (30%) ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full lg:w-80 xl:w-96 shrink-0"
          >
            <div className="sticky top-28 space-y-5">
              {/* Job overview card */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-6">
                <h3 className="font-semibold text-white mb-5">Job Overview</h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: DollarSign,
                      label: 'Salary',
                      value: job.salaryRange,
                      color: 'text-emerald-400',
                    },
                    {
                      icon: Briefcase,
                      label: 'Experience',
                      value: job.experienceLevel || 'Not specified',
                      color: 'text-violet-400',
                    },
                    {
                      icon: Monitor,
                      label: 'Work Mode',
                      value: job.workMode || 'On-site',
                      color: 'text-cyan-400',
                    },
                    {
                      icon: Clock,
                      label: 'Job Type',
                      value: job.type,
                      color: 'text-pink-400',
                    },
                    {
                      icon: Calendar,
                      label: 'Posted',
                      value: new Date(job.postedDate).toLocaleDateString(
                        'en-US',
                        { month: 'long', day: 'numeric', year: 'numeric' }
                      ),
                      color: 'text-amber-400',
                    },
                    {
                      icon: MapPin,
                      label: 'Location',
                      value: job.location,
                      color: 'text-rose-400',
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/[0.04]">
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-200">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply button */}
              <Button
                variant="glow"
                size="lg"
                onClick={() => navigate('/careers/apply')}
                className="w-full shadow-2xl shadow-violet-500/30 text-base"
              >
                Apply for this Role
                <ArrowRight className="h-4 w-4" />
              </Button>

              {/* Share widget */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-6">
                <h3 className="font-semibold text-white mb-4 text-sm">
                  Share this Role
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                        '_blank'
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors text-xs font-medium"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(job.title)}`,
                        '_blank'
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors text-xs font-medium"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                    Twitter
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400 transition-colors text-xs font-medium"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
