#!/usr/bin/env python3
"""Fix logger.error/warn calls that have error object as 3rd parameter."""

import os
import re

def fix_logger_calls(file_path):
    """Fix logger calls with 3 arguments."""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Pattern: logger.error('msg', { metadata }, errorVar)
    # Should be: logger.error('msg', { metadata })
    # Match patterns like: }, deleteError) or }, insertError) or }, fetchError) etc.
    pattern = re.compile(
        r'(logger\.(error|warn)\([^,]+,\s*\{[^}]+\}),\s*(\w+Error)\s*\)',
        re.MULTILINE
    )

    def replace_logger(match):
        # Extract the error variable name
        error_var = match.group(3)
        # Replace by moving error to metadata and removing 3rd arg
        full_match = match.group(0)

        # Find the closing brace of metadata object
        prefix = match.group(1)
        method = match.group(2)

        # Add error message to metadata
        new_call = f"{prefix}, error: {error_var}?.message }})"
        return new_call

    # Alternative simpler fix: just remove the error parameter
    # pattern2 matches: }, \n      errorVar\n    )
    pattern2 = re.compile(
        r'(\{[^}]+\}),\s*\n\s+(\w+Error)\s*\n\s*\)',
        re.MULTILINE
    )

    def replace_simple(match):
        return f"{match.group(1)}\n        )"

    content = pattern2.sub(replace_simple, content)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False

def main():
    base_path = '/home/vscode/U-Dig-It-1/frontend/src/app/api/admin'

    fixed_count = 0

    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)

                try:
                    if fix_logger_calls(file_path):
                        fixed_count += 1
                        rel_path = os.path.relpath(file_path, base_path)
                        print(f"✅ Fixed logger calls in: {rel_path}")
                except Exception as e:
                    rel_path = os.path.relpath(file_path, base_path)
                    print(f"❌ Error in {rel_path}: {e}")

    print(f"\n📊 Fixed logger calls in {fixed_count} files")

if __name__ == '__main__':
    main()



