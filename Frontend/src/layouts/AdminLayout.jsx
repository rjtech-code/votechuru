import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AdminSidebar from '../components/admin/AdminSidebar'
import AdminHeader from '../components/admin/AdminHeader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../i18n/I18nContext'

/** Protected admin shell. Unauthenticated visitors are sent to the login page. */
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const notify = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return <Navigate to="/admin" replace state={{ from: location.pathname }} />

  const handleLogout = () => {
    logout()
    notify(t('admin.signedOut'))
    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
      <div className="lg:pl-64">
        <AdminHeader user={user} sidebarOpen={sidebarOpen} onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
