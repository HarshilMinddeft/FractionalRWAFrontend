import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import './Info.css';
import Button from '../../common/Button';
import { TypeAnimation } from 'react-type-animation';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';

const CAPABILITIES = [
  { label: 'Fractionalize', subtitle: 'Split into tokens' },
  { label: 'List', subtitle: 'On the marketplace' },
  { label: 'Buy Back', subtitle: 'Initiate anytime' },
  { label: 'Redeem', subtitle: 'Claim the property' },
];

const TfInfo = () => {
  const navigate = useNavigate();
  const railRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: railRef, offset: ['start 85%', 'start 35%'] });
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="tfi-section">
      <div className="tfi-glow" />
      <div className="tfi-grid-overlay" />
      <motion.div
        className="tfi-heading-wrap"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="tfi-eyebrow">The Platform</span>
        <h2 className="tf-heding">
          With TrueFraction <br />
          You can{' '}
          <span className="tfi-accent-gradient">
            <TypeAnimation
              sequence={[
                'Fractionalize',
                3000,
                'Redeem Property',
                2000,
                'List as much as you want',
                2000,
                'Cancel Listing',
                2000,
              ]}
              speed={50}
              wapper="span"
              repeat={Infinity}
            />
          </span>
        </h2>
        <div className="tf-desc">
          TrueFraction is world first Usercentric Platform. Once property is tokenized by Truefraction SPV,
          PropertyOwner has full control over PropertyTokens then PropertyOwner can Fractionalize property Nft into
          tokens, List as much tokens they want to TrueFraction marketplace, Iniciate buy back program, CancelListing,
          And redeem back property.
        </div>
        <div className="tf-left-btns">
          <Button
            btnType="PRIMARY"
            btnText="Fractionalize Your Property →"
            btnonClick={() => navigate(ROUTES.fractionalizeProperty)}
          />
        </div>
      </motion.div>

      <div className="tfi-rail" ref={railRef}>
        <div className="tfi-rail-track">
          <motion.div className="tfi-rail-fill" style={{ scaleX: railScale }} />
        </div>
        {CAPABILITIES.map((step, idx) => (
          <motion.div
            className="tfi-rail-step"
            key={step.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
          >
            <span className="tfi-rail-index">{String(idx + 1).padStart(2, '0')}</span>
            <span className="tfi-rail-label">{step.label}</span>
            <span className="tfi-rail-subtitle">{step.subtitle}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TfInfo;
