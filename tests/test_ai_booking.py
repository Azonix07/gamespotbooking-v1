#!/usr/bin/env python3
"""
Test AI Booking Flow - Verify Database Integration
Tests if AI bookings actually create real database entries
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_ai_booking():
    print("=" * 80)
    print("🤖 TESTING AI BOOKING FLOW - DATABASE INTEGRATION")
    print("=" * 80)
    
    # Start a conversation
    session_id = f"test_{datetime.now().timestamp()}"
    
    # Step 1: Greeting
    print("\n1️⃣ STEP 1: Initial Greeting")
    print("   User: Hi")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "Hi",
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 2: Choose game
    print("\n2️⃣ STEP 2: Choose Game")
    print("   User: PS5")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "PS5",
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 3: Number of players
    print("\n3️⃣ STEP 3: Number of Players")
    print("   User: 2")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "2",
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 4: Duration
    print("\n4️⃣ STEP 4: Duration")
    print("   User: 1 hour")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "1 hour",
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 5: Date (tomorrow)
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    print("\n5️⃣ STEP 5: Date")
    print(f"   User: {tomorrow}")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": tomorrow,
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 6: Time
    print("\n6️⃣ STEP 6: Time")
    print("   User: 2:00 PM")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "2:00 PM",
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 7: Name
    print("\n7️⃣ STEP 7: Customer Name")
    print("   User: Test Customer")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "Test Customer",
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 8: Phone
    print("\n8️⃣ STEP 8: Phone Number")
    print("   User: 9876543210")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "9876543210",
        "session_id": session_id
    })
    print(f"   AI: {response.json()['response'][:100]}...")
    
    # Step 9: Confirmation
    print("\n9️⃣ STEP 9: Confirm Booking")
    print("   User: Yes")
    response = requests.post(f"{BASE_URL}/api/ai/chat", json={
        "message": "Yes",
        "session_id": session_id
    })
    result = response.json()
    print(f"   AI: {result['response'][:200]}...")
    
    print("\n" + "=" * 80)
    if 'data' in result and 'booking_id' in result.get('data', {}):
        booking_id = result['data']['booking_id']
        print(f"✅ SUCCESS! Booking created with ID: {booking_id}")
        print(f"🎯 Check admin panel to verify booking appears")
        print(f"🎯 Check calendar to verify slot is disabled")
        print(f"🎯 Check backend logs for detailed creation flow")
    else:
        print("❌ FAILED! No booking_id returned")
        print(f"Response: {json.dumps(result, indent=2)}")
    print("=" * 80)

if __name__ == "__main__":
    test_ai_booking()
