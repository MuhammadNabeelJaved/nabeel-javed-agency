import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Smile, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

const conversations = [
  { id: 'support', name: 'Support Team', avatar: 'ST', color: 'bg-violet-500', lastMessage: 'We\'re looking into it now!', time: '10m', unread: 2 },
  { id: 'lead', name: 'Alex Chen — Project Lead', avatar: 'AC', color: 'bg-emerald-500', lastMessage: 'Wireframes will be ready by EOD', time: '1h', unread: 0 },
  { id: 'design', name: 'Design Team', avatar: 'DT', color: 'bg-sky-500', lastMessage: 'Brand colors finalized ✓', time: '3h', unread: 1 },
];

const conversationMessages = {
  support: [
    { id: 1, from: 'them', sender: 'Support Team', text: 'Hi Marcus! Welcome to the portal. How can we help you today?', time: '9:00 AM' },
    { id: 2, from: 'me', text: 'Hi! I\'m having trouble accessing the Figma link for Horizon SaaS.', time: '9:02 AM' },
    { id: 3, from: 'them', sender: 'Support Team', text: 'Sure, let me check on that for you right away.', time: '9:03 AM' },
    { id: 4, from: 'them', sender: 'Support Team', text: 'It looks like the sharing settings need to be updated. Fixing that now!', time: '9:05 AM' },
    { id: 5, from: 'me', text: 'Great, thanks for the quick response!', time: '9:06 AM' },
    { id: 6, from: 'them', sender: 'Support Team', text: 'We\'re looking into it now! You should receive an updated link via email shortly.', time: '9:08 AM' },
  ],
  lead: [
    { id: 1, from: 'them', sender: 'Alex Chen', text: 'Hey Marcus! Quick update on the Horizon project.', time: 'Yesterday 2:00 PM' },
    { id: 2, from: 'them', sender: 'Alex Chen', text: 'We completed the onboarding flow prototype — the team is really happy with how it came out.', time: 'Yesterday 2:01 PM' },
    { id: 3, from: 'me', text: 'That\'s awesome! Can I take a look at the prototype?', time: 'Yesterday 2:15 PM' },
    { id: 4, from: 'them', sender: 'Alex Chen', text: 'Absolutely! Here\'s the Figma link: figma.com/proto/... (sharing now)', time: 'Yesterday 2:16 PM' },
    { id: 5, from: 'me', text: 'Looks great! Love the micro-animations on the step transitions.', time: 'Yesterday 4:00 PM' },
    { id: 6, from: 'them', sender: 'Alex Chen', text: 'Glad you like it! We can refine anything you want. Wireframes will be ready by EOD', time: '1h ago' },
  ],
  design: [
    { id: 1, from: 'them', sender: 'Priya Singh', text: 'Hi Marcus! We\'ve finalized the color palette for your brand refresh.', time: '8:00 AM' },
    { id: 2, from: 'me', text: 'Exciting! Can you share the palette?', time: '8:30 AM' },
    { id: 3, from: 'them', sender: 'Priya Singh', text: 'Primary: Deep Violet #7C3AED, Secondary: Emerald #10B981, Neutral: Slate grays', time: '8:32 AM' },
    { id: 4, from: 'me', text: 'I love the violet direction. Really premium feel.', time: '8:45 AM' },
    { id: 5, from: 'them', sender: 'Priya Singh', text: 'Brand colors finalized ✓', time: '3h ago' },
  ],
};

export default function UserChat() {
  const [currentConv, setCurrentConv] = useState('support');
  const [messagesByConv, setMessagesByConv] = useState(conversationMessages);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  const messages = messagesByConv[currentConv] || [];
  const currentConvData = conversations.find((c) => c.id === currentConv);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv, messages.length]);

  const send = () => {
    if (!input.trim()) return;
    const msg = {
      id: Date.now(), from: 'me',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessagesByConv((prev) => ({
      ...prev,
      [currentConv]: [...(prev[currentConv] || []), msg],
    }));
    setInput('');
  };

  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          <h2 className="text-base font-semibold text-white">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/30 rounded-lg pl-8 pr-3 py-2 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredConvs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setCurrentConv(conv.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all',
                currentConv === conv.id
                  ? 'bg-violet-600/20 border border-violet-500/30'
                  : 'hover:bg-white/[0.05] border border-transparent'
              )}
            >
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0', conv.color)}>
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white truncate">{conv.name}</p>
                  <span className="text-[10px] text-white/30 flex-shrink-0 ml-1">{conv.time}</span>
                </div>
                <p className="text-xs text-white/40 truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center flex-shrink-0">
                  {conv.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold', currentConvData?.color)}>
            {currentConvData?.avatar}
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">{currentConvData?.name}</h2>
            <p className="text-xs text-emerald-400">Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => {
            const isMe = msg.from === 'me';
            const showSender = !isMe && (i === 0 || messages[i - 1]?.from === 'me');
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-3', isMe && 'flex-row-reverse')}
              >
                {showSender ? (
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5', currentConvData?.color)}>
                    {currentConvData?.avatar}
                  </div>
                ) : !isMe ? (
                  <div className="w-8 flex-shrink-0" />
                ) : null}

                <div className={cn('max-w-[70%]', isMe && 'items-end flex flex-col')}>
                  {showSender && (
                    <p className="text-xs font-medium text-white/50 mb-1 ml-0.5">{msg.sender}</p>
                  )}
                  <div className={cn(
                    'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isMe
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-white/[0.07] text-white/80 rounded-tl-sm'
                  )}>
                    {msg.text}
                  </div>
                  <p className="text-[10px] text-white/25 mt-1 px-1">{msg.time}</p>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-3">
          <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-2.5">
            <button className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            <button className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={send}
              disabled={!input.trim()}
              className={cn(
                'p-1.5 rounded-lg transition-all flex-shrink-0',
                input.trim() ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-white/[0.06] text-white/20'
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
