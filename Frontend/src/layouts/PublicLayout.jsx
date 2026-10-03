import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ErrorState, LoadingState } from '../components/ui/States'
import { ResultsProvider, useResults } from '../context/ResultsContext'
import { CandidateProfileProvider } from '../context/CandidateProfileContext'
import { useLanguage } from '../i18n/I18nContext'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

// Information pages render without results data, so they work even if the API is unreachable.
const STATIC_PAGES = ['/government-initiatives', '/voter-information', '/about']

/** Holds back result pages until the first API load, so nothing shows "not found" or zeros early. */
function PublicDataGate({ children }) {
  const { pathname } = useLocation()
  const { ready, error, reload, wardMaster } = useResults()
  if (STATIC_PAGES.includes(pathname.replace(/\/+$/, ''))) return children
  if (!ready) return <LoadingState className="py-24" />
  if (error && !wardMaster.length) return <ErrorState className="py-24" onRetry={reload} />
  return children
}

/** Public shell. Its data provider only ever receives declared results from the API. */
export default function PublicLayout() {
  const { t } = useLanguage()
  return (
    <ResultsProvider scope="public">
      <CandidateProfileProvider>
        <div className="flex min-h-screen flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-card-hover"
          >
            {t('nav.skip')}
          </a>
          <ScrollToTop />
          <Header />
          <main id="main-content" className="flex-1">
            <PublicDataGate>
              <Outlet />
            </PublicDataGate>
          </main>
          <Footer />
        </div>
      </CandidateProfileProvider>
    </ResultsProvider>
  )
}
