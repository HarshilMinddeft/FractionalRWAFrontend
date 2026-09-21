import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTheme } from '../../../../context/ThemeContext';
import './tfInfo.css';

const Robinhood = () => {
  const ref = useRef(null);
  const { theme } = useTheme();
  const imageSrc = theme === 'dark' ? '/RobinhoodIMGDark.png' : '/RobinhoodIMGLight.png';
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'start 35%'] });

  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  return (
    <div className="robinhood-section" ref={ref}>
      <div className="robinhood-glow" />
      <div className="robinhood-grid-overlay" />
      <div className="robinhood-panel" style={{ perspective: 1200 }}>
        <motion.img
          src={imageSrc}
          className="robinhood-img"
          alt="Robinhood blockchain network"
          style={{ rotateX, opacity, scale, transformStyle: 'preserve-3d' }}
        />
      </div>
    </div>
  );
};

export default Robinhood;



