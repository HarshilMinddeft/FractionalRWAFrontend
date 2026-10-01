import { cn } from '../../lib/utils';

/**
 * Card — elevated white surface with hairline border.
 * @param {boolean} [hover] lift + brand-tinted glow on hover
 */
const Card = ({ className = '', hover = false, children, ...rest }) => (
  <div
    className={cn(
      'rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,17,28,0.04),0_8px_24px_-16px_rgba(16,17,28,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]',
      hover && 'card-glow transition-all duration-300 hover:-translate-y-1',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
