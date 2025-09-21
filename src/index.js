import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProvider } from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <AppProvider>
    <App />
  </AppProvider>
);
