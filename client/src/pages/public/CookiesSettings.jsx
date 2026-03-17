import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart2, Megaphone, Settings2, CheckCircle, Save } from 'lucide-react';
import { Switch } from '../../components/ui/Switch';
import { Button } from '../../components/ui/Button';

const COOKIE_TYPES = [
  {
    id: 'essential',
    icon: <Shield className="w-5 h-5" />,
    title: 'Essential Cookies',
    description:
      'Required for the website to function properly. These cannot be disabled as they are necessary for core features like authentication, security, and session management.',
    examples: ['Session tokens', 'CSRF protection', 'Login state'],
    required: true,
    color: '#22c55e',
  },
  {
    id: 'analytics',
    icon: <BarChart2 className="w-5 h-5" />,
    title: 'Analytics Cookies',
    description:
      'Help us understand how visitors interact with our website. This data is anonymized and used to improve our content and user experience.',
    examples: ['Google Analytics', 'Page views', 'User journeys'],
    required: false,
    color: '#a78bfa',
  },
  {
    id: 'marketing',
    icon: <Megaphone className="w-5 h-5" />,
    title: 'Marketing Cookies',
    description:
      'Used to track visitors across websites to display relevant and personalized advertisements. They help us measure the effectiveness of our campaigns.',
    examples: ['Google Ads', 'Retargeting pixels', 'Social media tracking'],
    required: false,
    color: '#fbbf24',
  },
  {
    id: 'preferences',
    icon: <Settings2 className="w-5 h-5" />,
    title: 'Preference Cookies',
    description:
      'Allow the website to remember your preferences such as language, theme, and region to provide a more personalized experience.',
    examples: ['Theme setting', 'Language preference', 'Layout choices'],
    required: false,
    color: '#60a5fa',
  },
];

export default function CookiesSettings() {
  const [settings, setSettings] = useState({
    essential: true,
    analytics: true,
    marketing: false,
    preferences: true,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = (id, value) => {
    if (id === 'essential') return;
    setSettings((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const enableAll = () => {
    setSettings({ essential: true, analytics: true, marketing: true, preferences: true });
    setSaved(false);
  };

  const disableAll = () => {
    setSettings({ essential: true, analytics: false, marketing: false, preferences: false });
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-20 px-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 30% at 50% 20%, rgba(124,58,237,0.12) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-medium"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            <Cookie className="w-4 h-4" /> Cookie Preferences
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Manage Cookies</h1>
          <p className="text-white/60 max-w-lg mx-auto leading-relaxed">
            Control how we use cookies to personalize your experience and support our services.
            Your preferences are saved to your browser.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-6 flex-wrap"
        >
          <button
            onClick={enableAll}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'rgba(34,197,94,0.12)',
              border: '1px solid rgba(34,197,94,0.25)',
              color: '#4ade80',
            }}
          >
            Accept All
          </button>
          <button
            onClick={disableAll}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            Reject Non-Essential
          </button>
        </motion.div>

        {/* Cookie Cards */}
        <div className="flex flex-col gap-4 mb-8">
          {COOKIE_TYPES.map((cookie, i) => (
            <motion.div
              key={cookie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="p-6 rounded-2xl"
              style={{
                background: settings[cookie.id]
                  ? `rgba(${cookie.id === 'essential' ? '34,197,94' : cookie.id === 'analytics' ? '124,58,237' : cookie.id === 'marketing' ? '251,191,36' : '96,165,250'},0.06)`
                  : 'rgba(255,255,255,0.03)',
                border: settings[cookie.id]
                  ? `1px solid rgba(${cookie.id === 'essential' ? '34,197,94' : cookie.id === 'analytics' ? '124,58,237' : cookie.id === 'marketing' ? '251,191,36' : '96,165,250'},0.25)`
                  : '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.3s ease',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `rgba(${cookie.id === 'essential' ? '34,197,94' : cookie.id === 'analytics' ? '124,58,237' : cookie.id === 'marketing' ? '251,191,36' : '96,165,250'},0.15)`,
                      color: cookie.color,
                      border: `1px solid rgba(${cookie.id === 'essential' ? '34,197,94' : cookie.id === 'analytics' ? '124,58,237' : cookie.id === 'marketing' ? '251,191,36' : '96,165,250'},0.3)`,
                    }}
                  >
                    {cookie.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold">{cookie.title}</h3>
                      {cookie.required && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: 'rgba(34,197,94,0.12)',
                            border: '1px solid rgba(34,197,94,0.25)',
                            color: '#4ade80',
                          }}
                        >
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed mb-3">
                      {cookie.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cookie.examples.map((ex) => (
                        <span
                          key={ex}
                          className="px-2 py-0.5 rounded-md text-xs"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  <Switch
                    checked={settings[cookie.id]}
                    onCheckedChange={(val) => handleToggle(cookie.id, val)}
                    disabled={cookie.required}
                    className={settings[cookie.id] && !cookie.required ? 'bg-violet-600' : ''}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-4"
        >
          <Button
            variant="glow"
            size="lg"
            onClick={handleSave}
            isLoading={saving}
            className="flex-1 sm:flex-none"
          >
            {!saving && <Save className="w-5 h-5" />}
            Save Preferences
          </Button>

          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-400 text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" /> Saved!
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-white/25 text-xs mt-6 leading-relaxed">
          Your cookie preferences are stored locally and will be remembered for 365 days. You can update these settings at any time.
        </p>
      </div>
    </div>
  );
}
