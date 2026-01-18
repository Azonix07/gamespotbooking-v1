import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/AdminLoginPage.css';  // Reuse existing styles

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    // Basic phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { text: '', color: '' };
    if (password.length < 6) return { text: 'Too Short', color: '#ef4444' };
    if (password.length < 8) return { text: 'Weak', color: '#f59e0b' };
    if (password.length < 12) return { text: 'Medium', color: '#eab308' };
    return { text: 'Strong', color: '#22c55e' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Auto-logged in after signup
        navigate('/', { state: { message: 'Account created successfully!' } });
      } else {
        setError(data.error || 'Signup failed');
      }
      
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      <Navbar showCenter={false} />
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '4rem auto' }}>
          <h2 className="card-title" style={{ textAlign: 'center' }}>
            ✨ Create Account
          </h2>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#ef4444'
            }}>
              ❌ {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                autoComplete="name"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="10-digit phone number"
                autoComplete="tel"
                maxLength="10"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--light-gray)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    fontSize: '1.2rem'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.password && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    flex: 1, 
                    height: '4px', 
                    background: 'var(--medium-gray)', 
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(formData.password.length / 12) * 100}%`,
                      height: '100%',
                      background: passwordStrength.color,
                      transition: 'all 0.3s'
                    }} />
                  </div>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: passwordStrength.color,
                    fontWeight: 'bold'
                  }}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-control"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--light-gray)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    fontSize: '1.2rem'
                  }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.confirmPassword && (
                <small style={{ 
                  color: formData.password === formData.confirmPassword ? '#22c55e' : '#ef4444',
                  fontSize: '0.85rem',
                  marginTop: '0.25rem',
                  display: 'block'
                }}>
                  {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </small>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? '🔄 Creating account...' : '✨ Create Account'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'rgba(99, 102, 241, 0.05)', 
            borderRadius: '0.5rem',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: 'var(--light-gray)' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: 'var(--primary)', 
                  textDecoration: 'none', 
                  fontWeight: 'bold' 
                }}
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
