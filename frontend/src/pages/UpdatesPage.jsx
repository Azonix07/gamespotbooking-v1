import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiZap, 
  FiCalendar, 
  FiTag, 
  FiAlertCircle,
  FiBell,
  FiChevronRight,
  FiFilter
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiClient';
import '../styles/UpdatesPage.css';

const UpdatesPage = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchUpdates();
    fetchCategories();
  }, [selectedCategory]);

  const fetchUpdates = async () => {
    try {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const data = await apiFetch(`/api/updates/latest?limit=50${categoryParam}`);
      
      if (data.success) {
        setUpdates(data.updates);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching updates:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiFetch('/api/updates/categories');
      
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="updates-page">
      <Navbar />
      
      <div className="updates-page-container">
        {/* Hero Section */}
        <div className="updates-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <FiTrendingUp />
            </div>
            <h1 className="hero-title">What's New at GameSpot</h1>
            <p className="hero-subtitle">
              Stay updated with the latest games, events, offers, and announcements
            </p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-header">
            <FiFilter />
            <span>Filter by Category</span>
          </div>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Updates
              {categories.length > 0 && (
                <span className="count-badge">
                  {categories.reduce((sum, cat) => sum + cat.count, 0)}
                </span>
              )}
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.category}
                className={`filter-btn ${selectedCategory === cat.category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.category)}
                style={{
                  '--category-color': getCategoryColor(cat.category)
                }}
              >
                {getCategoryIcon(cat.category)}
                {getCategoryLabel(cat.category)}
                <span className="count-badge">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Updates Grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading updates...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="no-updates">
            <FiBell className="no-updates-icon" />
            <h3>No Updates Found</h3>
            <p>Check back soon for the latest news and announcements!</p>
          </div>
        ) : (
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
        )}
      </div>

      <Footer />
    </div>
  );
};

export default UpdatesPage;
