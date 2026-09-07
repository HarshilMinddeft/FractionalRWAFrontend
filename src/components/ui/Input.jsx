const Input = ({ label, className = '', error, hint, hintTone = 'neutral', ...rest }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-left text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
    <input
      className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-950 placeholder-slate-400 shadow-sm outline-none transition focus:ring-4 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 ${
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/70'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-slate-700'
      } ${className}`}
      aria-invalid={error ? 'true' : undefined}
      {...rest}
    />
    {error ? (
      <span className="mt-1 block text-left text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
    ) : (
      hint && (
        <span
          className={`mt-1 block text-left text-xs font-medium ${
            hintTone === 'positive'
              ? 'text-emerald-600 dark:text-emerald-400'
              : hintTone === 'negative'
                ? 'text-amber-600 dark:text-amber-500'
                : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {hint}
        </span>
      )
    )}
  </label>
);

export default Input;
