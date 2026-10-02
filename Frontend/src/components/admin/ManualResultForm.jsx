import { useRef } from 'react'
import { AlertCircle, Plus } from 'lucide-react'
import { Field, Input } from '../ui/Form'
import Button from '../ui/Button'
import { useForm } from '../../hooks/useForm'
import { useLanguage } from '../../i18n/I18nContext'
import { validateResultInput } from '../../lib/wards'

const EMPTY = { name: '', wardNo: '', totalVotes: '' }
const validate = (values) => validateResultInput(values).errors ?? {}

/**
 * The three result fields (Name, Ward No., Total Votes) with validation.
 * `onSubmit(record)` receives the cleaned record and may throw an error with a `code`
 * (e.g. DUPLICATE_RECORD, STORAGE_FULL) to show a translated message.
 * Without `formId`, the form renders its own submit button and clears after success.
 */
export default function ManualResultForm({ initial = EMPTY, onSubmit, formId, submitLabel }) {
  const { t } = useLanguage()
  const nameRef = useRef(null)
  const { bind, errors, handleSubmit, submitting, formError, reset } = useForm(
    { name: String(initial.name), wardNo: String(initial.wardNo), totalVotes: String(initial.totalVotes) },
    validate,
  )
  const err = (key) => errors[key] && t(errors[key])
  const standalone = !formId

  const submit = async (values) => {
    await onSubmit(validateResultInput(values).record)
    if (standalone) {
      reset()
      nameRef.current?.focus()
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit(submit)} noValidate>
      {formError && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t(formError)}
        </div>
      )}
      <div className={standalone ? 'grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-start' : 'grid gap-4 sm:grid-cols-2'}>
        <Field label={t('admin.manual.name')} required error={err('name')} className={standalone ? '' : 'sm:col-span-2'}>
          {(p) => <Input {...p} {...bind('name')} ref={nameRef} autoComplete="off" maxLength={120} />}
        </Field>
        <Field label={t('admin.manual.wardNo')} required error={err('wardNo')}>
          {(p) => <Input {...p} {...bind('wardNo')} inputMode="numeric" autoComplete="off" />}
        </Field>
        <Field label={t('admin.manual.totalVotes')} required error={err('totalVotes')}>
          {(p) => <Input {...p} {...bind('totalVotes')} inputMode="numeric" autoComplete="off" />}
        </Field>
        {standalone && (
          <div className="md:pt-7">
            <Button type="submit" icon={Plus} loading={submitting} className="w-full md:w-auto">
              {submitLabel ?? t('admin.manual.submit')}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
