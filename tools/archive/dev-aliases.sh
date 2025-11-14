#!/bin/bash

# Development aliases for faster workflow
alias dev="pnpm dev:full"
alias devf="pnpm dev:frontend"
alias devb="pnpm dev:backend"
alias build="pnpm build:fast"
alias test="pnpm test:fast"
alias lint="pnpm lint:fast"
alias clean="pnpm clean"
alias setup="./scripts/dev-setup.sh"
alias start="node scripts/dev-automation.js"

# Quick development commands
alias qdev="pnpm dev:full"
alias qbuild="pnpm build:fast"
alias qtest="pnpm test:fast"
alias qlint="pnpm lint:fast"

echo "✅ Development aliases loaded"
echo "🚀 Use 'dev' to start full development environment"
echo "🔧 Use 'setup' to setup development environment"
