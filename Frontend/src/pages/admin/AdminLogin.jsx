import { Link, Navigate, useLocation } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Info, LogIn } from 'lucide-react'
import { LogoTile } from '../../components/BrandMark'
import HeroSkyline from '../../components/HeroSkyline'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Form'
import { useForm } from '../../hooks/useForm'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n/I18nContext'

function validate(v) {
  const errors = {}
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = 'admin.login.emailError'
  if (!v.password) errors.password = 'admin.login.passwordError'
  return errors
}

/** /admin — Super Admin login. Credentials are checked by the API server only. */
export default function AdminLogin() {
  const { user, login } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const { bind, errors, handleSubmit, submitting, formError } = useForm({ email: '', password: '' }, validate)
  const err = (key) => errors[key] && t(errors[key])
  const sessionExpired = location.state?.reason === 'expired'

  // Logging in sets `user`, which redirects to the page the admin originally asked for.
  if (user) {
    const from = location.state?.from
    return <Navigate to={from && from !== '/admin/login' ? from : '/admin'} replace />
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-canvas">
      {/* Navy band with the skyline, echoing the public hero */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[46vh] min-h-[300px] overflow-hidden bg-gradient-to-b from-[#132c63] to-[#183673]">
        <HeroSkyline className="absolute inset-x-0 bottom-0 h-full w-full" />
      </div>

      <div className="container-page flex items-center justify-end py-4">
        <LanguageSwitcher />
      </div>

      <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:pt-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-center gap-3 text-white">
            <LogoTile className="h-12 w-12" />
            <div className="leading-tight">
              <p className="text-[20px] font-extrabold">{t('site.title')}</p>
              <p className="text-[13px] text-white/80">{t('admin.panel')}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_32px_rgba(4,14,40,0.18)] sm:p-8">
            <h1 className="text-xl font-extrabold text-navy-900">{t('admin.login.title')}</h1>
            <p className="mt-1 text-sm text-slate-500">{t('admin.login.subtitle')}</p>

            {sessionExpired && !formError && (
              <div role="status" className="mt-5 flex items-start gap-2 rounded-lg border border-[#f4d77e] bg-[#fffbeb] px-3 py-2.5 text-sm text-[#7a4a06]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t('errors.UNAUTHORIZED')}
              </div>
            )}
            {formError && (
              <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {t(formError)}
              </div>
            )}

            <form onSubmit={handleSubmit(({ email, password }) => login(email, password))} noValidate className="mt-6 space-y-4">
              <Field label={t('admin.login.email')} required error={err('email')}>
                {(p) => <Input {...p} {...bind('email')} type="email" autoComplete="username" />}
              </Field>
              <Field label={t('admin.login.password')} required error={err('password')}>
                {(p) => <Input {...p} {...bind('password')} type="password" autoComplete="current-password" />}
              </Field>
              <Button type="submit" icon={LogIn} loading={submitting} className="w-full bg-navy-800 hover:bg-navy-700">
                {t('admin.login.submit')}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center">
            <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-navy-900">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('admin.login.back')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
