import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { KEYS, clearResults, clearWards, loadData, newId, saveCandidates, saveStatus, saveWards } from '../services/resultStorage'
import { buildWards, candidateKey, computeStats, planImport, planWardImport, sortWards } from '../lib/wards'

const ResultsContext = createContext(null)
const codeError = (code) => Object.assign(new Error(code), { code })

/**
 * Single source of Ward Master, candidate and result-status data for the public site and
 * the admin panel. Each change is written to localStorage before state updates, and changes
 * made in another tab arrive through the `storage` event.
 *
 * Safety rules:
 *  - imports and manual entries only ever append candidates; nothing is overwritten,
 *  - a candidate can only belong to a ward in the Ward Master,
 *  - any change to a declared ward's candidates returns it to Pending, so a winner is only
 *    shown for data the Super Admin declared as it stands,
 *  - a ward with candidates cannot be deleted unless its candidates are explicitly deleted too.
 */
export function ResultsProvider({ children }) {
  const [data, setData] = useState(loadData)
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    const watched = new Set([KEYS.wards, KEYS.candidates, KEYS.results])
    const onStorage = (event) => {
      if (event.key === null || watched.has(event.key)) setData(loadData())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const publish = useCallback((next) => {
    dataRef.current = next
    setData(next)
  }, [])

  /** Saves candidates; `touchedWards` lose their Declared status. Returns reopened wards. */
  const commitCandidates = useCallback(
    (candidates, touchedWards = []) => {
      const current = dataRef.current
      const touched = new Set(touchedWards)
      const withData = new Set(candidates.map((c) => c.wardNo))
      const declaredWards = current.declaredWards.filter((w) => withData.has(w) && !touched.has(w))
      const reopened = current.declaredWards.filter((w) => touched.has(w) && withData.has(w))
      saveCandidates(candidates)
      saveStatus(declaredWards)
      publish({ ...current, candidates, declaredWards })
      return reopened
    },
    [publish],
  )

  const commitWards = useCallback(
    (wards) => {
      const sorted = sortWards(wards)
      saveWards(sorted)
      publish({ ...dataRef.current, wards: sorted })
    },
    [publish],
  )

  // ---------- Candidates ----------

  /** Appends validated candidates. Returns { added, reopened }. */
  const addCandidates = useCallback(
    (items) => {
      const known = new Set(dataRef.current.wards.map((w) => w.wardNo))
      if (items.some((item) => !known.has(item.wardNo))) throw codeError('WARD_NOT_FOUND')
      const added = items.map((item) => ({
        id: newId(),
        name: item.name,
        party: item.party,
        wardNo: item.wardNo,
        totalVotes: item.totalVotes,
        candidateCode: item.candidateCode ?? null,
        image: null,
      }))
      const reopened = commitCandidates([...dataRef.current.candidates, ...added], added.map((c) => c.wardNo))
      return { added: added.length, reopened }
    },
    [commitCandidates],
  )

  const updateCandidate = useCallback(
    (id, values) => {
      const before = dataRef.current.candidates.find((c) => c.id === id)
      if (!dataRef.current.wards.some((w) => w.wardNo === values.wardNo)) throw codeError('WARD_NOT_FOUND')
      const candidates = dataRef.current.candidates.map((c) => (c.id === id ? { ...c, ...values, id, image: c.image } : c))
      return commitCandidates(candidates, [before?.wardNo, values.wardNo])
    },
    [commitCandidates],
  )

  const deleteCandidate = useCallback(
    (id) => {
      const before = dataRef.current.candidates.find((c) => c.id === id)
      return commitCandidates(dataRef.current.candidates.filter((c) => c.id !== id), [before?.wardNo])
    },
    [commitCandidates],
  )

  /** "Delete Ward Result": removes the ward's candidate records; the ward stays in the Ward Master. */
  const deleteWardCandidates = useCallback(
    (wardNo) => commitCandidates(dataRef.current.candidates.filter((c) => c.wardNo !== wardNo)),
    [commitCandidates],
  )

  /** Profile image only; does not change result data, so the ward status is unaffected. */
  const setCandidateImage = useCallback(
    (id, image) => {
      const current = dataRef.current
      const candidates = current.candidates.map((c) => (c.id === id ? { ...c, image } : c))
      saveCandidates(candidates)
      publish({ ...current, candidates })
    },
    [publish],
  )

  // ---------- Ward Master ----------

  const addWards = useCallback((items) => commitWards([...dataRef.current.wards, ...items]), [commitWards])

  /** Replaces the details of existing wards (explicit admin choice during an import). */
  const replaceWards = useCallback(
    (items) => {
      const byNo = new Map(items.map((w) => [w.wardNo, w]))
      commitWards(dataRef.current.wards.map((w) => byNo.get(w.wardNo) ?? w))
    },
    [commitWards],
  )

  const addWard = useCallback(
    (ward) => {
      if (dataRef.current.wards.some((w) => w.wardNo === ward.wardNo)) throw codeError('WARD_EXISTS')
      commitWards([...dataRef.current.wards, ward])
    },
    [commitWards],
  )

  /** Edits ward details; the ward number is the identity and cannot change. */
  const updateWard = useCallback(
    (wardNo, values) => commitWards(dataRef.current.wards.map((w) => (w.wardNo === wardNo ? { ...values, wardNo } : w))),
    [commitWards],
  )

  /** Refuses to orphan candidates unless `withCandidates` is explicitly set. */
  const deleteWard = useCallback(
    (wardNo, { withCandidates = false } = {}) => {
      const hasCandidates = dataRef.current.candidates.some((c) => c.wardNo === wardNo)
      if (hasCandidates && !withCandidates) throw codeError('WARD_HAS_CANDIDATES')
      if (hasCandidates) commitCandidates(dataRef.current.candidates.filter((c) => c.wardNo !== wardNo))
      commitWards(dataRef.current.wards.filter((w) => w.wardNo !== wardNo))
    },
    [commitCandidates, commitWards],
  )

  // ---------- Status ----------

  const setDeclared = useCallback(
    (wardNo, declare) => {
      const current = dataRef.current
      const declaredWards = declare ? [...new Set([...current.declaredWards, wardNo])] : current.declaredWards.filter((w) => w !== wardNo)
      saveStatus(declaredWards)
      publish({ ...current, declaredWards })
    },
    [publish],
  )

  // ---------- Resets ----------

  /** Removes candidates and result statuses; keeps the Ward Master and the schedule. */
  const resetResults = useCallback(() => {
    clearResults()
    publish({ ...dataRef.current, candidates: [], declaredWards: [] })
  }, [publish])

  /** Only allowed when no candidates exist, so no result data can be orphaned. */
  const resetWards = useCallback(() => {
    if (dataRef.current.candidates.length) throw codeError('WARD_HAS_CANDIDATES')
    clearWards()
    publish({ ...dataRef.current, wards: [] })
  }, [publish])

  // ---------- Import planning ----------

  const prepareCandidatePlan = useCallback((items) => planImport(dataRef.current.candidates, items), [])
  const prepareWardPlan = useCallback((items) => planWardImport(dataRef.current.wards, items), [])

  /** For one candidate: { duplicate } or { conflict: existingRecord } or {}. */
  const checkCandidate = useCallback((record, exceptId) => {
    const others = dataRef.current.candidates.filter((c) => c.id !== exceptId && candidateKey(c) === candidateKey(record))
    if (others.some((c) => c.totalVotes === record.totalVotes)) return { duplicate: true }
    return others.length ? { conflict: others[0] } : {}
  }, [])

  const value = useMemo(() => {
    const wards = buildWards(data.wards, data.candidates, data.declaredWards)
    const candidatesById = new Map()
    for (const ward of wards) for (const row of ward.rows) candidatesById.set(row.id, { ...row, ward })
    return {
      wardMaster: data.wards,
      candidates: data.candidates,
      wards,
      stats: computeStats(wards),
      getWard: (wardNo) => wards.find((w) => w.wardNo === wardNo) ?? null,
      /** Candidate with its ward result context ({ ...candidate, position, percent, ward }). */
      getCandidate: (id) => candidatesById.get(id) ?? null,
      addCandidates,
      updateCandidate,
      deleteCandidate,
      deleteWardCandidates,
      setCandidateImage,
      addWards,
      replaceWards,
      addWard,
      updateWard,
      deleteWard,
      declareWard: (wardNo) => setDeclared(wardNo, true),
      reopenWard: (wardNo) => setDeclared(wardNo, false),
      resetResults,
      resetWards,
      prepareCandidatePlan,
      prepareWardPlan,
      checkCandidate,
    }
  }, [
    data,
    addCandidates,
    updateCandidate,
    deleteCandidate,
    deleteWardCandidates,
    setCandidateImage,
    addWards,
    replaceWards,
    addWard,
    updateWard,
    deleteWard,
    setDeclared,
    resetResults,
    resetWards,
    prepareCandidatePlan,
    prepareWardPlan,
    checkCandidate,
  ])

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
}

export function useResults() {
  const context = useContext(ResultsContext)
  if (!context) throw new Error('useResults must be used inside ResultsProvider')
  return context
}
