import { useRef } from 'react'
import { AlertCircle, Plus } from 'lucide-react'
import { Field, Input, Select } from '../ui/Form'
import Button from '../ui/Button'
import { useForm } from '../../hooks/useForm'
import { useLanguage } from '../../i18n/I18nContext'
import { useResults } from '../../context/ResultsContext'
import { validateCandidateInput } from '../../lib/wards'

const EMPTY = { name: '', party: '', wardNo: '', totalVotes: '', candidateCode: '' }

/**
 * Candidate result fields (Name, Party, Ward No., Total Votes, optional Candidate ID).
 * The ward must exist in the Ward Master. `onSubmit(record)` receives the cleaned record
 * and may throw an error with a `code` (e.g. DUPLICATE_RECORD) to show a translated
 * message, or return false to keep the form values (e.g. the admin kept existing data).
 * Without `formId`, the form renders its own submit button and clears after success.
 */
export default function ManualResultForm({ initial = EMPTY, onSubmit, formId, submitLabel }) {
  const { t } = useLanguage()
  const { wardMaster } = useResults()
  const nameRef = useRef(null)
  const knownWards = new Set(wardMaster.map((w) => w.wardNo))
  const validate = (values) => validateCandidateInput(values, knownWards).errors ?? {}
  const { bind, errors, handleSubmit, submitting, formError, reset } = useForm(
    {
      name: String(initial.name ?? ''),
      party: String(initial.party ?? ''),
      wardNo: String(initial.wardNo ?? ''),
      totalVotes: String(initial.totalVotes ?? ''),
      candidateCode: String(initial.candidateCode ?? ''),
    },
    validate,
  )
  const err = (key) => errors[key] && t(errors[key])
  const standalone = !formId

  const submit = async (values) => {
    const saved = await onSubmit(validateCandidateInput(values, knownWards).record)
    if (standalone && saved !== false) {
      reset()
      nameRef.current?.focus()
    }
  }

  const wardOptions = wardMaster.map((w) => ({ value: String(w.wardNo), label: `${t('common.ward', { ward: w.wardNo })}${w.wardName ? ` — ${w.wardName}` : ''}` }))

  return (
    <form id={formId} onSubmit={handleSubmit(submit)} noValidate>
      {formError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t(formError)}
        </div>
      )}
      <div className={standalone ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-6' : 'grid gap-4 sm:grid-cols-2'}>
        <Field label={t('admin.manual.name')} required error={err('name')} className={standalone ? 'lg:col-span-2' : 'sm:col-span-2'}>
          {(p) => <Input {...p} {...bind('name')} ref={nameRef} autoComplete="off" maxLength={120} />}
        </Field>
        <Field label={t('admin.manual.party')} required error={err('party')} className={standalone ? 'lg:col-span-2' : ''}>
          {(p) => <Input {...p} {...bind('party')} autoComplete="off" maxLength={80} />}
        </Field>
        <Field label={t('admin.manual.wardNo')} required error={err('wardNo')}>
          {(p) => <Select {...p} {...bind('wardNo')} options={wardOptions} placeholder={t('admin.manual.wardSelect')} />}
        </Field>
        <Field label={t('admin.manual.totalVotes')} required error={err('totalVotes')}>
          {(p) => <Input {...p} {...bind('totalVotes')} inputMode="numeric" autoComplete="off" />}
        </Field>
        <Field label={t('admin.manual.candidateCode')} error={err('candidateCode')} className={standalone ? 'lg:col-span-2' : ''}>
          {(p) => <Input {...p} {...bind('candidateCode')} autoComplete="off" maxLength={40} />}
        </Field>
        {standalone && (
          <div className="flex items-end sm:col-span-2 lg:col-span-4 lg:justify-end">
            <Button type="submit" icon={Plus} loading={submitting} className="w-full sm:w-auto">
              {submitLabel ?? t('admin.manual.submit')}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
