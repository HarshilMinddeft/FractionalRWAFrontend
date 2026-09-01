const DEFAULT_WORDS = ['data', 'records', 'details', 'content', 'data'];

const Spinner = ({ words = DEFAULT_WORDS }) => (
  <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
    <div className="flex h-10 items-center overflow-hidden text-2xl font-medium text-slate-400 dark:text-slate-500">
      <span className="flex h-full items-center">loading</span>
      <span className="tf-spinner-mask relative ml-2 h-full overflow-hidden">
        <span className="tf-spinner-words block h-full">
          {words.map((word, i) => (
            <span key={`${word}-${i}`} className="flex h-full items-center pl-2 text-indigo-600 dark:text-indigo-400">
              {word}
            </span>
          ))}
        </span>
      </span>
    </div>
    <style>{`
      .tf-spinner-mask::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(var(--tf-spinner-fade) 10%, transparent 30%, transparent 70%, var(--tf-spinner-fade) 90%);
      }
      [data-theme='light'] .tf-spinner-mask { --tf-spinner-fade: #fff; }
      [data-theme='dark'] .tf-spinner-mask { --tf-spinner-fade: var(--tf-slate-900); }
      @keyframes tf-spin-words {
        10% { transform: translateY(-102%); }
        25% { transform: translateY(-100%); }
        35% { transform: translateY(-202%); }
        50% { transform: translateY(-200%); }
        60% { transform: translateY(-302%); }
        75% { transform: translateY(-300%); }
        85% { transform: translateY(-402%); }
        100% { transform: translateY(-400%); }
      }
      .tf-spinner-words { animation: tf-spin-words 4s infinite; }
    `}</style>
  </div>
);

export default Spinner;
