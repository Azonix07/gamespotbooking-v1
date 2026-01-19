#!/bin/bash
# Build script for Railway - builds both frontend and backend

set -e  # Exit on error

echo "=========================================="
echo "🎮 GameSpot Build Script"
echo "=========================================="

# Show current directory
echo "📁 Current directory: $(pwd)"
echo "📂 Contents:"
ls -la

# Step 1: Build Frontend
echo ""
echo "=========================================="
echo "📦 Step 1: Building Frontend..."
echo "=========================================="

cd frontend

# Check if node is available
if command -v node &> /dev/null; then
    echo "✅ Node.js version: $(node --version)"
else
    echo "❌ Node.js not found!"
    exit 1
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build React app
echo "🔨 Building React app..."
npm run build

# Verify build
if [ -f "build/index.html" ]; then
    echo "✅ Frontend build successful!"
    echo "📂 Build contents:"
    ls -la build/
else
    echo "❌ Frontend build failed - index.html not found!"
    exit 1
fi

cd ..

# Step 2: Install Backend Dependencies
echo ""
echo "=========================================="
echo "🐍 Step 2: Installing Backend Dependencies..."
echo "=========================================="

cd backend

# Check if python is available
if command -v python3 &> /dev/null; then
    echo "✅ Python version: $(python3 --version)"
elif command -v python &> /dev/null; then
    echo "✅ Python version: $(python --version)"
else
    echo "❌ Python not found!"
    exit 1
fi

# Install Python dependencies
echo "📦 Installing pip dependencies..."
pip install -r requirements.txt

cd ..

# Show final structure
echo ""
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo "📂 Final structure:"
echo "  frontend/build/index.html exists: $([ -f frontend/build/index.html ] && echo 'YES' || echo 'NO')"
echo "  backend/app.py exists: $([ -f backend/app.py ] && echo 'YES' || echo 'NO')"
