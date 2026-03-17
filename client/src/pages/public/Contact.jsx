import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Label } from '../../components/ui/Label';

const contactInfo = [
  { icon: <Mail className="w-5 h-5" />, label: 'Email', value: 'hello@nabeeljaved.dev', href: 'mailto:hello@nabeeljaved.dev' },
  { icon: <Phone className="w-5 h-5" />, label: 'Phone', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
  { icon: <MapPin className="w-5 h-5" />, label: 'Location', value: 'San Francisco, CA', href: '#' },
];

const socialLinks = [
  { icon: <Github className="w-5 h-5" />, href: 'https://github.com', label: 'GitHub' },
  { icon: <Twitter className="w-5 h-5" />, href: 'https://twitter.com', label: 'Twitter' },
  { icon: <Linkedin className="w-5 h-5" />, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: <Instagram className="w-5 h-5" />, href: 'https://instagram.com', label: 'Instagram' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
      <span className="text-red-400 text-xs">{message}</span>
    </div>
  );
}

export default function Contact() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    budget: '',
    message: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!form.service) newErrors.service = 'Please select a service';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    navigate('/contact/success');
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-medium"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.35)',
                color: '#a78bfa',
              }}
            >
              <Send className="w-4 h-4" /> Get In Touch
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
              Let's Build Something{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Amazing
              </span>
            </h1>
            <p className="text-white/50 text-xl max-w-xl mx-auto">
              Tell us about your project and we'll get back to you within 24 hours.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left: Info */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.2}
              variants={fadeUp}
              className="lg:col-span-2 flex flex-col gap-6"
            >
              {/* Contact Info */}
              <div
                className="p-7 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <h3 className="text-white font-bold text-lg mb-5">Contact Information</h3>
                <div className="flex flex-col gap-4">
                  {contactInfo.map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      className="flex items-center gap-4 group"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-violet-400 group-hover:text-white transition-colors"
                        style={{
                          background: 'rgba(124,58,237,0.15)',
                          border: '1px solid rgba(124,58,237,0.25)',
                        }}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-white/40 text-xs">{item.label}</div>
                        <div className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors">
                          {item.value}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div
                className="p-7 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <h3 className="text-white font-bold text-lg mb-5">Follow Us</h3>
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-violet-400 hover:scale-110 transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Map Placeholder */}
              <div
                className="rounded-2xl overflow-hidden h-52 relative"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(10,10,15,0.8))',
                    backgroundImage: `
                      repeating-linear-gradient(0deg, rgba(124,58,237,0.05) 0px, rgba(124,58,237,0.05) 1px, transparent 1px, transparent 40px),
                      repeating-linear-gradient(90deg, rgba(124,58,237,0.05) 0px, rgba(124,58,237,0.05) 1px, transparent 1px, transparent 40px)
                    `,
                  }}
                >
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-violet-400 mx-auto mb-2" />
                    <span className="text-white/50 text-sm">San Francisco, CA</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Form */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.3}
              variants={fadeUp}
              className="lg:col-span-3"
            >
              <div
                className="p-8 rounded-3xl relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 0 60px rgba(124,58,237,0.1)',
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{
                    background:
                      'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)',
                  }}
                />
                <h3 className="text-white font-bold text-2xl mb-7 relative z-10">
                  Send a Message
                </h3>
                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="name" className="text-white/70 text-sm mb-1.5 block">
                        Full Name <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={handleChange}
                        style={inputStyle}
                        className="placeholder:text-white/25"
                      />
                      <FieldError message={errors.name} />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-white/70 text-sm mb-1.5 block">
                        Email <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={handleChange}
                        style={inputStyle}
                        className="placeholder:text-white/25"
                      />
                      <FieldError message={errors.email} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="phone" className="text-white/70 text-sm mb-1.5 block">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={form.phone}
                        onChange={handleChange}
                        style={inputStyle}
                        className="placeholder:text-white/25"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-white/70 text-sm mb-1.5 block">Company</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Acme Inc."
                        value={form.company}
                        onChange={handleChange}
                        style={inputStyle}
                        className="placeholder:text-white/25"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="service" className="text-white/70 text-sm mb-1.5 block">
                        Service <span className="text-red-400">*</span>
                      </Label>
                      <Select
                        id="service"
                        name="service"
                        value={form.service}
                        onChange={handleChange}
                        style={{ ...inputStyle, color: form.service ? '#fff' : 'rgba(255,255,255,0.25)' }}
                      >
                        <option value="" disabled>Select a service</option>
                        <option value="web">Web Development</option>
                        <option value="mobile">Mobile Apps</option>
                        <option value="design">UI/UX Design</option>
                        <option value="ai">AI Solutions</option>
                        <option value="devops">Cloud & DevOps</option>
                        <option value="ecommerce">E-Commerce</option>
                      </Select>
                      <FieldError message={errors.service} />
                    </div>
                    <div>
                      <Label htmlFor="budget" className="text-white/70 text-sm mb-1.5 block">Budget</Label>
                      <Select
                        id="budget"
                        name="budget"
                        value={form.budget}
                        onChange={handleChange}
                        style={{ ...inputStyle, color: form.budget ? '#fff' : 'rgba(255,255,255,0.25)' }}
                      >
                        <option value="" disabled>Select budget range</option>
                        <option value="<5k">Less than $5,000</option>
                        <option value="5k-10k">$5,000 – $10,000</option>
                        <option value="10k-25k">$10,000 – $25,000</option>
                        <option value="25k-50k">$25,000 – $50,000</option>
                        <option value=">50k">$50,000+</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-white/70 text-sm mb-1.5 block">
                      Message <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Tell us about your project..."
                      value={form.message}
                      onChange={handleChange}
                      style={inputStyle}
                      className="placeholder:text-white/25 resize-none"
                    />
                    <FieldError message={errors.message} />
                  </div>

                  <Button
                    type="submit"
                    variant="glow"
                    size="lg"
                    isLoading={isSubmitting}
                    className="w-full mt-2"
                  >
                    {!isSubmitting && <Send className="w-5 h-5" />}
                    Send Message
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
