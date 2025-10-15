# CorteXIDE AI Functionality Test

## 🎯 **Test Plan: Chat → Edit → Diff → Apply Loop**

### **Prerequisites**
✅ CorteXIDE is running successfully
✅ Mock AI server is running on http://localhost:1234
✅ Test file created: `test-file.js`

### **Test Steps**

#### **1. Configure AI Model in CorteXIDE**
1. Open CorteXIDE
2. Go to Settings (Cmd+,)
3. Search for "LM Studio" or "AI Model"
4. Configure:
   - **Provider**: LM Studio
   - **Endpoint**: `http://localhost:1234`
   - **Model**: `mock-model`

#### **2. Test Chat Interface**
1. Look for the AI Chat sidebar (usually on the left or right)
2. Open the test file: `test-file.js`
3. In the chat, type: "Change the hello function to say 'Hello, CorteXIDE!'"
4. Press Enter or click Send

#### **3. Verify AI Response**
- ✅ AI should respond with acknowledgment
- ✅ AI should show it's making changes
- ✅ Diff preview should appear showing the changes

#### **4. Test Diff Preview**
- ✅ Changes should be highlighted (green for additions, red for deletions)
- ✅ Original code should be visible alongside new code
- ✅ Accept/Reject buttons should be available

#### **5. Test Apply Functionality**
1. Click "Accept" or "Apply" button
2. ✅ File should be updated with the new content
3. ✅ Changes should be saved to disk
4. ✅ Diff preview should disappear

#### **6. Verify File Changes**
1. Check the `test-file.js` file
2. ✅ The `hello()` function should now say "Hello, CorteXIDE!"
3. ✅ Other functions should remain unchanged

### **Expected Results**

**Before:**
```javascript
function hello() {
    console.log("Hello, World!");
}
```

**After:**
```javascript
function hello() {
    console.log("Hello, CorteXIDE!");
}
```

### **Troubleshooting**

**If AI Chat doesn't appear:**
- Check if the sidebar is collapsed
- Look for a chat icon in the activity bar
- Try the Command Palette (Cmd+Shift+P) and search for "Chat"

**If AI doesn't respond:**
- Verify the mock server is running: `curl http://localhost:1234/v1/models`
- Check CorteXIDE settings for correct endpoint
- Look for error messages in the chat interface

**If diff preview doesn't work:**
- Ensure the file is saved and has changes
- Check if the AI actually made tool calls
- Verify the edit service is working

### **Success Criteria**
✅ Chat interface is visible and functional
✅ AI responds to prompts
✅ Diff preview shows changes correctly
✅ Apply functionality updates the file
✅ File changes are persisted to disk
✅ No errors in the console

---

## 🧠 **CorteXIDE AI Features Validated**

This test validates the core AI functionality that makes CorteXIDE unique:
- **Privacy-first**: Uses local mock server (no external API calls)
- **Transparent**: Shows diffs before applying changes
- **Safe**: Allows accept/reject of AI suggestions
- **Integrated**: Works seamlessly with the VS Code-like interface
