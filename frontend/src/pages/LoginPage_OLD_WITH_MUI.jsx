import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Container,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd,
  Email,
  Phone,
  Lock,
  Person
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiClient';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Modern Glassmorphic Theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1', // Indigo
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      main: '#10b981', // Emerald
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#0a0f1e',
      paper: 'rgba(30, 41, 59, 0.6)',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    error: {
      main: '#f87171',
    },
    success: {
      main: '#34d399',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: 'rgba(99, 102, 241, 0.2)',
              borderWidth: '2px',
            },
            '&:hover': {
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              '& fieldset': {
                borderColor: 'rgba(99, 102, 241, 0.4)',
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
              '& fieldset': {
                borderColor: '#6366f1',
              },
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          padding: '14px 28px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px rgba(99, 102, 241, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
          },
        },
      },
    },
  },
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState(0); // 0 = Login, 1 = Signup
  
  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if already logged in
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await apiFetch('/api/auth/check');
      
      if (data.authenticated) {
        // Redirect based on user type
        if (data.user_type === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // Redirect to intended page or home
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Unified login API call
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: identifier,  // Can be email or "admin"
          password: password
        })
      });
      
      if (data.success) {
        // Redirect based on user type
        if (data.user_type === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // Redirect to intended page or home
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      } else {
        setError(data.error || 'Login failed');
      }
      
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!signupName || !signupEmail || !signupPhone || !signupPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Phone validation (10 digits)
    if (!/^\d{10}$/.test(signupPhone)) {
      setError('Phone number must be 10 digits');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          phone: signupPhone,
          password: signupPassword
        })
      });
      
      if (data.success) {
        // Auto-login after signup - redirect to home
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      } else {
        setError(data.error || 'Signup failed');
      }
      
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setTabValue(tabValue === 0 ? 1 : 0);
    setError(null);
    // Clear all fields when switching
    setIdentifier('');
    setPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
    setConfirmPassword('');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
    // Clear all fields
    setIdentifier('');
    setPassword('');
    setSignupName('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
    setConfirmPassword('');
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f3a 50%, #0f1729 100%)',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Navbar showCenter={false} />
        <Container maxWidth="sm" sx={{ pt: 8, pb: 8, position: 'relative', zIndex: 1 }}>
          <Card 
            elevation={0} 
            sx={{ 
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #6366f1 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              },
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '200% 0' },
                '100%': { backgroundPosition: '-200% 0' },
              },
            }}
          >
            {/* Tabs */}
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                backgroundColor: 'rgba(15, 23, 42, 0.3)',
                backdropFilter: 'blur(10px)',
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  py: 2
                }
              }}
            >
              <Tab 
                icon={<LoginIcon />} 
                iconPosition="start" 
                label="Login" 
              />
              <Tab 
                icon={<PersonAdd />} 
                iconPosition="start" 
                label="Sign Up" 
              />
            </Tabs>

            <CardContent sx={{ p: 4 }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 3 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {tabValue === 0 ? (
                // LOGIN FORM
                <Box component="form" onSubmit={handleSubmit}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography 
                      variant="h4" 
                      fontWeight="bold" 
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      Welcome Back! 👋
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sign in to continue your gaming journey
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    label="Email / Username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="Enter email or 'admin'"
                    autoComplete="username"
                    autoFocus
                    sx={{ mb: 2.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#6366f1' }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Enter your email or type 'admin' for admin access"
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    autoComplete="current-password"
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#6366f1' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#94a3b8' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ textAlign: 'right', mb: 3 }}>
                    <Link 
                      to="/forgot-password"
                      style={{ 
                        color: '#818cf8', 
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<LoginIcon />}
                    sx={{ mb: 3, py: 1.8, fontSize: '1.1rem' }}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>

                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2.5, 
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 3,
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Box component="span" sx={{ fontSize: '1.2rem' }}>🔐</Box>
                      <strong>Admin Access:</strong> Type 'admin' as username
                    </Typography>
                  </Paper>
                </Box>
              ) : (
                // SIGNUP FORM
                <Box component="form" onSubmit={handleSignupSubmit}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography 
                      variant="h4" 
                      fontWeight="bold" 
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      Create Account 🚀
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Join us and start your gaming adventure
                    </Typography>
                  </Box>

                  <TextField
                    fullWidth
                    label="Full Name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    autoFocus
                    sx={{ mb: 2.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: '#6366f1' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    sx={{ mb: 2.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: '#6366f1' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                    placeholder="10-digit phone number"
                    inputProps={{ maxLength: 10 }}
                    sx={{ mb: 2.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: '#6366f1' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    placeholder="Create a password (min 6 characters)"
                    sx={{ mb: 2.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#6366f1' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: '#94a3b8' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    sx={{ mb: 3 }}
                    error={confirmPassword && signupPassword !== confirmPassword}
                    helperText={
                      confirmPassword && signupPassword !== confirmPassword
                        ? '❌ Passwords do not match'
                        : confirmPassword && signupPassword === confirmPassword
                        ? '✅ Passwords match'
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: '#6366f1' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: '#94a3b8' }}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<PersonAdd />}
                    sx={{ py: 1.8, fontSize: '1.1rem' }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;
