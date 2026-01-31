import React, { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../utils/helpers';
import '../styles/ModernDatePicker.css';

const ModernDatePicker = ({ selectedDate, onChange, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  
  // Safe parsing of YYYY-MM-DD string to local Date to avoid timezone shifts
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Parse initial date or use today
  const initialDate = selectedDate ? parseDateString(selectedDate) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update calendar view when external date changes
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      // Only update month view if dramatically different (to avoid jumping while scrolling months)
      // But initially we want to sync
    }
  }, [selectedDate]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  // Calendar Logic
  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getDayOfWeek = (date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Mon=0, Sun=6
  };

  const generateDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = getDayOfWeek(currentMonth);
    
    // Previous month days (placeholders)
    for (let i = 0; i < firstDay; i++) {
        days.push({ day: '', type: 'empty' });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const dateString = formatDate(date);
      const isSelected = selectedDate === dateString;
      
      // Check if disabled (before minDate)
      let isDisabled = false;
      if (minDate) {
        // Compare date strings directly since format is YYYY-MM-DD
        isDisabled = dateString < minDate;
      }
      
      // Check if it is literally today
      const today = new Date();
      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth() && 
                      date.getFullYear() === today.getFullYear();

      days.push({
        day: i,
        date: dateString,
        type: 'day',
        isSelected,
        isDisabled,
        isToday
      });
    }

    return days;
  };

  const handleDateSelect = (dateString, isDisabled) => {
    if (isDisabled) return;
    onChange({ target: { value: dateString } });
    setIsOpen(false);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    // Optional: prevent going back too far if minDate exists
    if (minDate) {
        const min = new Date(minDate);
        // Allow going back to the month containing minDate
        const minMonthStart = new Date(min.getFullYear(), min.getMonth(), 1);
        if (prev < minMonthStart) return; 
    }
    
    setCurrentMonth(prev);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return 'Select Date';
    // Use parseDateString to ensure we display the correct local date
    const date = parseDateString(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
  };
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="modern-datepicker-container">
      <div 
        className={`datepicker-trigger ${isOpen ? 'is-open' : ''}`} 
        onClick={toggleDropdown}
        ref={triggerRef}
      >
        <div className="trigger-icon">
          <FiCalendar />
        </div>
        <div className="trigger-content">
          <span className="trigger-label">Select Date</span>
          <span className="trigger-value">{formatDateDisplay(selectedDate)}</span>
        </div>
        <FiChevronDown className="trigger-chevron" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="calendar-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            ref={dropdownRef}
          >
            <div className="calendar-header">
              <button className="month-nav-btn" onClick={prevMonth} type="button">
                <FiChevronLeft />
              </button>
              <span className="current-month">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button className="month-nav-btn" onClick={nextMonth} type="button">
                <FiChevronRight />
              </button>
            </div>
            
            <div className="calendar-grid">
              {weekdays.map((day) => (
                <div key={day} className="weekday-header">{day}</div>
              ))}
              
              {generateDays().map((item, index) => (
                <div 
                  key={`${item.type}-${index}`} 
                  className={`
                    ${item.type === 'day' ? 'calendar-day' : 'calendar-day other-month'} 
                    ${item.isSelected ? 'selected' : ''} 
                    ${item.isDisabled ? 'disabled' : ''}
                    ${item.isToday ? 'today' : ''}
                  `}
                  onClick={() => item.type === 'day' && handleDateSelect(item.date, item.isDisabled)}
                >
                  {item.day}
                </div>
              ))}
            </div>
            
            <div className="calendar-footer">
              <button 
                className="quick-date-btn"
                onClick={() => {
                  const today = new Date();
                  onChange({ target: { value: formatDate(today) } });
                  setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setIsOpen(false);
                }}
                type="button"
              >
                Select Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModernDatePicker;
