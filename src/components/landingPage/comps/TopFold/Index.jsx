import { useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import './topfold.css';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';

const FLOAT_CARDS = [
  {
    src: 'https://brown-leading-scallop-142.mypinata.cloud/ipfs/bafkreicouqxxw3kqtrws2rrghgom6p7d5diuoepo4gdztx7nf4itbet4wy',
    className: 'tf-fc tf-fc-1',
    depth: 60,
    float: { y: [0, -18, 0], duration: 7 },
  },
  {
    src: 'https://brown-leading-scallop-142.mypinata.cloud/ipfs/QmfRYuVo7gDzUeodqHtnMxqZuBXoPLQAkyyhzmMGEHfety',
    className: 'tf-fc tf-fc-2',
    depth: 110,
    float: { y: [0, 16, 0], duration: 8.5 },
  },
  {
    src: 'https://brown-leading-scallop-142.mypinata.cloud/ipfs/QmQSosWCn9TV6Sg7pQ4TxeRjeZFfq6Ay5QqEy94wE1wk8H',
    className: 'tf-fc tf-fc-3',
    depth: 30,
    float: { y: [0, -14, 0], duration: 6.2 },
  },
  {
    src: 'https://brown-leading-scallop-142.mypinata.cloud/ipfs/QmeinPk44AMkxDt8xnh3BxrstppHQKrBiYVD46GEPgQK54',
    className: 'tf-fc tf-fc-4',
    depth: 90,
    float: { y: [0, 20, 0], duration: 9 },
  },
];

const TopFold = () => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const springConfig = { stiffness: 90, damping: 20, mass: 0.6 };
  const spx = useSpring(px, springConfig);
  const spy = useSpring(py, springConfig);

  const rotateX = useTransform(spy, [0, 1], [8, -8]);
  const rotateY = useTransform(spx, [0, 1], [-8, 8]);
  const sceneX = useTransform(spx, [0, 1], [-16, 16]);
  const sceneY = useTransform(spy, [0, 1], [-16, 16]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85, 1], [1, 1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const auroraRotate = useTransform(scrollYProgress, [0, 1], [0, 25]);

  const handleMouseMove = (e) => {
    const rect = sectionRef.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div
      className="topfold"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div className="tf-aurora" style={{ y: bgY, rotate: auroraRotate }}>
        <div className="tf-aurora-blob tf-aurora-1" />
        <div className="tf-aurora-blob tf-aurora-2" />
        <div className="tf-aurora-blob tf-aurora-3" />
      </motion.div>
      <div className="tf-grid-overlay" />

      <motion.div className="tf-scene" style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}>
        <motion.div
          className="tf-copy"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="tf-eyebrow"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            Real-World Assets · On-Chain
          </motion.span>

          <h1 className="tf-heding">
            Unlock <span className="heading-gradient">Fractional</span>
            <br />
            Ownership of Real-World Assets
          </h1>

          <p className="tf-desc">
            Step into the future of investing where properties, infrastructure, and real estate are no longer limited
            to the elite. With TrueFraction, anyone can own a slice of high-value assets and earn real-world returns.
          </p>

          <div className="tf-left-btns">
            <Button
              btnType="PRIMARY"
              btnText="Tokenize Your Property"
              btnonClick={() => navigate(ROUTES.tokenizeProperty)}
            />
          </div>
        </motion.div>

        <div className="tf-stage">
          <motion.div
            className="tf-stage-inner"
            style={{
              rotateX,
              rotateY,
              x: sceneX,
              y: sceneY,
              transformStyle: 'preserve-3d',
            }}
          >
            {FLOAT_CARDS.map((card, idx) => (
              <motion.div
                key={card.src}
                className={card.className}
                style={{ transformStyle: 'preserve-3d', translateZ: card.depth }}
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: card.float.y,
                }}
                transition={{
                  opacity: { duration: 0.7, delay: 0.2 + idx * 0.12, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 0.7, delay: 0.2 + idx * 0.12, ease: [0.16, 1, 0.3, 1] },
                  y: {
                    duration: card.float.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.9 + idx * 0.12,
                  },
                }}
                whileHover={{ scale: 1.06, translateZ: card.depth + 40 }}
              >
                <img className="tf-fc-img" alt="tokenized property" src={card.src} loading={idx === 0 ? 'eager' : 'lazy'} />
                <div className="tf-fc-shine" />
              </motion.div>
            ))}
            <div className="tf-stage-glow" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="tf-scroll-cue"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <span className="tf-scroll-cue-dot" />
        <span className="tf-scroll-cue-label">Scroll</span>
      </motion.div>
    </div>
  );
};

export default TopFold;
