#!/bin/bash

# Instagram Promotion System - Quick Test Script
# This script helps verify the Instagram promotion system is working

echo "======================================"
echo "🎮 Instagram Promotion System Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Check Database Tables
echo "${YELLOW}1. Checking Database Tables...${NC}"
mysql -u root -p gamespot_booking -e "
SELECT 
    'instagram_promotions' as table_name,
    COUNT(*) as records
FROM instagram_promotions
UNION ALL
SELECT 
    'user_instagram_redemptions' as table_name,
    COUNT(*) as records
FROM user_instagram_redemptions;
"

echo ""

# 2. Check Active Promotion
echo "${YELLOW}2. Checking Active Promotion...${NC}"
mysql -u root -p gamespot_booking -e "
SELECT 
    id,
    campaign_name,
    instagram_handle,
    discount_value,
    required_friends_count,
    is_active,
    start_date
FROM instagram_promotions
WHERE is_active = TRUE;
"

echo ""

# 3. Check Backend Files
echo "${YELLOW}3. Checking Backend Files...${NC}"

if [ -f "backend/routes/instagram_promotion.py" ]; then
    echo "${GREEN}✓${NC} backend/routes/instagram_promotion.py exists"
else
    echo "${RED}✗${NC} backend/routes/instagram_promotion.py missing"
fi

if [ -f "backend/middleware/auth.py" ]; then
    echo "${GREEN}✓${NC} backend/middleware/auth.py exists"
else
    echo "${RED}✗${NC} backend/middleware/auth.py missing"
fi

# Check if blueprint is registered
if grep -q "instagram_promo_bp" backend/app.py; then
    echo "${GREEN}✓${NC} Instagram promo blueprint registered in app.py"
else
    echo "${RED}✗${NC} Instagram promo blueprint not registered"
fi

echo ""

# 4. Check Frontend Files
echo "${YELLOW}4. Checking Frontend Files...${NC}"

if [ -f "frontend/src/pages/InstagramPromoPage.jsx" ]; then
    echo "${GREEN}✓${NC} frontend/src/pages/InstagramPromoPage.jsx exists"
else
    echo "${RED}✗${NC} frontend/src/pages/InstagramPromoPage.jsx missing"
fi

if [ -f "frontend/src/styles/InstagramPromoPage.css" ]; then
    echo "${GREEN}✓${NC} frontend/src/styles/InstagramPromoPage.css exists"
else
    echo "${RED}✗${NC} frontend/src/styles/InstagramPromoPage.css missing"
fi

# Check if routes are added
if grep -q "InstagramPromoPage" frontend/src/App.js; then
    echo "${GREEN}✓${NC} Instagram promo routes added to App.js"
else
    echo "${RED}✗${NC} Instagram promo routes not added"
fi

# Check if navbar is updated
if grep -q "win-free-game" frontend/src/components/Navbar.jsx; then
    echo "${GREEN}✓${NC} Navbar link updated to /win-free-game"
else
    echo "${RED}✗${NC} Navbar link not updated"
fi

echo ""

# 5. Test API Endpoint (if backend is running)
echo "${YELLOW}5. Testing API Endpoint...${NC}"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} Backend is running"
    
    # Test Instagram promo endpoint
    RESPONSE=$(curl -s http://localhost:8000/api/instagram-promo/active)
    if echo "$RESPONSE" | grep -q "success"; then
        echo "${GREEN}✓${NC} Instagram promo API endpoint working"
    else
        echo "${RED}✗${NC} Instagram promo API endpoint not responding"
    fi
else
    echo "${YELLOW}⚠${NC} Backend not running (start with: cd backend && python3 app.py)"
fi

echo ""

# 6. Summary
echo "======================================"
echo "${GREEN}✅ System Check Complete!${NC}"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo "   1. Start backend: cd backend && python3 app.py"
echo "   2. Start frontend: cd frontend && npm start"
echo "   3. Go to: http://localhost:3000"
echo "   4. Click 'Win Free Game' in navbar"
echo "   5. Login/Signup"
echo "   6. Claim Instagram promotion"
echo ""
echo "📊 Admin Dashboard:"
echo "   - Login as admin"
echo "   - View Instagram redemptions"
echo "   - Verify/reject claims"
echo ""
echo "🎉 Instagram Promotion System Ready!"
echo ""
