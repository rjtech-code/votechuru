import { useState } from 'react'
import { Eye, Plus } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import WardUploadSection from '../../components/admin/WardUploadSection'
import ColumnList from '../../components/admin/ColumnList'
import FormModal from '../../components/admin/FormModal'
import RowActions from '../../components/admin/RowActions'
import SearchBar from '../../components/SearchBar'
import StatusBadge, { wardStatus } from '../../components/StatusBadge'
import { Card, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Table from '../../components/ui/Table'
import Pagination, { paginate } from '../../components/ui/Pagination'
import { EmptyState } from '../../components/ui/States'
import { Field, Input, Textarea } from '../../components/ui/Form'
import { useForm } from '../../hooks/useForm'
import { useResults } from '../../context/ResultsContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/I18nContext'
import { validateWardInput } from '../../lib/wards'

const PAGE_SIZE = 25
const F = 'admin.wards.form.'
const validate = (values) => validateWardInput(values).errors ?? {}

/** Add (ward === null) or edit a ward. The ward number is the identity and is fixed when editing. */
function WardForm({ ward, onSubmit, onClose }) {
  const { t } = useLanguage()
  const { bind, errors, handleSubmit, submitting, formError } = useForm(
    { wardNo: ward ? String(ward.wardNo) : '', wardName: ward?.wardName ?? '', areas: ward?.areas ?? '', totalVoters: ward?.totalVoters != null ? String(ward.totalVoters) : '' },
    validate,
  )
  const err = (key) => errors[key] && t(errors[key])
  return (
    <FormModal
      open
      onClose={onClose}
      size="md"
      title={ward ? t('admin.wards.editTitle', { ward: ward.wardNo }) : t('admin.wards.add')}
      formId="ward-form"
      submitLabel={t(`${F}save`)}
      submitting={submitting}
      formError={formError}
    >
      <form id="ward-form" onSubmit={handleSubmit((values) => onSubmit(validateWardInput(values).record))} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label={t(`${F}wardNo`)} required error={err('wardNo')} hint={ward ? t(`${F}wardFixed`) : undefined}>
          {(p) => <Input {...p} {...bind('wardNo')} inputMode="numeric" disabled={Boolean(ward)} />}
        </Field>
        <Field label={t(`${F}totalVoters`)} error={err('totalVoters')}>
          {(p) => <Input {...p} {...bind('totalVoters')} inputMode="numeric" />}
        </Field>
        <Field label={t(`${F}wardName`)} error={err('wardName')} className="sm:col-span-2">
          {(p) => <Input {...p} {...bind('wardName')} maxLength={120} />}
        </Field>
        <Field label={t(`${F}areas`)} error={err('areas')} className="sm:col-span-2">
          {(p) => <Textarea {...p} {...bind('areas')} rows={2} maxLength={500} />}
        </Field>
      </form>
    </FormModal>
  )
}

/** /admin/wards — Ward Master upload and management. */
export default function AdminWards() {
  const { t, formatNumber } = useLanguage()
  const { wards, addWard, updateWard, deleteWard } = useResults()
  const notify = useToast()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null) // { type: 'add' | 'edit' | 'view' | 'delete', ward? }
  const close = () => setDialog(null)
  const dash = <span className="text-slate-400">—</span>

  const q = query.trim().toLowerCase()
  const visible = wards.filter(
    (w) => !q || String(w.wardNo) === q.replace(/\D/g, '') || [w.wardName, w.areas].some((v) => v?.toLowerCase().includes(q)),
  )
  const { pageItems, pageCount, current } = paginate(visible, page, PAGE_SIZE)

  const C = 'admin.wards.columns.'
  const columns = [
    { key: 'wardNo', header: t(`${C}wardNo`), className: 'whitespace-nowrap font-semibold text-navy-900 tabular-nums', render: (w) => w.wardNo },
    { key: 'wardName', header: t(`${C}wardName`), render: (w) => w.wardName ?? dash },
    { key: 'areas', header: t(`${C}areas`), className: 'max-w-[18rem]', render: (w) => (w.areas ? <span className="line-clamp-2">{w.areas}</span> : dash) },
    { key: 'totalVoters', header: t(`${C}totalVoters`), align: 'right', className: 'tabular-nums', render: (w) => (w.totalVoters != null ? formatNumber(w.totalVoters) : dash) },
    { key: 'candidates', header: t(`${C}candidates`), align: 'right', className: 'tabular-nums', render: (w) => formatNumber(w.rows.length) },
    { key: 'status', header: t(`${C}status`), render: (w) => <StatusBadge status={wardStatus(w)} /> },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      render: (w) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setDialog({ type: 'view', ward: w })}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-label={`${t('admin.wards.view')} — ${t('common.ward', { ward: w.wardNo })}`}
            title={t('admin.wards.view')}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
          <RowActions label={t('common.ward', { ward: w.wardNo })} onEdit={() => setDialog({ type: 'edit', ward: w })} onDelete={() => setDialog({ type: 'delete', ward: w })} />
        </div>
      ),
    },
  ]

  const saveWard = async (record) => {
    if (dialog.type === 'add') {
      addWard(record)
      notify(t('admin.wards.added'))
    } else {
      updateWard(dialog.ward.wardNo, record)
      notify(t('admin.wards.updated'))
    }
    close()
  }

  const deleting = dialog?.type === 'delete' ? dialog.ward : null
  const viewing = dialog?.type === 'view' ? dialog.ward : null

  return (
    <>
      <AdminPageHeader
        title={t('admin.wards.title')}
        description={t('admin.wards.description')}
        actions={
          <Button icon={Plus} onClick={() => setDialog({ type: 'add' })}>
            {t('admin.wards.add')}
          </Button>
        }
      />
      <div className="space-y-6">
        <Card as="section" aria-labelledby="ward-upload-title">
          <CardHeader
            title={<span id="ward-upload-title">{t('admin.wards.uploadTitle')}</span>}
            description={<ColumnList required={['Ward No.']} optional={['Ward Name', 'Area / Localities', 'Total Voters']} requiredKey="admin.wards.requiredColumn" optionalKey="admin.wards.optionalColumns" />}
          />
          <div className="p-5">
            <WardUploadSection />
          </div>
        </Card>

        <Card as="section" aria-labelledby="ward-list-title" className="overflow-hidden">
          <CardHeader title={<span id="ward-list-title">{t('admin.wards.listTitle')}</span>} description={t('admin.wards.listText')} />
          {!wards.length ? (
            <EmptyState title={t('admin.wards.empty')} description={t('admin.wards.emptyText')} />
          ) : (
            <>
              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchBar
                  id="ward-search"
                  value={query}
                  onChange={(value) => {
                    setQuery(value)
                    setPage(1)
                  }}
                  placeholder={t('admin.wards.search')}
                  className="sm:w-80"
                />
                <p className="text-sm text-slate-500" aria-live="polite">
                  {t('admin.wards.count', { count: formatNumber(visible.length) })}
                </p>
              </div>
              {visible.length ? (
                <>
                  <Table columns={columns} rows={pageItems} rowKey={(w) => w.wardNo} caption={t('admin.wards.listTitle')} />
                  <Pagination page={current} pageCount={pageCount} total={visible.length} pageSize={PAGE_SIZE} onChange={setPage} />
                </>
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </Card>
      </div>

      {(dialog?.type === 'add' || dialog?.type === 'edit') && <WardForm ward={dialog.type === 'edit' ? dialog.ward : null} onSubmit={saveWard} onClose={close} />}

      <Modal open={Boolean(viewing)} onClose={close} title={viewing ? t('admin.wards.viewTitle', { ward: viewing.wardNo }) : ''} size="sm">
        {viewing && (
          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 text-sm">
            {[
              [t(`${C}wardName`), viewing.wardName ?? '—'],
              [t(`${C}areas`), viewing.areas ?? '—'],
              [t(`${C}totalVoters`), viewing.totalVoters != null ? formatNumber(viewing.totalVoters) : '—'],
              [t(`${C}candidates`), formatNumber(viewing.rows.length)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-semibold text-navy-900">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-slate-500">{t(`${C}status`)}</dt>
              <dd>
                <StatusBadge status={wardStatus(viewing)} />
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('admin.wards.deleteTitle')}
        message={
          deleting &&
          (deleting.rows.length ? (
            <span className="text-red-700">{t('admin.wards.deleteHasCandidates', { ward: deleting.wardNo, count: formatNumber(deleting.rows.length) })}</span>
          ) : (
            t('admin.wards.deleteConfirm', { ward: deleting.wardNo })
          ))
        }
        confirmLabel={deleting?.rows.length ? t('admin.wards.deleteWithCandidates') : t('admin.wards.deleteWard')}
        onConfirm={() => {
          deleteWard(deleting.wardNo, { withCandidates: deleting.rows.length > 0 })
          notify(t('admin.wards.deleted'))
        }}
        onClose={close}
      />
    </>
  )
}
