import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_KEY, clearResults, loadResults, newId, saveResults } from '../services/resultStorage'
import { buildWards, computeStats, recordKey } from '../lib/wards'

const ResultsContext = createContext(null)

/**
 * Single source of result data for public pages and the admin panel. Every change is
 * written to localStorage first, so state and storage never disagree; changes made
 * in another tab are picked up through the `storage` event.
 */
export function ResultsProvider({ children }) {
  const [records, setRecords] = useState(loadResults)
  const recordsRef = useRef(records)
  recordsRef.current = records

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) setRecords(loadResults())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  /** Persists then publishes. Throws { code: 'STORAGE_FULL' } if the browser quota is exceeded. */
  const commit = useCallback((next) => {
    saveResults(next)
    recordsRef.current = next
    setRecords(next)
  }, [])

  /** Adds validated records ({ name, wardNo, totalVotes }); returns how many were added. */
  const addResults = useCallback(
    (items) => {
      const added = items.map((item) => ({ id: newId(), name: item.name, wardNo: item.wardNo, totalVotes: item.totalVotes }))
      commit([...recordsRef.current, ...added])
      return added.length
    },
    [commit],
  )

  const updateResult = useCallback(
    (id, values) => {
      // Moving an edited record to the end marks its ward as recently changed.
      const others = recordsRef.current.filter((r) => r.id !== id)
      commit([...others, { id, name: values.name, wardNo: values.wardNo, totalVotes: values.totalVotes }])
    },
    [commit],
  )

  const deleteResult = useCallback((id) => commit(recordsRef.current.filter((r) => r.id !== id)), [commit])

  const clearAll = useCallback(() => {
    clearResults()
    recordsRef.current = []
    setRecords([])
  }, [])

  /** Splits incoming records into new ones and exact duplicates of stored records. */
  const findDuplicates = useCallback((items, exceptId) => {
    const existing = new Set(recordsRef.current.filter((r) => r.id !== exceptId).map(recordKey))
    const duplicates = items.filter((item) => existing.has(recordKey(item)))
    const fresh = items.filter((item) => !existing.has(recordKey(item)))
    return { duplicates, fresh }
  }, [])

  const value = useMemo(() => {
    const wards = buildWards(records)
    return {
      records,
      wards,
      stats: computeStats(records, wards),
      getWard: (wardNo) => wards.find((w) => w.wardNo === wardNo) ?? null,
      addResults,
      updateResult,
      deleteResult,
      clearAll,
      findDuplicates,
    }
  }, [records, addResults, updateResult, deleteResult, clearAll, findDuplicates])

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>
}

export function useResults() {
  const context = useContext(ResultsContext)
  if (!context) throw new Error('useResults must be used inside ResultsProvider')
  return context
}
