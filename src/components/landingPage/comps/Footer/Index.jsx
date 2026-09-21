import ScrollReveal from '../../common/ScrollReveal';
import './footer.css';

const Footer = () => {
  return (
    <ScrollReveal as="footer" className="footer" direction="up">
      <div className="footer-glow" />
      <div className="footer-divider" />
      <div className="footer-inner">
        <span className="footer-brand">
          True<span className="heading-gradient">Fraction</span>
        </span>
        <span className="footer-tagline">Fractional ownership of real-world assets, on-chain.</span>
        <span className="footer-meta">© {new Date().getFullYear()} TrueFraction. All rights reserved.</span>
      </div>
    </ScrollReveal>
  );
};

export default Footer;