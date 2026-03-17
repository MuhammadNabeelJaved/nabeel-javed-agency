import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Mail,
  Clock,
  UserCheck,
  ArrowRight,
  Home,
  Briefcase,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const nextSteps = [
  {
    step: '01',
    icon: Mail,
    title: 'Confirmation Email',
    desc: "You'll receive an email confirming we received your application within the next few minutes.",
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    step: '02',
    icon: UserCheck,
    title: 'Application Review',
    desc: 'Our hiring team will carefully review your application and portfolio within 5–7 business days.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    step: '03',
    icon: Clock,
    title: 'We\'ll Be in Touch',
    desc: "If your profile matches what we're looking for, we'll schedule an intro call to learn more about you.",
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
];

export default function JobApplicationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center px-4 py-20">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/6 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-600/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Checkmark animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl scale-150 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Application{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Submitted!
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
            Thank you for your interest in joining our team. We&apos;ve received your
            application and will review it carefully.
          </p>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 mb-8"
        >
          <h2 className="font-semibold text-white mb-7 text-lg">
            What happens next
          </h2>

          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-violet-500/30 via-cyan-500/20 to-emerald-500/30" />

            {nextSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.15 }}
                className="relative flex gap-5 pb-8 last:pb-0"
              >
                <div
                  className={`relative z-10 w-16 h-16 rounded-2xl ${step.bg} border border-white/5 flex items-center justify-center shrink-0`}
                >
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <div className="pt-2 flex-1">
                  <div className="text-xs text-gray-600 font-mono mb-0.5">
                    STEP {step.step}
                  </div>
                  <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Button
            variant="glow"
            size="lg"
            onClick={() => navigate('/careers')}
            className="flex-1 shadow-xl shadow-violet-500/20"
          >
            <Briefcase className="h-4 w-4" />
            View More Roles
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/')}
            className="flex-1 border-white/10 text-gray-300 hover:border-violet-500/30 hover:text-white"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center text-xs text-gray-600 mt-8"
        >
          Have questions? Reach us at{' '}
          <a
            href="mailto:careers@nabelagency.com"
            className="text-violet-400 hover:underline"
          >
            careers@nabelagency.com
          </a>
        </motion.p>
      </div>
    </div>
  );
}
