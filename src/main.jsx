import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// FE-10: the home page HTML is rendered at build time, so the hero paints before any JavaScript runs.
// In the browser React only attaches to that HTML (hydrate). In dev there is no prerender, so it renders.
const root = document.getElementById('root');
if (root.firstElementChild) ReactDOM.hydrateRoot(root, <App />);
else ReactDOM.createRoot(root).render(<App />);
