#!/usr/bin/env python3
"""
Test Complete AI Booking Flow
Tests the entire booking process from start to confirmation
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:8000/api/ai/chat'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def chat(message, session_id='complete_booking_test'):
    """Send message and return response"""
    try:
        response = requests.post(BASE_URL, json={
            'message': message,
            'session_id': session_id,
            'enable_voice': False  # Disable voice for testing
        }, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"{Colors.RED}❌ Error: Status {response.status_code}{Colors.END}")
            print(response.text)
            return None
    except Exception as e:
        print(f"{Colors.RED}❌ Request failed: {e}{Colors.END}")
        return None

def print_step(step_num, message, response):
    """Pretty print test step"""
    print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}Step {step_num}: {message}{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}")
    
    if response:
        print(f"\n{Colors.GREEN}🤖 AI Reply:{Colors.END}")
        print(response.get('reply', 'No reply'))
        
        print(f"\n{Colors.YELLOW}📊 Status:{Colors.END}")
        print(f"   Action: {response.get('action', 'N/A')}")
        print(f"   Next Step: {response.get('context', {}).get('current_step', 'N/A')}")
        
        state = response.get('context', {}).get('booking_state', {})
        if state:
            print(f"\n{Colors.YELLOW}📝 Booking State:{Colors.END}")
            for key, value in state.items():
                if value and key not in ['availability_checked', 'cancelled']:
                    print(f"   {key}: {value}")
        
        buttons = response.get('buttons', [])
        if buttons:
            print(f"\n{Colors.YELLOW}🔘 Buttons:{Colors.END} {', '.join(buttons[:5])}")
        
        # Check for booking_data or context for confirmation
        if response.get('action') == 'create_booking':
            booking_data = response.get('booking_data') or response.get('context')
            if booking_data:
                print(f"\n{Colors.GREEN}✅ BOOKING DATA READY:{Colors.END}")
                for key in ['customer_name', 'customer_phone', 'booking_date', 'start_time', 'duration_minutes', 'total_price', 'device']:
                    if key in booking_data:
                        print(f"   {key}: {booking_data[key]}")
    else:
        print(f"{Colors.RED}❌ No response{Colors.END}")

def main():
    print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.GREEN}🧪 COMPLETE AI BOOKING FLOW TEST{Colors.END}")
    print(f"{Colors.BOLD}{Colors.GREEN}{'='*70}{Colors.END}\n")
    
    # Calculate tomorrow's date
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Test conversation flow
    steps = [
        ("Hi", "Greeting"),
        ("PS5", "Select Game"),
        ("2 players", "Select Players"),
        ("1 hour", "Select Duration"),
        ("Tomorrow", "Select Date"),
        ("6 PM", "Select Time"),
        ("John Doe", "Enter Name"),
        ("9876543210", "Enter Phone"),
        ("✅ Confirm", "Confirm Booking")
    ]
    
    session_id = f"test_{datetime.now().timestamp()}"
    
    for i, (message, description) in enumerate(steps, 1):
        response = chat(message, session_id)
        print_step(i, f"{description}: '{message}'", response)
        
        if not response:
            print(f"\n{Colors.RED}❌ TEST FAILED: No response at step {i}{Colors.END}")
            return False
        
        # Check if booking was created
        if response.get('action') == 'booking_success':
            booking_id = response.get('data', {}).get('booking_id')
            if booking_id:
                print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*70}{Colors.END}")
                print(f"{Colors.BOLD}{Colors.GREEN}🎉 SUCCESS! BOOKING CREATED!{Colors.END}")
                print(f"{Colors.BOLD}{Colors.GREEN}Booking ID: #{booking_id}{Colors.END}")
                print(f"{Colors.BOLD}{Colors.GREEN}{'='*70}{Colors.END}\n")
                return True
            else:
                print(f"\n{Colors.YELLOW}⚠️  Booking success but no ID returned{Colors.END}")
                return False
        
        # Check for errors
        if response.get('action') in ['error', 'booking_failed', 'booking_error']:
            print(f"\n{Colors.RED}❌ TEST FAILED: {response.get('action')}{Colors.END}")
            return False
    
    print(f"\n{Colors.RED}❌ TEST FAILED: Booking not created after all steps{Colors.END}")
    return False

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted{Colors.END}")
        exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Test error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
        exit(1)
