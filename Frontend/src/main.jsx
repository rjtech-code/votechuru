import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { LanguageProvider } from './i18n/I18nContext'
import { AuthProvider } from './context/AuthContext'
import { ResultsProvider } from './context/ResultsContext'
import { SettingsProvider } from './context/SettingsContext'
import { ToastProvider } from './context/ToastContext'
import { CandidateProfileProvider } from './context/CandidateProfileContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <ResultsProvider>
              <SettingsProvider>
                <CandidateProfileProvider>
                  <App />
                </CandidateProfileProvider>
              </SettingsProvider>
            </ResultsProvider>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
