import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminHeader'
import { ErrorState, LoadingState } from '../components/ui/States'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ResultsProvider, useResults } from '../context/ResultsContext'
import { CandidateProfileProvider } from '../context/CandidateProfileContext'
import { useLanguage } from '../i18n/I18nContext'

/** Shows the admin pages once the data has loaded from the API. */
function AdminDataGate({ children }) {
  const { ready, error, reload, wardMaster } = useResults()
  if (!ready) return <LoadingState />
  if (error && !wardMaster.length) return <ErrorState onRetry={reload} />
  return children
}

/** Protected admin shell. Unauthenticated visitors are sent to the login page. */
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />

  const handleLogout = () => {
    logout()
    notify(t('admin.signedOut'))
    navigate('/admin/login', { replace: true })
  }

  return (
    <ResultsProvider scope="admin">
      <CandidateProfileProvider>
        <div className="min-h-screen bg-canvas">
          <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          <div className="lg:pl-64">
            <AdminHeader user={user} sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
              <AdminDataGate>
                <Outlet />
              </AdminDataGate>
            </main>
          </div>
        </div>
      </CandidateProfileProvider>
    </ResultsProvider>
  )
}
