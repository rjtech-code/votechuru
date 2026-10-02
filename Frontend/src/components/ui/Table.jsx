import { cn } from '../../lib/format'

/**
 * Responsive data table. On small screens it renders `renderMobileCard` for each row
 * when provided; otherwise the table scrolls horizontally inside its container.
 *
 * columns: [{ key, header, render?(row), className?, headerClassName?, align? }]
 */
export default function Table({ columns, rows, rowKey = (row) => row.id, caption, renderMobileCard, rowClassName, className }) {
  const alignClass = (align) => (align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left')

  return (
    <>
      {/* `relative` keeps absolutely positioned (sr-only) cells inside the scroll area. */}
      <div className={cn('relative overflow-x-auto', renderMobileCard && 'hidden md:block', className)}>
        <table className="w-full min-w-[640px] border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                    alignClass(column.align),
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={rowKey(row)} className={cn('transition-colors hover:bg-slate-50/60', rowClassName?.(row))}>
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3.5 align-middle text-slate-700', alignClass(column.align), column.className)}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderMobileCard && (
        <ul className="divide-y divide-slate-100 md:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)}>{renderMobileCard(row)}</li>
          ))}
        </ul>
      )}
    </>
  )
}
