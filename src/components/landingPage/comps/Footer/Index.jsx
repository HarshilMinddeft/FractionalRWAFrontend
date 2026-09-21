import { useNavigate } from 'react-router-dom';
import ScrollReveal from '../../common/ScrollReveal';
import { ROUTES } from '../../../../config/routes';
import './footer.css';

const FOOTER_LINKS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Marketplace', href: ROUTES.marketplace },
      { label: 'Tokenize Your Property', href: ROUTES.tokenizeProperty },
      { label: 'How It Works', href: '#how-it-works' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', href: '#' },
      { label: 'Contact', href: 'mailto:hello@truefraction.io' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: 'X (Twitter)', href: 'https://twitter.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Discord', href: 'https://discord.com' },
];

const Footer = () => {
  const navigate = useNavigate();

  const handleLinkClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    } else if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <ScrollReveal as="footer" className="footer" direction="up">
      <div className="footer-glow" />
      <div className="footer-divider" />
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand-col">
            <span className="footer-brand">
              True<span className="heading-gradient">Fraction</span>
            </span>
            <span className="footer-tagline">Fractional ownership of real-world assets, on-chain.</span>
            <div className="footer-socials">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-link-cols">
            {FOOTER_LINKS.map((col) => (
              <div key={col.heading} className="footer-link-col">
                <span className="footer-col-heading">{col.heading}</span>
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="footer-link"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-meta">© {new Date().getFullYear()} TrueFraction. All rights reserved.</span>
        </div>
      </div>
    </ScrollReveal>
  );
};

export default Footer;
