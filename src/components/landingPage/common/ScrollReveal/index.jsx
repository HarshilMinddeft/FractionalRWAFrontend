import { motion } from 'motion/react';

const DIRECTION_OFFSET = {
  up: { y: 48, x: 0 },
  down: { y: -48, x: 0 },
  left: { y: 0, x: 48 },
  right: { y: 0, x: -48 },
  none: { y: 0, x: 0 },
};

const ScrollReveal = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  scale = false,
  className = '',
  as = 'div',
  viewportAmount = 0.2,
  viewportMargin = '0px',
  once = true,
  ...rest
}) => {
  const offset = DIRECTION_OFFSET[direction] ?? DIRECTION_OFFSET.up;
  const Component = motion[as] ?? motion.div;

  return (
    <Component
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y, scale: scale ? 0.94 : 1 }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, amount: viewportAmount, margin: viewportMargin }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default ScrollReveal;
