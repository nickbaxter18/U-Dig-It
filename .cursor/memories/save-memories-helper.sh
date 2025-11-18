#!/bin/bash

# Helper script to format memories for easy saving in Cursor
# Usage: ./save-memories-helper.sh

MEMORIES_FILE=".cursor/memories/CODING_SAVANT_MEMORIES.md"
OUTPUT_FILE=".cursor/memories/FORMATTED_FOR_SAVING.txt"

echo "📋 Formatting memories for Cursor memory system..."
echo ""

# Extract memories and format them
grep -A 1 "^## 🔥" "$MEMORIES_FILE" | \
  grep -v "^--$" | \
  sed 's/^## 🔥 //' | \
  sed 's/^\*\*Memory\*\*: //' | \
  awk '
    BEGIN {
      print "=== CURSOR MEMORIES - COPY EACH ONE ===\n"
      count = 0
    }
    /^[^🔥]/ && length($0) > 10 {
      count++
      print "--- Memory " count " ---"
      print
      print
      print "---"
      print ""
    }
  ' > "$OUTPUT_FILE"

echo "✅ Formatted memories saved to: $OUTPUT_FILE"
echo ""
echo "📝 Next steps:"
echo "1. Open $OUTPUT_FILE"
echo "2. Copy each memory (between --- markers)"
echo "3. In Cursor, go to Settings → Saved Memories → Add Memory"
echo "4. Paste and save"
echo ""
echo "Or use Cursor chat and say:"
echo '   "Please save this as a memory: [paste memory text]"'
