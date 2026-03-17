import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/Dialog';
import { toast } from 'sonner';

const predefinedColors = [
  '#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#84cc16', '#f97316',
];

const initialCategories = [
  { id: 1, name: 'Web Development', slug: 'web-development', count: 8, color: '#8b5cf6' },
  { id: 2, name: 'Mobile Apps', slug: 'mobile-apps', count: 5, color: '#6366f1' },
  { id: 3, name: 'UI/UX Design', slug: 'ui-ux-design', count: 6, color: '#ec4899' },
  { id: 4, name: 'AI & Machine Learning', slug: 'ai-ml', count: 4, color: '#10b981' },
  { id: 5, name: 'E-Commerce', slug: 'e-commerce', count: 7, color: '#f59e0b' },
  { id: 6, name: 'SaaS Platforms', slug: 'saas-platforms', count: 3, color: '#3b82f6' },
  { id: 7, name: 'DevOps & Cloud', slug: 'devops-cloud', count: 2, color: '#06b6d4' },
  { id: 8, name: 'Digital Marketing', slug: 'digital-marketing', count: 4, color: '#ef4444' },
];

const slugify = (str) =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const emptyForm = { name: '', color: '#8b5cf6' };

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditTarget(cat);
    setForm({ name: cat.name, color: cat.color });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    const slug = slugify(form.name);
    if (editTarget) {
      setCategories((prev) => prev.map((c) => c.id === editTarget.id
        ? { ...c, name: form.name, slug, color: form.color } : c));
      toast.success('Category updated');
    } else {
      setCategories((prev) => [...prev, { id: Date.now(), name: form.name, slug, count: 0, color: form.color }]);
      toast.success('Category added');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setCategories((prev) => prev.filter((c) => c.id !== deleteModal.id));
    toast.success('Category deleted');
    setDeleteModal(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">{categories.length} categories total</p>
        </div>
        <Button onClick={openAdd} variant="glow" className="gap-2">
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Category', 'Slug', 'Projects', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-gray-500 text-xs font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <motion.tr
                  key={cat.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: cat.color + '25', border: `1px solid ${cat.color}50` }}
                      >
                        <Tag className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-white text-sm font-medium">{cat.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded-md font-mono">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: cat.color + '25', color: cat.color }}
                    >
                      {cat.count} projects
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}
                        className="h-7 w-7 text-gray-500 hover:text-violet-400">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteModal(cat)}
                        className="h-7 w-7 text-gray-500 hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Category Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white h-9" placeholder="e.g. Web Development" />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${form.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-6 h-6 rounded-md" style={{ backgroundColor: form.color }} />
                <span className="text-gray-400 text-xs font-mono">{form.color}</span>
              </div>
            </div>
            {form.name && (
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Preview Slug</label>
                <code className="text-gray-500 text-xs bg-white/5 px-2 py-1 rounded-md font-mono block">
                  {slugify(form.name)}
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleSave} variant="glow">
              {editTarget ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400 text-sm py-2">
            Delete <span className="text-white font-medium">"{deleteModal?.name}"</span>? Projects in this category will need to be reassigned.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModal(null)} className="text-gray-400">Cancel</Button>
            <Button onClick={handleDelete} variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
