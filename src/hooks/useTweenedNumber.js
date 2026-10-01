import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

/**
 * A number that glides to `target` instead of jumping (ease-out over
 * `duration` ms). Retargeting mid-flight continues from the value currently
 * shown, so dragging a slider produces one smooth motion rather than a
 * stutter of restarts. Snaps instantly under prefers-reduced-motion.
 *
 * @returns {[number, boolean]} [value to display, whether it is still moving]
 */
const useTweenedNumber = (target, duration = 320) => {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const frame = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = valueRef.current;
    if (reduce || from === target || !Number.isFinite(from)) {
      valueRef.current = target;
      setValue(target);
      return undefined;
    }

    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + (target - from) * easeOutCubic(t);
      valueRef.current = next;
      setValue(next);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return [value, value !== target];
};

export default useTweenedNumber;
