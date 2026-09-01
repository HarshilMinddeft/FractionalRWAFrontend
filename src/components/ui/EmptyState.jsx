const EmptyState = ({ children, title = 'Nothing to show yet' }) => (
  <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 9.75h16.5m-16.5 0A2.25 2.25 0 0 1 6 7.5h12a2.25 2.25 0 0 1 2.25 2.25m-16.5 0v6.75A2.25 2.25 0 0 0 6 18.75h12a2.25 2.25 0 0 0 2.25-2.25V9.75"
        />
      </svg>
    </div>
    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
    <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{children}</p>
  </div>
);

export default EmptyState;
