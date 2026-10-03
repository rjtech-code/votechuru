import { useLanguage } from '../../i18n/I18nContext'

const Code = ({ children }) => <code className="mx-0.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-navy-900">{children}</code>

/** "Required columns: … · Optional: …" line for spreadsheet upload cards. */
export default function ColumnList({ required, optional = [], requiredKey = 'admin.upload.requiredColumns', optionalKey = 'admin.upload.optionalColumns' }) {
  const { t } = useLanguage()
  return (
    <>
      {t(requiredKey)}{' '}
      {required.map((column) => (
        <Code key={column}>{column}</Code>
      ))}
      {optional.length > 0 && (
        <>
          {' · '}
          {t(optionalKey)}{' '}
          {optional.map((column) => (
            <Code key={column}>{column}</Code>
          ))}
        </>
      )}
    </>
  )
}
