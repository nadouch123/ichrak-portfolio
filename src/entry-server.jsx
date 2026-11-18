// Build-time entry: renders the home page to an HTML string (see scripts/prerender.mjs).
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export const render = () => renderToString(<App />);
