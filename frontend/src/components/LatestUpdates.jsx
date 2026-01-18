import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiZap, 
  FiCalendar, 
  FiTag, 
  FiAlertCircle,
  FiBell,
  FiChevronRight
} from 'react-icons/fi';
import '../styles/LatestUpdates.css';

const LatestUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/updates/latest?limit=6');
      const data = await response.json();
      
      if (data.success) {
        setUpdates(data.updates);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching updates:', error);
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'new_game':
        return <FiZap className="category-icon" />;
      case 'event':
        return <FiCalendar className="category-icon" />;
      case 'offer':
        return <FiTag className="category-icon" />;
      case 'update':
        return <FiTrendingUp className="category-icon" />;
      case 'maintenance':
        return <FiAlertCircle className="category-icon" />;
      default:
        return <FiBell className="category-icon" />;
    }
  };

  const getCategoryLabel = (category) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'new_game':
        return '#8b5cf6'; // Purple
      case 'event':
        return '#f59e0b'; // Amber
      case 'offer':
        return '#10b981'; // Green
      case 'update':
        return '#3b82f6'; // Blue
      case 'maintenance':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return <span className="priority-badge urgent">🔥 Urgent</span>;
    } else if (priority === 'high') {
      return <span className="priority-badge high">⚡ Hot</span>;
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="latest-updates-section">
        <div className="updates-container">
          <div className="loading-spinner">Loading updates...</div>
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return null;
  }

  return (
    <div className="latest-updates-section">
      <div className="updates-container">
        {/* Header */}
        <div className="updates-header">
          <div className="header-content">
            <div className="header-icon">
              <FiTrendingUp />
            </div>
            <div className="header-text">
              <h2 className="section-title">What's New</h2>
              <p className="section-subtitle">
                Latest games, events, and updates from GameSpot
              </p>
            </div>
          </div>
          <div className="header-badge">
            <span className="update-count">{updates.length} New</span>
          </div>
        </div>

        {/* Updates Grid */}
        <div className="updates-grid">
          {updates.map((update) => (
            <div 
              key={update.id} 
              className="update-card"
              style={{
                '--category-color': getCategoryColor(update.category)
              }}
            >
              {/* Priority Badge */}
              {getPriorityBadge(update.priority)}

              {/* Category Badge */}
              <div className="category-badge">
                {getCategoryIcon(update.category)}
                <span>{getCategoryLabel(update.category)}</span>
              </div>

              {/* Content */}
              <div className="card-content">
                <h3 className="update-title">{update.title}</h3>
                <p className="update-description">{update.description}</p>
              </div>

              {/* Footer */}
              <div className="card-footer">
                <span className="update-date">
                  <FiCalendar />
                  {formatDate(update.created_at)}
                </span>
                <button className="learn-more-btn">
                  Learn More
                  <FiChevronRight />
                </button>
              </div>

              {/* Decorative Element */}
              <div className="card-decoration"></div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="view-all-section">
          <button className="view-all-btn">
            <span>View All Updates</span>
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LatestUpdates;
