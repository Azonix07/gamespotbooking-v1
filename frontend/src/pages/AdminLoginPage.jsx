import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';
import Navbar from '../components/Navbar';
import '../styles/AdminLoginPage.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      await adminLogin(username, password);
      navigate('/admin/dashboard');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      <Navbar showCenter={false} />
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '4rem auto' }}>
          <h2 className="card-title" style={{ textAlign: 'center' }}>Admin Login</h2>
          
          {error && <div className="error">❌ {error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Logging in...' : '🔐 Login'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Back
              </button>
            </div>
          </form>
          
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'rgba(99, 102, 241, 0.1)', 
            borderRadius: '0.5rem',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--light-gray)', textAlign: 'center' }}>
              <strong>Default Credentials:</strong><br />
              Username: admin | Password: admin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
