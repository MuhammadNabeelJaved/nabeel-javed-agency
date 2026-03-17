import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/Select';
import { useContent } from '../../contexts/ContentContext';
import { toast } from 'sonner';

const techCategories = ['Frontend', 'Backend', 'AI', 'DevOps'];

export default function ContentEditor() {
  const {
    heroContent, updateHeroContent,
    techStack, updateTechStack,
    processSteps, updateProcessSteps,
    whyChooseUs, updateWhyChooseUs,
  } = useContent();

  // Hero form state
  const [heroForm, setHeroForm] = useState({ ...heroContent });
  const [showHeroPreview, setShowHeroPreview] = useState(false);

  // Tech stack state
  const [techItems, setTechItems] = useState(techStack);
  const [newTech, setNewTech] = useState({ name: '', icon: '', category: 'Frontend', description: '' });

  // Process steps state
  const [steps, setSteps] = useState(processSteps);

  // Why choose us state
  const [whyItems, setWhyItems] = useState(whyChooseUs);

  // Hero handlers
  const handleSaveHero = () => {
    updateHeroContent(heroForm);
    toast.success('Hero content saved!');
  };

  // Tech stack handlers
  const handleAddTech = () => {
    if (!newTech.name.trim()) { toast.error('Tech name is required'); return; }
    const updated = [...techItems, { ...newTech, id: Date.now().toString() }];
    setTechItems(updated);
    setNewTech({ name: '', icon: '', category: 'Frontend', description: '' });
    toast.success('Tech item added');
  };

  const handleDeleteTech = (id) => {
    const updated = techItems.filter((t) => t.id !== id);
    setTechItems(updated);
  };

  const handleSaveTech = () => {
    updateTechStack(techItems);
    toast.success('Tech stack saved!');
  };

  // Process steps handlers
  const moveStep = (index, direction) => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const updateStep = (id, field, value) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSaveSteps = () => {
    updateProcessSteps(steps);
    toast.success('Process steps saved!');
  };

  // Why choose us handlers
  const updateWhyItem = (id, field, value) => {
    setWhyItems((prev) => prev.map((w) => w.id === id ? { ...w, [field]: value } : w));
  };

  const handleSaveWhy = () => {
    updateWhyChooseUs(whyItems);
    toast.success('Why Choose Us saved!');
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      className="p-6 space-y-6"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-white">Content Editor</h1>
        <p className="text-gray-400 text-sm mt-1">Manage website content and copy</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="hero" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
            {['hero', 'tech', 'process', 'why'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-gray-400 capitalize"
              >
                {tab === 'hero' ? 'Hero Content' : tab === 'tech' ? 'Tech Stack' : tab === 'process' ? 'Process Steps' : 'Why Choose Us'}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab 1: Hero Content */}
          <TabsContent value="hero" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-white text-base">Edit Hero Section</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowHeroPreview(!showHeroPreview)}
                    className="text-gray-400 hover:text-white gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Badge Text</label>
                    <Input value={heroForm.badge || ''} onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9 text-sm" placeholder="e.g. 🚀 Now Offering AI Solutions" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Heading</label>
                    <Input value={heroForm.heading || ''} onChange={(e) => setHeroForm({ ...heroForm, heading: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9 text-sm" placeholder="Main heading text" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Heading Highlight</label>
                    <Input value={heroForm.headingHighlight || ''} onChange={(e) => setHeroForm({ ...heroForm, headingHighlight: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9 text-sm" placeholder="Highlighted word" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Subheading</label>
                    <Textarea value={heroForm.subheading || ''} onChange={(e) => setHeroForm({ ...heroForm, subheading: e.target.value })}
                      className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={3}
                      placeholder="Hero subtitle text..." />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Primary CTA</label>
                      <Input value={heroForm.primaryCta || ''} onChange={(e) => setHeroForm({ ...heroForm, primaryCta: e.target.value })}
                        className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Secondary CTA</label>
                      <Input value={heroForm.secondaryCta || ''} onChange={(e) => setHeroForm({ ...heroForm, secondaryCta: e.target.value })}
                        className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                    </div>
                  </div>
                  <Button onClick={handleSaveHero} variant="glow" className="w-full gap-2 mt-2">
                    <Save className="w-3.5 h-3.5" /> Save Hero Content
                  </Button>
                </CardContent>
              </Card>

              {showHeroPreview && (
                <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-white/10 overflow-hidden">
                  <CardContent className="p-8 text-center">
                    {heroForm.badge && (
                      <div className="inline-block px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs mb-4">
                        {heroForm.badge}
                      </div>
                    )}
                    <h1 className="text-white text-3xl font-bold leading-tight mb-2">
                      {heroForm.heading}{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                        {heroForm.headingHighlight}
                      </span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-3 leading-relaxed">{heroForm.subheading}</p>
                    <div className="flex gap-3 justify-center mt-6">
                      <div className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium">
                        {heroForm.primaryCta}
                      </div>
                      <div className="px-5 py-2 rounded-xl border border-white/20 text-white text-sm font-medium">
                        {heroForm.secondaryCta}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Tech Stack */}
          <TabsContent value="tech" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-base">Add Tech Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Name *</label>
                    <Input value={newTech.name} onChange={(e) => setNewTech({ ...newTech, name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9 text-sm" placeholder="e.g. React" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Icon (Emoji)</label>
                    <Input value={newTech.icon} onChange={(e) => setNewTech({ ...newTech, icon: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9 text-sm text-center" placeholder="⚛️" maxLength={2} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Category</label>
                    <Select value={newTech.category} onValueChange={(v) => setNewTech({ ...newTech, category: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/10">
                        {techCategories.map((c) => (
                          <SelectItem key={c} value={c} className="text-gray-300">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Description</label>
                    <Input value={newTech.description} onChange={(e) => setNewTech({ ...newTech, description: e.target.value })}
                      className="bg-white/5 border-white/10 text-white h-9 text-sm" placeholder="e.g. UI Framework" />
                  </div>
                  <Button onClick={handleAddTech} variant="outline" size="sm"
                    className="w-full border-white/10 text-gray-400 hover:text-white gap-2">
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </Button>
                </CardContent>
              </Card>

              <Card className="xl:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-white text-base">Tech Stack ({techItems.length} items)</CardTitle>
                  <Button onClick={handleSaveTech} variant="glow" size="sm" className="gap-2">
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {techItems.map((tech) => (
                      <div key={tech.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <span className="text-lg">{tech.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{tech.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-violet-400 text-xs">{tech.category}</span>
                            <span className="text-gray-600 text-xs">·</span>
                            <span className="text-gray-500 text-xs">{tech.description}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTech(tech.id)}
                          className="h-7 w-7 text-gray-600 hover:text-rose-400 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 3: Process Steps */}
          <TabsContent value="process" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-400 text-sm">{steps.length} process steps</p>
              <Button onClick={handleSaveSteps} variant="glow" size="sm" className="gap-2">
                <Save className="w-3.5 h-3.5" /> Save Steps
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <Card key={step.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                          className="h-7 w-7 text-gray-600 hover:text-white disabled:opacity-20">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-gray-600 text-xs text-center font-mono">{step.step}</span>
                        <Button variant="ghost" size="icon" onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                          className="h-7 w-7 text-gray-600 hover:text-white disabled:opacity-20">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-gray-500 text-xs mb-1 block">Icon</label>
                          <Input value={step.icon} onChange={(e) => updateStep(step.id, 'icon', e.target.value)}
                            className="bg-white/5 border-white/10 text-white h-8 text-sm text-center" maxLength={2} />
                        </div>
                        <div>
                          <label className="text-gray-500 text-xs mb-1 block">Title</label>
                          <Input value={step.title} onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                            className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="text-gray-500 text-xs mb-1 block">Description</label>
                          <Input value={step.description} onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                            className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab 4: Why Choose Us */}
          <TabsContent value="why" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleSaveWhy} variant="glow" size="sm" className="gap-2">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyItems.map((item) => (
                <Card key={item.id} className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">Icon</label>
                        <Input value={item.icon} onChange={(e) => updateWhyItem(item.id, 'icon', e.target.value)}
                          className="bg-white/5 border-white/10 text-white h-9 text-center text-lg" maxLength={2} />
                      </div>
                      <div className="col-span-3">
                        <label className="text-gray-500 text-xs mb-1 block">Title</label>
                        <Input value={item.title} onChange={(e) => updateWhyItem(item.id, 'title', e.target.value)}
                          className="bg-white/5 border-white/10 text-white h-9 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs mb-1 block">Description</label>
                      <Textarea value={item.description} onChange={(e) => updateWhyItem(item.id, 'description', e.target.value)}
                        className="bg-white/5 border-white/10 text-white resize-none text-sm" rows={2} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
