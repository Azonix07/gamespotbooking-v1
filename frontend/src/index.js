import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// No ChakraUI needed - using native CSS variables for theming
// CSS variables are defined in index.css and can be dynamically changed

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
