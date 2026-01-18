import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import './index.css';
import App from './App';

// Custom Chakra UI theme that uses CSS variables
// This allows Chakra components to respond to theme changes
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#e8e9fa',
      100: '#c3c6f4',
      200: '#9ca1ed',
      300: '#757ce6',
      400: '#5761e0',
      500: 'var(--primary)', // Use CSS variable
      600: 'var(--primary-dark)',
      700: '#4649a8',
      800: '#373a84',
      900: '#282b60',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'var(--dark)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      },
      // Make Chakra components aware of CSS variables
      '*': {
        borderColor: 'var(--border-light)',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'var(--radius-lg)',
        transition: 'var(--transition-base)',
      },
      variants: {
        solid: {
          bg: 'var(--primary)',
          color: 'white',
          _hover: {
            bg: 'var(--primary-dark)',
            transform: 'translateY(-2px)',
            boxShadow: 'var(--shadow-lg)',
          },
        },
        outline: {
          borderColor: 'var(--border-light)',
          color: 'var(--text-secondary)',
          _hover: {
            bg: 'var(--hover-overlay)',
            borderColor: 'var(--primary)',
          },
        },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'var(--card-bg)',
            borderColor: 'var(--border-light)',
            color: 'var(--text-primary)',
            _hover: {
              bg: 'var(--card-bg-hover)',
              borderColor: 'var(--primary)',
            },
            _focus: {
              bg: 'var(--card-bg-hover)',
              borderColor: 'var(--primary)',
              boxShadow: 'var(--focus-ring)',
            },
            _placeholder: {
              color: 'var(--text-muted)',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
    Tabs: {
      variants: {
        'soft-rounded': {
          tab: {
            color: 'var(--text-muted)',
            _selected: {
              bg: 'var(--primary)',
              color: 'white',
              boxShadow: 'var(--shadow-glow)',
            },
            _hover: {
              color: 'var(--text-primary)',
            },
          },
        },
      },
    },
    Alert: {
      baseStyle: {
        container: {
          bg: 'var(--card-bg)',
          borderColor: 'var(--border-light)',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
