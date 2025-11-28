'use client';

import { motion } from 'framer-motion';

const stats = [
  {
    label: 'Active Conversations',
    value: '847',
    change: '+12.5%',
    trend: 'up',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Bugs Reported',
    value: '124',
    change: '+8.2%',
    trend: 'up',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m8 2 1.88 1.88" />
        <path d="M14.12 3.88 16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" />
        <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
        <path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
        <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" />
        <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
      </svg>
    ),
  },
  {
    label: 'Feedback Items',
    value: '392',
    change: '+24.1%',
    trend: 'up',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    label: 'Avg Response Time',
    value: '1.2s',
    change: '-15.3%',
    trend: 'down',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Stats() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={item}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="card group relative overflow-hidden"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative">
            {/* Icon */}
            <div className="mb-4 text-cyan group-hover:scale-110 transition-transform duration-300">
              {stat.icon}
            </div>

            {/* Value */}
            <div className="mb-2">
              <span className="font-display text-4xl font-bold tracking-tight">
                {stat.value}
              </span>
            </div>

            {/* Label */}
            <div className="mb-3">
              <span className="font-sans text-sm text-ash">
                {stat.label}
              </span>
            </div>

            {/* Change indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`font-mono text-xs font-semibold ${
                  stat.trend === 'up' ? 'text-lime' : 'text-coral'
                }`}
              >
                {stat.change}
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-mist/40 to-transparent" />
            </div>
          </div>

          {/* Hover glow effect */}
          <div className="absolute inset-0 border-2 border-cyan/0 group-hover:border-cyan/40 rounded-lg transition-all duration-300 pointer-events-none" />
        </motion.div>
      ))}
    </motion.div>
  );
}
