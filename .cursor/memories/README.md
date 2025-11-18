# Cursor Memories - How to Use

This directory contains memories that should be saved in Cursor's memory system for automatic recall.

## 📋 How to Save Memories

### Method 1: Via Cursor UI
1. Open Cursor
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
3. Type "Save memory" or "Remember"
4. Paste the memory text
5. Cursor will save it for future sessions

### Method 2: Via Chat
1. In Cursor chat, say: "Remember: [memory text]"
2. Cursor will save it automatically

### Method 3: Bulk Import
1. Open `CODING_SAVANT_MEMORIES.md`
2. Copy each memory (they're separated by `---`)
3. Save them one by one using Method 1 or 2

## 🎯 Memory Format

Each memory follows this format:
- **Title**: Brief description
- **Content**: Specific pattern, rule, or fact
- **Context**: Why it matters (optional but helpful)

## 📚 Memory Categories

### Critical Patterns (Save These First)
- API Route Pattern
- Supabase Query Pattern
- RLS Policy Pattern
- Webhook Service Role Client
- Frontend Startup Script

### Common Mistakes (High Priority)
- SQL camelCase Column Names
- NULL Handling in Triggers
- React setTimeout Cleanup
- Silent Failure Debugging

### Performance Wins (Always Apply)
- Query Optimization
- Component Memoization
- Performance Wins Summary

## ✅ Verification

After saving memories, test them:
1. Ask Cursor: "What's the API route pattern?"
2. Ask Cursor: "How do I start the frontend?"
3. Ask Cursor: "What's the Supabase query pattern?"

If Cursor recalls the memories correctly, they're saved!

## 🔄 Updating Memories

To update a memory:
1. Find the memory in Cursor's memory system
2. Update it with new information
3. Or delete and recreate with updated content

## 📊 Memory Status

Check which memories are saved:
- Ask Cursor: "What memories do you have about this codebase?"
- Cursor will list all saved memories

---

**Tip**: Start with the "Critical Patterns" - these are used most frequently and have the biggest impact.
