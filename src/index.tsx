import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { loadMessages, localeFromPath } from './i18n';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// Load the page's language first so the prerendered HTML stays on screen until the app can render in that language.
loadMessages(localeFromPath(window.location.pathname)).then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
