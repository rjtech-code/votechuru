export default function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2.5 text-[24px] font-extrabold tracking-tight text-navy-900">
          <span className="h-[26px] w-1 rounded-full bg-brand-600" aria-hidden="true" />
          {title}
        </h1>
        {description && <p className="mt-1 pl-[14px] text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
