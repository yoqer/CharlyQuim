'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const bots = [
  {
    id: 'default',
    name: 'Main Support Bot',
    conversations: 847,
    lastActive: '2 minutes ago',
    status: 'active',
    primaryColor: '#00e5ff',
  },
  {
    id: 'sales-bot',
    name: 'Sales Assistant',
    conversations: 324,
    lastActive: '15 minutes ago',
    status: 'active',
    primaryColor: '#a3ff12',
  },
  {
    id: 'docs-bot',
    name: 'Documentation Helper',
    conversations: 1203,
    lastActive: '1 hour ago',
    status: 'paused',
    primaryColor: '#ff6b6b',
  },
];

export default function BotsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b-2 border-mist/20 bg-slate/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/"
                className="text-ash hover:text-cyan transition-colors font-mono text-sm flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Dashboard
              </Link>
              <Link href="/bots/new" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Create Bot
              </Link>
            </div>

            <h1 className="font-display text-5xl font-bold mb-3">
              Your Bots
            </h1>
            <p className="font-sans text-lg text-ash">
              Manage and configure your AI feedback widgets
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {bots.map((bot, index) => (
            <motion.div
              key={bot.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={`/bots/${bot.id}`}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="card h-full group cursor-pointer relative overflow-hidden"
                >
                  {/* Color stripe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: bot.primaryColor }}
                  />

                  {/* Status indicator */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center gap-2">
                      {bot.status === 'active' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-lime animate-pulse" />
                          <span className="font-mono text-xs text-lime">Active</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-ash" />
                          <span className="font-mono text-xs text-ash">Paused</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bot icon */}
                  <div className="mb-6 mt-4">
                    <div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-ink group-hover:scale-110 transition-transform duration-300"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${bot.primaryColor}, ${bot.primaryColor}dd)`,
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="font-display text-2xl font-bold mb-3 group-hover:text-cyan transition-colors">
                    {bot.name}
                  </h3>

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-sm text-ash">Conversations</span>
                      <span className="font-mono text-sm font-semibold">{bot.conversations.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-sm text-ash">Last active</span>
                      <span className="font-mono text-sm font-semibold">{bot.lastActive}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-mist/20 flex items-center justify-between">
                    <button className="font-sans text-sm text-ash hover:text-cyan transition-colors">
                      Configure
                    </button>
                    <button className="font-sans text-sm text-ash hover:text-cyan transition-colors">
                      View Stats
                    </button>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty state would go here if no bots */}
      </div>
    </div>
  );
}
