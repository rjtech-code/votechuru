import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import Results from './pages/Results'
import WardResult from './pages/WardResult'
import Candidates from './pages/Candidates'
import PreviousElections from './pages/PreviousElections'
import ElectionSummary from './pages/ElectionSummary'
import MapPage from './pages/Map'
import About from './pages/About'
import NotFound from './pages/NotFound'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminResults from './pages/admin/AdminResults'
import AdminUpload from './pages/admin/AdminUpload'
import AdminSettings from './pages/admin/AdminSettings'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="results" element={<Results />} />
        <Route path="results/:wardNo" element={<WardResult />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="previous-elections" element={<PreviousElections />} />
        <Route path="election-summary" element={<ElectionSummary />} />
        <Route path="map" element={<MapPage />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Not linked from the public site: administration is reached by visiting /admin directly. */}
      <Route path="admin">
        <Route index element={<AdminLogin />} />
        <Route path="login" element={<Navigate to="/admin" replace />} />
        <Route element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="upload" element={<AdminUpload />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
