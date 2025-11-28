'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

export default function BotConfigPage({ params }: { params: { id: string } }) {
  const [botName, setBotName] = useState('Main Support Bot');
  const [instructions, setInstructions] = useState(
    `You are a helpful support assistant. When users report bugs, ask them:
- What they were trying to do
- What they expected to happen
- What actually happened
- What browser/device they're using

Be conversational, friendly, and thorough.`
  );
  const [primaryColor, setPrimaryColor] = useState('#00e5ff');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b-2 border-mist/20 bg-slate/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href="/bots"
              className="text-ash hover:text-cyan transition-colors font-mono text-sm flex items-center gap-2 mb-4"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Bots
            </Link>

            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-ink flex-shrink-0"
                style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>

              <div className="flex-1">
                <h1 className="font-display text-5xl font-bold mb-3">Configure Bot</h1>
                <p className="font-sans text-lg text-ash">
                  Customize behavior, appearance, and integrations
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h2 className="font-display text-3xl font-bold mb-6">Basic Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block font-sans font-semibold text-sm mb-2">Bot Name</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block font-sans font-semibold text-sm mb-2">Custom Instructions</label>
                  <p className="font-mono text-xs text-ash mb-2">
                    Guide the AI on how to interact with users and what information to collect
                  </p>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="textarea"
                    rows={10}
                  />
                </div>
              </div>
            </motion.div>

            {/* Appearance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="font-display text-3xl font-bold mb-6">Appearance</h2>

              <div className="space-y-6">
                <div>
                  <label className="block font-sans font-semibold text-sm mb-2">Primary Color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-16 h-16 rounded-lg border-2 border-mist/30 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="input flex-1 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-sans font-semibold text-sm mb-2">Position</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['bottom-right', 'bottom-left'].map((position) => (
                      <button
                        key={position}
                        className="btn btn-secondary text-left justify-start"
                      >
                        {position.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Notion Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h2 className="font-display text-3xl font-bold mb-6">Notion Integration</h2>

              <div className="space-y-6">
                <div className="p-4 rounded-lg border-2 border-ash/30 bg-ash/5">
                  <div className="flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ash flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <p className="font-sans text-sm text-ash">
                      Connect a Notion database to automatically populate bug reports and feedback entries
                    </p>
                  </div>
                </div>

                <button className="btn btn-primary w-full">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7" />
                    <path d="M16 3H8v4h8V3z" />
                  </svg>
                  Connect Notion Database
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Embed code */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="font-display text-xl font-bold mb-4">Embed Code</h3>
              <p className="font-sans text-sm text-ash mb-4">
                Copy this snippet to add the widget to your site
              </p>
              <pre className="bg-ink p-4 rounded-lg border border-mist/20 overflow-x-auto">
                <code className="font-mono text-xs text-lime">
                  {`<script src="https://..."></script>
<script>
  AIFeedbackWidget.init({
    botId: '${params.id}',
    apiUrl: 'https://api...'
  });
</script>`}
                </code>
              </pre>
              <button className="btn btn-secondary w-full mt-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Code
              </button>
            </motion.div>

            {/* Save button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button className="btn btn-primary w-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Save Changes
              </button>
            </motion.div>

            {/* Danger zone */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card border-coral/30"
            >
              <h3 className="font-display text-xl font-bold mb-4 text-coral">Danger Zone</h3>
              <p className="font-sans text-sm text-ash mb-4">
                Permanently delete this bot and all associated data
              </p>
              <button className="btn bg-coral/10 border-coral/40 text-coral hover:bg-coral/20 w-full">
                Delete Bot
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
