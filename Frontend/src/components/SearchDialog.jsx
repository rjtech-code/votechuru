import { useMemo, useState } from 'react'
import Modal from './ui/Modal'
import SearchBar from './SearchBar'
import SearchResults, { searchWards } from './SearchResults'
import { EmptyState } from './ui/States'
import { useLanguage } from '../i18n/I18nContext'
import { useResults } from '../context/ResultsContext'

function DialogBody({ onClose }) {
  const { t } = useLanguage()
  const { wards } = useResults()
  const [query, setQuery] = useState('')
  const q = query.trim()
  const results = useMemo(() => (q ? searchWards(wards, q) : null), [wards, q])

  return (
    <>
      <SearchBar id="global-search" value={query} onChange={setQuery} size="lg" placeholder={t('hero.searchPlaceholder')} />
      <div className="mt-5 max-h-[55vh] overflow-y-auto">
        {!wards.length ? (
          <EmptyState title={t('state.noData')} description={t('state.noDataDescription')} />
        ) : !results ? (
          <p className="py-6 text-center text-sm text-slate-500">{t('search.hint')}</p>
        ) : (
          <SearchResults results={results} onNavigate={onClose} />
        )}
      </div>
    </>
  )
}

export default function SearchDialog({ open, onClose }) {
  const { t } = useLanguage()
  return (
    <Modal open={open} onClose={onClose} title={t('search.title')} description={t('search.description')} size="lg" align="top">
      {open && <DialogBody onClose={onClose} />}
    </Modal>
  )
}
