import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Github, Chrome, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

const floatingCards = [
  { label: 'Projects Delivered', value: '120+', delay: 0 },
  { label: 'Client Satisfaction', value: '99%', delay: 0.3 },
  { label: 'Team Members', value: '12', delay: 0.6 },
];

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    navigate('/admin');
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f]">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a0533 0%, #0d0020 50%, #0a0a0f 100%)',
        }}
      >
        {/* Background rings */}
        {[200, 350, 500].map((size, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              top: '50%',
              left: '50%',
              marginTop: -size / 2,
              marginLeft: -size / 2,
              border: `1px solid rgba(124,58,237,${0.15 - i * 0.04})`,
            }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 20 + i * 8, repeat: Infinity, ease: 'linear' }}
          />
        ))}

        {/* Floating stats */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64">
          {floatingCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: card.delay + 0.5, duration: 0.6 }}
              className="absolute"
              style={{
                top: `${i * 90 - 90}px`,
                left: i % 2 === 0 ? '-20px' : '60px',
              }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
                className="px-4 py-3 rounded-xl text-center min-w-[130px]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div
                  className="text-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {card.value}
                </div>
                <div className="text-white/50 text-xs">{card.label}</div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Branding */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">NabeelDev</span>
          </div>
          <p className="text-white/40 text-sm max-w-xs leading-relaxed">
            Building digital products that are fast, beautiful, and built to scale.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">
            © 2025 NabeelDev Agency. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo on mobile */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">NabeelDev</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-white/50 mb-8">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <Label htmlFor="email" className="text-white/70 text-sm mb-1.5 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  style={inputStyle}
                  className="pl-10 placeholder:text-white/25"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password" className="text-white/70 text-sm">Password</Label>
                <Link to="/forgot-password" className="text-violet-400 text-xs hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  style={inputStyle}
                  className="pl-10 pr-10 placeholder:text-white/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <Button type="submit" variant="glow" size="lg" isLoading={isLoading} className="w-full mt-1">
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Github className="w-5 h-5" />, label: 'GitHub' },
              { icon: <Chrome className="w-5 h-5" />, label: 'Google' },
            ].map((provider) => (
              <button
                key={provider.label}
                type="button"
                className="flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {provider.icon} {provider.label}
              </button>
            ))}
          </div>

          <p className="text-center text-white/40 text-sm mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
