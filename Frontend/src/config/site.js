// Non-translatable site configuration. All visible text lives in src/i18n/translations.js.
export const site = {
  contactEmail: 'contact@chururesults.local',
}

/** Public navigation; `labelKey` is a translation key. */
export const publicNav = [
  { to: '/', labelKey: 'nav.home', end: true },
  { to: '/results', labelKey: 'nav.results' },
  { to: '/candidates', labelKey: 'nav.candidates' },
  { to: '/government-initiatives', labelKey: 'nav.initiatives' },
  { to: '/voter-information', labelKey: 'nav.voterInfo' },
  { to: '/election-summary', labelKey: 'nav.summary' },
]

export const footerNav = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/results', labelKey: 'nav.results' },
  { to: '/candidates', labelKey: 'nav.candidates' },
  { to: '/government-initiatives', labelKey: 'nav.initiatives' },
  { to: '/voter-information', labelKey: 'nav.voterInfo' },
  { to: '/about', labelKey: 'nav.about' },
]

/** Official websites (verified) used as sources on the information pages. */
export const officialSources = {
  churuDistrict: 'https://churu.rajasthan.gov.in/',
  secRajasthan: 'https://sec.rajasthan.gov.in/',
  ceoRajasthan: 'https://ceorajasthan.nic.in/',
  eciSveep: 'https://ecisveep.nic.in/',
  eci: 'https://www.eci.gov.in/',
  votersPortal: 'https://voters.eci.gov.in/',
}

/**
 * Government Initiatives page: sections and cards. Text comes from
 * pages.initiatives.items.<key> (title, text, source) in the translations.
 */
export const initiativeSections = [
  { key: 'district', items: [{ key: 'districtPortal', url: officialSources.churuDistrict }, { key: 'districtSveep', url: officialSources.eciSveep }] },
  {
    key: 'state',
    items: [
      { key: 'sec', url: officialSources.secRajasthan },
      { key: 'ceo', url: officialSources.ceoRajasthan },
      { key: 'ePledge', url: officialSources.ceoRajasthan },
    ],
  },
  {
    key: 'national',
    items: [
      { key: 'sveep', url: officialSources.eciSveep },
      { key: 'elc', url: officialSources.eciSveep },
      { key: 'nvd', url: officialSources.eciSveep },
      { key: 'vsp', url: officialSources.votersPortal },
    ],
  },
]
