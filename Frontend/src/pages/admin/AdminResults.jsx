import { useState } from 'react'
import { Upload } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import FormModal from '../../components/admin/FormModal'
import ManualResultForm from '../../components/admin/ManualResultForm'
import RowActions from '../../components/admin/RowActions'
import FilterBar from '../../components/FilterBar'
import { Card } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination, { paginate } from '../../components/ui/Pagination'
import { EmptyState } from '../../components/ui/States'
import { useResults } from '../../context/ResultsContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/I18nContext'

const PAGE_SIZE = 25

export default function AdminResults() {
  const { t, formatNumber } = useLanguage()
  const { records, wards, updateResult, deleteResult, findDuplicates } = useResults()
  const notify = useToast()
  const [filters, setFilters] = useState({ q: '', ward: '' })
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const q = filters.q.trim().toLowerCase()
  const rows = records
    .filter((r) => (!filters.ward || r.wardNo === Number(filters.ward)) && (!q || r.name.toLowerCase().includes(q)))
    .sort((a, b) => a.wardNo - b.wardNo || b.totalVotes - a.totalVotes)
  const { pageItems, pageCount, current } = paginate(rows, page, PAGE_SIZE)

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const saveEdit = async (record) => {
    if (findDuplicates([record], editing.id).duplicates.length) throw Object.assign(new Error('Duplicate'), { code: 'DUPLICATE_RECORD' })
    updateResult(editing.id, record)
    setEditing(null)
    notify(t('admin.results.updated'))
  }

  const recordLine = (r) => r && t('admin.results.recordLine', { name: r.name, ward: r.wardNo, votes: formatNumber(r.totalVotes) })

  const C = 'admin.columns.'
  const columns = [
    { key: 'name', header: t(`${C}name`), render: (r) => <span className="font-semibold text-navy-900">{r.name}</span> },
    { key: 'wardNo', header: t(`${C}wardNo`), className: 'tabular-nums', render: (r) => r.wardNo },
    { key: 'totalVotes', header: t(`${C}totalVotes`), align: 'right', className: 'tabular-nums', render: (r) => formatNumber(r.totalVotes) },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      render: (r) => <RowActions label={r.name} onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />,
    },
  ]

  return (
    <>
      <AdminPageHeader title={t('admin.results.title')} description={t('admin.results.description')} />

      {!records.length ? (
        <Card>
          <EmptyState
            title={t('admin.dashboard.emptyTitle')}
            description={t('admin.dashboard.emptyText')}
            action={<Button to="/admin/upload" icon={Upload}>{t('admin.results.emptyCta')}</Button>}
          />
        </Card>
      ) : (
        <>
          <FilterBar
            className="mb-6"
            search={filters.q}
            onSearchChange={(value) => updateFilter('q', value)}
            searchPlaceholder={t('admin.results.search')}
            values={filters}
            onChange={updateFilter}
            onReset={() => {
              setFilters({ q: '', ward: '' })
              setPage(1)
            }}
            canReset={Boolean(filters.q || filters.ward)}
            filters={[{ key: 'ward', label: t('field.ward'), options: wards.map((w) => ({ value: String(w.wardNo), label: t('common.ward', { ward: w.wardNo }) })) }]}
          />
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-5" aria-live="polite">
              {t('admin.results.count', { count: formatNumber(rows.length) })}
            </div>
            {rows.length ? (
              <>
                <Table columns={columns} rows={pageItems} caption={t('admin.results.title')} />
                <Pagination page={current} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            ) : (
              <EmptyState />
            )}
          </Card>
        </>
      )}

      {editing && (
        <FormModal
          open
          onClose={() => setEditing(null)}
          size="md"
          title={t('admin.results.editTitle')}
          formId="edit-result-form"
          submitLabel={t('admin.manual.save')}
        >
          <ManualResultForm formId="edit-result-form" initial={editing} onSubmit={saveEdit} />
        </FormModal>
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('admin.results.deleteTitle')}
        message={
          <>
            {t('admin.results.deleteMessage')}
            <span className="mt-2 block font-semibold text-navy-900">{recordLine(deleting)}</span>
          </>
        }
        onConfirm={() => {
          deleteResult(deleting.id)
          notify(t('admin.results.deleted'))
        }}
        onClose={() => setDeleting(null)}
      />
    </>
  )
}
