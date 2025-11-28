'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface WidgetPreviewProps {
  botName: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
}

export function WidgetPreview({ botName, primaryColor, position }: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'modes' | 'chat'>('modes');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleModeSelect = (mode: string) => {
    setCurrentView('chat');
    setMessages([
      {
        role: 'assistant',
        content: mode === 'bug_report'
          ? "I'm here to help you report a bug. Can you tell me what's going wrong?"
          : mode === 'feedback'
          ? "I'd love to hear your feedback! What would you like to share?"
          : "Hi! I'm here to help you with any questions. What would you like to know?",
      },
    ]);
  };

  const handleReset = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCurrentView('modes');
      setMessages([]);
    }, 300);
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Device Frame */}
      <div className="bg-canvas/50 backdrop-blur-sm rounded-2xl border-2 border-mist/30 p-8 shadow-2xl">
        {/* Browser Chrome */}
        <div className="bg-slate rounded-t-lg border-2 border-mist/20 p-3 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-coral/60" />
            <div className="w-3 h-3 rounded-full bg-lime/60" />
            <div className="w-3 h-3 rounded-full bg-cyan/60" />
          </div>
          <div className="bg-canvas/50 rounded px-3 py-1.5 font-mono text-xs text-ash">
            https://yoursite.com
          </div>
        </div>

        {/* Preview Area */}
        <div className="relative bg-gradient-to-br from-mist/5 to-transparent rounded-lg border-2 border-mist/20 overflow-hidden" style={{ height: '500px' }}>
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="font-display text-6xl font-bold text-mist/10 mb-2">
                PREVIEW
              </p>
              <p className="font-mono text-sm text-ash/40">
                Live widget preview
              </p>
            </div>
          </div>

          {/* Widget Button */}
          <AnimatePresence>
            {!isOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => setIsOpen(true)}
                className="absolute shadow-xl hover:scale-110 transition-transform"
                style={{
                  [position.includes('right') ? 'right' : 'left']: '20px',
                  bottom: '20px',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: primaryColor,
                  color: '#0a0e1a',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Widget Panel */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="absolute bg-paper shadow-2xl rounded-xl overflow-hidden flex flex-col"
                style={{
                  [position.includes('right') ? 'right' : 'left']: '20px',
                  bottom: '90px',
                  width: '360px',
                  height: '520px',
                }}
              >
                {/* Header */}
                <div
                  className="px-5 py-4 flex items-center justify-between text-ink"
                  style={{ backgroundColor: primaryColor }}
                >
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="font-semibold text-sm">{botName}</span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-white">
                  <AnimatePresence mode="wait">
                    {currentView === 'modes' ? (
                      <motion.div
                        key="modes"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6 space-y-4"
                      >
                        <h3 className="font-bold text-lg text-gray-900 mb-4">How can we help?</h3>
                        <button
                          onClick={() => handleModeSelect('documentation')}
                          className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors text-left flex items-center gap-3 bg-gray-50"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          </div>
                          <span className="font-semibold text-sm text-gray-900">Ask a question</span>
                        </button>
                        <button
                          onClick={() => handleModeSelect('bug_report')}
                          className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors text-left flex items-center gap-3 bg-gray-50"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="8" y="6" width="8" height="12" rx="1" />
                              <path d="M15 6v-2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2" />
                            </svg>
                          </div>
                          <span className="font-semibold text-sm text-gray-900">Report a bug</span>
                        </button>
                        <button
                          onClick={() => handleModeSelect('feedback')}
                          className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors text-left flex items-center gap-3 bg-gray-50"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7" />
                            </svg>
                          </div>
                          <span className="font-semibold text-sm text-gray-900">Give feedback</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col h-full"
                      >
                        {/* Messages */}
                        <div className="flex-1 p-4 space-y-3">
                          {messages.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              {msg.role === 'assistant' && (
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
                                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="4" />
                                  </svg>
                                </div>
                              )}
                              <div
                                className="max-w-[75%] px-4 py-2 rounded-2xl text-sm"
                                style={
                                  msg.role === 'user'
                                    ? { backgroundColor: primaryColor, color: '#0a0e1a' }
                                    : { backgroundColor: '#f3f4f6', color: '#1f2937' }
                                }
                              >
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-200 p-4 bg-white">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type your message..."
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                              style={{ color: '#1f2937' }}
                            />
                            <button
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: primaryColor, color: '#0a0e1a' }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 rounded-lg bg-mist/5 border border-mist/20">
          <p className="font-mono text-xs text-ash text-center">
            Click the widget to interact with a live preview
          </p>
        </div>
      </div>
    </div>
  );
}
