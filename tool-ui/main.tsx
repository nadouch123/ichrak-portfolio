import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../src/index.css';
import '../agent-spec/agent-spec.css';
import '../agent-build/agent-build.css';
import './tool-ui.css';

ReactDOM.createRoot(document.getElementById('tool-root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
