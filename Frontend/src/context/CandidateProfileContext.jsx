import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ImagePlus, Trash2 } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import CandidateAvatar from '../components/CandidateAvatar'
import StatusBadge, { wardStatus } from '../components/StatusBadge'
import { useResults } from './ResultsContext'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { useLanguage } from '../i18n/I18nContext'
import { prepareCandidateImage } from '../lib/image'

const CandidateProfileContext = createContext(null)

const IMAGE_ERRORS = { IMAGE_INVALID: 'profile.imageInvalid', IMAGE_TOO_LARGE: 'profile.imageTooLarge', IMAGE_ERROR: 'profile.imageError' }

function ProfileBody({ candidate, manage }) {
  const { t, formatNumber, formatPercent, errorText } = useLanguage()
  const { setCandidateImage } = useResults()
  const notify = useToast()
  const inputRef = useRef(null)
  const [errorKey, setErrorKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { ward } = candidate
  const isWinner = ward.winner?.id === candidate.id

  const onFile = async (file) => {
    if (!file) return
    setErrorKey('')
    setBusy(true)
    try {
      await setCandidateImage(candidate.id, await prepareCandidateImage(file))
      notify(t('profile.imageSaved'))
    } catch (error) {
      if (error.code === 'UNAUTHORIZED') return
      setErrorKey(IMAGE_ERRORS[error.code] ?? (error.status ? '' : 'profile.imageError'))
      if (!IMAGE_ERRORS[error.code] && error.status) notify(errorText(error), 'error')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const details = [
    [t('result.ward'), `${t('common.ward', { ward: ward.wardNo })}${ward.wardName ? ` — ${ward.wardName}` : ''}`],
    [t('result.totalVotes'), formatNumber(candidate.totalVotes)],
    [t('result.position'), t('profile.positionOf', { position: candidate.position, total: ward.rows.length })],
    [t('result.percent'), formatPercent(candidate.percent)],
    candidate.candidateCode && [t('profile.candidateCode'), candidate.candidateCode],
  ].filter(Boolean)

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <CandidateAvatar candidate={candidate} size="lg" />
        <p className="mt-3 text-xl font-extrabold text-navy-900">{candidate.name}</p>
        <p className="text-sm text-slate-600">{candidate.party || '—'}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {isWinner && (
            <Badge tone="green" icon={CheckCircle2}>
              {t('profile.winnerDeclared')}
            </Badge>
          )}
          {!isWinner && <StatusBadge status={wardStatus(ward)} />}
        </div>
      </div>

      <dl className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-100 text-sm">
        {details.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-semibold text-navy-900">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt className="text-slate-500">{t('profile.resultStatus')}</dt>
          <dd>
            <StatusBadge status={wardStatus(ward)} />
          </dd>
        </div>
      </dl>

      {manage && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0])} aria-label={t('profile.uploadImage')} />
          {errorKey && (
            <p role="alert" className="mb-3 flex items-start gap-1.5 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t(errorKey)}
            </p>
          )}
          {confirmRemove ? (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">{t('profile.removeTitle')}</p>
              <p className="mt-1">{t('profile.removeConfirm', { name: candidate.name })}</p>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmRemove(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={busy}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      await setCandidateImage(candidate.id, null)
                      setConfirmRemove(false)
                      notify(t('profile.imageRemoved'))
                    } catch (error) {
                      if (error.code !== 'UNAUTHORIZED') notify(errorText(error), 'error')
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  {t('profile.removeImage')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant={candidate.image ? 'secondary' : 'primary'} size="sm" icon={ImagePlus} loading={busy} onClick={() => inputRef.current?.click()}>
                {candidate.image ? t('profile.replaceImage') : t('profile.uploadImage')}
              </Button>
              {candidate.image && (
                <Button variant="ghost" size="sm" icon={Trash2} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmRemove(true)}>
                  {t('profile.removeImage')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Candidate profile popup available everywhere. Public pages open it read-only;
 * admin pages pass { manage: true } to show photo controls (only for a signed-in admin).
 */
export function CandidateProfileProvider({ children }) {
  const { t } = useLanguage()
  const { getCandidate, scope } = useResults()
  const { user } = useAuth()
  const [open, setOpen] = useState(null) // { id, manage }

  const openProfile = useCallback((id, { manage = false } = {}) => setOpen({ id, manage }), [])
  const close = useCallback(() => setOpen(null), [])
  const value = useMemo(() => ({ openProfile }), [openProfile])
  const candidate = open && getCandidate(open.id)

  return (
    <CandidateProfileContext.Provider value={value}>
      {children}
      <Modal open={Boolean(open)} onClose={close} title={t('profile.title')} size="sm">
        {candidate ? (
          <ProfileBody key={candidate.id} candidate={candidate} manage={open.manage && scope === 'admin' && Boolean(user)} />
        ) : (
          <p className="text-sm text-slate-600">{t('profile.notFound')}</p>
        )}
      </Modal>
    </CandidateProfileContext.Provider>
  )
}

export function useCandidateProfile() {
  const context = useContext(CandidateProfileContext)
  if (!context) throw new Error('useCandidateProfile must be used inside CandidateProfileProvider')
  return context
}
