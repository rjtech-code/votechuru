import { useState } from 'react'
import { AlertTriangle, Database, Info, Mail, MapPin, Send } from 'lucide-react'
import PageHeader, { PageBody } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Field, Input, Textarea } from '../components/ui/Form'
import { useToast } from '../context/ToastContext'
import { useLanguage } from '../i18n/I18nContext'
import { site } from '../config/site'

const EMPTY_FORM = { name: '', email: '', message: '' }

function ContactForm() {
  const { t } = useLanguage()
  const notify = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  // Errors are stored as translation keys so they follow a language switch.
  const validate = (values) => {
    const next = {}
    if (!values.name.trim()) next.name = 'pages.about.form.nameError'
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'pages.about.form.emailError'
    if (values.message.trim().length < 10) next.message = 'pages.about.form.messageError'
    return next
  }

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSending(false)
    setForm(EMPTY_FORM)
    notify(t('pages.about.form.sent'))
  }

  const error = (key) => errors[key] && t(errors[key])

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label={t('pages.about.form.name')} required error={error('name')}>
        {(props) => <Input {...props} value={form.name} onChange={update('name')} autoComplete="name" />}
      </Field>
      <Field label={t('pages.about.form.email')} required error={error('email')}>
        {(props) => <Input {...props} type="email" value={form.email} onChange={update('email')} autoComplete="email" />}
      </Field>
      <Field label={t('pages.about.form.message')} required error={error('message')}>
        {(props) => <Textarea {...props} value={form.message} onChange={update('message')} rows={4} />}
      </Field>
      <Button type="submit" icon={Send} loading={sending}>
        {t('pages.about.form.send')}
      </Button>
    </form>
  )
}

function SectionTitle({ icon: Icon, children, tone = 'text-brand-600' }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
      <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
      {children}
    </h2>
  )
}

export default function About() {
  const { t } = useLanguage()
  const coverage = [
    ['coverageWard', 'coverageWardText'],
    ['coverageShown', 'coverageShownText'],
  ]

  return (
    <>
      <PageHeader title={t('pages.about.title')} description={t('pages.about.description')} />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <SectionTitle icon={Info}>{t('pages.about.purposeTitle')}</SectionTitle>
              <p className="mt-3 leading-relaxed text-slate-600">{t('pages.about.purpose1')}</p>
              <p className="mt-3 leading-relaxed text-slate-600">{t('pages.about.purpose2')}</p>
            </Card>

            <Card className="p-6">
              <SectionTitle icon={MapPin}>{t('pages.about.coverageTitle')}</SectionTitle>
              <dl className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100">
                {coverage.map(([title, text]) => (
                  <div key={title} className="grid gap-1 px-4 py-3 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-bold text-navy-900">{t(`pages.about.${title}`)}</dt>
                    <dd className="text-sm text-slate-600 sm:col-span-2">{t(`pages.about.${text}`)}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card id="disclaimer" className="scroll-mt-24 border-[#f4d77e] bg-[#fffbeb] p-6">
              <SectionTitle icon={AlertTriangle} tone="text-[#b26a00]">
                {t('pages.about.disclaimerTitle')}
              </SectionTitle>
              <p className="mt-3 font-semibold leading-relaxed text-slate-800">{t('pages.about.disclaimer')}</p>
              <p className="mt-3 leading-relaxed text-slate-600">{t('pages.about.disclaimerMore')}</p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <SectionTitle icon={Mail}>{t('pages.about.contactTitle')}</SectionTitle>
              <p className="mt-3 text-sm text-slate-600">{t('pages.about.contactText')}</p>
              <p className="mt-2 text-sm text-slate-600">
                {t('pages.about.email')}:{' '}
                <a href={`mailto:${site.contactEmail}`} className="font-semibold text-brand-600 hover:text-brand-800">
                  {site.contactEmail}
                </a>
              </p>
              <div className="mt-5">
                <ContactForm />
              </div>
            </Card>
            <Card className="p-6">
              <SectionTitle icon={Database}>{t('pages.about.updatesTitle')}</SectionTitle>
              <p className="mt-2 text-sm text-slate-600">{t('pages.about.updatesText')}</p>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  )
}
