#!/bin/bash
# Quick Test: Verify AI Booking Creates Database Entry

echo "=========================================="
echo "🧪 AI BOOKING DATABASE TEST"
echo "=========================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "❌ Backend not running!"
    echo "   Start it with: cd backend_python && python3 app.py"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Test a simple AI chat
echo "📱 Testing AI Chat Endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi", "session_id": "test_123"}')

if echo "$RESPONSE" | grep -q "response"; then
    echo "✅ AI Chat endpoint working"
    echo "   AI Response: $(echo $RESPONSE | python3 -c 'import sys, json; print(json.load(sys.stdin)["response"][:80])' 2>/dev/null || echo 'OK')"
else
    echo "❌ AI Chat endpoint error"
    echo "   Response: $RESPONSE"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ SYSTEM READY FOR BOOKING TEST"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000"
echo "2. Click AI Chat icon (bottom right)"
echo "3. Complete a full booking:"
echo "   - Say 'Hi'"
echo "   - Choose 'PS5'"
echo "   - Say '2' players"
echo "   - Say '1 hour'"
echo "   - Choose tomorrow's date"
echo "   - Choose '2 PM'"
echo "   - Enter your name"
echo "   - Enter phone: 9876543210"
echo "   - Confirm with 'Yes'"
echo ""
echo "4. Watch the backend terminal for:"
echo "   ============================================================"
echo "   🤖 AI BOOKING CREATION ATTEMPT"
echo "   ✅ BOOKING CREATED SUCCESSFULLY! ID: ###"
echo ""
echo "5. Check admin panel to verify booking appears"
echo ""
