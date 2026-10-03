import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { admin as adminApi, getSettings } from '../services/api'
import { useAuth } from './AuthContext'

const SettingsContext = createContext(null)
const REFRESH_MS = 5 * 60 * 1000

/**
 * Election schedule from the API: { electionDateTime, resultDeclarationDateTime } (ISO or null).
 * Countdowns are calculated from these values; remaining time is never stored.
 */
export function SettingsProvider({ children }) {
  const { token, handleUnauthorized } = useAuth()
  const [settings, setSettings] = useState({ electionDateTime: null, resultDeclarationDateTime: null })

  const load = useCallback(async () => {
    try {
      setSettings(await getSettings())
    } catch {
      // Keep the last known schedule; countdowns simply stay hidden if none is known.
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  const save = useCallback(
    async (fn) => {
      try {
        const response = await fn(token)
        setSettings(response.settings)
      } catch (error) {
        if (error.code === 'UNAUTHORIZED') handleUnauthorized()
        throw error
      }
    },
    [token, handleUnauthorized],
  )

  /** key: 'electionDateTime' | 'resultDeclarationDateTime'; value: ISO string or null. */
  const setEventDateTime = useCallback(
    (key, value) => save((t) => (key === 'electionDateTime' ? adminApi.setElection(t, value) : adminApi.setResultDeclaration(t, value))),
    [save],
  )
  const clearSchedule = useCallback(() => save((t) => adminApi.clearSchedule(t)), [save])

  const value = useMemo(() => ({ ...settings, setEventDateTime, clearSchedule, reload: load }), [settings, setEventDateTime, clearSchedule, load])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used inside SettingsProvider')
  return context
}
