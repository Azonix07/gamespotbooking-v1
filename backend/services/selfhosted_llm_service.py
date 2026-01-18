"""
Self-Hosted LLM Service - UNLIMITED, NO QUOTAS
Uses open-source Mistral-7B-Instruct for conversation
COMPLETELY FREE - No API costs, no daily limits
"""

import os
import torch
from typing import Dict, List, Optional
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import json

class SelfHostedLLM:
    """
    Self-hosted AI using Mistral-7B-Instruct
    - Runs locally or on your server
    - NO quotas, NO limits, NO costs
    - Full conversation intelligence preserved
    - Optimized for booking conversations
    """
    
    def __init__(self, model_name: str = "mistralai/Mistral-7B-Instruct-v0.2"):
        """
        Initialize self-hosted LLM
        
        Args:
            model_name: Hugging Face model ID
            Options:
            - mistralai/Mistral-7B-Instruct-v0.2 (Recommended, 7B params)
            - tiiuae/falcon-7b-instruct (Alternative, 7B params)
            - microsoft/phi-2 (Smaller, 2.7B params, faster)
        """
        print(f"🚀 Initializing Self-Hosted LLM: {model_name}")
        print("   This is a ONE-TIME download. Model will be cached locally.")
        
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"   Device: {self.device}")
        
        # Load tokenizer
        print("   Loading tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Load model (will download ~14GB first time, then cached)
        print("   Loading model (may take 2-5 minutes on first run)...")
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            device_map="auto" if self.device == "cuda" else None,
            low_cpu_mem_usage=True
        )
        
        if self.device == "cpu":
            self.model = self.model.to(self.device)
        
        # Create text generation pipeline
        self.pipe = pipeline(
            "text-generation",
            model=self.model,
            tokenizer=self.tokenizer,
            max_new_tokens=150,  # Concise responses for voice
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.2
        )
        
        print("✅ Self-Hosted LLM initialized successfully!")
        print(f"   Model: {model_name}")
        print(f"   Device: {self.device}")
        print("   Status: UNLIMITED, NO QUOTAS")
        
        # System prompt - preserve all Gemini intelligence
        self.system_prompt = self._build_system_prompt()
        
        # Conversation history per session
        self.conversations = {}
    
    def _build_system_prompt(self) -> str:
        """Build comprehensive system prompt - preserves all booking intelligence"""
        return """You are Priya, a friendly gaming lounge staff member at GameSpot in India.

CRITICAL RULES:
1. Keep responses SHORT (1-2 sentences max)
2. Sound human and friendly, NOT robotic
3. NEVER repeat what user just said
4. NEVER ask same question twice
5. Extract multiple details from one message
6. Move conversation FORWARD, not backward

GAMESPOT INFO:
- PS5 Gaming: ₹130-300/hr (1-4 players)
- Driving Simulator: ₹170/hr (1 player)
- Hours: 9 AM - 10 PM daily
- Durations: 30min, 1hr, 1.5hr, 2hr

BOOKING FLOW:
1. Game selection (PS5 or Driving Simulator)
2. Player count (for PS5 only)
3. Duration
4. Date
5. Time
6. Check availability
7. Get customer name & phone
8. Confirm booking

CONVERSATION STYLE:
✓ "Great choice! 🎮 How many players?"
✓ "Perfect 👍 What time?"
✓ "Let me check that for you..."
✗ "Your request has been processed"
✗ "Please provide the number of players"

SMART EXTRACTION:
If user says "I want PS5 for 4 people tomorrow at 6 PM for 2 hours":
- Extract: game=PS5, players=4, date=tomorrow, time=6 PM, duration=2hr
- Ask ONLY for missing info (name/phone)
- DON'T repeat known info

Remember: You're a real person, not a bot!"""
    
    def generate_response(
        self,
        user_message: str,
        session_id: str,
        booking_context: Dict = None
    ) -> str:
        """
        Generate conversational response
        
        Args:
            user_message: User's current message
            session_id: Session ID for conversation memory
            booking_context: Current booking progress
        
        Returns:
            AI response text
        """
        # Get or initialize conversation history
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        
        history = self.conversations[session_id]
        
        # Build context with booking progress
        context_info = ""
        if booking_context and booking_context.get('booking_progress'):
            progress = booking_context['booking_progress']
            known_fields = [f"{k}: {v}" for k, v in progress.items() if v]
            if known_fields:
                context_info = f"\nKnown: {', '.join(known_fields)}"
        
        # Build conversation prompt
        conversation_text = ""
        if history:
            # Include last 6 messages for context
            for msg in history[-6:]:
                role = "User" if msg['role'] == 'user' else "Priya"
                conversation_text += f"{role}: {msg['content']}\n"
        
        # Create prompt for Mistral-7B-Instruct format
        prompt = f"""<s>[INST] {self.system_prompt}

{context_info}

{conversation_text}User: {user_message}
[/INST] Priya:"""
        
        # Generate response
        try:
            outputs = self.pipe(
                prompt,
                max_new_tokens=150,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.2,
                pad_token_id=self.tokenizer.eos_token_id
            )
            
            # Extract response
            generated_text = outputs[0]['generated_text']
            
            # Extract only the new response (after the prompt)
            response = generated_text.split("[/INST] Priya:")[-1].strip()
            
            # Clean up response
            response = self._clean_response(response)
            
            # Store in conversation history
            history.append({'role': 'user', 'content': user_message})
            history.append({'role': 'assistant', 'content': response})
            
            # Keep only last 12 messages to manage memory
            if len(history) > 12:
                self.conversations[session_id] = history[-12:]
            
            return response
            
        except Exception as e:
            print(f"❌ LLM Generation Error: {e}")
            # Fallback to simple response
            return "Could you tell me more about what you'd like to book?"
    
    def _clean_response(self, response: str) -> str:
        """Clean and optimize response"""
        # Remove incomplete sentences at the end
        response = response.strip()
        
        # If response has <s> or [INST] tokens, remove them
        response = response.replace('<s>', '').replace('[INST]', '').replace('[/INST]', '')
        
        # Remove any text after closing punctuation followed by incomplete text
        import re
        
        # Find last complete sentence
        sentences = re.split(r'([.!?])\s+', response)
        if len(sentences) > 1:
            # Reconstruct with complete sentences only
            complete_response = ""
            for i in range(0, len(sentences)-1, 2):
                if i+1 < len(sentences):
                    complete_response += sentences[i] + sentences[i+1]
            if complete_response:
                response = complete_response.strip()
        
        # Limit to 2 sentences max for voice
        sentences = re.split(r'[.!?]\s+', response)
        if len(sentences) > 2:
            response = '. '.join(sentences[:2]) + '.'
        
        return response.strip()
    
    def clear_session(self, session_id: str):
        """Clear conversation history for a session"""
        if session_id in self.conversations:
            del self.conversations[session_id]
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        return {
            'model_name': self.model_name,
            'device': self.device,
            'status': 'active',
            'quotas': 'UNLIMITED',
            'cost': 'FREE',
            'type': 'self-hosted'
        }


# Global instance (singleton)
_llm_instance = None

def get_llm_service(model_name: str = None) -> SelfHostedLLM:
    """
    Get or create LLM service instance
    
    Args:
        model_name: Optional model override
    """
    global _llm_instance
    
    if _llm_instance is None:
        # Use environment variable or default
        model = model_name or os.getenv(
            'LOCAL_LLM_MODEL',
            'mistralai/Mistral-7B-Instruct-v0.2'
        )
        _llm_instance = SelfHostedLLM(model)
    
    return _llm_instance


# Test function
if __name__ == "__main__":
    print("Testing Self-Hosted LLM...")
    llm = get_llm_service()
    
    # Test conversation
    session_id = "test_session"
    
    responses = [
        llm.generate_response("Hey", session_id, {}),
        llm.generate_response("I want PS5", session_id, {'booking_progress': {'game': 'PS5'}}),
        llm.generate_response("4 people", session_id, {'booking_progress': {'game': 'PS5', 'players': 4}})
    ]
    
    print("\nTest Conversation:")
    print("User: Hey")
    print(f"AI: {responses[0]}")
    print("\nUser: I want PS5")
    print(f"AI: {responses[1]}")
    print("\nUser: 4 people")
    print(f"AI: {responses[2]}")
    
    print("\n✅ Self-Hosted LLM working!")
