import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { KEYS, loadSettings, saveSettings } from '../services/resultStorage'

const SettingsContext = createContext(null)

/**
 * Election schedule (stored separately as churuElectionSettings):
 * { electionDateTime, resultDeclarationDateTime } — ISO strings or null.
 * Countdowns are always calculated from these values; remaining time is never stored.
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === KEYS.settings || event.key === null) setSettings(loadSettings())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** key: 'electionDateTime' | 'resultDeclarationDateTime'; value: ISO string or null. */
  const setEventDateTime = useCallback((key, value) => {
    const next = { ...settingsRef.current, [key]: value }
    saveSettings(next) // throws STORAGE_FULL before any state changes
    settingsRef.current = next
    setSettings(next)
  }, [])

  const clearSchedule = useCallback(() => {
    const next = { electionDateTime: null, resultDeclarationDateTime: null }
    saveSettings(next)
    setSettings(next)
  }, [])

  const value = useMemo(() => ({ ...settings, setEventDateTime, clearSchedule }), [settings, setEventDateTime, clearSchedule])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}
