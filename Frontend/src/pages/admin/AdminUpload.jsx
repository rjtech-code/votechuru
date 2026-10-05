import { useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import ResultUploadSection from '../../components/admin/ResultUploadSection'
import ColumnList from '../../components/admin/ColumnList'
import { Card, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Field, Select } from '../../components/ui/Form'
import { EmptyState } from '../../components/ui/States'
import { useResults } from '../../context/ResultsContext'
import { useLanguage } from '../../i18n/I18nContext'

/** /admin/results/upload[?ward=N] — result sheet upload for all wards or for one ward. */
export default function AdminUpload() {
  const { t } = useLanguage()
  const { wardMaster, candidates } = useResults()
  const [searchParams, setSearchParams] = useSearchParams()
  const param = searchParams.get('ward')
  const wardNo = param && /^\d{1,6}$/.test(param) ? Number(param) : null
  const wardExists = !param || wardMaster.some((w) => w.wardNo === wardNo)

  return (
    <>
      <AdminPageHeader
        title={wardNo ? t('admin.resultUpload.titleWard', { ward: wardNo }) : t('admin.resultUpload.title')}
        description={t('admin.resultUpload.description')}
        actions={
          <Button to="/admin/results" variant="secondary" icon={ArrowLeft}>
            {t('admin.back')}
          </Button>
        }
      />
      <div className="space-y-6">
        <Card as="section" aria-labelledby="result-upload-title">
          <CardHeader
            title={<span id="result-upload-title">{t('admin.resultUpload.cardTitle')}</span>}
            description={<ColumnList required={['Candidate ID', 'Ward No.', 'Total Votes']} />}
            action={
              wardMaster.length > 0 && (
                <Field label={t('admin.resultUpload.scope')} className="w-full sm:w-56">
                  {(p) => (
                    <Select
                      {...p}
                      value={wardNo ? String(wardNo) : ''}
                      onChange={(event) => setSearchParams(event.target.value ? { ward: event.target.value } : {}, { replace: true })}
                      placeholder={t('admin.resultUpload.allWards')}
                      options={wardMaster.map((w) => ({ value: String(w.wardNo), label: t('common.ward', { ward: w.wardNo }) }))}
                    />
                  )}
                </Field>
              )
            }
          />
          <div className="p-5">
            {!wardExists ? (
              <EmptyState title={t('errors.WARD_NOT_FOUND')} description={null} action={<Button to="/admin/results/upload">{t('admin.resultUpload.allWards')}</Button>} />
            ) : !candidates.length ? (
              <EmptyState title={t('admin.resultUpload.needCandidates')} description={null} action={<Button to="/admin/candidates">{t('admin.nav.candidates')}</Button>} />
            ) : (
              <ResultUploadSection key={wardNo ?? 'all'} wardNo={wardNo} />
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
