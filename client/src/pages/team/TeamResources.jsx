import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Eye, Palette, Code2, FileText, Star,
  Figma, Image, Archive, File
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35 } }),
};

const categories = ['All', 'Design Assets', 'Code Snippets', 'Documentation', 'Brand Assets'];

const categoryConfig = {
  'Design Assets': { icon: Palette, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  'Code Snippets': { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'Documentation': { icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  'Brand Assets': { icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const fileTypeIcons = {
  FIG: Figma,
  PNG: Image,
  ZIP: Archive,
  PDF: FileText,
  JS: Code2,
  TS: Code2,
  MD: FileText,
  SVG: Image,
};

const fileTypeColors = {
  FIG: 'bg-violet-500/20 text-violet-400',
  PNG: 'bg-pink-500/20 text-pink-400',
  ZIP: 'bg-amber-500/20 text-amber-400',
  PDF: 'bg-rose-500/20 text-rose-400',
  JS: 'bg-emerald-500/20 text-emerald-400',
  TS: 'bg-sky-500/20 text-sky-400',
  MD: 'bg-white/10 text-white/50',
  SVG: 'bg-cyan-500/20 text-cyan-400',
};

const resources = [
  { id: 1, title: 'UI Component Library', description: 'Complete Figma component set with dark/light variants', category: 'Design Assets', fileType: 'FIG', size: '24.5 MB', date: 'Mar 15', downloads: 42 },
  { id: 2, title: 'Icon Pack v2', description: '500+ outline icons in SVG and PNG format', category: 'Design Assets', fileType: 'ZIP', size: '8.2 MB', date: 'Mar 10', downloads: 87 },
  { id: 3, title: 'React Hook Collection', description: 'Custom hooks for auth, data fetching, and state management', category: 'Code Snippets', fileType: 'JS', size: '45 KB', date: 'Mar 8', downloads: 31 },
  { id: 4, title: 'TypeScript Utilities', description: 'Type helpers, generic patterns, and utility functions', category: 'Code Snippets', fileType: 'TS', size: '28 KB', date: 'Mar 6', downloads: 19 },
  { id: 5, title: 'API Integration Guide', description: 'Step-by-step guide for REST and GraphQL integrations', category: 'Documentation', fileType: 'MD', size: '120 KB', date: 'Mar 5', downloads: 55 },
  { id: 6, title: 'Design System Spec', description: 'Full specification document for our design tokens and patterns', category: 'Documentation', fileType: 'PDF', size: '3.1 MB', date: 'Mar 1', downloads: 72 },
  { id: 7, title: 'Brand Logo Package', description: 'All logo variants in SVG, PNG, and print-ready formats', category: 'Brand Assets', fileType: 'ZIP', size: '15.6 MB', date: 'Feb 28', downloads: 108 },
  { id: 8, title: 'Color Palette Guide', description: 'Brand colors with hex, RGB, and OKLCH values', category: 'Brand Assets', fileType: 'PDF', size: '1.8 MB', date: 'Feb 25', downloads: 64 },
  { id: 9, title: 'Motion Guidelines', description: 'Animation timing, easing curves, and interaction principles', category: 'Documentation', fileType: 'PDF', size: '2.4 MB', date: 'Feb 22', downloads: 38 },
  { id: 10, title: 'Tailwind Config Template', description: 'Pre-configured Tailwind setup with custom design tokens', category: 'Code Snippets', fileType: 'JS', size: '12 KB', date: 'Feb 20', downloads: 93 },
  { id: 11, title: 'Illustration Pack', description: 'Custom brand illustrations for error pages and marketing', category: 'Design Assets', fileType: 'PNG', size: '35.0 MB', date: 'Feb 18', downloads: 47 },
  { id: 12, title: 'Typography Specimens', description: 'Font specimens and hierarchy examples for approved typefaces', category: 'Brand Assets', fileType: 'FIG', size: '6.7 MB', date: 'Feb 15', downloads: 29 },
];

export default function TeamResources() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = resources.filter((r) => {
    const matchCat = activeCategory === 'All' || r.category === activeCategory;
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          <p className="text-sm text-white/50 mt-0.5">Team asset library</p>
        </div>
        <Button variant="glow" className="self-start gap-2">
          <Archive className="w-4 h-4" /> Upload Resource
        </Button>
      </motion.div>

      {/* Category Stats */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.filter((c) => c !== 'All').map((cat) => {
          const config = categoryConfig[cat];
          const count = resources.filter((r) => r.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'p-3 rounded-xl border text-left transition-all',
                activeCategory === cat
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              )}
            >
              <div className={cn('p-1.5 rounded-lg w-fit mb-2', config.bg)}>
                <config.icon className={cn('w-4 h-4', config.color)} />
              </div>
              <p className="text-xs text-white/60 font-medium">{cat}</p>
              <p className="text-lg font-bold text-white">{count}</p>
            </button>
          );
        })}
      </motion.div>

      {/* Search + All Filter */}
      <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                activeCategory === c
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/[0.04] text-white/50 hover:text-white border border-white/10'
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((resource, i) => {
            const catConfig = categoryConfig[resource.category];
            const FileIcon = fileTypeIcons[resource.fileType] || File;
            return (
              <motion.div
                key={resource.id}
                custom={i}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className="bg-white/[0.04] border-white/10 hover:border-white/20 transition-all group">
                  <CardContent className="p-5 space-y-4">
                    {/* Icon + Type */}
                    <div className="flex items-start justify-between">
                      <div className={cn('p-2.5 rounded-xl', catConfig.bg)}>
                        <catConfig.icon className={cn('w-5 h-5', catConfig.color)} />
                      </div>
                      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-lg', fileTypeColors[resource.fileType] || 'bg-white/10 text-white/50')}>
                        {resource.fileType}
                      </span>
                    </div>

                    {/* Title + Description */}
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors text-sm">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2">{resource.description}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-white/30">
                      <span>{resource.size}</span>
                      <span>{resource.downloads} downloads</span>
                      <span>{resource.date}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1.5 border-white/10 text-white/50 hover:text-white hover:border-white/20">
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </Button>
                      <Button size="sm" variant="glow" className="flex-1 h-8 text-xs gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="text-center py-16">
          <Archive className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No resources found.</p>
        </motion.div>
      )}
    </div>
  );
}
