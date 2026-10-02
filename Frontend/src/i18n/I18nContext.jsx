import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LANGUAGE, LANGUAGES, translations } from './translations'

const STORAGE_KEY = 'language'
const LanguageContext = createContext(null)

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

const lookup = (dictionary, key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary)

const interpolate = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match)) : text

/**
 * Single source of truth for the UI language. Every page reads it from here, so a
 * switch applies everywhere at once, survives navigation and (via localStorage) reloads.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage)

  const setLanguage = useCallback((next) => {
    if (LANGUAGES.includes(next)) setLanguageState(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translations[language].site.title
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Storage unavailable (e.g. private mode): the choice lasts for this visit only.
    }
  }, [language])

  const value = useMemo(() => {
    const dictionary = translations[language]
    const locale = language === 'hi' ? 'hi-IN' : 'en-IN'
    const numberFormatter = new Intl.NumberFormat('en-IN')

    /** Translate a key, e.g. t('hero.title') or t('election.seats', { count: 12 }). */
    const t = (key, vars) => {
      const text = lookup(dictionary, key)
      if (typeof text !== 'string') {
        if (import.meta.env.DEV) console.warn(`[i18n] Missing translation: ${key}`)
        return key
      }
      return interpolate(text, vars)
    }

    /** Translate an enum-like data value (status, party, place…), falling back to the raw value. */
    const tx = (group, raw) => {
      if (raw == null || raw === '') return ''
      const text = dictionary[group]?.[raw]
      return typeof text === 'string' ? text : raw
    }

    /** Pick a record's Hindi field (`nameHi`) when Hindi is active and the field exists. */
    const loc = (record, field = 'name') => {
      if (!record) return ''
      return (language === 'hi' && record[`${field}Hi`]) || record[field] || ''
    }

    const formatNumber = (n) => (n == null ? '—' : numberFormatter.format(n))
    const formatPercent = (n) => (n == null ? '—' : `${n.toFixed(1)}%`)
    const formatDate = (input) => {
      if (!input) return '—'
      const date = /^\d{4}-\d{2}-\d{2}$/.test(input) ? new Date(`${input}T00:00:00`) : new Date(input)
      return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    }
    const formatDateTime = (input) =>
      input
        ? new Date(input).toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
        : '—'

    return { language, setLanguage, t, tx, loc, formatNumber, formatPercent, formatDate, formatDateTime }
  }, [language, setLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
