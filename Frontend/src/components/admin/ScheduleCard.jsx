import { useState } from 'react'
import { CalendarClock, Save, X } from 'lucide-react'
import { Card, CardHeader } from '../ui/Card'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { Field, Input } from '../ui/Form'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/I18nContext'

const pad = (n) => String(n).padStart(2, '0')
/** Splits a stored ISO date-time into local <input type=date/time> values. */
function toInputs(iso) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` }
}

/** Editor for one scheduled event; the weekday is calculated from the chosen date. */
function EventEditor({ settingKey, labelKey }) {
  const { t, errorText, formatDate, formatWeekday, formatTime } = useLanguage()
  const settings = useSettings()
  const notify = useToast()
  const stored = settings[settingKey]
  const [values, setValues] = useState(() => toInputs(stored))
  const [errors, setErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const label = t(labelKey)
  const isFuture = stored && new Date(stored).getTime() > Date.now()

  const save = async (event) => {
    event.preventDefault()
    const next = {}
    if (!values.date) next.date = 'admin.schedule.dateRequired'
    if (!values.time) next.time = 'admin.schedule.timeRequired'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await settings.setEventDateTime(settingKey, new Date(`${values.date}T${values.time}:00`).toISOString())
      notify(t('admin.schedule.saved'))
    } catch (error) {
      if (error.code !== 'UNAUTHORIZED') notify(errorText(error), 'error')
    }
  }

  return (
    <form onSubmit={save} noValidate className="rounded-lg border border-slate-200/80 p-4">
      <p className="text-sm font-bold text-navy-900">{label}</p>
      <p className="mt-1 text-xs text-slate-500">
        {t('admin.schedule.current')}:{' '}
        <span className="font-semibold text-navy-900">
          {stored ? `${formatDate(stored)} · ${formatWeekday(stored)} · ${formatTime(stored)}` : t('admin.schedule.notSet')}
        </span>
      </p>
      {stored && <p className={`mt-0.5 text-xs ${isFuture ? 'text-emerald-700' : 'text-amber-700'}`}>{isFuture ? t('admin.schedule.upcoming') : t('admin.schedule.past')}</p>}
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_8rem]">
        <Field label={t('admin.schedule.date')} required error={errors.date && t(errors.date)}>
          {(p) => <Input {...p} type="date" value={values.date} onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))} />}
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">{t('admin.schedule.day')}</p>
          <p className="flex h-10 min-w-[6rem] items-center rounded-lg bg-slate-50 px-3 text-sm font-semibold text-navy-900" aria-live="polite">
            {values.date ? formatWeekday(values.date) : '—'}
          </p>
        </div>
        <Field label={t('admin.schedule.time')} required error={errors.time && t(errors.time)}>
          {(p) => <Input {...p} type="time" value={values.time} onChange={(e) => setValues((v) => ({ ...v, time: e.target.value }))} />}
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {stored && (
          <Button variant="ghost" size="sm" icon={X} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirming(true)}>
            {t('admin.schedule.clear')}
          </Button>
        )}
        <Button type="submit" size="sm" icon={Save}>
          {t('admin.schedule.save')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title={t('admin.schedule.clearTitle')}
        message={t('admin.schedule.clearConfirm', { event: label })}
        confirmLabel={t('admin.schedule.clear')}
        onConfirm={async () => {
          try {
            await settings.setEventDateTime(settingKey, null)
            setValues({ date: '', time: '' })
            notify(t('admin.schedule.cleared'))
          } catch (error) {
            if (error.code !== 'UNAUTHORIZED') notify(errorText(error), 'error')
          }
        }}
        onClose={() => setConfirming(false)}
      />
    </form>
  )
}

/** Election Schedule page section: the election date and the result declaration date. */
export default function ScheduleCard() {
  const { t } = useLanguage()
  return (
    <Card as="section" aria-labelledby="schedule-title">
      <CardHeader
        title={
          <span id="schedule-title" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand-600" aria-hidden="true" />
            {t('admin.schedule.title')}
          </span>
        }
        description={t('admin.schedule.description')}
      />
      <div className="grid gap-4 p-5 xl:grid-cols-2">
        <EventEditor settingKey="electionDateTime" labelKey="admin.schedule.election" />
        <EventEditor settingKey="resultDeclarationDateTime" labelKey="admin.schedule.result" />
      </div>
    </Card>
  )
}
