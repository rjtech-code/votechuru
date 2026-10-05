import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { admin as adminApi, candidateImageUrl, getCandidates, getWards } from '../services/api'
import { useAuth } from './AuthContext'
import { buildWards, computeStats } from '../lib/wards'

const ResultsContext = createContext(null)
const PUBLIC_REFRESH_MS = 60 * 1000

/** API candidate → UI candidate (photo URL in `image`, or null). */
const toCandidate = (c) => ({ ...c, image: c.hasImage ? candidateImageUrl(c.id, c.imageVersion) : null })

/**
 * Ward / candidate / result data from the API (MongoDB is the source of truth).
 *
 * scope="public": wards and candidate profiles, with votes for DECLARED wards only — the
 *   server never sends pending votes. Refreshes every minute and when the tab regains
 *   focus, so new wards, candidates, photos and declared results appear.
 * scope="admin":  everything, including pending results, plus the admin actions. Every
 *   action is validated by the server and followed by a fresh load.
 */
export function ResultsProvider({ scope = 'public', children }) {
  const { token, handleUnauthorized } = useAuth()
  const [state, setState] = useState({ wards: [], candidates: [], ready: false, error: null })
  const isAdmin = scope === 'admin'
  const tokenRef = useRef(token)
  tokenRef.current = token

  /** Runs an admin API call; an expired session signs the admin out. */
  const call = useCallback(
    async (fn) => {
      try {
        return await fn(tokenRef.current)
      } catch (error) {
        if (error.code === 'UNAUTHORIZED') handleUnauthorized()
        throw error
      }
    },
    [handleUnauthorized],
  )

  const load = useCallback(async () => {
    try {
      if (isAdmin) {
        const data = await call((t) => adminApi.data(t))
        setState({ wards: data.wards, candidates: data.candidates.map(toCandidate), ready: true, error: null })
      } else {
        const [wards, candidates] = await Promise.all([getWards(), getCandidates()])
        setState({ wards, candidates: candidates.map(toCandidate), ready: true, error: null })
      }
    } catch (error) {
      setState((s) => ({ ...s, ready: true, error }))
    }
  }, [isAdmin, call])

  useEffect(() => {
    load()
    if (isAdmin) return undefined
    const timer = setInterval(load, PUBLIC_REFRESH_MS)
    const onFocus = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [isAdmin, load])

  /** Admin action: API call, then reload so the UI always reflects the database. */
  const mutate = useCallback(
    async (fn) => {
      const result = await call(fn)
      await load()
      return result
    },
    [call, load],
  )

  const actions = useMemo(
    () =>
      isAdmin
        ? {
            importWards: (wards, resolution) => mutate((t) => adminApi.importWards(t, wards, resolution)),
            addWard: (ward) => mutate((t) => adminApi.createWard(t, ward)),
            updateWard: (wardNo, ward) => mutate((t) => adminApi.updateWard(t, wardNo, ward)),
            deleteWard: (wardNo, { withCandidates = false } = {}) => mutate((t) => adminApi.deleteWard(t, wardNo, withCandidates)),
            declareWard: (wardNo) => mutate((t) => adminApi.declareWard(t, wardNo)),
            reopenWard: (wardNo) => mutate((t) => adminApi.reopenWard(t, wardNo)),
            resetWards: () => mutate((t) => adminApi.resetWards(t)),
            importCandidates: (candidates) => mutate((t) => adminApi.importCandidates(t, candidates)),
            createCandidate: (candidate) => mutate((t) => adminApi.createCandidate(t, candidate)),
            deleteCandidate: (id) => mutate((t) => adminApi.deleteCandidate(t, id)),
            setCandidateImage: (id, image) => mutate((t) => adminApi.setCandidateImage(t, id, image)),
            resetCandidates: () => mutate((t) => adminApi.resetCandidates(t)),
            importResults: (results, options) => mutate((t) => adminApi.importResults(t, results, options)),
            setResult: (id, totalVotes) => mutate((t) => adminApi.setResult(t, id, totalVotes)),
            deleteResult: (id) => mutate((t) => adminApi.deleteResult(t, id)),
            deleteWardResults: (wardNo) => mutate((t) => adminApi.deleteWardResults(t, wardNo)),
            resetResults: () => mutate((t) => adminApi.resetResults(t)),
          }
        : {},
    [isAdmin, mutate],
  )

  const value = useMemo(() => {
    const declaredWards = state.wards.filter((w) => w.status === 'declared').map((w) => w.wardNo)
    // Public visitors never receive votes for undeclared wards; `withheld` lets pages say
    // "not declared yet" instead of showing result figures.
    const wards = buildWards(state.wards, state.candidates, declaredWards).map((w) => ({ ...w, withheld: !isAdmin && w.status !== 'declared' }))
    const candidatesById = new Map()
    for (const ward of wards) for (const row of ward.rows) candidatesById.set(row.id, { ...row, ward })
    return {
      scope,
      ready: state.ready,
      error: state.error,
      reload: load,
      wardMaster: state.wards,
      candidates: state.candidates,
      wards,
      stats: computeStats(wards),
      getWard: (wardNo) => wards.find((w) => w.wardNo === wardNo) ?? null,
      /** Candidate with its ward result context ({ ...candidate, position, percent, ward }). */
      getCandidate: (id) => candidatesById.get(id) ?? null,
      ...actions,
    }
  }, [scope, state, load, actions])

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
}

export function useResults() {
  const context = useContext(ResultsContext)
  if (!context) throw new Error('useResults must be used inside ResultsProvider')
  return context
}
