'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageVisit } from '@/services/api';

/**
 * Hook to automatically track page visits for analytics
 * Uses requestIdleCallback to avoid blocking rendering
 */
const usePageTracking = () => {
  const pathname = usePathname();

  useEffect(() => {
    const track = () => trackPageVisit(pathname);
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(track);
    } else {
      setTimeout(track, 1000);
    }
  }, [pathname]);
};

export default usePageTracking;
