import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import 'regenerator-runtime/runtime' // For react-speech-recognition

// Initialize theme from persisted store (default: light)
try {
  const stored = JSON.parse(localStorage.getItem('rakshak-theme-store') || '{}');
  if (stored?.state?.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch {
  document.documentElement.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
