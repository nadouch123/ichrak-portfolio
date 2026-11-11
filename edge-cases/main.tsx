import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../src/index.css';
import '../agent-spec/agent-spec.css';
import '../agent-build/agent-build.css';
import '../tool-ui/tool-ui.css';
import './edge-cases.css';

ReactDOM.createRoot(document.getElementById('edge-root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
