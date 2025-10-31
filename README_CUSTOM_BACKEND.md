# 🚀 Integrating Your Custom Backend with Void

**Welcome!** This guide helps you connect your own backend API to the Void frontend (the open-source Cursor alternative).

---

## 📚 Documentation Overview

I've created 4 files to help you integrate your backend:

| File | Purpose | Read Time |
|------|---------|-----------|
| **INTEGRATION_QUICK_REFERENCE.md** | ⚡ Quick reference card & cheat sheet | 5 min |
| **CUSTOM_BACKEND_INTEGRATION_GUIDE.md** | 📖 Complete integration guide with examples | 15 min |
| **CUSTOM_BACKEND_EXAMPLE.ts** | 💻 Copy-paste code templates | Reference |
| **test-custom-backend.js** | 🧪 Test script for your backend API | Interactive |

**Start here:** 👉 `INTEGRATION_QUICK_REFERENCE.md` for a quick overview
**Then read:** 👉 `CUSTOM_BACKEND_INTEGRATION_GUIDE.md` for detailed instructions

---

## 🎯 Choose Your Path

### Path 1: Your Backend is OpenAI-Compatible ✨

**Difficulty:** ⭐ Easy (5 minutes)
**Code changes:** None!

If your backend follows OpenAI's API format:

```bash
# Just configure and go!
./scripts/code.sh
# Then in Settings: Select "OpenAI Compatible" provider
```

✅ **Use this if:** Your backend responds with OpenAI-style JSON
📖 **No code changes needed!** Just configure the endpoint in Settings

---

### Path 2: Add Your Backend as a New Provider 🔧

**Difficulty:** ⭐⭐ Medium (1-2 hours)
**Code changes:** ~200 lines across 3 files

Most common approach. Keeps Void's architecture intact.

```bash
# 1. Test your backend
./test-custom-backend.js

# 2. Edit 3 files (templates in CUSTOM_BACKEND_EXAMPLE.ts)
#    - voidSettingsTypes.ts
#    - sendLLMMessage.impl.ts
#    - modelCapabilities.ts

# 3. Build and run
npm run buildreact && npm run compile
./scripts/code.sh
```

✅ **Use this if:** You want clean integration with existing Void features
📖 **Read:** `CUSTOM_BACKEND_INTEGRATION_GUIDE.md` → Option 1

---

### Path 3: Replace the Entire LLM Pipeline ⚙️

**Difficulty:** ⭐⭐⭐ Advanced (4+ hours)
**Code changes:** Extensive modifications

Complete customization of how Void talks to backends.

✅ **Use this if:** You need radical changes to the architecture
📖 **Read:** `CUSTOM_BACKEND_INTEGRATION_GUIDE.md` → Option 2

---

## ⚡ Quick Start (5 minutes)

### Step 1: Test Your Backend

```bash
# Edit the config at the top of this file
nano test-custom-backend.js

# Run the tests
./test-custom-backend.js
```

**Expected output:**
```
📡 Test 1: Testing connection to backend...
   ✅ Backend is reachable
💬 Test 3: Sending simple chat message...
   ✅ Response received
...
✅ Your backend is ready to integrate with Void!
```

### Step 2: Choose Integration Method

**Is your backend OpenAI-compatible?**
- ✅ YES → Use Path 1 (OpenAI-Compatible) - Just configure in Settings
- ❌ NO → Use Path 2 (Add as Provider) - Follow the guide below

### Step 3: Follow the Guide

👉 **Start with:** `INTEGRATION_QUICK_REFERENCE.md`
👉 **Then read:** `CUSTOM_BACKEND_INTEGRATION_GUIDE.md`
👉 **Use templates from:** `CUSTOM_BACKEND_EXAMPLE.ts`

---

## 📦 What's in This Repo

```
void/
├── README.md                           ← Original Void README
├── VOID_CODEBASE_GUIDE.md             ← How Void's code works
│
├── README_CUSTOM_BACKEND.md           ← THIS FILE - Start here! ⭐
├── INTEGRATION_QUICK_REFERENCE.md     ← Quick reference card
├── CUSTOM_BACKEND_INTEGRATION_GUIDE.md← Complete guide
├── CUSTOM_BACKEND_EXAMPLE.ts          ← Code templates
└── test-custom-backend.js             ← Backend test tool
│
└── src/vs/workbench/contrib/void/     ← Void's source code
    ├── common/
    │   ├── voidSettingsTypes.ts       ← Edit: Provider types
    │   ├── modelCapabilities.ts       ← Edit: Model configs
    │   └── sendLLMMessageService.ts   ← Browser-side service
    ├── browser/
    │   └── chatThreadService.ts       ← Chat management
    └── electron-main/
        └── llmMessage/
            └── sendLLMMessage.impl.ts ← Edit: Implementations ⭐
```

---

## 🧪 Testing Checklist

Before integrating, make sure:

- [ ] Your backend is running and reachable
- [ ] `./test-custom-backend.js` passes all tests
- [ ] You understand your backend's request/response format
- [ ] You have API credentials (if needed)
- [ ] You've chosen an integration path

---

## 🔧 Development Workflow

```bash
# 1. Make changes to Void source files
nano src/vs/workbench/contrib/void/...

# 2. Rebuild
npm run buildreact  # If you changed React components
npm run compile     # Compile TypeScript

# 3. Run Void
./scripts/code.sh

# 4. Debug
# Help → Toggle Developer Tools
# Check console for errors

# 5. Iterate!
```

### Watch Mode (Auto-rebuild)

Open 3 terminals:

```bash
# Terminal 1: Watch React changes
npm run watchreact

# Terminal 2: Watch TypeScript changes
npm run watch

# Terminal 3: Run Void
./scripts/code.sh
```

---

## 🐛 Troubleshooting

### Backend not working?
1. Run `./test-custom-backend.js` - does it pass?
2. Check backend logs
3. Test with curl directly
4. Verify API key and endpoint

### Changes not taking effect?
1. Did you run `npm run buildreact`?
2. Did you run `npm run compile`?
3. Did you restart Void completely?
4. Try clearing cache: `rm -rf ~/.vscode-oss-dev`

### TypeScript errors?
1. Check imports match exactly
2. Run `npm run compile` to see all errors
3. Compare with existing provider implementations
4. Check types in `sendLLMMessageTypes.ts`

### Can't see messages?
1. Open Developer Tools (Help → Toggle Developer Tools)
2. Check console for errors
3. Add `console.log()` in your implementation
4. Verify `onText()` is called with correct format

---

## 🎓 Learning Path

**If you're new to Void:**

1. ✅ Read `README.md` - Understand what Void is
2. ✅ Read `VOID_CODEBASE_GUIDE.md` - Understand the architecture
3. ✅ Read `INTEGRATION_QUICK_REFERENCE.md` - Quick overview
4. ✅ Test your backend with `./test-custom-backend.js`
5. ✅ Read `CUSTOM_BACKEND_INTEGRATION_GUIDE.md` - Detailed guide
6. ✅ Follow the code templates in `CUSTOM_BACKEND_EXAMPLE.ts`
7. ✅ Build, test, iterate! 🚀

---

## 📖 Key Concepts

### Void's Architecture
```
┌──────────────────┐
│   React UI       │ User interaction
│   (Browser)      │
└────────┬─────────┘
         │ IPC Channel (Inter-Process Communication)
┌────────▼─────────┐
│  Electron-Main   │ Node.js process
│  sendLLMMessage  │ Can import node_modules
└────────┬─────────┘
         │ HTTP Request
┌────────▼─────────┐
│  Your Backend    │ Your custom API
│  (External)      │
└──────────────────┘
```

### Message Flow
1. User types in chat → `chatThreadService.ts`
2. Message sent via IPC → `sendLLMMessageService.ts`
3. Received by main process → `sendLLMMessageChannel.ts`
4. Routed to provider → `sendLLMMessage.impl.ts`
5. API request to backend → **Your implementation**
6. Response streamed back → `onText()` callbacks
7. UI updated → React components render

---

## 💡 Best Practices

### 1. Start Small
Get basic chat working before adding advanced features like:
- Streaming
- Tool calling
- Vision/multimodal
- Fill-in-middle (autocomplete)

### 2. Test Independently
Always test your backend with `./test-custom-backend.js` before integrating.

### 3. Use Existing Code as Reference
Look at how other providers are implemented:
- **OpenAI**: Simple, clean implementation
- **Anthropic**: Tool calling, streaming
- **Ollama**: Local model support

### 4. Debug Effectively
- Always have Developer Tools open
- Add `console.log()` liberally
- Check `~/.vscode-oss-dev/logs` for errors

### 5. Version Control
```bash
git add -A
git commit -m "Add custom backend integration"
```

---

## 🚀 Next Steps

**Ready to get started?**

1. **Test your backend:**
   ```bash
   ./test-custom-backend.js
   ```

2. **Read the quick reference:**
   ```bash
   cat INTEGRATION_QUICK_REFERENCE.md
   ```

3. **Follow the detailed guide:**
   ```bash
   cat CUSTOM_BACKEND_INTEGRATION_GUIDE.md
   ```

4. **Copy code templates:**
   ```bash
   cat CUSTOM_BACKEND_EXAMPLE.ts
   ```

5. **Build and test:**
   ```bash
   npm run buildreact && npm run compile
   ./scripts/code.sh
   ```

---

## 🆘 Need Help?

- **Quick answers:** Check `INTEGRATION_QUICK_REFERENCE.md`
- **Detailed guide:** Read `CUSTOM_BACKEND_INTEGRATION_GUIDE.md`
- **Code examples:** See `CUSTOM_BACKEND_EXAMPLE.ts`
- **Test tool:** Run `./test-custom-backend.js`
- **Discord:** https://discord.gg/RSNjgaugJs
- **Issues:** https://github.com/voideditor/void/issues

---

## 🎉 Success Checklist

You're done when:

- [ ] `./test-custom-backend.js` passes all tests
- [ ] Code compiles without errors (`npm run compile`)
- [ ] Void launches successfully (`./scripts/code.sh`)
- [ ] Your backend appears in the Settings provider dropdown
- [ ] You can send a message and get a response
- [ ] Streaming works (if supported)
- [ ] Error handling works (try invalid API key)

**Congrats! You've integrated your custom backend with Void!** 🎊

---

## 📝 Summary

| What | Where | Time |
|------|-------|------|
| Quick overview | `INTEGRATION_QUICK_REFERENCE.md` | 5 min |
| Full guide | `CUSTOM_BACKEND_INTEGRATION_GUIDE.md` | 15 min |
| Code templates | `CUSTOM_BACKEND_EXAMPLE.ts` | Reference |
| Test your API | `./test-custom-backend.js` | 2 min |
| Make changes | Edit 3 files in `src/vs/workbench/contrib/void/` | 1-2 hours |
| Build & test | `npm run buildreact && npm run compile && ./scripts/code.sh` | 5 min |

**Total time:** ~2-3 hours for complete integration

---

**Happy coding! 🚀**

Made with ❤️ for the Void community

