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
    const dayOfWeek = d.getDay();
    return {
      date: d,
      dateStr: formatDate(d),
      day: d.getDate(),
      weekday: i === 0 ? 'Today' : WEEKDAYS[dayOfWeek],
      month: MONTHS[d.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    };
  });

  // Auto-scroll to selected date on mount and when selection changes
  useEffect(() => {
    if (scrollRef.current) {
      const idx = days.findIndex((d) => d.dateStr === selectedDate);
      if (idx >= 0) {
        const cardWidth = 68; // card width (60) + gap (8)
        const containerWidth = scrollRef.current.offsetWidth;
        const scrollTo = idx * cardWidth - (containerWidth / 2 - 30);
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
              className={`mobile-date-card ${isSelected ? 'selected' : ''} ${d.isToday ? 'is-today' : ''} ${d.isWeekend && !isSelected ? 'is-weekend' : ''}`}
              onClick={() => onChange(d.dateStr)}
              type="button"
              aria-label={`${d.weekday} ${d.day} ${d.month}`}
            >
              {/* Today badge */}
              {d.isToday && isSelected && (
                <span className="mobile-date-today-badge">TODAY</span>
              )}
              {/* Glow ring for selected */}
              {isSelected && <span className="mobile-date-glow" />}
              <span className="mobile-date-weekday">{d.weekday}</span>
              <span className="mobile-date-day">{d.day}</span>
              <span className="mobile-date-month">{d.month}</span>
            </button>
          );
        })}
      </div>
      {/* Fade edges for scroll hint */}
      <div className="mobile-date-fade-left" />
      <div className="mobile-date-fade-right" />
    </div>
  );
};

export default MobileDateCarousel;
