import { useLanguage } from '../i18n/I18nContext'

/**
 * Single-series horizontal bar chart. One neutral hue for every bar (identity is
 * carried by the text label, never by colour); values are printed in text ink and
 * each bar also exposes its value on hover.
 */
export default function BarList({ items, caption }) {
  const { formatNumber } = useLanguage()
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <figure>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.key} className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_3.5rem]">
            <span className="truncate text-slate-700">{item.label}</span>
            <span className="h-2.5 rounded-full bg-slate-100" title={`${item.label}: ${formatNumber(item.value)}`}>
              <span
                className="block h-full rounded-full bg-brand-600 transition-[width] duration-300"
                style={{ width: `${(item.value / max) * 100}%`, minWidth: item.value ? '4px' : 0 }}
              />
            </span>
            <span className="text-right font-semibold tabular-nums text-navy-900">{formatNumber(item.value)}</span>
          </li>
        ))}
      </ul>
      {caption && <figcaption className="mt-4 text-xs text-slate-500">{caption}</figcaption>}
    </figure>
  )
}
