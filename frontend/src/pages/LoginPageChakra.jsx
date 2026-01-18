import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertDescription,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { 
  FiMail, 
  FiLock, 
  FiUser, 
  FiPhone, 
  FiEye, 
  FiEyeOff,
  FiLogIn,
  FiUserPlus
} from 'react-icons/fi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { apiFetch } from '../services/apiClient';

const LoginPageChakra = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
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
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await apiFetch('/api/auth/check');
      
      if (data.authenticated) {
        if (data.user_type === 'admin') {
          navigate('/admin/dashboard');
        } else {
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: identifier,
          password: password
        })
      });
      
      if (data.success) {
        toast({
          title: 'Login successful!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        
        if (data.user_type === 'admin') {
          navigate('/admin/dashboard');
        } else {
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

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long');
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
        toast({
          title: 'Account created!',
          description: 'Please login to continue.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setSuccess('Registration successful! Please login.');
        
        // Clear signup form
        setSignupName('');
        setSignupEmail('');
        setSignupPhone('');
        setSignupPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Registration failed');
      }
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bg="var(--dark)" 
      position="relative"
      overflow="hidden"
    >
      {/* Video Background */}
      <Box
        as="video"
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        objectFit="cover"
        zIndex={-2}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/assets/videos/background.mp4" type="video/mp4" />
      </Box>
      
      {/* Dark Overlay for better text readability */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(15, 23, 42, 0.75)"
        zIndex={-1}
      />
      
      <Navbar />
      
      {/* Background decoration - keeping for extra effect */}
      <Box
        position="absolute"
        top="-50%"
        right="-50%"
        w="100%"
        h="100%"
        bgGradient="radial(circle, var(--primary) 0%, transparent 70%)"
        opacity={0.08}
        animation="float 20s ease-in-out infinite"
        pointerEvents="none"
        zIndex={0}
      />

      <Container maxW="container.sm" py={20} position="relative" zIndex={1}>
        <VStack spacing={0}>
          <Box
            w="full"
            bg="var(--card-bg)"
            backdropFilter="blur(16px)"
            borderRadius="var(--radius-xl)"
            border="2px solid"
            borderColor="var(--border-light)"
            p={8}
            boxShadow="var(--shadow-xl)"
          >
            <Tabs isFitted variant="soft-rounded" colorScheme="brand">
              <TabList mb={6} bg="var(--dark-light)" borderRadius="var(--radius-lg)" p={2}>
                <Tab
                  _selected={{ 
                    bg: 'var(--primary)', 
                    color: 'white', 
                    boxShadow: 'var(--shadow-glow)' 
                  }}
                  color="var(--text-muted)"
                  fontWeight="600"
                >
                  <Icon as={FiLogIn} mr={2} />
                  Login
                </Tab>
                <Tab
                  _selected={{ 
                    bg: 'var(--primary)', 
                    color: 'white', 
                    boxShadow: 'var(--shadow-glow)' 
                  }}
                  color="var(--text-muted)"
                  fontWeight="600"
                >
                  <Icon as={FiUserPlus} mr={2} />
                  Sign Up
                </Tab>
              </TabList>

              {error && (
                <Alert status="error" borderRadius="var(--radius-lg)" mb={4} bg="var(--error)" color="white">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert status="success" borderRadius="var(--radius-lg)" mb={4} bg="var(--success)" color="white">
                  <AlertIcon />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <TabPanels>
                {/* Login Panel */}
                <TabPanel p={0}>
                  <form onSubmit={handleLogin}>
                    <VStack spacing={6} align="stretch">
                      <Box textAlign="center">
                        <Heading 
                          size="lg" 
                          mb={2} 
                          bgGradient="var(--gradient-primary)" 
                          bgClip="text"
                          color="var(--text-primary)"
                        >
                          Welcome Back!
                        </Heading>
                        <Text color="var(--text-muted)">Login to access your account</Text>
                      </Box>

                      <FormControl>
                        <FormLabel color="var(--text-secondary)">Email or Username</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiMail} color="var(--text-muted)" />
                          </InputLeftElement>
                          <Input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="Enter your email or username"
                            required
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="var(--text-secondary)">Password</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiLock} color="var(--text-muted)" />
                          </InputLeftElement>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                          />
                          <InputRightElement>
                            <Button
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                              variant="ghost"
                              color="var(--text-muted)"
                              _hover={{ color: 'var(--text-primary)' }}
                            >
                              <Icon as={showPassword ? FiEyeOff : FiEye} />
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                      <Button
                        type="submit"
                        size="lg"
                        bg="var(--primary)"
                        color="white"
                        _hover={{ bg: 'var(--primary-dark)', transform: 'translateY(-2px)' }}
                        _active={{ transform: 'translateY(0)' }}
                        isLoading={loading}
                        loadingText="Logging in..."
                        leftIcon={<FiLogIn />}
                        boxShadow="var(--shadow-glow)"
                      >
                        Login
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Signup Panel */}
                <TabPanel p={0}>
                  <form onSubmit={handleSignup}>
                    <VStack spacing={6} align="stretch">
                      <Box textAlign="center">
                        <Heading 
                          size="lg" 
                          mb={2} 
                          bgGradient="var(--gradient-primary)" 
                          bgClip="text"
                          color="var(--text-primary)"
                        >
                          Create Account
                        </Heading>
                        <Text color="var(--text-muted)">Join us today!</Text>
                      </Box>

                      <FormControl>
                        <FormLabel color="var(--text-secondary)">Full Name</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiUser} color="var(--text-muted)" />
                          </InputLeftElement>
                          <Input
                            type="text"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="var(--text-secondary)">Email</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiMail} color="var(--text-muted)" />
                          </InputLeftElement>
                          <Input
                            type="email"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="var(--text-secondary)">Phone Number</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiPhone} color="var(--text-muted)" />
                          </InputLeftElement>
                          <Input
                            type="tel"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            required
                          />
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="var(--text-secondary)">Password</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiLock} color="var(--text-muted)" />
                          </InputLeftElement>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            placeholder="Create a password (min 6 characters)"
                            required
                          />
                          <InputRightElement>
                            <Button
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                              variant="ghost"
                              color="var(--text-muted)"
                              _hover={{ color: 'var(--text-primary)' }}
                            >
                              <Icon as={showPassword ? FiEyeOff : FiEye} />
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.300">Confirm Password</FormLabel>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <Icon as={FiLock} color="gray.400" />
                          </InputLeftElement>
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                          />
                          <InputRightElement>
                            <Button
                              size="sm"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              variant="ghost"
                              color="var(--text-muted)"
                              _hover={{ color: 'var(--text-primary)' }}
                            >
                              <Icon as={showConfirmPassword ? FiEyeOff : FiEye} />
                            </Button>
                          </InputRightElement>
                        </InputGroup>
                      </FormControl>

                      <Button
                        type="submit"
                        size="lg"
                        bg="var(--success)"
                        color="white"
                        _hover={{ bg: 'var(--success-dark)', transform: 'translateY(-2px)' }}
                        _active={{ transform: 'translateY(0)' }}
                        isLoading={loading}
                        loadingText="Creating account..."
                        leftIcon={<FiUserPlus />}
                        boxShadow="var(--shadow-glow)"
                      >
                        Create Account
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Container>

      {/* Add keyframes for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
      `}</style>

      <Footer />
    </Box>
  );
};

export default LoginPageChakra;
