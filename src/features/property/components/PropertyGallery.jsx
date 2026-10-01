import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import Card from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';

/**
 * Centre thumbnail `index` inside its horizontal strip. Scrolls only the
 * strip — scrollIntoView would also scroll the page to bring the strip into
 * view, yanking the page up every time the slideshow advanced.
 */
const centreThumb = (strip, index) => {
  const el = strip?.querySelector(`[data-thumb="${index}"]`);
  if (!el) return;
  const stripRect = strip.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const left = strip.scrollLeft + (elRect.left - stripRect.left) - (strip.clientWidth - elRect.width) / 2;
  strip.scrollTo({ left, behavior: 'smooth' });
};

const Chevron = ({ dir }) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
  </svg>
);

const GridIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
    />
  </svg>
);

/**
 * Full-screen viewer: large photo, arrows, counter, thumbnail strip.
 * Keyboard ← → and Esc; swipe on touch. Portaled to <body> so no transformed
 * ancestor can offset it.
 */
const Lightbox = ({ images, index, onIndex, onClose }) => {
  const stripRef = useRef(null);
  const touchX = useRef(null);
  const [dir, setDir] = useState(1);

  const go = useCallback(
    (delta) => {
      setDir(delta);
      onIndex((index + delta + images.length) % images.length);
    },
    [index, images.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  useEffect(() => centreThumb(stripRef.current, index), [index]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[90] flex flex-col bg-slate-950"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 text-white">
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* Photo */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.img
            key={index}
            src={images[index]}
            alt={`Property view ${index + 1}`}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl select-none"
            draggable={false}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            {['prev', 'next'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => go(d === 'prev' ? -1 : 1)}
                aria-label={d === 'prev' ? 'Previous photo' : 'Next photo'}
                className={cn(
                  'absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition-transform hover:scale-105 active:scale-95 sm:flex',
                  d === 'prev' ? 'left-5' : 'right-5',
                )}
              >
                <Chevron dir={d} />
              </button>
            ))}
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div ref={stripRef} className="tf-scroll overflow-x-auto px-5 py-4">
          {/* w-max + mx-auto: centred when it fits, scrollable from the start when it doesn't. */}
          <div className="mx-auto flex w-max gap-2">
            {images.map((url, i) => (
              <button
                key={url + i}
                type="button"
                data-thumb={i}
                onClick={() => {
                  setDir(i > index ? 1 : -1);
                  onIndex(i);
                }}
                aria-label={`Show photo ${i + 1}`}
                className={cn(
                  'relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all duration-200',
                  i === index
                    ? 'opacity-100 ring-2 ring-white ring-offset-2 ring-offset-slate-950'
                    : 'opacity-45 hover:opacity-90',
                )}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>,
    document.body,
  );
};

const ExpandIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
    />
  </svg>
);

const SLIDE_MS = 2000;

// Horizontal slide; `dir` is 1 for next, -1 for previous.
const SLIDE = {
  enter: (dir) => ({ x: `${dir * 100}%` }),
  center: { x: '0%' },
  exit: (dir) => ({ x: `${dir * -100}%` }),
};

/**
 * Property photos: a large viewer that advances slowly on its own, with
 * story-style progress segments on top (click one to jump), a gentle zoom on
 * the active photo, arrows, and a thumbnail strip. Hovering, touching or
 * opening the full-screen viewer pauses the slideshow.
 */
const PropertyGallery = ({ images = [] }) => {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [viewer, setViewer] = useState(null); // index open full-screen, or null
  const [cycle, setCycle] = useState(0); // restarts the progress animation
  const stripRef = useRef(null);
  const touchX = useRef(null);
  const count = images?.length ?? 0;

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const playing = count > 1 && !paused && viewer === null && !reduceMotion;

  const goTo = useCallback(
    (i, d) => {
      setDir(d ?? (i > active ? 1 : -1));
      setActive(((i % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [active, count],
  );

  // Auto-advance; restarted whenever the photo changes by hand.
  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(() => goTo(active + 1, 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [playing, active, cycle, goTo]);

  useEffect(() => centreThumb(stripRef.current, active), [active]);

  if (!count) {
    return (
      <Card className="flex aspect-[16/9] flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
        <GridIcon />
        No photos available for this property
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-2.5 sm:p-3">
      <div
        className="group relative aspect-[16/9] overflow-hidden rounded-xl bg-slate-900"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          setPaused(true);
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current !== null) {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) goTo(active + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
          }
          touchX.current = null;
        }}
      >
        {/* Photos slide: the new one moves in from the side as the old one
            moves out the other way. */}
        <AnimatePresence initial={false} custom={dir}>
          <motion.img
            key={active}
            custom={dir}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] }}
            src={images[active]}
            alt={`Property view ${active + 1}`}
            className="absolute inset-0 h-full w-full cursor-zoom-in object-cover select-none"
            draggable={false}
            onClick={() => setViewer(active)}
          />
        </AnimatePresence>

        {/* Shading so the controls read on bright photos. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Story-style progress segments. */}
        {count > 1 && (
          <div className="absolute inset-x-3 top-3 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                className="group/seg relative h-4 flex-1 cursor-pointer"
              >
                <span className="absolute inset-x-0 top-1.5 h-1 overflow-hidden rounded-full bg-white/30 transition-all group-hover/seg:top-1 group-hover/seg:h-1.5">
                  {i < active && <span className="absolute inset-0 bg-white" />}
                  {i === active && (
                    <span
                      key={`${active}-${cycle}`}
                      className="absolute inset-y-0 left-0 bg-white"
                      style={{
                        width: playing ? undefined : '100%',
                        animation: playing ? `tf-seg ${SLIDE_MS}ms linear forwards` : 'none',
                      }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Arrows */}
        {count > 1 &&
          ['prev', 'next'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => goTo(active + (d === 'prev' ? -1 : 1), d === 'prev' ? -1 : 1)}
              aria-label={d === 'prev' ? 'Previous photo' : 'Next photo'}
              className={cn(
                'absolute top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 sm:opacity-0 sm:group-hover:opacity-100',
                d === 'prev' ? 'left-3 sm:-translate-x-2 sm:group-hover:translate-x-0' : 'right-3 sm:translate-x-2 sm:group-hover:translate-x-0',
              )}
            >
              <Chevron dir={d} />
            </button>
          ))}

        {/* Bottom bar: counter + expand */}
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between">
          <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
            {active + 1} / {count}
            {count > 1 && paused && <span className="ml-1.5 text-white/60">· paused</span>}
          </span>
          <button
            type="button"
            onClick={() => setViewer(active)}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <ExpandIcon />
            Full screen
          </button>
        </div>
      </div>

      {count > 1 && (
        <div ref={stripRef} className="tf-scroll mt-3 overflow-x-auto pb-1">
          <div className="flex w-max gap-2 px-0.5 pt-1">
            {images.map((url, i) => (
              <button
                key={url + i}
                type="button"
                data-thumb={i}
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                className={cn(
                  'relative h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg p-[2px] transition-all duration-200',
                  i === active
                    ? '-translate-y-0.5 bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md shadow-indigo-500/30'
                    : 'bg-transparent opacity-55 hover:opacity-100',
                )}
              >
                <img src={url} alt="" loading="lazy" className="h-full w-full rounded-md object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewer !== null && (
          <Lightbox
            images={images}
            index={viewer}
            onIndex={setViewer}
            onClose={() => {
              setActive(viewer);
              setViewer(null);
            }}
          />
        )}
      </AnimatePresence>
    </Card>
  );
};

export default PropertyGallery;
