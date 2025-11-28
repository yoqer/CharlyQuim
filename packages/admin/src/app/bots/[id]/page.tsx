'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

const models = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', icon: '⚡' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5', icon: '🚀' },
  { id: 'claude-sonnet', name: 'Claude Sonnet', icon: '🎯' },
];

export default function BotConfigPage({ params }: { params: { id: string } }) {
  const [botName, setBotName] = useState('Main Support Bot');
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [instructions, setInstructions] = useState(
    `You are a helpful support assistant. When users report bugs, ask them:
- What they were trying to do
- What they expected to happen
- What actually happened
- What browser/device they're using

Be conversational, friendly, and thorough.`
  );
  const [primaryColor, setPrimaryColor] = useState('#00e5ff');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');

  const colorPresets = ['#00e5ff', '#a3ff12', '#ff6b6b', '#8b5cf6', '#f59e0b', '#10b981'];

  return (
    <div className="min-h-screen">
      {/* Header with Stats */}
      <div className="border-b-2 border-mist/20 bg-slate/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-50" />

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              href="/bots"
              className="text-ash hover:text-cyan transition-colors font-mono text-sm flex items-center gap-2 mb-6"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Bots
            </Link>

            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center text-ink flex-shrink-0 shadow-lg"
                  style={{ backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-display text-5xl font-bold">{botName}</h1>
                    <span className="badge badge-lime">Active</span>
                  </div>
                  <p className="font-sans text-lg text-ash mb-4">
                    Customize behavior, appearance, and integrations
                  </p>

                  {/* Mini stats */}
                  <div className="flex items-center gap-6 font-mono text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                      <span className="text-ash">847 conversations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-lime" />
                      <span className="text-ash">Active 2m ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan/10 to-transparent rounded-bl-full" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center text-cyan">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </div>
                  <h2 className="font-display text-3xl font-bold">AI Configuration</h2>
                </div>

                <div className="space-y-6">
                  {/* Bot Name */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">Bot Name</label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="input"
                      placeholder="e.g., Support Assistant"
                    />
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-3">AI Model</label>
                    <div className="grid grid-cols-3 gap-3">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedModel === model.id
                              ? 'border-cyan bg-cyan/5 scale-105'
                              : 'border-mist/30 hover:border-cyan/50 hover:bg-canvas'
                          }`}
                        >
                          <div className="text-2xl mb-2">{model.icon}</div>
                          <div className="font-sans text-xs font-semibold">{model.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-sans font-semibold text-sm">Temperature</label>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-cyan">{temperature.toFixed(1)}</span>
                        <span className="font-mono text-xs text-ash">
                          {temperature < 0.5 ? 'Precise' : temperature > 1.5 ? 'Creative' : 'Balanced'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-cyan/20 via-lime/20 to-coral/20 rounded-lg appearance-none cursor-pointer"
                      style={{
                        accentColor: primaryColor,
                      }}
                    />
                    <div className="flex justify-between mt-2">
                      <span className="font-mono text-xs text-ash">0.0</span>
                      <span className="font-mono text-xs text-ash">1.0</span>
                      <span className="font-mono text-xs text-ash">2.0</span>
                    </div>
                  </div>

                  {/* Custom Instructions */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">Custom Instructions</label>
                    <p className="font-mono text-xs text-ash mb-3">
                      Define how your bot behaves and what information to collect
                    </p>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="textarea font-mono text-sm leading-relaxed"
                      rows={12}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-xs text-ash">{instructions.length} characters</span>
                      <button className="font-mono text-xs text-cyan hover:text-lime transition-colors">
                        View Templates →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Appearance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-lime/10 to-transparent rounded-bl-full" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-lime/10 flex items-center justify-center text-lime">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v6m0 6v6" />
                      <path d="m4.2 4.2 4.2 4.2m5.2 5.2 4.2 4.2" />
                      <path d="M1 12h6m6 0h6" />
                      <path d="m4.2 19.8 4.2-4.2m5.2-5.2 4.2-4.2" />
                    </svg>
                  </div>
                  <h2 className="font-display text-3xl font-bold">Appearance</h2>
                </div>

                <div className="space-y-6">
                  {/* Primary Color */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-3">Primary Color</label>
                    <div className="flex items-center gap-4 mb-4">
                      <motion.input
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-20 rounded-xl border-2 border-mist/30 cursor-pointer shadow-lg"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="input flex-1 font-mono text-lg"
                      />
                    </div>

                    {/* Color presets */}
                    <div className="flex gap-2">
                      {colorPresets.map((color) => (
                        <motion.button
                          key={color}
                          whileHover={{ scale: 1.15, y: -2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setPrimaryColor(color)}
                          className="w-12 h-12 rounded-lg border-2 transition-all"
                          style={{
                            backgroundColor: color,
                            borderColor: primaryColor === color ? color : 'transparent',
                            boxShadow: primaryColor === color ? `0 0 0 2px #24273a, 0 0 0 4px ${color}` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-3">Widget Position</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'bottom-right', label: 'Bottom Right' },
                        { id: 'bottom-left', label: 'Bottom Left' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => setPosition(pos.id as typeof position)}
                          className={`p-6 rounded-lg border-2 transition-all ${
                            position === pos.id
                              ? 'border-lime bg-lime/5'
                              : 'border-mist/30 hover:border-lime/50'
                          }`}
                        >
                          <div className="relative w-full h-20 bg-ink/30 rounded-lg border border-mist/20 mb-3">
                            <motion.div
                              animate={{
                                [pos.id.includes('right') ? 'right' : 'left']: 8,
                                bottom: 8,
                              }}
                              className="absolute w-6 h-6 rounded-full shadow-lg"
                              style={{ backgroundColor: primaryColor }}
                            />
                          </div>
                          <p className="font-sans text-sm font-semibold">{pos.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Notion Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card border-2 border-dashed border-mist/30 hover:border-cyan/50 transition-colors"
            >
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan to-lime mx-auto mb-4 flex items-center justify-center text-ink">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7" />
                    <path d="M16 3H8v4h8V3z" />
                  </svg>
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">Notion Integration</h3>
                <p className="font-sans text-ash mb-6 max-w-md mx-auto">
                  Connect your Notion database to automatically populate bug reports and feedback
                </p>
                <button className="btn btn-primary">
                  Connect Notion Database
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card bg-gradient-to-br from-cyan/5 to-transparent"
            >
              <h3 className="font-display text-xl font-bold mb-4">Usage Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-sans text-sm text-ash">Conversations</span>
                    <span className="font-mono text-sm font-bold">847</span>
                  </div>
                  <div className="h-2 bg-mist/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan to-lime" style={{ width: '73%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-sans text-sm text-ash">Avg Response</span>
                    <span className="font-mono text-sm font-bold">1.2s</span>
                  </div>
                  <div className="h-2 bg-mist/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-lime to-cyan" style={{ width: '91%' }} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Embed code */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h3 className="font-display text-xl font-bold mb-4">Embed Code</h3>
              <p className="font-sans text-sm text-ash mb-4">
                Add this to your site's HTML
              </p>
              <pre className="bg-ink p-4 rounded-lg border border-mist/20 overflow-x-auto mb-4">
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
              <button className="btn btn-secondary w-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy to Clipboard
              </button>
            </motion.div>

            {/* Danger zone */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card border-2 border-coral/30 bg-coral/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-coral/20 flex items-center justify-center text-coral">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v4m0 4h.01M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-coral">Danger Zone</h3>
              </div>
              <p className="font-sans text-sm text-ash mb-4">
                Permanently delete this bot and all data
              </p>
              <button className="btn bg-coral/10 border-2 border-coral/40 text-coral hover:bg-coral/20 w-full">
                Delete Bot
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
