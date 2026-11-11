import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../src/index.css';
import './agent-spec.css';

ReactDOM.createRoot(document.getElementById('agent-root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
