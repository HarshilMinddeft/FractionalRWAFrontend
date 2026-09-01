const PageHeader = ({ title, description, icon, action }) => (
  <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 sm:p-8 dark:border-slate-800 dark:from-indigo-500/10 dark:via-slate-900 dark:to-slate-900">
    <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/10" />
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl items-start gap-4 text-left">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              {icon}
            </svg>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">{title}</h1>
          {description && <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </div>
  </div>
);

export default PageHeader;
