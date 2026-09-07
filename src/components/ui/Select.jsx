const Select = ({ label, className = '', children, ...rest }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-left text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
    <select
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${className}`}
      {...rest}
    >
      {children}
    </select>
  </label>
);

export default Select;
