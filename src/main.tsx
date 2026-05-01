import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { LevelProvider } from './lib/level';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LevelProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </LevelProvider>
  </React.StrictMode>
);
