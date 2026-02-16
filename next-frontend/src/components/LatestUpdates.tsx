'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiTrendingUp, FiZap, FiCalendar, FiTag, FiAlertCircle, FiBell, FiChevronRight } from 'react-icons/fi';
import { apiFetch } from '@/services/apiClient';

interface Update {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  created_at: string;
}

const LatestUpdates = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUpdates(); }, []);

  const fetchUpdates = async () => {
    try {
      const data = await apiFetch('/api/updates/latest?limit=6');
      if (data.success) setUpdates(data.updates);
    } catch {} finally { setLoading(false); }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'new_game': return <FiZap className="category-icon" />;
      case 'event': return <FiCalendar className="category-icon" />;
      case 'offer': return <FiTag className="category-icon" />;
      case 'update': return <FiTrendingUp className="category-icon" />;
      case 'maintenance': return <FiAlertCircle className="category-icon" />;
      default: return <FiBell className="category-icon" />;
    }
  };

  const getCategoryLabel = (category: string) => category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'new_game': return '#8b5cf6';
      case 'event': return '#f59e0b';
      case 'offer': return '#10b981';
      case 'update': return '#3b82f6';
      case 'maintenance': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') return <span className="priority-badge urgent">🔥 Urgent</span>;
    if (priority === 'high') return <span className="priority-badge high">⚡ Hot</span>;
    return null;
  };

  const formatDateRelative = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) return <div className="latest-updates-section"><div className="updates-container"><div className="loading-spinner">Loading updates...</div></div></div>;
  if (updates.length === 0) return null;

  return (
    <div className="latest-updates-section">
      <div className="updates-container">
        <div className="updates-header">
          <div className="header-content">
            <div className="header-icon"><FiTrendingUp /></div>
            <div className="header-text">
              <h2 className="section-title">What&apos;s New</h2>
              <p className="section-subtitle">Latest games, events, and updates from GameSpot</p>
            </div>
          </div>
          <div className="header-badge"><span className="update-count">{updates.length} New</span></div>
        </div>

        <div className="updates-grid">
          {updates.map((update) => (
            <div key={update.id} className="update-card" style={{ '--category-color': getCategoryColor(update.category) } as React.CSSProperties}>
              {getPriorityBadge(update.priority)}
              <div className="category-badge">{getCategoryIcon(update.category)}<span>{getCategoryLabel(update.category)}</span></div>
              <div className="card-content"><h3 className="update-title">{update.title}</h3><p className="update-description">{update.description}</p></div>
              <div className="card-footer">
                <span className="update-date"><FiCalendar />{formatDateRelative(update.created_at)}</span>
                <button className="learn-more-btn">Learn More<FiChevronRight /></button>
              </div>
              <div className="card-decoration"></div>
            </div>
          ))}
        </div>

        <div className="view-all-section">
          <Link href="/updates" className="view-all-btn"><span>View All Updates</span><FiChevronRight /></Link>
        </div>
      </div>
    </div>
  );
};

export default LatestUpdates;
