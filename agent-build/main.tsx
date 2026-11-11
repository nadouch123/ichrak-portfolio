import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../src/index.css';
import '../agent-spec/agent-spec.css';
import './agent-build.css';

ReactDOM.createRoot(document.getElementById('build-root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
