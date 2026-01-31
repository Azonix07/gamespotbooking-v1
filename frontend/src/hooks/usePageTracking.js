import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageVisit } from '../services/api';

/**
 * Hook to automatically track page visits for analytics
 * Use this in App.js to track all route changes
 */
const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page visit
    trackPageVisit(location.pathname);
  }, [location]);
};

export default usePageTracking;
