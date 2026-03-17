import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Upload,
  Globe,
  ChevronDown,
  Lightbulb,
  CheckCircle2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

const applicationTips = [
  {
    icon: FileText,
    title: 'Tailor your cover letter',
    desc: 'Mention specific projects or technologies relevant to the role.',
  },
  {
    icon: Lightbulb,
    title: 'Showcase your impact',
    desc: 'Use numbers and metrics to demonstrate your contributions.',
  },
  {
    icon: Globe,
    title: 'Polish your portfolio',
    desc: "Make sure your portfolio links are live and highlight your best work.",
  },
  {
    icon: CheckCircle2,
    title: 'Proofread everything',
    desc: 'Double-check spelling, grammar, and all URLs before submitting.',
  },
];

const hearAboutOptions = [
  'LinkedIn',
  'Twitter / X',
  'Google Search',
  'Friend or Colleague',
  'Company Blog',
  'Job Board (Indeed, Glassdoor, etc.)',
  'Other',
];

export default function JobApplication() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    // Simulate async submission
    await new Promise((resolve) => setTimeout(resolve, 1200));
    navigate('/careers/apply/success');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setResumeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setResumeFile(file);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-20">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-violet-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Careers
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold text-white mb-3">
            Apply for this{' '}
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              Role
            </span>
          </h1>
          <p className="text-gray-400">
            We review every application carefully. Fill in the details below and
            we&apos;ll get back to you shortly.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ——— FORM ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal info */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6">
                <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-400" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                      Full Name <span className="text-violet-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        {...register('fullName', {
                          required: 'Full name is required',
                        })}
                        type="text"
                        placeholder="John Doe"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-sm ${
                          errors.fullName
                            ? 'border-red-500/50 focus:ring-red-500/30'
                            : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30'
                        }`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                      Email Address <span className="text-violet-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Enter a valid email address',
                          },
                        })}
                        type="email"
                        placeholder="john@example.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-sm ${
                          errors.email
                            ? 'border-red-500/50 focus:ring-red-500/30'
                            : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        {...register('phone')}
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                      LinkedIn URL
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        {...register('linkedin', {
                          pattern: {
                            value: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
                            message: 'Enter a valid LinkedIn URL',
                          },
                        })}
                        type="url"
                        placeholder="https://linkedin.com/in/yourname"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-sm ${
                          errors.linkedin
                            ? 'border-red-500/50 focus:ring-red-500/30'
                            : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30'
                        }`}
                      />
                    </div>
                    {errors.linkedin && (
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.linkedin.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cover Letter */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6">
                <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-400" />
                  Cover Letter <span className="text-violet-400 ml-1">*</span>
                </h2>
                <textarea
                  {...register('coverLetter', {
                    required: 'Cover letter is required',
                    minLength: {
                      value: 100,
                      message: 'Please write at least 100 characters',
                    },
                  })}
                  rows={6}
                  placeholder="Tell us why you're excited about this role and what makes you a great fit..."
                  className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all text-sm resize-none ${
                    errors.coverLetter
                      ? 'border-red-500/50 focus:ring-red-500/30'
                      : 'border-white/10 focus:border-violet-500/50 focus:ring-violet-500/30'
                  }`}
                />
                {errors.coverLetter && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.coverLetter.message}
                  </p>
                )}
              </div>

              {/* Resume Upload */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6">
                <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-violet-400" />
                  Resume / CV <span className="text-violet-400 ml-1">*</span>
                </h2>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragging
                      ? 'border-violet-500/60 bg-violet-500/8'
                      : resumeFile
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-white/10 hover:border-violet-500/30 hover:bg-white/[0.02]'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-emerald-300">
                          {resumeFile.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(resumeFile.size / 1024).toFixed(0)} KB — click to
                          replace
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-500 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 mb-1">
                        <span className="text-violet-400 font-medium">
                          Click to upload
                        </span>{' '}
                        or drag &amp; drop
                      </p>
                      <p className="text-xs text-gray-600">
                        PDF, DOC, or DOCX — max 10 MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Additional */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6">
                <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-violet-400" />
                  Additional Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* How did you hear */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                      How did you hear about us?
                    </label>
                    <div className="relative">
                      <select
                        {...register('hearAbout')}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm appearance-none"
                      >
                        <option value="" className="bg-[#0d0d1a]">
                          Select an option
                        </option>
                        {hearAboutOptions.map((opt) => (
                          <option key={opt} value={opt} className="bg-[#0d0d1a]">
                            {opt}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Portfolio URL */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5 font-medium">
                      Portfolio URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        {...register('portfolio')}
                        type="url"
                        placeholder="https://yourportfolio.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="glow"
                size="lg"
                isLoading={isSubmitting}
                className="w-full shadow-2xl shadow-violet-500/25 text-base"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                {!isSubmitting && <Send className="h-4 w-4" />}
              </Button>

              <p className="text-xs text-center text-gray-600">
                By submitting, you agree to our{' '}
                <Link
                  to="/careers/privacy"
                  className="text-violet-400 hover:underline"
                >
                  Job Applicant Privacy Policy
                </Link>
                .
              </p>
            </form>
          </motion.div>

          {/* ——— TIPS PANEL ——— */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-72 xl:w-80 shrink-0"
          >
            <div className="sticky top-28">
              <div className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/8 to-purple-600/4 backdrop-blur-sm p-6">
                <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  Application Tips
                </h3>
                <div className="space-y-5">
                  {applicationTips.map((tip, i) => (
                    <motion.div
                      key={tip.title}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="p-2 rounded-lg bg-violet-500/10 shrink-0 mt-0.5">
                        <tip.icon className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white mb-0.5">
                          {tip.title}
                        </div>
                        <div className="text-xs text-gray-400 leading-relaxed">
                          {tip.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-white/5">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    We typically respond within 5–7 business days. All
                    applications are treated with strict confidentiality.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
