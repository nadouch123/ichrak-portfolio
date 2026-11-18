import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../src/index.css';
import '../agent-spec/agent-spec.css';
import '../agent-build/agent-build.css';
import './three-d.css';

ReactDOM.createRoot(document.getElementById('three-root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
