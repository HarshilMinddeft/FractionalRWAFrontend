const Card = ({ className = '', children, ...rest }) => (
  <div
    className={`rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-400/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
