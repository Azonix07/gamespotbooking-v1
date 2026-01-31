import { useEffect } from 'react';

/**
 * Hook to synchronize CSS theme variables with Chakra UI
 * This ensures that when themes change via ThemeSelector,
 * all components (both CSS and Chakra) reflect the new theme
 */
const useThemeSync = () => {
  useEffect(() => {
    // Load the current theme from localStorage on mount
    const stored = localStorage.getItem('siteTheme');
    if (stored) {
      document.body.className = stored;
    } else {
      // Default to purple theme
      document.body.className = 'theme-purple';
      localStorage.setItem('siteTheme', 'theme-purple');
    }

    // Listen for theme changes from ThemeSelector
    const handleThemeChange = (event) => {
      if (event.key === 'siteTheme') {
        document.body.className = event.newValue || 'theme-purple';
      }
    };

    window.addEventListener('storage', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);
};

export default useThemeSync;
