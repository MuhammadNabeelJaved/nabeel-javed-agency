import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Type,
  Square,
  Tag,
  LayoutGrid,
  FormInput,
  Bell,
  Check,
  X,
  AlertTriangle,
  Info,
  Star,
  Zap,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { cn } from '../../lib/utils';

// --- Color Palette ---
const colors = [
  { name: 'Primary', value: '#7c3aed', token: '--primary' },
  { name: 'Primary Light', value: '#a78bfa', token: '--primary-light' },
  { name: 'Accent', value: '#c084fc', token: '--accent' },
  { name: 'Background', value: '#0a0a0f', token: '--background' },
  { name: 'Surface', value: 'rgba(255,255,255,0.04)', token: '--surface' },
  { name: 'Border', value: 'rgba(255,255,255,0.08)', token: '--border' },
  { name: 'Success', value: '#22c55e', token: '--success' },
  { name: 'Warning', value: '#f59e0b', token: '--warning' },
  { name: 'Danger', value: '#ef4444', token: '--danger' },
  { name: 'Info', value: '#3b82f6', token: '--info' },
  { name: 'White', value: '#ffffff', token: '--white' },
  { name: 'Muted', value: 'rgba(255,255,255,0.4)', token: '--muted' },
];

// --- Typography ---
const typographyScale = [
  { label: 'Display', size: 'text-6xl', weight: 'font-black', text: 'Display Text' },
  { label: 'H1', size: 'text-5xl', weight: 'font-black', text: 'Heading 1' },
  { label: 'H2', size: 'text-4xl', weight: 'font-black', text: 'Heading 2' },
  { label: 'H3', size: 'text-3xl', weight: 'font-bold', text: 'Heading 3' },
  { label: 'H4', size: 'text-2xl', weight: 'font-bold', text: 'Heading 4' },
  { label: 'H5', size: 'text-xl', weight: 'font-semibold', text: 'Heading 5' },
  { label: 'Body Large', size: 'text-lg', weight: 'font-normal', text: 'Large body text for introductions and leads.' },
  { label: 'Body', size: 'text-base', weight: 'font-normal', text: 'Default body text used for most content and paragraphs.' },
  { label: 'Small', size: 'text-sm', weight: 'font-normal', text: 'Small text for captions and secondary information.' },
  { label: 'Tiny', size: 'text-xs', weight: 'font-medium', text: 'EXTRA SMALL — USED FOR LABELS AND BADGES' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' },
  }),
};

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-violet-400"
        style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}
      >
        {icon}
      </div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
    </div>
  );
}

function Section({ children, title, icon, custom = 0 }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      custom={custom}
      variants={fadeUp}
      className="mb-16"
    >
      <SectionTitle icon={icon} title={title} />
      {children}
    </motion.div>
  );
}

export default function StyleGuide() {
  const [switchStates, setSwitchStates] = useState({ a: true, b: false, c: true });

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-medium"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            <Palette className="w-4 h-4" /> Design System
          </div>
          <h1 className="text-6xl font-black text-white mb-3">
            Style{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Guide
            </span>
          </h1>
          <p className="text-white/50 text-xl max-w-xl">
            The complete design system for NabeelDev Agency — colors, typography, components, and more.
          </p>
        </motion.div>

        {/* Color Palette */}
        <Section title="Color Palette" icon={<Palette className="w-5 h-5" />}>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {colors.map((color) => (
              <div key={color.name} className="flex flex-col gap-2">
                <div
                  className="w-full aspect-square rounded-xl"
                  style={{
                    background: color.value,
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                />
                <div>
                  <div className="text-white text-xs font-semibold">{color.name}</div>
                  <div className="text-white/30 text-xs font-mono">{color.token}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography Scale" icon={<Type className="w-5 h-5" />} custom={1}>
          <div
            className="p-6 rounded-2xl divide-y"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              divideColor: 'rgba(255,255,255,0.06)',
            }}
          >
            {typographyScale.map((t, i) => (
              <div
                key={t.label}
                className="flex items-baseline gap-6 py-4"
                style={{ borderBottom: i < typographyScale.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
              >
                <span className="text-white/30 text-xs font-mono w-20 shrink-0 pt-1">{t.label}</span>
                <span className={cn(t.size, t.weight, 'text-white leading-tight')}>{t.text}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Button Variants */}
        <Section title="Button Variants" icon={<Square className="w-5 h-5" />} custom={2}>
          <div className="space-y-6">
            {/* By Variant */}
            <div>
              <p className="text-white/40 text-xs font-mono mb-3">— variant</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="glow"><Zap className="w-4 h-4" /> Glow</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="success"><Check className="w-4 h-4" /> Success</Button>
                <Button variant="warning"><AlertTriangle className="w-4 h-4" /> Warning</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            {/* By Size */}
            <div>
              <p className="text-white/40 text-xs font-mono mb-3">— size</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="glow">Small</Button>
                <Button size="default" variant="glow">Default</Button>
                <Button size="lg" variant="glow">Large</Button>
                <Button size="xl" variant="glow">Extra Large</Button>
              </div>
            </div>
            {/* States */}
            <div>
              <p className="text-white/40 text-xs font-mono mb-3">— states</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="glow" isLoading>Loading</Button>
                <Button variant="outline" disabled>Disabled</Button>
                <Button variant="glow"><Plus className="w-4 h-4" /> With Icon</Button>
                <Button variant="outline"><Edit3 className="w-4 h-4" /></Button>
                <Button variant="destructive"><Trash2 className="w-4 h-4" /> Delete</Button>
              </div>
            </div>
          </div>
        </Section>

        {/* Badge Variants */}
        <Section title="Badge Variants" icon={<Tag className="w-5 h-5" />} custom={3}>
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="purple"><Zap className="w-3 h-3" /> Purple</Badge>
            <Badge variant="success"><Check className="w-3 h-3" /> Success</Badge>
            <Badge variant="warning"><AlertTriangle className="w-3 h-3" /> Warning</Badge>
            <Badge variant="destructive"><X className="w-3 h-3" /> Error</Badge>
            <Badge variant="info"><Info className="w-3 h-3" /> Info</Badge>
          </div>
        </Section>

        {/* Card Examples */}
        <Section title="Card Examples" icon={<LayoutGrid className="w-5 h-5" />} custom={4}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Basic Card */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>A simple card with header and content.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card body content goes here. Add any information you need.</p>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <div
              className="p-6 rounded-2xl flex flex-col gap-3 relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-white/50 text-sm">Total Revenue</span>
                <Badge variant="success"><Star className="w-3 h-3" /> Top</Badge>
              </div>
              <div
                className="text-4xl font-black relative z-10"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                $142K
              </div>
              <p className="text-white/40 text-xs relative z-10">+23% from last month</p>
            </div>

            {/* Action Card */}
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                  <Download className="w-5 h-5 text-violet-400" />
                </div>
                <CardTitle>Action Card</CardTitle>
                <CardDescription>Card with footer action buttons.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Ready to get started? Take action now.</p>
              </CardContent>
              <CardFooter className="gap-3">
                <Button size="sm" variant="glow" className="flex-1">
                  Download <ArrowRight className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline">Cancel</Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        {/* Form Inputs */}
        <Section title="Form Inputs" icon={<FormInput className="w-5 h-5" />} custom={5}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <Label className="mb-1.5 block text-white/70 text-sm">Text Input</Label>
                <Input placeholder="Enter text..." />
              </div>
              <div>
                <Label className="mb-1.5 block text-white/70 text-sm">Email Input</Label>
                <Input type="email" placeholder="you@example.com" />
              </div>
              <div>
                <Label className="mb-1.5 block text-white/70 text-sm">Select</Label>
                <Select>
                  <option value="">Choose an option...</option>
                  <option value="a">Option A</option>
                  <option value="b">Option B</option>
                  <option value="c">Option C</option>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-white/70 text-sm">Disabled Input</Label>
                <Input placeholder="Disabled input" disabled />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <Label className="mb-1.5 block text-white/70 text-sm">Textarea</Label>
                <Textarea rows={4} placeholder="Enter a longer message..." />
              </div>
              <div>
                <Label className="mb-3 block text-white/70 text-sm">Toggle Switches</Label>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'a', label: 'Notifications enabled' },
                    { key: 'b', label: 'Dark mode' },
                    { key: 'c', label: 'Auto-save' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">{label}</span>
                      <Switch
                        checked={switchStates[key]}
                        onCheckedChange={(v) => setSwitchStates((s) => ({ ...s, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Notification Colors */}
        <Section title="Status Colors" icon={<Bell className="w-5 h-5" />} custom={6}>
          <div className="flex flex-col gap-3">
            {[
              { type: 'success', icon: <Check className="w-4 h-4" />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', msg: 'Operation completed successfully! Your changes have been saved.' },
              { type: 'warning', icon: <AlertTriangle className="w-4 h-4" />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', msg: 'Warning: This action cannot be undone. Please review before proceeding.' },
              { type: 'error', icon: <X className="w-4 h-4" />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', msg: 'Error: Failed to save changes. Please check your connection and try again.' },
              { type: 'info', icon: <Info className="w-4 h-4" />, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', msg: 'Info: A new version of the application is available. Refresh to update.' },
            ].map((alert) => (
              <div
                key={alert.type}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: alert.bg, border: `1px solid ${alert.border}` }}
              >
                <span style={{ color: alert.color }} className="mt-0.5 shrink-0">{alert.icon}</span>
                <span className="text-sm" style={{ color: alert.color }}>{alert.msg}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
