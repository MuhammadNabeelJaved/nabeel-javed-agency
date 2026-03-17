import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Hash, Circle, Smile, Paperclip } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const channels = [
  { id: 'general', name: 'General', unread: 0 },
  { id: 'projects', name: 'Projects', unread: 3 },
  { id: 'design', name: 'Design', unread: 1 },
  { id: 'engineering', name: 'Engineering', unread: 0 },
  { id: 'random', name: 'Random', unread: 2 },
];

const users = {
  alex: { name: 'Alex Chen', color: 'bg-violet-500', online: true },
  beth: { name: 'Beth Park', color: 'bg-emerald-500', online: true },
  carlos: { name: 'Carlos Diaz', color: 'bg-sky-500', online: false },
  priya: { name: 'Priya Singh', color: 'bg-amber-500', online: true },
  me: { name: 'You', color: 'bg-rose-500', online: true },
};

const channelMessages = {
  general: [
    { id: 1, user: 'alex', text: 'Good morning everyone! Ready for the sprint?', time: '9:01 AM' },
    { id: 2, user: 'beth', text: 'Morning! Yes, just finishing up my daily standup notes.', time: '9:03 AM' },
    { id: 3, user: 'carlos', text: 'Sprint looks packed this week — 14 story points 😅', time: '9:05 AM' },
    { id: 4, user: 'me', text: 'Hey all! I\'ll share the updated wireframes after the 10am call.', time: '9:06 AM' },
    { id: 5, user: 'priya', text: 'The figma link is live btw — have a look before the meeting', time: '9:08 AM' },
    { id: 6, user: 'alex', text: 'Saw it — looks great! The new onboarding flow is much cleaner.', time: '9:10 AM' },
    { id: 7, user: 'beth', text: 'Agreed. The stepper component is really smooth.', time: '9:11 AM' },
    { id: 8, user: 'carlos', text: 'I\'ll start building it out once the specs are locked in', time: '9:13 AM' },
    { id: 9, user: 'me', text: 'Will have them locked by EOD. Also — can someone review the color tokens PR?', time: '9:15 AM' },
    { id: 10, user: 'priya', text: 'On it 👍', time: '9:16 AM' },
    { id: 11, user: 'alex', text: 'Also heads up: client call moved to 3pm', time: '9:20 AM' },
    { id: 12, user: 'beth', text: 'Got it, added to cal', time: '9:21 AM' },
    { id: 13, user: 'carlos', text: 'Thanks for the heads up', time: '9:22 AM' },
    { id: 14, user: 'me', text: 'Cool. I\'ll prep a quick deck for the demo', time: '9:23 AM' },
    { id: 15, user: 'priya', text: 'Want me to add the new screens to it?', time: '9:25 AM' },
    { id: 16, user: 'me', text: 'Yes please! Slides 4-6 would be perfect for the UI update', time: '9:26 AM' },
    { id: 17, user: 'alex', text: 'Sent over the client feedback doc too — lots of positive notes!', time: '9:30 AM' },
    { id: 18, user: 'beth', text: 'That\'s awesome to hear 🎉', time: '9:31 AM' },
    { id: 19, user: 'carlos', text: 'Makes the late nights worth it 😄', time: '9:32 AM' },
    { id: 20, user: 'me', text: 'Seriously! Big thanks to everyone. Let\'s crush this sprint.', time: '9:33 AM' },
  ],
  projects: [
    { id: 1, user: 'carlos', text: 'Horizon project board updated — moved 3 tasks to review', time: '8:45 AM' },
    { id: 2, user: 'beth', text: 'I\'ll check them now', time: '8:47 AM' },
    { id: 3, user: 'alex', text: 'Just pushed the new API endpoints', time: '8:50 AM' },
    { id: 4, user: 'priya', text: 'Staging deploy successful ✅', time: '9:00 AM' },
    { id: 5, user: 'me', text: 'Perfect timing! Checking staging now.', time: '9:02 AM' },
  ],
  design: [
    { id: 1, user: 'me', text: 'Uploaded new icon set to shared drive', time: '10:00 AM' },
    { id: 2, user: 'priya', text: 'These look 🔥 — the outlined style is so clean', time: '10:05 AM' },
    { id: 3, user: 'alex', text: 'Love the consistency with the rounded corners', time: '10:08 AM' },
  ],
  engineering: [
    { id: 1, user: 'carlos', text: 'Updated dependencies across all packages', time: '7:30 AM' },
    { id: 2, user: 'beth', text: 'Nice — any breaking changes?', time: '7:35 AM' },
    { id: 3, user: 'carlos', text: 'Small one in the chart lib — PR has the fix already', time: '7:40 AM' },
  ],
  random: [
    { id: 1, user: 'alex', text: 'Anyone watching the game tonight?', time: '6:00 PM' },
    { id: 2, user: 'beth', text: 'Always 🏀', time: '6:05 PM' },
    { id: 3, user: 'priya', text: 'I\'m in! Score update channel activating lol', time: '6:10 PM' },
  ],
};

export default function TeamChat() {
  const [currentChannel, setCurrentChannel] = useState('general');
  const [messagesByChannel, setMessagesByChannel] = useState(channelMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const messages = messagesByChannel[currentChannel] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChannel, messages.length]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      user: 'me',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessagesByChannel((prev) => ({
      ...prev,
      [currentChannel]: [...(prev[currentChannel] || []), newMsg],
    }));
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white/80">Team Chat</h2>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider px-2 mb-1.5">Channels</p>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChannel(ch.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all text-left',
                currentChannel === ch.id
                  ? 'bg-violet-600/30 text-violet-300'
                  : 'text-white/50 hover:bg-white/[0.05] hover:text-white/80'
              )}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 truncate">{ch.name}</span>
              {ch.unread > 0 && (
                <span className="bg-violet-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {ch.unread}
                </span>
              )}
            </button>
          ))}

          {/* Users */}
          <div className="mt-4">
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-wider px-2 mb-1.5">Team</p>
            {Object.entries(users).filter(([k]) => k !== 'me').map(([key, user]) => (
              <div key={key} className="flex items-center gap-2 px-2 py-1.5 text-sm text-white/40">
                <div className="relative">
                  <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold', user.color)}>
                    {user.name[0]}
                  </div>
                  <div className={cn('absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0a0a0f]', user.online ? 'bg-emerald-500' : 'bg-white/20')} />
                </div>
                <span className="truncate">{user.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3 bg-white/[0.02]">
          <Hash className="w-5 h-5 text-white/40" />
          <div>
            <h2 className="font-semibold text-white capitalize">{currentChannel}</h2>
            <p className="text-xs text-white/30">{messages.length} messages</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => {
            const user = users[msg.user];
            const isMe = msg.user === 'me';
            const showAvatar = i === 0 || messages[i - 1]?.user !== msg.user;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn('flex gap-3', isMe && 'flex-row-reverse')}
              >
                {showAvatar ? (
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5', user?.color)}>
                    {user?.name[0]}
                  </div>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}
                <div className={cn('max-w-[70%] space-y-0.5', isMe && 'items-end flex flex-col')}>
                  {showAvatar && (
                    <div className={cn('flex items-baseline gap-2', isMe && 'flex-row-reverse')}>
                      <span className="text-xs font-semibold text-white/80">{isMe ? 'You' : user?.name}</span>
                      <span className="text-[10px] text-white/30">{msg.time}</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'px-3.5 py-2 rounded-2xl text-sm leading-relaxed',
                      isMe
                        ? 'bg-violet-600 text-white rounded-tr-sm'
                        : 'bg-white/[0.07] text-white/80 rounded-tl-sm'
                    )}
                  >
                    {msg.text}
                  </div>
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
              onKeyDown={handleKey}
              placeholder={`Message #${currentChannel}`}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
            <button className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
              <Smile className="w-4 h-4" />
            </button>
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className={cn(
                'p-1.5 rounded-lg transition-all flex-shrink-0',
                input.trim()
                  ? 'bg-violet-600 text-white hover:bg-violet-500'
                  : 'bg-white/[0.06] text-white/20'
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
