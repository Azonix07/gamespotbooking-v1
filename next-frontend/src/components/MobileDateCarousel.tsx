'use client';

import React, { useRef, useEffect } from 'react';
import { formatDate } from '@/utils/helpers';
import '@/styles/MobileDateCarousel.css';

interface MobileDateCarouselProps {
  selectedDate: string;
  onChange: (dateStr: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MobileDateCarousel = ({ selectedDate, onChange }: MobileDateCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 14 days starting from today
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dateStr: formatDate(d),
      day: d.getDate(),
      weekday: i === 0 ? 'Today' : WEEKDAYS[d.getDay()],
      month: MONTHS[d.getMonth()],
      isToday: i === 0,
    };
  });

  // Auto-scroll to selected date
  useEffect(() => {
    if (scrollRef.current) {
      const idx = days.findIndex((d) => d.dateStr === selectedDate);
      if (idx > 0) {
        const cardWidth = 64; // card width + gap
        const scrollTo = idx * cardWidth - (scrollRef.current.offsetWidth / 2 - cardWidth / 2);
        scrollRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: 'smooth' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="mobile-date-carousel">
      <div className="mobile-date-carousel-scroll" ref={scrollRef}>
        {days.map((d) => {
          const isSelected = selectedDate === d.dateStr;
          return (
            <button
              key={d.dateStr}
              className={`mobile-date-card ${isSelected ? 'selected' : ''} ${d.isToday ? 'is-today' : ''}`}
              onClick={() => onChange(d.dateStr)}
              type="button"
            >
              <span className="mobile-date-weekday">{d.weekday}</span>
              <span className="mobile-date-day">{d.day}</span>
              <span className="mobile-date-month">{d.month}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileDateCarousel;
