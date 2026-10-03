import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import CandidateUploadSection from '../../components/admin/CandidateUploadSection'
import ManualResultForm from '../../components/admin/ManualResultForm'
import ConflictList from '../../components/admin/ConflictList'
import ColumnList from '../../components/admin/ColumnList'
import { Card, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useResults } from '../../context/ResultsContext'
import { useToast } from '../../context/ToastContext'
import { useLanguage } from '../../i18n/I18nContext'

/** /admin/upload — candidate results from Excel, or one at a time. */
export default function AdminUpload() {
  const { t } = useLanguage()
  const { wardMaster, createCandidate } = useResults()
  const notify = useToast()
  const { hash } = useLocation()
  const [conflict, setConflict] = useState(null) // { record, existing, resolve }

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }, [hash])

  /** The server checks the ward, duplicates and conflicts; a conflict needs the admin's decision. */
  const addManual = async (record) => {
    let response
    try {
      response = await createCandidate(record)
    } catch (error) {
      if (error.code !== 'CONFLICT') throw error
      // Never overwrite: "Keep existing" is the default; adding a separate record is explicit.
      const addSeparate = await new Promise((resolve) => setConflict({ record, existing: error.details.existing, resolve }))
      setConflict(null)
      if (!addSeparate) return false
      response = await createCandidate(record, 'add')
    }
    notify(t('admin.manual.added'))
    if (response.reopened?.length) notify(t('admin.results.autoReopened', { wards: response.reopened.join(', ') }), 'warning')
    return true
  }

  return (
    <>
      <AdminPageHeader title={t('admin.upload.title')} description={t('admin.upload.description')} />
      <div className="space-y-6">
        <Card as="section" id="upload" aria-labelledby="upload-title" className="scroll-mt-20">
          <CardHeader
            title={<span id="upload-title">{t('admin.results.uploadTitle')}</span>}
            description={<ColumnList required={['Name', 'Party', 'Ward No.', 'Total Votes']} optional={['Candidate ID']} />}
          />
          <div className="p-5">
            <CandidateUploadSection />
          </div>
        </Card>

        {wardMaster.length > 0 && (
          <Card as="section" id="manual" aria-labelledby="manual-title" className="scroll-mt-20">
            <CardHeader title={<span id="manual-title">{t('admin.manual.title')}</span>} description={t('admin.manual.description')} />
            <div className="p-5">
              <ManualResultForm onSubmit={addManual} />
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={Boolean(conflict)}
        onClose={() => conflict?.resolve(false)}
        title={t('admin.results.conflictTitle')}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => conflict.resolve(true)}>
              {t('admin.results.addSeparate')}
            </Button>
            <Button onClick={() => conflict.resolve(false)}>{t('admin.results.keepExisting')}</Button>
          </>
        }
      >
        {conflict && (
          <>
            <ConflictList
              items={[
                {
                  key: 'admin.results.conflictManual',
                  vars: { name: conflict.existing.name, ward: conflict.record.wardNo, existing: conflict.existing.totalVotes, incoming: conflict.record.totalVotes },
                },
              ]}
            />
            <p className="mt-2 text-xs text-slate-500">{t('admin.results.conflictHint')}</p>
          </>
        )}
      </Modal>
    </>
  )
}
