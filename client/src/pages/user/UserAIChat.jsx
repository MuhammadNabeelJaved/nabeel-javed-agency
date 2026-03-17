import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Zap, User, X, ChevronRight, Code, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

const suggestedPrompts = [
  { id: 1, text: 'What\'s the current status of my projects?', icon: FileText },
  { id: 2, text: 'Explain the design process for my brand refresh', icon: Zap },
  { id: 3, text: 'How do I request changes to a deliverable?', icon: ChevronRight },
  { id: 4, text: 'What are my upcoming project milestones?', icon: FileText },
  { id: 5, text: 'Help me write a brief for a new feature', icon: Code },
  { id: 6, text: 'What should I review before the next call?', icon: FileText },
];

const followUpPrompts = {
  status: [
    'Tell me more about the Horizon SaaS timeline',
    'What deliverables are pending my review?',
  ],
  design: [
    'What is the typical brand identity timeline?',
    'Can I see examples of similar brand work?',
  ],
  changes: [
    'How many revision rounds do I have?',
    'What\'s the turnaround time for changes?',
  ],
  milestones: [
    'Add this to my calendar',
    'What happens after each milestone?',
  ],
};

const aiResponses = {
  'What\'s the current status of my projects?': {
    text: 'Here\'s a quick overview of your active projects:\n\n**Horizon SaaS Platform** — 72% complete. The team is currently building out the component library and onboarding prototype. Next milestone: Final Prototype Delivery on March 25.\n\n**Brand Identity Refresh** — 45% complete. Color palette has been finalized and is pending your approval. Logo variations are in progress.\n\n**Mobile App MVP** — 15% complete. Currently in the planning & discovery phase. User research report is ready for your review.',
    followUps: followUpPrompts.status,
  },
  'Explain the design process for my brand refresh': {
    text: 'Your brand identity refresh follows a structured 5-phase process:\n\n```\n1. Discovery & Research (done)\n   └─ Brand audit, competitor analysis, stakeholder interviews\n\n2. Strategy & Direction (done)\n   └─ Brand positioning, tone of voice, moodboards\n\n3. Visual Development (in progress)\n   └─ Logo concepts, color palette, typography\n\n4. Refinement & Approval\n   └─ Client feedback rounds, final asset production\n\n5. Handoff & Guidelines\n   └─ Brand manual, asset library, usage rules\n```\nYou\'re currently in Phase 3. The color palette is ready for your review!',
    followUps: followUpPrompts.design,
  },
  'How do I request changes to a deliverable?': {
    text: 'Requesting changes is simple! Here are your options:\n\n**Option 1 — In-portal:** Go to your project, click the deliverable, and use the "Request Changes" button to leave specific feedback.\n\n**Option 2 — Chat:** Message your Project Lead directly with your feedback. This is best for quick clarifications.\n\n**Option 3 — Comment in Figma:** If the deliverable is a design file, you can add comments directly in Figma using the comment tool (C).\n\n> Note: Your plan includes **3 revision rounds** per deliverable. You\'ve used 1 round on the Brand Identity project.',
    followUps: followUpPrompts.changes,
  },
  'What are my upcoming project milestones?': {
    text: 'Here are your upcoming milestones across all projects:\n\n📅 **March 25, 2026**\n→ Final Prototype Delivery — Horizon SaaS Platform\n\n📅 **April 5, 2026**\n→ Brand Guidelines Handoff — Brand Identity Refresh\n\n📅 **April 20, 2026**\n→ MVP Feature Freeze — Mobile App MVP\n\n📅 **April 15, 2026**\n→ Horizon SaaS Platform Launch 🚀\n\nWould you like me to add any of these to your calendar?',
    followUps: followUpPrompts.milestones,
  },
};

const defaultResponse = {
  text: 'That\'s a great question! I\'m here to help you navigate your projects, understand deliverables, and get the most out of your collaboration with our team. Could you provide a bit more detail so I can give you the most accurate answer?\n\nAlternatively, you can reach out directly to your **Project Lead, Alex Chen**, via the Chat section.',
  followUps: ['Tell me about my active projects', 'How do I contact my project lead?'],
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-violet-400"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```\w*\n?/g, '').trim();
          return (
            <pre key={i} className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
              {code}
            </pre>
          );
        }
        return (
          <p key={i} className="text-white/80 whitespace-pre-line">
            {part.split(/\*\*(.*?)\*\*/g).map((s, j) =>
              j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{s}</strong> : s
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function UserAIChat() {
  const [messages, setMessages] = useState([
    {
      id: 1, from: 'ai',
      text: 'Hi Marcus! I\'m your AI assistant. I can help you understand your project status, deliverables, timelines, and more. What would you like to know?',
      followUps: ['What\'s the current status of my projects?', 'What are my upcoming project milestones?'],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [recentFiles] = useState(['brand_brief_v2.pdf', 'design_feedback.docx', 'requirements.md']);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    if (!text.trim() && !uploadedFile) return;
    const userMsg = {
      id: Date.now(), from: 'user',
      text: text.trim() || `[File: ${uploadedFile?.name}]`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setUploadedFile(null);
    setIsTyping(true);

    const delay = 1000 + Math.random() * 800;
    setTimeout(() => {
      const response = aiResponses[text.trim()] || defaultResponse;
      const aiMsg = { id: Date.now() + 1, from: 'ai', text: response.text, followUps: response.followUps };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 flex-shrink-0 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="p-1.5 bg-violet-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="font-semibold text-white text-sm">AI Assistant</h2>
          </div>
          <p className="text-xs text-white/30 ml-9">Powered by agency AI</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Suggested Prompts */}
          <div>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2 px-1">Suggested</p>
            <div className="space-y-1">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => sendMessage(prompt.text)}
                  className="w-full flex items-start gap-2 px-2 py-2 rounded-lg text-left text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all group"
                >
                  <prompt.icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-violet-400 group-hover:text-violet-300" />
                  <span className="leading-snug">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Files */}
          <div>
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2 px-1">Recent Files</p>
            <div className="space-y-1">
              {recentFiles.map((file) => (
                <div key={file} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/40">
                  <FileText className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                  <span className="truncate">{file}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <h2 className="font-semibold text-white">Chat with AI</h2>
          <p className="text-xs text-white/40">Ask anything about your projects, deliverables, or processes</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn('flex gap-3', msg.from === 'user' && 'flex-row-reverse')}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                msg.from === 'ai' ? 'bg-gradient-to-br from-violet-600 to-purple-600' : 'bg-white/10'
              )}>
                {msg.from === 'ai' ? <Zap className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white/60" />}
              </div>

              <div className={cn('max-w-[75%] space-y-3', msg.from === 'user' && 'items-end flex flex-col')}>
                {/* Bubble */}
                <div className={cn(
                  'rounded-2xl px-4 py-3',
                  msg.from === 'ai'
                    ? 'bg-white/[0.06] border border-white/10 rounded-tl-sm'
                    : 'bg-violet-600 rounded-tr-sm'
                )}>
                  {msg.from === 'ai' ? (
                    <MessageContent text={msg.text} />
                  ) : (
                    <p className="text-sm text-white">{msg.text}</p>
                  )}
                </div>

                {/* Follow-up suggestions */}
                {msg.from === 'ai' && msg.followUps && (
                  <div className="flex flex-wrap gap-2">
                    {msg.followUps.map((fp, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(fp)}
                        className="text-xs px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-full text-white/50 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all"
                      >
                        {fp}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-sm">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-3 space-y-2">
          {/* File preview */}
          {uploadedFile && (
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 w-fit">
              <FileText className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-white/70">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="text-white/30 hover:text-white/70">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0 mb-0.5"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFile} />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Ask the AI assistant anything..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none resize-none max-h-32"
              style={{ lineHeight: '1.5' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() && !uploadedFile}
              className={cn(
                'p-1.5 rounded-lg transition-all flex-shrink-0 mb-0.5',
                (input.trim() || uploadedFile)
                  ? 'bg-violet-600 text-white hover:bg-violet-500'
                  : 'bg-white/[0.06] text-white/20'
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-white/20">AI responses are generated and may not always be 100% accurate. Verify with your project team.</p>
        </div>
      </div>
    </div>
  );
}
