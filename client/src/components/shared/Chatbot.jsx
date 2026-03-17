import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Paperclip, Bot, User } from 'lucide-react';

const mockResponses = [
  "Thanks for reaching out! I'd love to help you with your project. Could you tell me more about what you're looking to build?",
  "Great question! Our team specializes in web apps, mobile experiences, and AI-powered solutions. What's your main goal?",
  "We typically start with a discovery call to understand your vision. Would you like to schedule one with our team?",
  "Our projects usually range from 4–16 weeks depending on complexity. What's your timeline looking like?",
  "We work with startups and enterprises alike. Our process is collaborative and transparent every step of the way.",
  "You can reach our team directly at hello@agency.com or fill out the contact form on our website. We respond within 24 hours!",
  "Absolutely! We offer ongoing maintenance and support packages after launch to keep everything running smoothly.",
];

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hi! I'm your AI assistant. How can I help you today?",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: trimmed,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: mockResponses[responseIndex % mockResponses.length],
        time: new Date(),
      };
      setResponseIndex((prev) => prev + 1);
      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 1200 + Math.random() * 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: `📎 Attached: ${file.name}`,
      time: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    e.target.value = '';

    setIsTyping(true);
    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Got your file "${file.name}"! Our team will review it and get back to you shortly.`,
        time: new Date(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              key="trigger"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)',
              }}
              aria-label="Open chat"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-violet-500" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat window */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="chatwindow"
              initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{
                width: 350,
                height: 500,
                background: 'rgba(9, 9, 11, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.2)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                >
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm leading-none">AI Assistant</p>
                  <p className="text-emerald-400 text-xs mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-end gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                      style={{
                        background:
                          msg.type === 'bot'
                            ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                            : 'linear-gradient(135deg, #374151, #4b5563)',
                      }}
                    >
                      {msg.type === 'bot' ? (
                        <Bot className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>

                    <div className={`flex flex-col gap-1 max-w-[75%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                        style={
                          msg.type === 'user'
                            ? {
                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                color: '#fff',
                                borderBottomRightRadius: 4,
                              }
                            : {
                                background: 'rgba(255,255,255,0.07)',
                                color: 'rgba(255,255,255,0.9)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderBottomLeftRadius: 4,
                              }
                        }
                      >
                        {msg.text}
                      </div>
                      <span className="text-white/30 text-[10px] px-1">{formatTime(msg.time)}</span>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex items-end gap-2"
                    >
                      <div
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
                      >
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div
                        className="px-3 py-3 rounded-2xl flex gap-1 items-center"
                        style={{
                          background: 'rgba(255,255,255,0.07)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderBottomLeftRadius: 4,
                        }}
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-violet-400 block"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div
                className="px-3 py-3 shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {/* File upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 p-1 rounded-lg text-white/40 hover:text-white/70 transition-colors"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                  />

                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                    style={{
                      background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent',
                    }}
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
