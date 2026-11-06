import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/layout.css';
import './styles/themes/azzurro.css';
import './styles/themes/arancione.css';
import './styles/themes/natale.css';
import { TEMA } from './config';

// il tema attivo si sceglie in config.ts
document.documentElement.dataset.theme = TEMA;

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
