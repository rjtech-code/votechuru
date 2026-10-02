import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Keeps filter values in the URL query string so filtered views can be linked,
 * bookmarked and restored with the browser's back button.
 */
export function useFilterParams(keys) {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(
    () => Object.fromEntries(keys.map((key) => [key, params.get(key) ?? ''])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, keys.join(',')],
  )

  /** Updates several filters in one navigation (separate calls in one tick would overwrite each other). */
  const setFilters = useCallback(
    (changes) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          next.delete('page')
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters])

  const resetFilters = useCallback(() => setParams({}, { replace: true }), [setParams])

  const page = Math.max(1, Number(params.get('page')) || 1)
  const setPage = useCallback(
    (value) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (value > 1) next.set('page', String(value))
        else next.delete('page')
        return next
      }),
    [setParams],
  )

  const hasFilters = Object.values(filters).some(Boolean)
  return { filters, setFilter, setFilters, resetFilters, hasFilters, page, setPage }
}
