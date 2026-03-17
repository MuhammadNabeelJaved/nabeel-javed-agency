import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Clock,
  Briefcase,
  Monitor,
  DollarSign,
  Calendar,
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Target,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useJobs } from '../../hooks/useJobs';

const departments = ['All', 'Engineering', 'Design', 'Marketing', 'Product'];

const companyValues = [
  {
    icon: Zap,
    title: 'Innovation',
    description:
      'We push boundaries and embrace new technologies to deliver cutting-edge solutions.',
    color: 'from-violet-500 to-purple-600',
    glow: 'hover:shadow-violet-500/20',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description:
      'Great ideas emerge from great teams. We foster open communication and mutual respect.',
    color: 'from-cyan-500 to-blue-600',
    glow: 'hover:shadow-cyan-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Growth',
    description:
      'We invest in our people. Continuous learning and career development are core to who we are.',
    color: 'from-emerald-500 to-teal-600',
    glow: 'hover:shadow-emerald-500/20',
  },
  {
    icon: Target,
    title: 'Impact',
    description:
      'Every line of code, every design decision — we build things that truly matter to people.',
    color: 'from-pink-500 to-rose-600',
    glow: 'hover:shadow-pink-500/20',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Careers() {
  const navigate = useNavigate();
  const { jobs } = useJobs();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDept === 'All' || job.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 px-4">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-500/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Badge
              variant="purple"
              className="px-4 py-1.5 text-sm font-medium border-violet-500/30 bg-violet-500/10 text-violet-300"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              We&apos;re Hiring
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Join Our{' '}
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              Team
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            We&apos;re building the future of digital experiences. Come work with
            talented people who care deeply about craft, culture, and making an
            impact that lasts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex items-center justify-center gap-6 mt-10 text-sm text-gray-500"
          >
            {[
              { label: 'Open Roles', value: jobs.length },
              { label: 'Team Members', value: '40+' },
              { label: 'Countries', value: '12' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Our{' '}
              <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
                Values
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              The principles that guide everything we do — from the code we write
              to the culture we build.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {companyValues.map((value) => (
              <motion.div
                key={value.title}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`relative group rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-6 hover:shadow-2xl ${value.glow} transition-all duration-300 overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
                <div
                  className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${value.color} mb-4`}
                >
                  <value.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-20 px-4 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Open{' '}
              <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
                Positions
              </span>
            </h2>
            <p className="text-gray-400">
              {filteredJobs.length}{' '}
              {filteredJobs.length === 1 ? 'role' : 'roles'} available
            </p>
          </motion.div>

          {/* Search & Filter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search roles, departments, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedDept === dept
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-white/[0.04] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-white'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Job Cards */}
          <AnimatePresence mode="wait">
            {filteredJobs.length > 0 ? (
              <motion.div
                key="jobs"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                {filteredJobs.map((job) => (
                  <motion.div
                    key={job.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    className="group relative rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="purple">{job.department}</Badge>
                          <Badge
                            variant="outline"
                            className="border-white/10 text-gray-400"
                          >
                            {job.type}
                          </Badge>
                          {job.workMode && (
                            <Badge
                              variant="success"
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            >
                              {job.workMode}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{job.salaryRange}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Monitor className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>{job.workMode || 'On-site'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                        <span>
                          {new Date(job.postedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/careers/${job.id}`)}
                        className="flex-1 border-white/10 text-gray-300 hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/5"
                      >
                        View Details
                      </Button>
                      <Button
                        variant="glow"
                        size="sm"
                        onClick={() => navigate('/careers/apply')}
                        className="flex-1"
                      >
                        Apply Now
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No roles found
                </h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your search or filter criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedDept('All');
                  }}
                  className="border-white/10 text-gray-300 hover:border-violet-500/30"
                >
                  Clear filters
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-600/5 backdrop-blur-sm p-10 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="text-4xl mb-4">💼</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Don&apos;t see the right role?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                We&apos;re always looking for exceptional talent. Send us your
                resume and tell us how you can contribute to our mission.
              </p>
              <Button
                variant="glow"
                size="lg"
                onClick={() => navigate('/careers/apply')}
                className="shadow-2xl shadow-violet-500/25"
              >
                Send Open Application
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
