// index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AppProvider } from './App'; // Adjust import path as needed

ReactDOM.render(
  <AppProvider>
    <App />
  </AppProvider>,
  document.getElementById('root')
);
