'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Stats } from '@/components/Stats';
import { QuickActions } from '@/components/QuickActions';
import { RecentConversations } from '@/components/RecentConversations';

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b-2 border-mist/20 bg-slate/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan to-lime flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink">
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
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight">Feedback Console</h1>
                <p className="font-mono text-xs text-ash">AI-Powered Support</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <Link href="/bots" className="font-sans font-semibold text-sm hover:text-cyan transition-colors">
                Bots
              </Link>
              <Link href="/conversations" className="font-sans font-semibold text-sm hover:text-cyan transition-colors">
                Conversations
              </Link>
              <Link href="/settings" className="font-sans font-semibold text-sm hover:text-cyan transition-colors">
                Settings
              </Link>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral to-cyan"></div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient"></div>
        <div className="absolute inset-0 grid-pattern opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-display text-6xl font-bold mb-4 leading-tight">
              Dashboard
            </h2>
            <p className="font-sans text-lg text-ash max-w-2xl">
              Monitor conversations, manage bots, and extract insights from your AI-powered feedback system.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12"
          >
            <Stats />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="lg:col-span-1"
          >
            <QuickActions />
          </motion.div>

          {/* Recent Conversations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="lg:col-span-2"
          >
            <RecentConversations />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
