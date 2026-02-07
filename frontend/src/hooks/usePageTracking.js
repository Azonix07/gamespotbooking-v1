import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageVisit } from '../services/api';

/**
 * Hook to automatically track page visits for analytics
 * Uses requestIdleCallback to avoid blocking rendering
 */
const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Defer analytics to idle time so it never blocks rendering
    const track = () => trackPageVisit(location.pathname);
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(track);
    } else {
      setTimeout(track, 1000);
    }
  }, [location]);
};

export default usePageTracking;
