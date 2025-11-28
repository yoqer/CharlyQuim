'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { WidgetPreview } from '@/components/WidgetPreview';

type Tab = 'configure' | 'appearance';

const models = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Most capable, best for complex tasks' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and cost-effective' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and speed' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fastest, great for simple tasks' },
];

const templates = [
  {
    id: 'bug-report',
    name: 'Bug Report Bot',
    prompt: `You are a helpful support assistant focused on gathering bug reports.

When a user reports an issue, ask them:
- What were you trying to do?
- What did you expect to happen?
- What actually happened?
- What browser and device are you using?

Be friendly, conversational, and thorough. Keep questions natural and avoid sounding robotic.`,
  },
  {
    id: 'feedback',
    name: 'Feedback Collection Bot',
    prompt: `You are a friendly assistant collecting product feedback.

When users share feedback, explore:
- What feature or aspect are they commenting on?
- What would make their experience better?
- How important is this to them?
- Any specific use cases or examples?

Be enthusiastic and make users feel heard. Thank them for their input.`,
  },
  {
    id: 'documentation',
    name: 'Documentation Helper',
    prompt: `You are a knowledgeable documentation assistant.

Help users by:
- Understanding what they're trying to accomplish
- Providing clear, step-by-step guidance
- Linking to relevant documentation when helpful
- Asking clarifying questions if needed

Be patient, clear, and educational. Assume users may not be technical experts.`,
  },
];

export default function CreateBotPage() {
  const [activeTab, setActiveTab] = useState<Tab>('configure');

  // Configure tab state
  const [botName, setBotName] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [customPrompt, setCustomPrompt] = useState(templates[0].prompt);

  // Appearance tab state
  const [primaryColor, setPrimaryColor] = useState('#00e5ff');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');

  const selectedModelInfo = models.find(m => m.id === selectedModel);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomPrompt(template.prompt);
    }
  };

  const handleCreate = () => {
    // TODO: Send to API
    console.log('Creating bot:', {
      name: botName,
      model: selectedModel,
      temperature,
      prompt: customPrompt,
      primaryColor,
      position,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-mist/20 bg-slate/50 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/bots"
                className="text-ash hover:text-cyan transition-colors font-mono text-sm flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back to Bots
              </Link>
              <button onClick={handleCreate} className="btn btn-primary">
                Create Bot
              </button>
            </div>

            <h1 className="font-display text-4xl font-bold mb-2">
              Create New Bot
            </h1>
            <p className="font-sans text-ash">
              Configure your AI feedback widget
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex">
        {/* Left Side - Configuration */}
        <div className="w-[55%] border-r-2 border-mist/20 flex flex-col bg-slate/30">
          {/* Tabs */}
          <div className="border-b border-mist/20 bg-canvas/50 px-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('configure')}
                className={`relative px-6 py-4 font-sans font-semibold text-sm transition-colors ${
                  activeTab === 'configure'
                    ? 'text-cyan'
                    : 'text-ash hover:text-paper'
                }`}
              >
                Configure
                {activeTab === 'configure' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`relative px-6 py-4 font-sans font-semibold text-sm transition-colors ${
                  activeTab === 'appearance'
                    ? 'text-cyan'
                    : 'text-ash hover:text-paper'
                }`}
              >
                Appearance
                {activeTab === 'appearance' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'configure' && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Bot Name */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">
                      Bot Name
                    </label>
                    <input
                      type="text"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="e.g., Support Assistant"
                      className="input"
                    />
                  </div>

                  {/* Model Selection */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">
                      AI Model
                    </label>
                    <div className="space-y-2">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                            selectedModel === model.id
                              ? 'border-cyan bg-cyan/5'
                              : 'border-mist/30 bg-canvas hover:border-cyan/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h4 className="font-sans font-semibold text-sm">{model.name}</h4>
                              <p className="font-mono text-xs text-ash">{model.provider}</p>
                            </div>
                            {selectedModel === model.id && (
                              <div className="w-5 h-5 rounded-full bg-cyan flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-ink">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="font-sans text-xs text-ash">{model.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-sans font-semibold text-sm">
                        Temperature
                      </label>
                      <span className="font-mono text-sm text-cyan">{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-2 bg-mist/20 rounded-lg appearance-none cursor-pointer accent-cyan"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="font-mono text-xs text-ash">Precise</span>
                      <span className="font-mono text-xs text-ash">Creative</span>
                    </div>
                  </div>

                  {/* Prompt Templates */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">
                      Start from Template
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className="p-3 rounded-lg border-2 border-mist/30 bg-canvas hover:border-cyan/50 transition-all text-left"
                        >
                          <p className="font-sans text-xs font-semibold">{template.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Instructions */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">
                      Custom Instructions
                    </label>
                    <p className="font-mono text-xs text-ash mb-3">
                      Define how your bot should behave and what information to collect
                    </p>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="textarea font-mono text-sm leading-relaxed"
                      rows={16}
                      placeholder="You are a helpful assistant..."
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-ash">
                        {customPrompt.length} characters
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Primary Color */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">
                      Primary Color
                    </label>
                    <p className="font-mono text-xs text-ash mb-4">
                      This color will be used for the widget button, accents, and user messages
                    </p>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-20 rounded-lg border-2 border-mist/30 cursor-pointer"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="input font-mono"
                        />
                      </div>
                    </div>

                    {/* Color presets */}
                    <div className="mt-4">
                      <p className="font-mono text-xs text-ash mb-2">Quick presets</p>
                      <div className="flex gap-2">
                        {['#00e5ff', '#a3ff12', '#ff6b6b', '#8b5cf6', '#f59e0b', '#10b981'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setPrimaryColor(color)}
                            className="w-10 h-10 rounded-lg border-2 border-mist/30 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">
                      Widget Position
                    </label>
                    <p className="font-mono text-xs text-ash mb-4">
                      Where the widget button appears on your site
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPosition('bottom-right')}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          position === 'bottom-right'
                            ? 'border-cyan bg-cyan/5'
                            : 'border-mist/30 bg-canvas hover:border-cyan/50'
                        }`}
                      >
                        <div className="relative w-full h-24 bg-ink/50 rounded border border-mist/20 mb-3">
                          <div
                            className="absolute bottom-2 right-2 w-6 h-6 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          />
                        </div>
                        <p className="font-sans text-sm font-semibold text-center">Bottom Right</p>
                      </button>
                      <button
                        onClick={() => setPosition('bottom-left')}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          position === 'bottom-left'
                            ? 'border-cyan bg-cyan/5'
                            : 'border-mist/30 bg-canvas hover:border-cyan/50'
                        }`}
                      >
                        <div className="relative w-full h-24 bg-ink/50 rounded border border-mist/20 mb-3">
                          <div
                            className="absolute bottom-2 left-2 w-6 h-6 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          />
                        </div>
                        <p className="font-sans text-sm font-semibold text-center">Bottom Left</p>
                      </button>
                    </div>
                  </div>

                  {/* Icon Upload (placeholder) */}
                  <div>
                    <label className="block font-sans font-semibold text-sm mb-2">
                      Custom Icon (Optional)
                    </label>
                    <p className="font-mono text-xs text-ash mb-4">
                      Upload a custom icon for the widget button
                    </p>
                    <div className="border-2 border-dashed border-mist/30 rounded-lg p-8 text-center hover:border-cyan/50 transition-colors cursor-pointer">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-3 text-ash">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="font-sans text-sm text-ash">Click to upload or drag and drop</p>
                      <p className="font-mono text-xs text-ash mt-1">SVG, PNG or JPG (max. 1MB)</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 bg-gradient-to-br from-ink via-slate to-ink p-8 flex items-center justify-center">
          <WidgetPreview
            botName={botName || 'Your Bot'}
            primaryColor={primaryColor}
            position={position}
          />
        </div>
      </div>
    </div>
  );
}
