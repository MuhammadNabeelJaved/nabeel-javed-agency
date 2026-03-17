import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Label } from '../../components/ui/Label';
import { cn } from '../../lib/utils';

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

const cardAnim = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

const COLUMNS = ['todo', 'in-progress', 'review', 'done'];
const columnMeta = {
  'todo': { label: 'To Do', color: 'border-white/20', dot: 'bg-white/40' },
  'in-progress': { label: 'In Progress', color: 'border-violet-500/50', dot: 'bg-violet-400' },
  'review': { label: 'Review', color: 'border-amber-500/50', dot: 'bg-amber-400' },
  'done': { label: 'Done', color: 'border-emerald-500/50', dot: 'bg-emerald-400' },
};

const priorityConfig = {
  high: { variant: 'destructive', label: 'High' },
  medium: { variant: 'warning', label: 'Med' },
  low: { variant: 'success', label: 'Low' },
};

const initialTasks = [
  { id: 1, title: 'Design homepage wireframes', priority: 'high', project: 'Horizon SaaS', dueDate: 'Mar 20', column: 'todo' },
  { id: 2, title: 'Write API documentation', priority: 'medium', project: 'Dashboard Analytics', dueDate: 'Mar 22', column: 'todo' },
  { id: 3, title: 'Create onboarding flow prototype', priority: 'high', project: 'Horizon SaaS', dueDate: 'Mar 19', column: 'in-progress' },
  { id: 4, title: 'Build component library', priority: 'medium', project: 'Brand Identity', dueDate: 'Mar 25', column: 'in-progress' },
  { id: 5, title: 'Mobile responsive breakpoints', priority: 'low', project: 'E-commerce Redesign', dueDate: 'Mar 28', column: 'in-progress' },
  { id: 6, title: 'Color palette finalization', priority: 'medium', project: 'Brand Identity', dueDate: 'Mar 18', column: 'review' },
  { id: 7, title: 'Logo variations export', priority: 'high', project: 'Brand Identity', dueDate: 'Mar 17', column: 'review' },
  { id: 8, title: 'Stakeholder presentation deck', priority: 'high', project: 'Horizon SaaS', dueDate: 'Mar 18', column: 'review' },
  { id: 9, title: 'Setup CI/CD pipeline', priority: 'medium', project: 'Dashboard Analytics', dueDate: 'Mar 10', column: 'done' },
  { id: 10, title: 'User research interviews', priority: 'high', project: 'Mobile App MVP', dueDate: 'Mar 8', column: 'done' },
  { id: 11, title: 'Accessibility audit report', priority: 'low', project: 'E-commerce Redesign', dueDate: 'Mar 12', column: 'done' },
  { id: 12, title: 'Sprint retrospective notes', priority: 'low', project: 'Horizon SaaS', dueDate: 'Mar 14', column: 'done' },
];

const projects = ['All', 'Horizon SaaS', 'Brand Identity', 'E-commerce Redesign', 'Dashboard Analytics', 'Mobile App MVP'];
const priorities = ['All', 'High', 'Medium', 'Low'];

export default function TeamTasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterProject, setFilterProject] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', project: 'Horizon SaaS', dueDate: '' });

  const moveTask = (id, direction) => {
    const idx = COLUMNS.indexOf(tasks.find((t) => t.id === id)?.column);
    const newCol = COLUMNS[Math.min(Math.max(idx + direction, 0), COLUMNS.length - 1)];
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column: newCol } : t)));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    setTasks((prev) => [
      ...prev,
      { ...newTask, id: Date.now(), column: 'todo' },
    ]);
    setNewTask({ title: '', priority: 'medium', project: 'Horizon SaaS', dueDate: '' });
    setAddOpen(false);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchProject = filterProject === 'All' || t.project === filterProject;
    const matchPriority = filterPriority === 'All' || t.priority === filterPriority.toLowerCase();
    return matchProject && matchPriority;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6 space-y-6">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-sm text-white/50 mt-0.5">{tasks.length} total tasks</p>
        </div>
        <Button variant="glow" onClick={() => setAddOpen(true)} className="self-start gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div custom={1} variants={fadeIn} initial="hidden" animate="visible" className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <span className="text-xs text-white/40">Project:</span>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-white/[0.06] border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-white/[0.06] border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
          >
            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <motion.div custom={2} variants={fadeIn} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.column === col);
          return (
            <div key={col} className={cn('rounded-2xl border bg-white/[0.02] p-3 space-y-3 min-h-[200px]', columnMeta[col].color)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', columnMeta[col].dot)} />
                  <h3 className="text-sm font-semibold text-white/80">{columnMeta[col].label}</h3>
                </div>
                <span className="text-xs text-white/30 bg-white/[0.06] px-2 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              <AnimatePresence>
                {colTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    variants={cardAnim}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <div
                      className="p-3 rounded-xl bg-white/[0.05] border border-white/10 hover:border-white/20 cursor-pointer group transition-all space-y-2"
                      onClick={() => setSelectedTask(task)}
                    >
                      <p className="text-sm text-white/80 group-hover:text-white transition-colors leading-snug">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={priorityConfig[task.priority].variant} className="text-[10px] px-1.5 py-0">
                          {priorityConfig[task.priority].label}
                        </Badge>
                        <span className="text-[10px] text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                          {task.project}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/30">Due {task.dueDate}</p>
                      {/* Move buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {COLUMNS.indexOf(col) > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveTask(task.id, -1); }}
                            className="text-[10px] text-white/40 hover:text-white bg-white/[0.06] hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                          >
                            ← Move Back
                          </button>
                        )}
                        {COLUMNS.indexOf(col) < COLUMNS.length - 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveTask(task.id, 1); }}
                            className="text-[10px] text-white/40 hover:text-white bg-white/[0.06] hover:bg-white/10 px-2 py-0.5 rounded transition-colors"
                          >
                            Move Fwd →
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

      {/* Add Task Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#131320] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Task Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                placeholder="Enter task title..."
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Priority</Label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70 text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                  className="bg-white/[0.04] border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70 text-xs">Project</Label>
              <select
                value={newTask.project}
                onChange={(e) => setNewTask((p) => ({ ...p, project: e.target.value }))}
                className="w-full bg-white/[0.04] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none"
              >
                {projects.filter((p) => p !== 'All').map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setAddOpen(false)} className="text-white/50">Cancel</Button>
              <Button variant="glow" onClick={addTask}>Create Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-[#131320] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedTask?.title}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={priorityConfig[selectedTask.priority].variant}>{priorityConfig[selectedTask.priority].label} Priority</Badge>
                <Badge variant="outline" className="border-white/20 text-white/60">{selectedTask.project}</Badge>
              </div>
              <p className="text-sm text-white/50">Due: {selectedTask.dueDate}</p>
              <p className="text-sm text-white/50">Column: <span className="text-white capitalize">{selectedTask.column.replace('-', ' ')}</span></p>
              <div className="flex gap-2 pt-2 flex-wrap">
                {COLUMNS.map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, column: col } : t));
                      setSelectedTask(null);
                    }}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-lg border transition-all',
                      selectedTask.column === col
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white/[0.04] border-white/10 text-white/50 hover:border-white/20 hover:text-white'
                    )}
                  >
                    {columnMeta[col].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
