import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter, Heart, Lightbulb, Shield, Zap, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const teamMembers = [
  {
    name: 'Nabeel Javed',
    role: 'Founder & Lead Developer',
    bio: 'Full-stack wizard with 7+ years building scalable web apps. Obsessed with clean code and great UX.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    gradient: 'from-violet-600 to-purple-700',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Sarah Chen',
    role: 'Lead UI/UX Designer',
    bio: 'Design thinker who crafts interfaces that users love. Expert in design systems and prototyping.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    gradient: 'from-pink-600 to-rose-700',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Backend Engineer',
    bio: 'Systems architect who loves performance optimization, distributed systems, and clean APIs.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    gradient: 'from-emerald-600 to-teal-700',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Aisha Patel',
    role: 'AI/ML Engineer',
    bio: 'Machine learning specialist turning raw data into intelligent products. LLM fine-tuning pro.',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    gradient: 'from-amber-600 to-orange-700',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'David Kim',
    role: 'DevOps Engineer',
    bio: 'Cloud infrastructure guru. Kubernetes, CI/CD, and security are his daily playground.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    gradient: 'from-blue-600 to-cyan-700',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
  {
    name: 'Emma Thompson',
    role: 'Mobile Developer',
    bio: 'React Native & Flutter expert crafting smooth mobile experiences for iOS and Android.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    gradient: 'from-indigo-600 to-violet-700',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    twitter: 'https://twitter.com',
  },
];

const values = [
  { icon: <Heart className="w-6 h-6" />, title: 'Client First', desc: 'Every decision we make starts with your success in mind.' },
  { icon: <Lightbulb className="w-6 h-6" />, title: 'Innovation', desc: 'We embrace new technologies and better approaches constantly.' },
  { icon: <Shield className="w-6 h-6" />, title: 'Integrity', desc: 'Transparent communication and honest work, always.' },
  { icon: <Zap className="w-6 h-6" />, title: 'Excellence', desc: 'We hold ourselves to the highest standards of quality.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

export default function Team() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.3) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' }}
          >
            <Users className="w-4 h-4" /> Our People
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6"
          >
            Meet the{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Team
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto"
          >
            A passionate group of designers, engineers, and strategists dedicated to
            building exceptional digital experiences.
          </motion.p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, i) => (
            <motion.div
              key={member.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i * 0.08}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="relative p-6 rounded-2xl overflow-hidden group"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)',
                }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden"
                    style={{ border: '2px solid rgba(124,58,237,0.4)' }}>
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.background = `linear-gradient(135deg, var(--from), var(--to))`;
                      }}
                    />
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 w-6 h-6 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                      backgroundImage: `linear-gradient(135deg, rgba(124,58,237,0.8), rgba(168,85,247,0.6))`,
                    }}
                  />
                </div>

                <h3 className="text-white font-bold text-lg mb-0.5">{member.name}</h3>
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: '#a78bfa' }}
                >
                  {member.role}
                </p>
                <p className="text-white/50 text-sm leading-relaxed mb-4 line-clamp-2">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex gap-2">
                  {[
                    { icon: <Github className="w-4 h-4" />, href: member.github, label: 'GitHub' },
                    { icon: <Linkedin className="w-4 h-4" />, href: member.linkedin, label: 'LinkedIn' },
                    { icon: <Twitter className="w-4 h-4" />, href: member.twitter, label: 'Twitter' },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-violet-400 hover:scale-110 transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <h2 className="text-4xl font-black text-white mb-4">
              What We{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Believe In
              </span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i * 0.1}
                variants={fadeUp}
                className="p-6 rounded-2xl text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-violet-400"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
                >
                  {value.icon}
                </div>
                <h3 className="text-white font-bold mb-2">{value.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-10 rounded-3xl relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(124,58,237,0.3)',
              backdropFilter: 'blur(24px)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(124,58,237,0.2) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-3">Join Our Team</h2>
              <p className="text-white/60 mb-6">
                We're always looking for talented people who are passionate about building great things.
              </p>
              <Button variant="glow" size="lg" onClick={() => navigate('/careers')}>
                View Open Positions
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
