'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

const conversations = [
  {
    id: '1',
    mode: 'bug_report',
    preview: 'The submit button on the checkout page is not responding...',
    fullText: 'The submit button on the checkout page is not responding when clicked. I tried refreshing the page multiple times but the issue persists.',
    timestamp: '2024-01-15 14:32',
    status: 'processing',
    messages: 7,
    bot: 'Main Support Bot',
    metadata: {
      browser: 'Chrome 121',
      os: 'macOS',
      url: '/checkout',
    },
  },
  {
    id: '2',
    mode: 'feedback',
    preview: 'Love the new dashboard design! Would be great if...',
    fullText: 'Love the new dashboard design! Would be great if we could customize the color scheme. Also, dark mode would be amazing!',
    timestamp: '2024-01-15 14:09',
    status: 'completed',
    messages: 4,
    bot: 'Main Support Bot',
    metadata: {
      browser: 'Firefox 122',
      os: 'Windows 11',
      url: '/dashboard',
    },
  },
  {
    id: '3',
    mode: 'documentation',
    preview: 'How do I integrate the payment gateway?',
    fullText: 'How do I integrate the payment gateway with my existing setup? I need to support both credit cards and PayPal.',
    timestamp: '2024-01-15 13:15',
    status: 'completed',
    messages: 12,
    bot: 'Documentation Helper',
    metadata: {
      browser: 'Safari 17',
      os: 'iOS 17',
      url: '/docs/payments',
    },
  },
  {
    id: '4',
    mode: 'bug_report',
    preview: 'Getting a 500 error when uploading large files...',
    fullText: 'Getting a 500 error when trying to upload large files over 10MB. The error message says "Request Entity Too Large".',
    timestamp: '2024-01-15 12:45',
    status: 'processed',
    messages: 9,
    bot: 'Main Support Bot',
    metadata: {
      browser: 'Chrome 121',
      os: 'Linux',
      url: '/upload',
    },
  },
  {
    id: '5',
    mode: 'feedback',
    preview: 'The mobile app needs dark mode support...',
    fullText: 'The mobile app needs dark mode support. Using it at night is pretty harsh on the eyes. Otherwise, loving the app!',
    timestamp: '2024-01-15 11:20',
    status: 'completed',
    messages: 6,
    bot: 'Main Support Bot',
    metadata: {
      browser: 'Mobile Safari',
      os: 'iOS 17',
      url: '/app',
    },
  },
];

const modeConfig = {
  bug_report: { label: 'Bug', color: 'coral' },
  feedback: { label: 'Feedback', color: 'lime' },
  documentation: { label: 'Question', color: 'cyan' },
};

const statusConfig = {
  processing: { label: 'Processing', color: 'cyan' },
  completed: { label: 'Completed', color: 'lime' },
  processed: { label: 'Processed', color: 'ash' },
};

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'all') return true;
    return conv.mode === filter;
  });

  const selected = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b-2 border-mist/20 bg-slate/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href="/"
              className="text-ash hover:text-cyan transition-colors font-mono text-sm flex items-center gap-2 mb-4"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Dashboard
            </Link>

            <h1 className="font-display text-5xl font-bold mb-3">Conversations</h1>
            <p className="font-sans text-lg text-ash">Browse and analyze all conversations</p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-mist/20 bg-canvas/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`font-sans text-sm px-4 py-2 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-cyan text-ink font-semibold'
                  : 'text-ash hover:text-paper hover:bg-canvas'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('bug_report')}
              className={`font-sans text-sm px-4 py-2 rounded-lg transition-all ${
                filter === 'bug_report'
                  ? 'bg-coral text-ink font-semibold'
                  : 'text-ash hover:text-paper hover:bg-canvas'
              }`}
            >
              Bug Reports
            </button>
            <button
              onClick={() => setFilter('feedback')}
              className={`font-sans text-sm px-4 py-2 rounded-lg transition-all ${
                filter === 'feedback'
                  ? 'bg-lime text-ink font-semibold'
                  : 'text-ash hover:text-paper hover:bg-canvas'
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setFilter('documentation')}
              className={`font-sans text-sm px-4 py-2 rounded-lg transition-all ${
                filter === 'documentation'
                  ? 'bg-cyan text-ink font-semibold'
                  : 'text-ash hover:text-paper hover:bg-canvas'
              }`}
            >
              Questions
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-3">
            {filteredConversations.map((conversation, index) => {
              const mode = modeConfig[conversation.mode as keyof typeof modeConfig];
              const status = statusConfig[conversation.status as keyof typeof statusConfig];

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`card cursor-pointer transition-all ${
                    selectedConversation === conversation.id
                      ? 'border-cyan/60 shadow-lg shadow-cyan/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`badge badge-${mode.color} text-[10px]`}>{mode.label}</span>
                        <span className={`badge badge-${status.color} text-[10px]`}>{status.label}</span>
                      </div>

                      {/* Preview */}
                      <p className="font-sans text-sm text-paper mb-2 line-clamp-2">{conversation.preview}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs font-mono text-ash">
                        <span>{conversation.timestamp}</span>
                        <span>·</span>
                        <span>{conversation.messages} msgs</span>
                        <span>·</span>
                        <span>{conversation.bot}</span>
                      </div>
                    </div>

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-ash flex-shrink-0"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail view */}
          <div className="sticky top-6 h-fit">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="card"
                >
                  {/* Header */}
                  <div className="mb-6 pb-6 border-b border-mist/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge badge-${
                            modeConfig[selected.mode as keyof typeof modeConfig].color
                          }`}
                        >
                          {modeConfig[selected.mode as keyof typeof modeConfig].label}
                        </span>
                        <span
                          className={`badge badge-${
                            statusConfig[selected.status as keyof typeof statusConfig].color
                          }`}
                        >
                          {statusConfig[selected.status as keyof typeof statusConfig].label}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="text-ash hover:text-paper transition-colors"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>

                    <p className="font-sans text-lg leading-relaxed">{selected.fullText}</p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-3 mb-6">
                    <h3 className="font-display text-xl font-bold">Metadata</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="font-mono text-xs text-ash mb-1">Browser</div>
                        <div className="font-sans text-sm">{selected.metadata.browser}</div>
                      </div>
                      <div>
                        <div className="font-mono text-xs text-ash mb-1">OS</div>
                        <div className="font-sans text-sm">{selected.metadata.os}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="font-mono text-xs text-ash mb-1">URL</div>
                        <div className="font-mono text-sm text-cyan">{selected.metadata.url}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="btn btn-secondary flex-1">View Full Chat</button>
                    <button className="btn btn-ghost">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card text-center py-12"
                >
                  <div className="text-ash mb-4">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="font-sans text-ash">Select a conversation to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
