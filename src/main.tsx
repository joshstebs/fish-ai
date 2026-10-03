import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BillingBootstrap } from './components/BillingBootstrap';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BillingBootstrap />
    <App />
  </React.StrictMode>
);
