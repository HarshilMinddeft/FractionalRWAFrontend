import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { useState } from 'react';
import './header.css';

const Header = () => {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 8);
  });

  return (
    <motion.div className={`header-bar ${scrolled ? 'header-bar-scrolled' : ''}`}>
      <motion.div className="header-bar-bg" style={{ opacity: bgOpacity }} />
      <motion.div
        className="header absolute-center cur-po"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <a href="/" className="header-brand">
          <img src="/logoD.webp" className="header-logo" alt="TrueFraction logo" />
          <span className="header-brand-text">
            True<span className="header-brand-accent">Fraction</span>
          </span>
        </a>
      </motion.div>
    </motion.div>
  );
};

export default Header;
