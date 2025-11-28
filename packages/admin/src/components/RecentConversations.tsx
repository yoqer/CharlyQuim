'use client';

import { motion } from 'framer-motion';

const conversations = [
  {
    id: '1',
    mode: 'bug_report',
    preview: 'The submit button on the checkout page is not responding when clicked...',
    timestamp: '5 minutes ago',
    status: 'processing',
    messages: 7,
  },
  {
    id: '2',
    mode: 'feedback',
    preview: 'Love the new dashboard design! Would be great if we could customize...',
    timestamp: '23 minutes ago',
    status: 'completed',
    messages: 4,
  },
  {
    id: '3',
    mode: 'documentation',
    preview: 'How do I integrate the payment gateway with my existing setup?',
    timestamp: '1 hour ago',
    status: 'completed',
    messages: 12,
  },
  {
    id: '4',
    mode: 'bug_report',
    preview: 'Getting a 500 error when trying to upload large files over 10MB...',
    timestamp: '2 hours ago',
    status: 'processed',
    messages: 9,
  },
  {
    id: '5',
    mode: 'feedback',
    preview: 'The mobile app needs dark mode support. Using it at night is...',
    timestamp: '3 hours ago',
    status: 'completed',
    messages: 6,
  },
];

const modeConfig = {
  bug_report: {
    label: 'Bug Report',
    color: 'coral',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m8 2 1.88 1.88" />
        <path d="M14.12 3.88 16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      </svg>
    ),
  },
  feedback: {
    label: 'Feedback',
    color: 'lime',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7" />
      </svg>
    ),
  },
  documentation: {
    label: 'Question',
    color: 'cyan',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
};

const statusConfig = {
  processing: { label: 'Processing', color: 'cyan' },
  completed: { label: 'Completed', color: 'lime' },
  processed: { label: 'Processed', color: 'ash' },
};

export function RecentConversations() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">Recent Conversations</h3>
          <p className="font-sans text-sm text-ash">Latest interactions across all bots</p>
        </div>
        <button className="btn btn-ghost text-sm">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {conversations.map((conversation, index) => {
          const mode = modeConfig[conversation.mode as keyof typeof modeConfig];
          const status = statusConfig[conversation.status as keyof typeof statusConfig];

          return (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ scale: 1.01 }}
              className="card group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Mode indicator */}
                <div className={`w-12 h-12 rounded-lg bg-${mode.color}/10 border-2 border-${mode.color}/30 flex items-center justify-center text-${mode.color} flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  {mode.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`badge badge-${mode.color} text-[10px]`}>
                      {mode.label}
                    </span>
                    <span className={`badge badge-${status.color} text-[10px]`}>
                      {status.label}
                    </span>
                    <span className="font-mono text-xs text-ash">
                      {conversation.messages} messages
                    </span>
                  </div>

                  {/* Preview */}
                  <p className="font-sans text-sm text-paper mb-2 line-clamp-2 group-hover:text-cyan transition-colors">
                    {conversation.preview}
                  </p>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ash">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="font-mono text-xs text-ash">
                      {conversation.timestamp}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-ash group-hover:text-cyan group-hover:translate-x-1 transition-all flex-shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>

              {/* Progress bar for processing status */}
              {conversation.status === 'processing' && (
                <div className="mt-4 pt-4 border-t border-mist/20">
                  <div className="h-1 bg-mist/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan to-lime"
                      initial={{ width: '0%' }}
                      animate={{ width: '70%' }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="font-mono text-xs text-ash mt-2">
                    Extracting structured data...
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
