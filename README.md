# चूरू जिला चुनाव परिणाम — Churu District Election Results (prototype)

A bilingual (हिन्दी / English) frontend prototype of a portal for local election information and results in
Churu District, Rajasthan.

> **All data in this prototype is sample data.** Candidate and party names are fictional. The site is not
> affiliated with the State Election Commission, Rajasthan, or any government body.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run server     # optional read-only sample API on http://localhost:4000
```

Admin panel: `/admin` → sign in with `admin@chururesults.local` and any password of 8+ characters (mock login).
Admin changes live in memory and reset on page reload.

## Routes

Public: `/`, `/panchayat-elections`, `/municipal-elections`, `/elections/:electionId`, `/results`,
`/results/:id` (id = `<electionId>--<constituencyId>`), `/candidates`, `/previous-elections`, `/election-summary`,
`/map`, `/about`.
Admin: `/admin` (→ `/admin/login`), `/admin/dashboard`, `/admin/elections`, `/admin/results`, `/admin/candidates`,
`/admin/constituencies`, `/admin/settings`.

## Language system

- `src/i18n/translations.js` — every UI string, defined once as a `[Hindi, English]` pair; `translations.hi` and
  `translations.en` are derived from it, so the two languages always have the same keys.
- `src/i18n/I18nContext.jsx` — `LanguageProvider` + `useLanguage()` → `{ language, setLanguage, t, tx, loc, formatDate, formatNumber, … }`.
  - `t('hero.title')` translates a key; `tx('status', 'Declared')` translates a data enum (status, party, place…).
  - `loc(record)` picks a record's Hindi field (`nameHi`, `areaNameHi`…) when Hindi is active.
- The choice is global, applies instantly on every page (public and admin), and persists in
  `localStorage["language"]`. Default: Hindi. In development a missing key logs a `[i18n] Missing translation` warning.

## Structure

```
src/
  i18n/                 translations + LanguageProvider
  config/site.js        Non-text config and navigation (label keys)
  data/                 Sample data with English + Hindi names
  services/             Async data-access layer — the only code that touches data
  lib/                  Constants, result calculations, URL helpers
  hooks/                useAsync, useFilterParams, useForm, useRecordEditor, …
  components/           Header (TopHeader + Navbar), Hero + HeroSkyline, SearchBox, LanguageSwitcher,
                        ElectionTypeCard, StatCard, ResultCard, SectionHeader, Footer, …
  components/ui/        Button, Card, Badge, Form fields, Modal, Table, States, Pagination, PageHeader
  components/admin/     Sidebar, header, row actions, form modals
  layouts/              PublicLayout, AdminLayout (auth-protected)
  pages/, pages/admin/  One file per route
server/index.js         Minimal Express API using the same data
```

Design tokens (navy, royal blue `brand`, saffron, earth tones, canvas background) are defined in
`tailwind.config.js`. Fonts: Inter for Latin text and Noto Sans Devanagari for Hindi.

## Connecting a backend

Each function in `src/services/*.js` is async, returns plain JSON and is annotated with its planned endpoint
(`GET /api/elections`, `PUT /api/results/:id`, …). Replace the function bodies with `fetch` calls — Vite already
proxies `/api` to `http://localhost:4000` — and pages keep working unchanged. Records carry optional `…Hi`
fields for Hindi names; services throw errors with a `code` that maps to `errors.<code>` translations.
