// Non-translatable site configuration. All visible text lives in src/i18n/translations.js.
export const site = {
  contactEmail: 'contact@chururesults.local',
}

/** Public navigation; `labelKey` is a translation key. */
export const publicNav = [
  { to: '/', labelKey: 'nav.home', end: true },
  { to: '/results', labelKey: 'nav.results' },
  { to: '/candidates', labelKey: 'nav.candidates' },
  { to: '/previous-elections', labelKey: 'nav.previous' },
  { to: '/election-summary', labelKey: 'nav.summary' },
  { to: '/map', labelKey: 'nav.map' },
]

export const footerNav = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/results', labelKey: 'nav.results' },
  { to: '/candidates', labelKey: 'nav.candidates' },
  { to: '/previous-elections', labelKey: 'nav.previous' },
  { to: '/map', labelKey: 'nav.map' },
  { to: '/about', labelKey: 'nav.about' },
]
