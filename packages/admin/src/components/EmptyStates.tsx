'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function EmptyBots() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="col-span-full"
    >
      <div className="card text-center py-20 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-lime/5 rounded-full blur-3xl" />

        <div className="relative">
          {/* Icon */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-cyan/20 to-lime/20 border-2 border-mist/30 flex items-center justify-center backdrop-blur-sm">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cyan">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="6.34" y1="17.66" x2="4.93" y2="19.07" />
                <line x1="19.07" y1="4.93" x2="17.66" y2="6.34" />
              </svg>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="font-display text-4xl font-bold mb-3">
              No bots yet
            </h3>
            <p className="font-sans text-lg text-ash max-w-md mx-auto leading-relaxed">
              Create your first AI feedback widget to start collecting bug reports,
              feedback, and answering user questions.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/bots/new" className="btn btn-primary inline-flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Create Your First Bot
            </Link>
          </motion.div>

          {/* Help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-8 border-t border-mist/20"
          >
            <p className="font-mono text-xs text-ash">
              Need help getting started? Check out our{' '}
              <a href="#" className="text-cyan hover:text-lime transition-colors">
                quick start guide
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export function EmptyConversations() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="col-span-full"
    >
      <div className="card text-center py-20 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-coral/5 rounded-full blur-3xl" />

        <div className="relative">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
            transition={{ delay: 0.2, duration: 0.6, rotate: { delay: 0.8, duration: 0.5 } }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-coral/20 to-cyan/20 border-2 border-mist/30 flex items-center justify-center backdrop-blur-sm">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-coral">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="9" y1="10" x2="15" y2="10" />
                <line x1="9" y1="14" x2="13" y2="14" />
              </svg>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h3 className="font-display text-4xl font-bold mb-3">
              No conversations yet
            </h3>
            <p className="font-sans text-lg text-ash max-w-md mx-auto leading-relaxed">
              Once users interact with your widgets, their conversations will appear here.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-lg mx-auto"
          >
            <div className="grid grid-cols-3 gap-4 text-left">
              {[
                { step: '1', title: 'Create a bot', icon: '🤖' },
                { step: '2', title: 'Add to your site', icon: '🌐' },
                { step: '3', title: 'Start chatting', icon: '💬' },
              ].map((item, idx) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className="p-4 rounded-lg bg-canvas/50 border border-mist/20"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-mono text-xs text-ash mb-1">Step {item.step}</div>
                  <div className="font-sans text-sm font-semibold">{item.title}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8"
          >
            <Link href="/bots" className="btn btn-secondary inline-flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              Go to Bots
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
