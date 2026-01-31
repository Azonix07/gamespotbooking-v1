/**
 * Malayalam UI Translations
 * Complete interface translations for Malayalam language
 */

export const malayalamUI = {
  // Header
  title: "AI സഹായി",
  close: "അടയ്ക്കുക",
  
  // Language Toggle
  languageToggle: {
    english: "EN",
    malayalam: "ML"
  },
  
  // Quick Actions / Recommendations
  recommendations: {
    title: "ദ്രുത പ്രവർത്തനങ്ങൾ",
    items: [
      { text: '📅 ഇന്നത്തെ ലഭ്യത പരിശോധിക്കുക', message: 'ഇന്നത്തെ ലഭ്യത പരിശോധിക്കുക' },
      { text: '🎮 PS5-ന് ഏറ്റവും നല്ല സമയം', message: 'PS5-ന് ഏറ്റവും നല്ല സമയം എന്താണ്?' },
      { text: '👥 4 കളിക്കാർക്ക് ബുക്ക് ചെയ്യുക', message: '4 കളിക്കാർക്ക് ബുക്ക് ചെയ്യുക' },
      { text: '💰 ഏറ്റവും വിലകുറഞ്ഞ സ്ലോട്ട്', message: 'ഏറ്റവും വിലകുറഞ്ഞ സ്ലോട്ട് ഏതാണ്?' },
      { text: '🌆 വൈകുന്നേരം ലഭ്യമാണോ?', message: 'വൈകുന്നേരം ലഭ്യമാണോ?' },
    ]
  },
  
  // Input Placeholder
  inputPlaceholder: "നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക...",
  
  // Buttons
  buttons: {
    send: "അയയ്ക്കുക",
    voice: "ശബ്ദം",
    stopVoice: "നിർത്തുക",
    clearSession: "പുതിയ സംഭാഷണം ആരംഭിക്കുക"
  },
  
  // Voice States
  voice: {
    listening: "കേൾക്കുന്നു...",
    speaking: "സംസാരിക്കുന്നു...",
    notSupported: "നിങ്ങളുടെ ബ്രൗസർ വോയ്സ് തിരിച്ചറിയൽ പിന്തുണയ്ക്കുന്നില്ല",
    clickToSpeak: "സംസാരിക്കാൻ ക്ലിക്ക് ചെയ്യുക"
  },
  
  // Loading States
  loading: {
    thinking: "ചിന്തിക്കുന്നു...",
    processing: "പ്രോസസ്സ് ചെയ്യുന്നു...",
    typing: "ടൈപ്പ് ചെയ്യുന്നു..."
  },
  
  // Error Messages
  errors: {
    sendFailed: "സന്ദേശം അയയ്ക്കാൻ കഴിഞ്ഞില്ല",
    networkError: "നെറ്റ്‌വർക്ക് പിശക്",
    tryAgain: "വീണ്ടും ശ്രമിക്കുക"
  },
  
  // Session
  session: {
    newConversation: "പുതിയ സംഭാഷണം ആരംഭിച്ചു",
    cleared: "സെഷൻ ക്ലിയർ ചെയ്തു"
  },
  
  // Booking Flow (for reference)
  booking: {
    greeting: "ഹായ് 👋 ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",
    selectGame: "നിങ്ങൾ എന്താണ് കളിക്കാൻ ആഗ്രഹിക്കുന്നത്?",
    ps5: "പി എസ് 5",
    drivingSimulator: "ഡ്രൈവിംഗ് സിമുലേറ്റർ",
    playerCount: "എത്ര കളിക്കാർ?",
    duration: "എത്ര നേരം കളിക്കണം?",
    date: "ഏത് തീയതി?",
    time: "എന്ത് സമയം?",
    confirm: "സ്ഥിരീകരിക്കുക",
    bookingConfirmed: "നിങ്ങളുടെ ബുക്കിംഗ് സ്ഥിരീകരിച്ചു!"
  }
};

export const englishUI = {
  // Header
  title: "AI Assistant",
  close: "Close",
  
  // Language Toggle
  languageToggle: {
    english: "EN",
    malayalam: "ML"
  },
  
  // Quick Actions / Recommendations
  recommendations: {
    title: "Quick Actions",
    items: [
      { text: '📅 Check availability today', message: 'check availability today' },
      { text: '🎮 Best time for PS5', message: 'what is the best time for PS5?' },
      { text: '👥 Book for 4 players', message: 'book for 4 players' },
      { text: '💰 Cheapest available slot', message: 'what is the cheapest available slot?' },
      { text: '🌆 Is evening available?', message: 'is evening available?' },
    ]
  },
  
  // Input Placeholder
  inputPlaceholder: "Type your message...",
  
  // Buttons
  buttons: {
    send: "Send",
    voice: "Voice",
    stopVoice: "Stop",
    clearSession: "Start New Conversation"
  },
  
  // Voice States
  voice: {
    listening: "Listening...",
    speaking: "Speaking...",
    notSupported: "Voice recognition not supported in your browser",
    clickToSpeak: "Click to speak"
  },
  
  // Loading States
  loading: {
    thinking: "Thinking...",
    processing: "Processing...",
    typing: "Typing..."
  },
  
  // Error Messages
  errors: {
    sendFailed: "Failed to send message",
    networkError: "Network error",
    tryAgain: "Try again"
  },
  
  // Session
  session: {
    newConversation: "New conversation started",
    cleared: "Session cleared"
  },
  
  // Booking Flow
  booking: {
    greeting: "Hi 👋 How can I help you?",
    selectGame: "What would you like to play?",
    ps5: "PS5",
    drivingSimulator: "Driving Simulator",
    playerCount: "How many players?",
    duration: "How long do you want to play?",
    date: "What date?",
    time: "What time?",
    confirm: "Confirm",
    bookingConfirmed: "Your booking is confirmed!"
  }
};
