#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║   🔐 AUTHENTICATION SYSTEM - SETUP & START                      ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Database Migration
echo "📊 Step 1: Running database migration..."
echo "Enter MySQL root password when prompted:"
mysql -u root -p gamespot_booking < database/migration_auth_system.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
else
    echo "❌ Database migration failed. Please check your MySQL connection."
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║   ✅ AUTHENTICATION SYSTEM READY!                                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔐 New Features Available:"
echo "  • Unified Login: http://localhost:3000/login"
echo "  • Customer Signup: http://localhost:3000/signup"
echo "  • Membership Plans: http://localhost:3000/membership"
echo "  • Forgot Password: http://localhost:3000/forgot-password"
echo ""
echo "👤 Test Accounts:"
echo "  Admin: username='admin', password='admin'"
echo "  User: email='test@example.com', password='password123'"
echo ""
echo "🚀 Backend is running on: http://localhost:8000"
echo "🌐 Frontend is running on: http://localhost:3000"
echo ""
echo "📖 Full documentation: AUTH_SYSTEM_IMPLEMENTATION.md"
echo ""
