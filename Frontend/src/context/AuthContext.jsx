import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { login as loginRequest, logout as logoutRequest } from '../services/api'

const STORAGE_KEY = 'churuAdminSession'
const AuthContext = createContext(null)

/** The admin session ({ token, user }) lives in sessionStorage, so it ends with the browser tab. */
function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    return session?.token && session?.user ? session : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  const login = useCallback(async (email, password) => {
    const next = await loginRequest(email, password)
    setSession(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable: the session lasts until the page is reloaded.
    }
    return next.user
  }, [])

  /** Clears the local session; also revokes the token on the server unless it is already invalid. */
  const logout = useCallback(
    ({ revoke = true } = {}) => {
      if (revoke && session?.token) logoutRequest(session.token)
      setSession(null)
      try {
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        // Ignore storage errors.
      }
    },
    [session],
  )

  const value = useMemo(() => ({ user: session?.user ?? null, token: session?.token ?? null, login, logout }), [session, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
