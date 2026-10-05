import { useState } from 'react'
import { AlertTriangle, CalendarX, MapPinOff, Trash2, UserX } from 'lucide-react'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useResults } from '../../context/ResultsContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/I18nContext'

function DangerRow({ title, text, note, button, icon, disabled, onClick }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold text-navy-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{text}</p>
        {note && <p className="mt-1 text-xs font-semibold text-amber-700">{note}</p>}
      </div>
      <Button variant="danger" icon={icon} onClick={onClick} disabled={disabled} className="shrink-0">
        {button}
      </Button>
    </div>
  )
}

/**
 * Separate, confirmed resets. Resetting results keeps wards, candidates and the schedule;
 * resetting candidates also removes their results; the Ward Master can only be reset once
 * no candidate records depend on it.
 */
export default function DangerZone() {
  const { t, formatNumber, errorText } = useLanguage()
  const { candidates, wardMaster, resetResults, resetCandidates, resetWards } = useResults()
  const resultCount = candidates.filter((c) => c.totalVotes != null).length
  const { electionDateTime, resultDeclarationDateTime, clearSchedule } = useSettings()
  const notify = useToast()
  const [confirming, setConfirming] = useState(null) // 'results' | 'wards' | 'schedule'
  const close = () => setConfirming(null)

  const dialogs = {
    results: {
      title: t('admin.danger.confirmTitle'),
      message: (
        <>
          {t('admin.danger.confirmText')}
          <span className="mt-2 block text-slate-500">{t('admin.danger.confirmKeeps')}</span>
        </>
      ),
      label: t('admin.danger.button'),
      run: async () => {
        await resetResults()
        notify(t('admin.danger.done'))
      },
    },
    candidates: {
      title: t('admin.danger.candidatesConfirmTitle'),
      message: t('admin.danger.candidatesConfirmText', { count: formatNumber(candidates.length) }),
      label: t('admin.danger.candidatesButton'),
      run: async () => {
        await resetCandidates()
        notify(t('admin.danger.candidatesDone'))
      },
    },
    wards: {
      title: t('admin.danger.wardsConfirmTitle'),
      message: t('admin.danger.wardsConfirmText', { count: formatNumber(wardMaster.length) }),
      label: t('admin.danger.wardsButton'),
      run: async () => {
        await resetWards()
        notify(t('admin.danger.wardsDone'))
      },
    },
    schedule: {
      title: t('admin.danger.scheduleConfirmTitle'),
      message: t('admin.danger.scheduleConfirmText'),
      label: t('admin.danger.scheduleButton'),
      run: async () => {
        await clearSchedule()
        notify(t('admin.danger.scheduleDone'))
      },
    },
  }
  const dialog = confirming && dialogs[confirming]

  return (
    <section aria-labelledby="danger-zone" className="rounded-xl border border-red-200 bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]">
      <div className="border-b border-red-100 px-5 py-4">
        <h2 id="danger-zone" className="flex items-center gap-2 text-base font-bold text-red-700">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          {t('admin.danger.title')}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">{t('admin.danger.text')}</p>
      </div>
      <div className="divide-y divide-slate-100">
        <DangerRow
          title={t('admin.danger.resultsTitle')}
          text={t('admin.danger.resultsText')}
          note={t('admin.danger.stored', { count: formatNumber(resultCount), wards: formatNumber(wardMaster.length) })}
          button={t('admin.danger.button')}
          icon={Trash2}
          disabled={!resultCount}
          onClick={() => setConfirming('results')}
        />
        <DangerRow
          title={t('admin.danger.candidatesTitle')}
          text={t('admin.danger.candidatesText')}
          note={t('admin.danger.candidatesStored', { count: formatNumber(candidates.length) })}
          button={t('admin.danger.candidatesButton')}
          icon={UserX}
          disabled={!candidates.length}
          onClick={() => setConfirming('candidates')}
        />
        <DangerRow
          title={t('admin.danger.wardsTitle')}
          text={t('admin.danger.wardsText')}
          note={candidates.length ? t('admin.danger.wardsBlocked') : null}
          button={t('admin.danger.wardsButton')}
          icon={MapPinOff}
          disabled={!wardMaster.length || candidates.length > 0}
          onClick={() => setConfirming('wards')}
        />
        <DangerRow
          title={t('admin.danger.scheduleTitle')}
          text={t('admin.danger.scheduleText')}
          button={t('admin.danger.scheduleButton')}
          icon={CalendarX}
          disabled={!electionDateTime && !resultDeclarationDateTime}
          onClick={() => setConfirming('schedule')}
        />
      </div>
      <ConfirmDialog open={Boolean(dialog)} title={dialog?.title} message={dialog?.message} confirmLabel={dialog?.label} onConfirm={async () => {
          try {
            await dialog.run()
          } catch (error) {
            if (error.code !== 'UNAUTHORIZED') notify(errorText(error), 'error')
          }
        }} onClose={close} />
    </section>
  )
}
