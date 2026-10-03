import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginRequest, logout as logoutRequest, me } from '../services/api'

const STORAGE_KEY = 'churuAdminSession'
const AuthContext = createContext(null)

/**
 * The admin session token (issued by the backend) lives in sessionStorage, so it ends
 * with the browser tab. No credentials are ever stored in the frontend.
 */
function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    return session?.token && session?.user ? session : null
  } catch {
    return null
  }
}

function writeSession(session) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable: the session lasts until the page is reloaded.
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)
  const navigate = useNavigate()

  // Confirm a stored session is still valid (tokens expire or are revoked on logout).
  useEffect(() => {
    if (!session?.token) return
    me(session.token).catch((error) => {
      if (error.code === 'UNAUTHORIZED') {
        writeSession(null)
        setSession(null)
      }
    })
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email, password) => {
    const { token, user } = await loginRequest(email, password)
    const next = { token, user }
    writeSession(next)
    setSession(next)
    return user
  }, [])

  /** Clears the local session; also revokes the token on the server unless it is already invalid. */
  const logout = useCallback(
    ({ revoke = true } = {}) => {
      if (revoke && session?.token) logoutRequest(session.token)
      writeSession(null)
      setSession(null)
    },
    [session],
  )

  /** Called when the API rejects the token: sign out and return to the login page. */
  const handleUnauthorized = useCallback(() => {
    writeSession(null)
    setSession(null)
    navigate('/admin', { replace: true, state: { reason: 'expired' } })
  }, [navigate])

  const value = useMemo(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, login, logout, handleUnauthorized }),
    [session, login, logout, handleUnauthorized],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
