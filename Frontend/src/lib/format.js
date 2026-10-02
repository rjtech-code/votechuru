// Language-aware number/date formatting lives in i18n/I18nContext.jsx (formatNumber, formatDate…).

export const cn = (...classes) => classes.filter(Boolean).join(' ')

/** Groups constituencies by their local body (areaKey), for dependent select options. */
export function groupByArea(constituencies) {
  const groups = {}
  for (const c of constituencies) (groups[c.areaKey] ??= []).push(c)
  return groups
}
