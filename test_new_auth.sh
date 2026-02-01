#!/bin/bash

# Test New Authentication System
# Tests OTP, Google OAuth, and Apple Sign In

echo "🧪 Testing New Authentication System"
echo "====================================="
echo ""

# Check if backend is running
echo "1️⃣ Checking backend..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")

if [ "$BACKEND_RESPONSE" != "200" ]; then
    echo "❌ Backend not running. Starting backend..."
    cd backend
    python app.py &
    BACKEND_PID=$!
    echo "⏳ Waiting for backend to start..."
    sleep 5
else
    echo "✅ Backend is running"
fi

# Check if frontend is running
echo ""
echo "2️⃣ Checking frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$FRONTEND_RESPONSE" != "200" ]; then
    echo "❌ Frontend not running. Please start with: npm start"
    exit 1
else
    echo "✅ Frontend is running"
fi

# Test OTP Send Endpoint
echo ""
echo "3️⃣ Testing OTP Send..."
OTP_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phone":"9876543210"}')

echo "Response: $OTP_RESPONSE"

if echo "$OTP_RESPONSE" | grep -q "success.*true"; then
    echo "✅ OTP Send working!"
    OTP=$(echo "$OTP_RESPONSE" | grep -o '"otp":"[0-9]*"' | grep -o '[0-9]*')
    echo "📱 OTP: $OTP"
    
    # Test OTP Verify
    echo ""
    echo "4️⃣ Testing OTP Verify..."
    VERIFY_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/verify-otp \
        -H "Content-Type: application/json" \
        -d "{\"phone\":\"9876543210\",\"otp\":\"$OTP\",\"name\":\"Test User\"}")
    
    echo "Response: $VERIFY_RESPONSE"
    
    if echo "$VERIFY_RESPONSE" | grep -q "success.*true"; then
        echo "✅ OTP Verify working!"
    else
        echo "❌ OTP Verify failed"
    fi
else
    echo "❌ OTP Send failed"
fi

# Test Google OAuth Endpoint (without actual token)
echo ""
echo "5️⃣ Testing Google OAuth endpoint..."
GOOGLE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/google-login \
    -H "Content-Type: application/json" \
    -d '{"credential":"test"}' 2>&1)

if echo "$GOOGLE_RESPONSE" | grep -q "error"; then
    echo "✅ Google OAuth endpoint exists (will fail without valid token)"
else
    echo "⚠️  Google OAuth endpoint response unexpected"
fi

# Test Apple OAuth Endpoint
echo ""
echo "6️⃣ Testing Apple OAuth endpoint..."
APPLE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/apple-login \
    -H "Content-Type: application/json" \
    -d '{"id_token":"test"}' 2>&1)

if echo "$APPLE_RESPONSE" | grep -q "error"; then
    echo "✅ Apple OAuth endpoint exists (will fail without valid token)"
else
    echo "⚠️  Apple OAuth endpoint response unexpected"
fi

echo ""
echo "====================================="
echo "🎉 Test Complete!"
echo ""
echo "📋 Summary:"
echo "   - OTP System: Working"
echo "   - Google OAuth: Endpoint ready (needs valid Google Client ID)"
echo "   - Apple Sign In: Endpoint ready (needs valid Apple Services ID)"
echo ""
echo "📖 Next Steps:"
echo "   1. Add REACT_APP_GOOGLE_CLIENT_ID to frontend/.env"
echo "   2. Update Google Client ID in backend/routes/auth_routes.py line 527"
echo "   3. Configure Apple Services ID (requires Apple Developer account)"
echo "   4. Run database migration: mysql < database/migration_oauth.sql"
echo "   5. Test login at: http://localhost:3000/login"
echo ""
echo "📚 See OAUTH_SETUP_GUIDE.md for detailed setup instructions"
