#!/bin/bash

echo "🚀 Development Environment Setup - Starting..."
echo "=============================================="

# Check system requirements
echo "📋 Checking system requirements..."
node --version
pnpm --version

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local 2>/dev/null || echo "No .env.example found"
fi

# Create build cache
echo "🗂️ Creating build cache..."
mkdir -p .build-cache
mkdir -p .pnpm-cache

# Setup development tools
echo "🛠️ Setting up development tools..."
pnpm prepare

echo "✅ Development environment setup complete!"
echo "🚀 Ready to start development with: pnpm dev:full"
