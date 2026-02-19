'use client';
// @ts-nocheck

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

import React, { useState } from 'react';
import {
  FiMessageSquare,
  FiAlertTriangle,
  FiHelpCircle,
  FiStar,
  FiAlertCircle,
  FiSend,
  FiUser,
  FiMail,
  FiCheck
} from 'react-icons/fi';
import { apiFetch } from '@/services/apiClient';
import '@/styles/FeedbackPage.css';

const FeedbackPage = () => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    type: 'suggestion',
    message: '',
    name: '',
    email: '',
    priority: 'medium',
    isAnonymous: false
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const feedbackTypes = [
    {
      id: 'suggestion',
      label: 'Suggestion',
      icon: FiStar,
      description: 'Share your ideas to improve our service',
      color: '#10b981'
    },
    {
      id: 'bug',
      label: 'Bug Report',
      icon: FiAlertTriangle,
      description: 'Report issues or problems you encountered',
      color: '#ef4444'
    },
    {
      id: 'query',
      label: 'Question',
      icon: FiHelpCircle,
      description: 'Ask questions about our services',
      color: '#3b82f6'
    },
    {
      id: 'feature',
      label: 'Feature Request',
      icon: FiMessageSquare,
      description: 'Request new features or functionality',
      color: '#8b5cf6'
    },
    {
      id: 'other',
      label: 'Other',
      icon: FiAlertCircle,
      description: 'Any other feedback or comments',
      color: '#f59e0b'
    }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear name and email if anonymous
    if (name === 'isAnonymous' && checked) {
      setFormData(prev => ({
        ...prev,
        name: '',
        email: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch('/api/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({
          type: formData.type,
          message: formData.message,
          name: formData.isAnonymous ? 'Anonymous' : (formData.name || 'Anonymous'),
          email: formData.isAnonymous ? '' : formData.email,
          priority: formData.priority
        })
      });

      if (data.success) {
        setSuccess(true);
        // Reset form after 2 seconds
        setTimeout(() => {
          setFormData({
            type: 'suggestion',
            message: '',
            name: '',
            email: '',
            priority: 'medium',
            isAnonymous: false
          });
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = feedbackTypes.find(t => t.id === formData.type);

  return (
    <div className="feedback-page">
<div className="feedback-container">
        <div className="feedback-header">
          <FiMessageSquare className="header-icon" />
          <h1 className="page-title">We'd Love to Hear From You!</h1>
          <p className="page-subtitle">
            Your feedback helps us improve. Share suggestions, report bugs, or ask questions.
          </p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon-wrapper">
              <FiCheck className="success-icon" />
            </div>
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted successfully. We'll review it soon.</p>
            <button 
              className="btn-primary" 
              onClick={() => router.push('/')}
            >
              Back to Home
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit}>
            {/* Feedback Type Selection */}
            <div className="form-section">
              <label className="section-label">What would you like to share?</label>
              <div className="feedback-types">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.id}
                      className={`feedback-type-card ${formData.type === type.id ? 'selected' : ''}`}
                      style={{
                        '--type-color': type.color
                      } as React.CSSProperties}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.id}
                        checked={formData.type === type.id}
                        onChange={handleChange}
                      />
                      <div className="type-icon">
                        <Icon />
                      </div>
                      <div className="type-info">
                        <span className="type-label">{type.label}</span>
                        <span className="type-description">{type.description}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="form-section">
              <label className="section-label">
                Your Message <span className="required">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={`Share your ${selectedType?.label.toLowerCase()} here... Be as detailed as possible.`}
                required
                rows={6}
                className="form-textarea"
              />
              <div className="char-count">
                {formData.message.length} characters
              </div>
            </div>

            {/* Priority */}
            <div className="form-section">
              <label className="section-label">Priority Level</label>
              <div className="priority-options">
                <label className={`priority-option ${formData.priority === 'low' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value="low"
                    checked={formData.priority === 'low'}
                    onChange={handleChange}
                  />
                  <span className="priority-label">Low</span>
                  <span className="priority-desc">Can wait</span>
                </label>
                <label className={`priority-option ${formData.priority === 'medium' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value="medium"
                    checked={formData.priority === 'medium'}
                    onChange={handleChange}
                  />
                  <span className="priority-label">Medium</span>
                  <span className="priority-desc">Normal</span>
                </label>
                <label className={`priority-option ${formData.priority === 'high' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={formData.priority === 'high'}
                    onChange={handleChange}
                  />
                  <span className="priority-label">High</span>
                  <span className="priority-desc">Urgent</span>
                </label>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="form-section">
              <label className="anonymous-toggle">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                />
                <span className="toggle-label">
                  Submit anonymously (no contact info required)
                </span>
              </label>
            </div>

            {/* Contact Information (if not anonymous) */}
            {!formData.isAnonymous && (
              <div className="form-section contact-section">
                <label className="section-label">
                  Contact Information (Optional)
                </label>
                <p className="section-note">
                  Provide your details if you'd like us to follow up with you.
                </p>
                <div className="contact-fields">
                  <div className="form-group">
                    <label>
                      <FiUser /> Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <FiMail /> Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <FiAlertCircle />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading || !formData.message.trim()}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        )}

        {/* Info Box */}
        <div className="info-box">
          <FiAlertCircle className="info-icon" />
          <div className="info-content">
            <h3>Your Privacy Matters</h3>
            <p>
              All feedback is reviewed by our team. If you choose to provide contact information,
              it will only be used to follow up on your feedback. Anonymous submissions are equally valued.
            </p>
          </div>
        </div>
      </div>
</div>
  );
};

export default FeedbackPage;
