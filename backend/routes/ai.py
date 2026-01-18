"""
AI Chat Routes
Handles AI-powered booking assistant conversations
TEXT-ONLY MODE: Voice/audio completely disabled
"""

from flask import Blueprint, request, jsonify, session
from services.ai_assistant import AIBookingAssistant
from services.ai_helpers import (
    get_slot_availability,
    get_slot_details_info,
    calculate_slot_price,
    create_booking_internal
)
from middleware.rate_limiter import rate_limit
from middleware.ai_validator import AIValidator
import traceback

# ❌ VOICE DISABLED - Text-only mode
VOICE_ENABLED = False
voice_tts_service = None
print("✅ Voice/Audio DISABLED - Text-only chat mode")

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
ai_assistant = AIBookingAssistant()

# Store conversation sessions (in production, use Redis or database)
conversation_sessions = {}

@ai_bp.route('/chat', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=60, per_ip_limit=100, per_ip_window=3600)
def chat():
    """
    Handle AI chat messages
    
    Request body:
    {
        "message": "user message",
        "session_id": "optional session id",
        "context": {}  # optional conversation context
    }
    
    Response:
    {
        "reply": "AI response",
        "action": "action type",
        "data": {},  # additional data if needed
        "session_id": "session id"
    }
    """
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        session_id = data.get('session_id', None)
        context = data.get('context', {})
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Get or create session
        if session_id and session_id in conversation_sessions:
            context = conversation_sessions[session_id]
        elif not session_id:
            import uuid
            session_id = str(uuid.uuid4())
            conversation_sessions[session_id] = {}
        
        # Process message with AI (now with session_id for context awareness)
        response = ai_assistant.process_message(message, context, session_id)
        
        # Handle different actions
        action = response.get('action')
        
        if action == 'fetch_availability':
            # User wants to check availability
            response = handle_availability_request(response)
        
        elif action == 'checking_availability':
            # AI has all details and wants to check availability
            response = check_availability_for_booking(response)
        
        elif action == 'create_booking':
            # User confirmed and provided details - create the booking
            print("=" * 60)
            print("🔍 DEBUG: Full response object before booking creation:")
            print(f"Response keys: {list(response.keys())}")
            print(f"Response action: {response.get('action')}")
            print(f"Response booking_data: {response.get('booking_data', 'NOT FOUND')}")
            print(f"Response context: {response.get('context', 'NOT FOUND')}")
            print(f"Response booking_state: {response.get('booking_state', 'NOT FOUND')}")
            print("=" * 60)
            response = handle_booking_creation(response)
            
            # Track successful booking in context engine
            if response.get('action') == 'booking_success' and hasattr(ai_assistant, 'context_engine'):
                booking_data = response.get('data', {})
                ai_assistant.context_engine.track_successful_booking(session_id, booking_data)
        
        # Track failed attempts if needed
        if response.get('action') in ['slot_conflict', 'no_availability', 'error']:
            if hasattr(ai_assistant, 'context_engine'):
                reason = response.get('action')
                ai_assistant.context_engine.track_failed_attempt(session_id, reason, context)
        
        # Update session
        if 'context' in response:
            conversation_sessions[session_id] = response['context']
        
        # Add session_id to response
        response['session_id'] = session_id
        
        # ❌ VOICE DISABLED - Always return voice_enabled: false
        response['voice_enabled'] = False
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error in AI chat: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'error': 'An error occurred processing your request',
            'reply': "I'm sorry, I encountered an error. Would you like to try the manual booking page?",
            'action': 'error'
        }), 500


def handle_availability_request(response):
    """Check slot availability with smart suggestions"""
    try:
        context = response.get('context', {})
        date = response['data']['date']
        time = response['data'].get('time')
        
        # Get slots for the date
        slots_data = get_slot_availability(date)
        
        if not slots_data or 'slots' not in slots_data:
            response['reply'] = f"❌ I couldn't fetch availability for {date}. Please try again or pick another date."
            return response
        
        slots = slots_data['slots']
        
        # Filter by status
        available_slots = [s for s in slots if s['status'] in ['available', 'partial']]
        fully_booked = [s for s in slots if s['status'] == 'full']
        
        if not available_slots:
            response['reply'] = f"😔 **All slots are fully booked for {date}**\n\n" \
                              "🔄 **Suggestion:** Try booking for:\n" \
                              "• Tomorrow\n" \
                              "• A weekday (usually less crowded)\n" \
                              "• Morning slots (typically more available)\n\n" \
                              "Would you like me to check another date?"
            response['action'] = 'no_availability'
            return response
        
        # Format available slots
        if time:
            # Check specific time
            requested_slot = next((s for s in slots if s['time'] == time), None)
            if requested_slot:
                if requested_slot['status'] == 'full':
                    # Provide detailed explanation and smart alternatives
                    ps5_full = requested_slot.get('total_ps5_players', 0) >= 9
                    driving_full = requested_slot.get('driving_sim_booked', False)
                    
                    explanation = f"❌ **{time} is fully booked**\n\n"
                    if ps5_full and driving_full:
                        explanation += "• All 3 PS5 stations are occupied\n• Driving simulator is also booked\n\n"
                    elif ps5_full:
                        explanation += "• All 3 PS5 stations are occupied (9+ players)\n• Driving simulator is still available\n\n"
                    elif driving_full:
                        explanation += "• Driving simulator is booked\n• PS5 stations may still have space\n\n"
                    
                    # Suggest nearby times with reasoning
                    nearby = suggest_nearby_slots_smart(slots, time)
                    response['reply'] = explanation + "✨ **Better alternatives:**\n" + nearby
                    response['action'] = 'slot_conflict_with_alternatives'
                elif requested_slot['status'] == 'partial':
                    # Explain partial booking
                    ps5_count = requested_slot.get('total_ps5_players', 0)
                    available_space = 9 - ps5_count  # 3 stations × 3 players - occupied
                    
                    response['reply'] = f"✅ **{time} is AVAILABLE!**\n\n" \
                                      f"📊 **Current Status:**\n" \
                                      f"• {ps5_count} players already booked\n" \
                                      f"• {available_space} player spots remaining\n" \
                                      f"• Less crowded than peak hours\n\n" \
                                      f"💡 **Good choice!** More space means better gaming experience!"
                    response['data']['availability_status'] = 'partial_available'
                else:
                    # Completely available
                    response['reply'] = f"✅ **{time} is COMPLETELY AVAILABLE!**\n\n" \
                                      f"🎉 **Perfect timing!** You'll have:\n" \
                                      f"• All stations at your disposal\n" \
                                      f"• No wait times\n" \
                                      f"• Best possible experience\n\n" \
                                      f"💡 **Pro tip:** This is an ideal slot!"
                    response['data']['availability_status'] = 'fully_available'
            else:
                response['reply'] = f"⚠️ I couldn't find information for {time}.\n\n" \
                                  f"Here are the available slots for {date}:\n" + \
                                  format_available_slots(available_slots)
        else:
            # Show all available slots with insights
            total_slots = len(slots)
            available_count = len(available_slots)
            booking_rate = ((total_slots - available_count) / total_slots * 100) if total_slots > 0 else 0
            
            crowdedness = "🟢 Light" if booking_rate < 30 else "🟡 Moderate" if booking_rate < 70 else "🔴 Heavy"
            
            response['reply'] = f"📅 **Availability for {date}**\n\n" \
                              f"📊 **Booking Status:** {crowdedness} ({available_count}/{total_slots} slots available)\n\n" + \
                              format_available_slots_enhanced(available_slots, fully_booked)
        
        response['data'] = {'slots': available_slots}
        response['action'] = 'show_availability'
        
        return response
        
    except Exception as e:
        print(f"Error checking availability: {str(e)}")
        response['reply'] = "I had trouble checking availability. Please try again."
        return response


def check_availability_for_booking(response):
    """Check availability for booking with full details and smart suggestions"""
    try:
        context = response['context']
        date = context['date']
        time = context['time']
        duration = context['duration']
        device = context['device']
        
        # Get detailed slot info
        slot_details = get_slot_details_info(date, time, duration)
        
        if not slot_details:
            response['reply'] = "❌ I couldn't verify availability. Please try again."
            return response
        
        # Check device availability
        if device == 'ps5':
            available_ps5 = slot_details.get('available_ps5_units', [])
            if not available_ps5:
                # Get all slots to suggest alternatives
                slots_data = get_slot_availability(date)
                if slots_data and 'slots' in slots_data:
                    slots = slots_data['slots']
                    available_slots = [s for s in slots if s['status'] != 'full']
                    if available_slots:
                        alternatives = suggest_nearby_slots_smart(slots, time)
                        response['reply'] = (
                            f"😔 **All 3 PS5 stations are fully booked at {time}**\n\n"
                            f"📊 **Status:** All 9+ player slots occupied\n\n"
                            f"✨ **Better alternatives for {date}:**\n{alternatives}\n"
                            f"💡 Or would you like to:\n"
                            f"• Check a different date?\n"
                            f"• Try our driving simulator instead?"
                        )
                    else:
                        response['reply'] = (
                            f"😔 **All PS5 stations are fully booked for {date}**\n\n"
                            f"🔄 **Try these options:**\n"
                            f"• Tomorrow (usually less crowded)\n"
                            f"• A weekday afternoon\n"
                            f"• Morning slots (9 AM - 12 PM)\n\n"
                            f"Would you like me to check another date?"
                        )
                else:
                    response['reply'] = (
                        f"😔 All PS5 stations are booked for {time}.\n\n"
                        f"Would you like to try a different time or date?"
                    )
                
                response['action'] = 'no_ps5_available'
                return response
            
            # Calculate price
            players = context.get('players', 1)
            price_data = calculate_slot_price(
                ps5_bookings=[{'device_number': available_ps5[0], 'player_count': players}],
                driving_sim=False,
                duration_minutes=duration
            )
            total_price = price_data['total_price']
            
            # Update context
            context['selected_ps5'] = available_ps5[0]
            context['price'] = total_price
            
            # Check current occupancy for additional context
            current_players = slot_details.get('total_ps5_players', 0)
            occupancy_note = ""
            if current_players == 0:
                occupancy_note = "\n\n🎉 **Bonus:** You'll have the place to yourself!"
            elif current_players < 4:
                occupancy_note = f"\n\n💚 **Great choice:** Only {current_players} other players - very quiet!"
            
            # Format confirmation
            response['reply'] = ai_assistant.format_booking_summary(context, total_price) + occupancy_note
            response['action'] = 'confirm_booking'
            response['next_step'] = 'awaiting_final_confirmation'
            response['context'] = context
            
        elif device == 'driving_sim':
            if not slot_details.get('available_driving', False):
                # Get alternatives
                slots_data = get_slot_availability(date)
                if slots_data and 'slots' in slots_data:
                    slots = slots_data['slots']
                    available_slots = [s for s in slots if s['status'] != 'full']
                    if available_slots:
                        alternatives = suggest_nearby_slots_smart(slots, time)
                        response['reply'] = (
                            f"😔 **Driving simulator is booked at {time}**\n\n"
                            f"✨ **Available alternatives:**\n{alternatives}\n"
                            f"Or would you like to check a different date?"
                        )
                    else:
                        response['reply'] = (
                            f"😔 The driving simulator is fully booked for {date}.\n\n"
                            f"💡 **Try:**\n"
                            f"• Tomorrow\n"
                            f"• Weekday afternoons\n"
                            f"• Morning time slots\n\n"
                            f"Would you like me to check another date?"
                        )
                else:
                    response['reply'] = (
                        f"😔 The driving simulator is booked for {time}.\n\n"
                        f"Would you like to try a different time?"
                    )
                
                response['action'] = 'no_driving_available'
                return response
            
            # Calculate price
            price_data = calculate_slot_price(
                ps5_bookings=[],
                driving_sim=True,
                duration_minutes=duration
            )
            total_price = price_data['total_price']
            
            context['price'] = total_price
            
            # Format confirmation
            response['reply'] = ai_assistant.format_booking_summary(context, total_price) + \
                              "\n\n🏎️ **Get ready for an amazing racing experience!**"
            response['action'] = 'confirm_booking'
            response['next_step'] = 'awaiting_final_confirmation'
            response['context'] = context
        
        return response
        
    except Exception as e:
        print(f"Error checking availability for booking: {str(e)}")
        print(traceback.format_exc())
        response['reply'] = "❌ I had trouble checking availability. Please try again."
        return response


def handle_booking_creation(response):
    """Create the actual booking"""
    try:
        # Extract booking data from response - check multiple locations
        context = response.get('booking_data', {})  # First check booking_data
        if not context:
            # Check context.booking_state (Fast AI format)
            context = response.get('context', {}).get('booking_state', {})
        if not context:
            # Fallback to direct context
            context = response.get('context', {})
        
        print("=" * 60)
        print("🤖 AI BOOKING CREATION ATTEMPT")
        print("=" * 60)
        print(f"🔍 Extracted context: {context}")
        
        # Prepare booking data - handle both Fast AI format (name, phone) and standard format (customer_name, customer_phone)
        booking_data = {
            'customer_name': context.get('customer_name', context.get('name', '')),
            'customer_phone': context.get('customer_phone', context.get('phone', '')),
            'booking_date': context.get('booking_date', context.get('date', '')),
            'start_time': context.get('start_time', context.get('time', '')),
            'duration_minutes': context.get('duration_minutes', context.get('duration', 0)),
            'total_price': context.get('total_price', context.get('price', 0)),
            'booking_source': 'ai_chat'  # Track that this came from AI
        }
        
        print(f"📝 Customer: {booking_data['customer_name']}")
        print(f"📞 Phone: {booking_data['customer_phone']}")
        print(f"📅 Date: {booking_data['booking_date']}")
        print(f"⏰ Time: {booking_data['start_time']}")
        print(f"⏱️  Duration: {booking_data['duration_minutes']} minutes")
        print(f"💰 Price: ₹{booking_data['total_price']}")
        
        device_type = context.get('device_type', context.get('device', context.get('game', 'ps5')))
        print(f"🎮 Device: {device_type}")
        
        if device_type in ['ps5', 'PS5']:
            selected_ps5 = context.get('selected_ps5', context.get('device_number', 1))
            player_count = context.get('players', context.get('num_players', context.get('player_count', 1)))
            
            booking_data['ps5_bookings'] = [{
                'device_number': int(selected_ps5),
                'player_count': int(player_count)
            }]
            booking_data['driving_sim'] = False
            booking_data['driving_after_ps5'] = False
            print(f"🎮 PS5 Station: {selected_ps5}")
            print(f"👥 Players: {player_count}")
        else:
            booking_data['ps5_bookings'] = []
            booking_data['driving_sim'] = True
            booking_data['driving_after_ps5'] = False
            print(f"🏎️  Driving Simulator selected")
        
        print("-" * 60)
        print("📡 Calling booking API...")
        
        # Create booking
        result = create_booking_internal(booking_data)
        
        print(f"📥 API Response: {result}")
        print("=" * 60)
        
        if result and 'booking_id' in result:
            device_name = "PS5" if device_type in ['ps5', 'PS5'] else "Driving Simulator"
            booking_id = result['booking_id']
            
            print(f"✅ BOOKING CREATED SUCCESSFULLY! ID: {booking_id}")
            
            response['reply'] = (
                f"🎉 **Booking Confirmed!**\n\n"
                f"🎫 Booking ID: #{booking_id}\n"
                f"🎮 Device: {device_name}\n"
                f"📅 Date: {booking_data['booking_date']}\n"
                f"⏰ Time: {booking_data['start_time']}\n"
                f"⏱️  Duration: {booking_data['duration_minutes']} minutes\n"
                f"💰 Total: ₹{booking_data['total_price']:.0f}\n\n"
                f"✨ Your slot is now RESERVED!\n"
                f"📲 Confirmation sent to {booking_data['customer_phone']}\n\n"
                f"See you at GameSpot! 🎮\n\n"
                f"Need anything else?"
            )
            response['action'] = 'booking_success'
            response['data'] = {'booking_id': result['booking_id']}
            
            # Clear context for new conversation
            response['context'] = {}
        else:
            response['reply'] = (
                "❌ I couldn't complete the booking. This might be because:\n\n"
                "• The slot was just booked by someone else\n"
                "• There was a system error\n\n"
                "Would you like to:\n"
                "1. Try again\n"
                "2. Use the manual booking page"
            )
            response['action'] = 'booking_failed'
        
        return response
        
    except Exception as e:
        print(f"Error creating booking: {str(e)}")
        print(traceback.format_exc())
        response['reply'] = (
            "❌ I encountered an error while creating your booking.\n\n"
            "Please try using the manual booking page to complete your reservation."
        )
        response['action'] = 'booking_error'
        return response


def format_available_slots(slots):
    """Format available slots for display"""
    if not slots:
        return "No slots available"
    
    morning = [s for s in slots if int(s['time'].split(':')[0]) < 12]
    afternoon = [s for s in slots if 12 <= int(s['time'].split(':')[0]) < 17]
    evening = [s for s in slots if int(s['time'].split(':')[0]) >= 17]
    
    output = ""
    
    if morning:
        output += "🌅 **Morning:**\n"
        output += ", ".join([f"{s['time']}" for s in morning]) + "\n\n"
    
    if afternoon:
        output += "☀️ **Afternoon:**\n"
        output += ", ".join([f"{s['time']}" for s in afternoon]) + "\n\n"
    
    if evening:
        output += "🌙 **Evening:**\n"
        output += ", ".join([f"{s['time']}" for s in evening]) + "\n\n"
    
    return output


def format_available_slots_enhanced(available_slots, fully_booked):
    """Format slots with enhanced details showing crowdedness"""
    if not available_slots:
        return "No slots available"
    
    morning = [s for s in available_slots if int(s['time'].split(':')[0]) < 12]
    afternoon = [s for s in available_slots if 12 <= int(s['time'].split(':')[0]) < 17]
    evening = [s for s in available_slots if int(s['time'].split(':')[0]) >= 17]
    
    output = ""
    
    def format_slot_with_status(slot):
        """Format individual slot with crowdedness indicator"""
        players = slot.get('total_ps5_players', 0)
        if players == 0:
            return f"• {slot['time']} - 🟢 Empty (best choice!)"
        elif players < 4:
            return f"• {slot['time']} - 🟢 Very quiet ({players} players)"
        elif players < 7:
            return f"• {slot['time']} - 🟡 Moderate ({players} players)"
        else:
            return f"• {slot['time']} - 🟠 Busy ({players} players)"
    
    if morning:
        output += "🌅 **Morning Slots:**\n"
        output += "\n".join([format_slot_with_status(s) for s in morning]) + "\n\n"
    
    if afternoon:
        output += "☀️ **Afternoon Slots:**\n"
        output += "\n".join([format_slot_with_status(s) for s in afternoon]) + "\n\n"
    
    if evening:
        output += "🌙 **Evening Slots:**\n"
        output += "\n".join([format_slot_with_status(s) for s in evening]) + "\n\n"
    
    if fully_booked:
        output += f"❌ **Fully Booked:** {len(fully_booked)} slots unavailable\n"
    
    output += "\n💡 **Tip:** Green slots offer the best experience!"
    
    return output


def suggest_nearby_slots(slots, requested_time):
    """Suggest slots near the requested time"""
    available = [s for s in slots if s['status'] != 'full']
    
    if not available:
        return "No alternative times available"


def suggest_nearby_slots_smart(slots, requested_time):
    """Suggest alternative slots with intelligent reasoning"""
    available = [s for s in slots if s['status'] != 'full']
    
    if not available:
        return "⚠️ No alternative times available for this date.\n" \
               "💡 **Suggestion:** Try tomorrow or a weekday."
    
    # Convert requested time to hour
    req_hour = int(requested_time.split(':')[0])
    
    # Find slots within 2 hours
    nearby = []
    for slot in available:
        slot_hour = int(slot['time'].split(':')[0])
        time_diff = abs(slot_hour - req_hour)
        if time_diff <= 2:
            players = slot.get('total_ps5_players', 0)
            nearby.append({
                'slot': slot,
                'diff': time_diff,
                'players': players,
                'score': time_diff * 10 + players  # Lower is better
            })
    
    # Sort by score (closest time + least crowded)
    nearby.sort(key=lambda x: x['score'])
    
    if not nearby:
        # No nearby slots, suggest any available
        best_available = sorted(available, key=lambda x: x.get('total_ps5_players', 0))[:3]
        output = ""
        for slot in best_available:
            players = slot.get('total_ps5_players', 0)
            reason = "Empty - perfect!" if players == 0 else f"Only {players} players" if players < 5 else f"{players} players"
            output += f"• **{slot['time']}** - {reason}\n"
        return output
    
    # Format nearby suggestions with reasoning
    output = ""
    for i, item in enumerate(nearby[:3], 1):
        slot = item['slot']
        players = item['players']
        diff = item['diff']
        
        # Add reasoning
        if diff == 0:
            reason = "Same time, different availability"
        elif diff == 1:
            reason = "Just 1 hour away"
        else:
            reason = f"{diff} hours away"
        
        # Add crowdedness info
        if players == 0:
            crowd_info = "🟢 Empty (best choice!)"
        elif players < 4:
            crowd_info = f"🟢 Very quiet ({players} players)"
        elif players < 7:
            crowd_info = f"🟡 Moderate ({players} players)"
        else:
            crowd_info = f"🟠 Busy ({players} players)"
        
        output += f"{i}. **{slot['time']}** - {reason}\n   {crowd_info}\n\n"
    
    return output
    # Convert time to minutes for comparison
    req_hour, req_min = map(int, requested_time.split(':'))
    req_minutes = req_hour * 60 + req_min
    
    # Calculate distance from requested time
    for slot in available:
        hour, minute = map(int, slot['time'].split(':'))
        slot['distance'] = abs((hour * 60 + minute) - req_minutes)
    
    # Sort by distance
    available.sort(key=lambda s: s['distance'])
    
    # Take top 3
    nearby = available[:3]
    
    output = ""
    for slot in nearby:
        status_emoji = "✅" if slot['status'] == 'available' else "⚠️"
        output += f"{status_emoji} {slot['time']}"
        if slot['total_ps5_players'] > 0:
            output += f" ({slot['total_ps5_players']} players already booked)"
        output += "\n"
    
    return output


@ai_bp.route('/clear-session', methods=['POST'])
def clear_session():
    """Clear conversation session"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if session_id and session_id in conversation_sessions:
            del conversation_sessions[session_id]
        
        return jsonify({'message': 'Session cleared'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
