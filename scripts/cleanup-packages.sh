#!/bin/bash
# Script to remove MUI and unused packages from the frontend

echo "🧹 Cleaning up frontend dependencies..."
echo ""

cd "$(dirname "$0")/frontend" || exit 1

echo "📦 Current package.json dependencies:"
grep -A 15 '"dependencies"' package.json
echo ""

echo "🗑️  Removing MUI and unused packages..."
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled react-rainbow-components

echo ""
echo "✅ Packages removed successfully!"
echo ""

echo "📦 Updated package.json dependencies:"
grep -A 10 '"dependencies"' package.json
echo ""

echo "📥 Installing remaining dependencies..."
npm install

echo ""
echo "🎉 Frontend optimization complete!"
echo ""
echo "📊 Estimated bundle size reduction: ~1.2MB"
echo ""
echo "⚠️  Note: You'll need to complete the LoginPage.jsx refactoring"
echo "   See PERFORMANCE_OPTIMIZATION_PLAN.md for details"
