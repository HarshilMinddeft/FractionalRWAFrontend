import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';
import Button from '../../common/Button';
import { ROUTES } from '../../../../config/routes';

const NAV_LINKS = [
  { label: 'Marketplace', href: ROUTES.marketplace },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Tokenize', href: ROUTES.tokenizeProperty },
];

const Header = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 8);
  });

  const handleNavClick = (href) => {
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(href);
  };

  return (
    <motion.div className={`header-bar ${scrolled ? 'header-bar-scrolled' : ''}`}>
      <motion.div className="header-bar-bg" style={{ opacity: bgOpacity }} />
      <motion.div
        className="header"
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

        <nav className="header-nav">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              className="header-nav-link"
              onClick={() => handleNavClick(link.href)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="header-cta">
          <Button
            btnType="PRIMARY"
            btnText="Get Started"
            customClass="header-cta-btn"
            btnonClick={() => navigate(ROUTES.tokenizeProperty)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Header;
