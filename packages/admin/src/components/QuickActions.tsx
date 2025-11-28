'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const actions = [
  {
    title: 'Create New Bot',
    description: 'Set up a new feedback widget',
    href: '/bots/new',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    color: 'cyan',
  },
  {
    title: 'View All Conversations',
    description: 'Browse conversation history',
    href: '/conversations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: 'lime',
  },
  {
    title: 'Connect Notion',
    description: 'Integrate with Notion database',
    href: '/integrations/notion',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7" />
        <path d="M16 3H8v4h8V3z" />
        <line x1="12" y1="15" x2="12" y2="21" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    ),
    color: 'coral',
  },
  {
    title: 'Export Data',
    description: 'Download conversations as CSV',
    href: '/export',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    color: 'ash',
  },
];

export function QuickActions() {
  return (
    <div>
      <div className="mb-6">
        <h3 className="font-display text-2xl font-bold mb-2">Quick Actions</h3>
        <p className="font-sans text-sm text-ash">Common tasks and shortcuts</p>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link href={action.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className="card p-4 flex items-start gap-4 cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-${action.color}/10 border-2 border-${action.color}/30 flex items-center justify-center text-${action.color} flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                >
                  {action.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-sans font-semibold text-sm mb-1 group-hover:text-cyan transition-colors">
                    {action.title}
                  </h4>
                  <p className="font-mono text-xs text-ash">
                    {action.description}
                  </p>
                </div>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-ash group-hover:text-cyan group-hover:translate-x-1 transition-all flex-shrink-0"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-6 p-4 rounded-lg border-2 border-lime/30 bg-lime/5"
      >
        <div className="flex items-start gap-3">
          <div className="text-lime flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <div>
            <h4 className="font-sans font-semibold text-sm text-lime mb-1">
              Widget Embed Code
            </h4>
            <p className="font-mono text-xs text-ash leading-relaxed">
              Copy the embed snippet from any bot's settings to add the widget to your site.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
