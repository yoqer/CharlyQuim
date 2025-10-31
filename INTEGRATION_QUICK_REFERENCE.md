# Quick Reference: Custom Backend Integration

## 📋 Pre-Integration Checklist

- [ ] Your backend is running and accessible
- [ ] You have an API key (if needed)
- [ ] You've tested your backend with `./test-custom-backend.js`
- [ ] You know your backend's response format
- [ ] You've read `CUSTOM_BACKEND_INTEGRATION_GUIDE.md`

---

## 🎯 3 Integration Options

| Option | Difficulty | Best For | Code Changes |
|--------|-----------|----------|--------------|
| **OpenAI-Compatible** | ⭐ Easy | Backends following OpenAI API spec | ✅ None! Just configure |
| **Add as Provider** | ⭐⭐ Medium | Most use cases | ✅ ~200 lines across 3 files |
| **Replace Pipeline** | ⭐⭐⭐ Advanced | Complete customization | ⚠️ Extensive changes |

---

## 🚀 Quick Start: Option 1 (OpenAI-Compatible)

If your backend follows OpenAI's API format, **no code changes needed!**

1. Start Void: `./scripts/code.sh`
2. Open Settings (Cmd+Shift+P → "Void: Settings")
3. Select Provider: "OpenAI Compatible"
4. Enter your endpoint: `https://your-backend.com/v1`
5. Enter your API key
6. Select a model
7. Start chatting! ✨

**Your backend must respond like:**
```json
{
  "choices": [{
    "message": { "content": "Hello!" }
  }]
}
```

---

## 🔧 Quick Start: Option 2 (Add as Provider)

### Files to Edit (3 files total)

| File | What to Add | Lines |
|------|------------|-------|
| `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts` | Provider definition | ~20 |
| `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts` | Send implementation | ~100 |
| `src/vs/workbench/contrib/void/common/modelCapabilities.ts` | Model capabilities | ~30 |

### Step-by-Step

1. **Edit `voidSettingsTypes.ts`**
   - Add `'myBackend'` to `ProviderName` type
   - Add backend config to `SettingsOfProvider`
   - Add display info to `displayInfoOfProviderName`

2. **Edit `sendLLMMessage.impl.ts`**
   - Create `sendMyBackendChat` function
   - Add to `sendLLMMessageToProviderImplementation` object
   - Copy template from `CUSTOM_BACKEND_EXAMPLE.ts`

3. **Edit `modelCapabilities.ts`**
   - Add provider capabilities
   - Add model capabilities
   - Add default settings

4. **Build & Run**
   ```bash
   npm run buildreact
   npm run compile
   ./scripts/code.sh
   ```

---

## 🧪 Testing Workflow

### 1. Test Your Backend First
```bash
# Edit config in test-custom-backend.js first
./test-custom-backend.js
```

### 2. Make Code Changes
See `CUSTOM_BACKEND_EXAMPLE.ts` for templates

### 3. Rebuild
```bash
npm run buildreact  # Rebuild React components
npm run compile     # Compile TypeScript
```

### 4. Run & Debug
```bash
./scripts/code.sh   # Launch Void
# Then: Help → Toggle Developer Tools to see console logs
```

### 5. Development Mode (Auto-rebuild)
```bash
# Terminal 1: Watch React changes
npm run watchreact

# Terminal 2: Watch TypeScript changes
npm run watch

# Terminal 3: Run Void
./scripts/code.sh
```

---

## 🔍 Response Format Examples

Your backend needs to return one of these formats:

### OpenAI Format (Recommended)
```json
{
  "choices": [{
    "message": { "content": "Hello!" },
    "delta": { "content": "Hello!" }
  }]
}
```

### Simple Format
```json
{
  "content": "Hello!"
}
```

### Streaming (SSE)
```
data: {"choices": [{"delta": {"content": "Hel"}}]}
data: {"choices": [{"delta": {"content": "lo!"}}]}
data: [DONE]
```

Adjust the parsing code in `sendMyBackendChat` to match YOUR format.

---

## 🐛 Common Issues & Solutions

### Issue: "Provider not recognized"
**Solution:** Did you add your provider to `sendLLMMessageToProviderImplementation`?

### Issue: "No text appearing in chat"
**Solutions:**
- Check `onText()` is being called with the right format
- Check console logs (Help → Toggle Developer Tools)
- Verify your response parsing matches your backend's format

### Issue: Streaming not working
**Solutions:**
- Verify backend returns `Content-Type: text/event-stream`
- Check SSE format: each line must be `data: {...}`
- Test streaming with curl first

### Issue: Changes not taking effect
**Solutions:**
- Run `npm run buildreact` (rebuilds React)
- Run `npm run compile` (rebuilds TypeScript)
- Restart Void completely
- Clear cache: Delete `~/.vscode-oss-dev` folder

### Issue: TypeScript errors
**Solutions:**
- Check imports match exactly
- Run `npm run compile` to see full errors
- Compare with existing provider implementations

---

## 📁 Key File Locations

```
void/
├── src/vs/workbench/contrib/void/
│   ├── common/
│   │   ├── voidSettingsTypes.ts       ← Provider types & settings
│   │   ├── modelCapabilities.ts       ← Model configs
│   │   ├── sendLLMMessageService.ts   ← Browser-side service
│   │   └── sendLLMMessageTypes.ts     ← Type definitions
│   ├── browser/
│   │   ├── chatThreadService.ts       ← Chat management
│   │   └── react/src/                 ← React UI components
│   └── electron-main/
│       ├── llmMessage/
│       │   ├── sendLLMMessage.impl.ts ← Provider implementations ⭐
│       │   └── sendLLMMessage.ts      ← Main routing
│       └── sendLLMMessageChannel.ts   ← IPC channel
│
├── CUSTOM_BACKEND_INTEGRATION_GUIDE.md ← Full guide
├── CUSTOM_BACKEND_EXAMPLE.ts           ← Code templates
├── test-custom-backend.js              ← Test script
└── INTEGRATION_QUICK_REFERENCE.md      ← This file
```

---

## 🎨 UI Customization (Optional)

Want a custom settings panel for your provider?

Edit: `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx`

The UI auto-generates inputs based on your `SettingsOfProvider` definition, but you can customize:
- Input types (text, password, dropdown)
- Validation
- Helper text
- Layout

---

## 📊 Supported Features

| Feature | Required | How to Enable |
|---------|----------|---------------|
| **Chat** | ✅ Required | Implement `sendChat` |
| **Streaming** | ⭐ Recommended | Return SSE format |
| **Tool Calling** | ⚡ Optional | Handle `toolCall` in onText |
| **Autocomplete (FIM)** | ⚡ Optional | Implement `sendFIM` |
| **Model Listing** | ⚡ Optional | Implement `list` |
| **Vision** | ⚡ Optional | Set `supportsImages: true` |
| **Reasoning** | ⚡ Optional | Set `doReasoningEffort: true` |

---

## 🧩 API Request Format

Your backend will receive:

```typescript
POST /v1/chat/completions
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Hello!" }
  ],
  "model": "your-model-name",
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 8192,

  // Optional:
  "tools": [...],           // If MCP tools enabled
  "system": "...",          // If separateSystemMessage used
}
```

---

## 🔗 Helpful Commands

```bash
# Development
npm run watch              # Auto-rebuild on changes
npm run watchreact         # Auto-rebuild React only
./scripts/code.sh          # Launch Void

# Testing
./test-custom-backend.js   # Test backend API
npm run test               # Run Void tests

# Building
npm run compile            # Compile TypeScript
npm run buildreact         # Build React components
npm run compile-build      # Production build

# Debugging
# Help → Toggle Developer Tools (in Void)
# Check: ~/.vscode-oss-dev/logs for log files
```

---

## 💡 Pro Tips

1. **Start Small**: Get basic chat working first, then add streaming/tools
2. **Use Existing Providers as Reference**: Look at how Anthropic/OpenAI are implemented
3. **Test Independently**: Use `test-custom-backend.js` before integrating
4. **Watch the Console**: Always have Developer Tools open during testing
5. **Version Control**: Commit working states frequently
6. **Read the Logs**: Check `~/.vscode-oss-dev/logs` for errors

---

## 📚 Next Steps

1. ✅ Test your backend: `./test-custom-backend.js`
2. ✅ Read: `CUSTOM_BACKEND_INTEGRATION_GUIDE.md`
3. ✅ Copy templates: `CUSTOM_BACKEND_EXAMPLE.ts`
4. ✅ Make changes to 3 files
5. ✅ Build: `npm run buildreact && npm run compile`
6. ✅ Test: `./scripts/code.sh`
7. ✅ Debug: Toggle Developer Tools
8. ✅ Iterate! 🚀

---

## 🆘 Get Help

- **Discord**: https://discord.gg/RSNjgaugJs
- **Issues**: https://github.com/voideditor/void/issues
- **Docs**: `VOID_CODEBASE_GUIDE.md`
- **Examples**: Look at existing provider implementations in `sendLLMMessage.impl.ts`

---

## ⚡ TL;DR

**Fastest path to working integration:**

1. Make your backend OpenAI-compatible → No code changes
2. OR copy templates from `CUSTOM_BACKEND_EXAMPLE.ts` → ~200 lines
3. Test with `./test-custom-backend.js`
4. Build: `npm run buildreact && npm run compile`
5. Run: `./scripts/code.sh`
6. Configure in Settings
7. Start coding! 🎉

