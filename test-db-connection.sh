#!/bin/bash
# Database Connection Verification Script
# Run this after you've set up the DATABASE_URL

echo "================================"
echo "🧪 DATABASE CONNECTION TEST"
echo "================================"
echo ""

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "❌ ERROR: backend/.env not found!"
    echo "Make sure you're in the project root directory"
    exit 1
fi

echo "✅ Found backend/.env"
echo ""

# Check if DATABASE_URL is set
DB_URL=$(grep "DATABASE_URL" backend/.env | cut -d'=' -f2)
if [ -z "$DB_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not found in backend/.env"
    exit 1
fi

# Hide password in output
SAFE_URL=$(echo "$DB_URL" | sed 's/:[^:]*@/:****@/')
echo "📝 DATABASE_URL found:"
echo "   $SAFE_URL"
echo ""

# Check if password is still a placeholder
if echo "$DB_URL" | grep -q "YOUR_POSTGRES_PASSWORD"; then
    echo "❌ WARNING: DATABASE_URL still contains placeholder 'YOUR_POSTGRES_PASSWORD'"
    echo "   Please update it with your actual password from Supabase"
    echo ""
    echo "📌 Steps to fix:"
    echo "   1. Go to https://app.supabase.com"
    echo "   2. Select your project (fsgcdhshhsbmodspyggn)"
    echo "   3. Go to Settings → Database → Connection string"
    echo "   4. Copy the connection string with password"
    echo "   5. Replace YOUR_POSTGRES_PASSWORD in backend/.env"
    exit 1
fi

echo "✅ Database URL appears to be configured"
echo ""

# Check if we can access Node
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if npm dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "⏳ Installing npm dependencies..."
    cd backend
    npm install
    cd ..
fi

echo ""
echo "================================"
echo "🚀 STARTING DATABASE TEST..."
echo "================================"
echo ""

# Try to start the backend
cd backend
npm run dev
