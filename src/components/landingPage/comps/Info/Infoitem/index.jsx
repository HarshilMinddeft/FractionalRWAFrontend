import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import './infoitem.css';
import Tilt3D from '../../../common/Tilt3D';

const InfoItem = (props) => {
  const { item, step, isLast } = props;
  const connectorRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: connectorRef, offset: ['start 70%', 'end 40%'] });
  const connectorScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className={`info-item ${isLast ? 'info-item-last' : ''}`}>
      <div className="ii-rail">
        <Tilt3D className="ii-icon-tilt" maxTilt={6} scale={1.06}>
          <div className="ii-icon-wrap">
            <img alt={item.section_title} className="ii-icon" src={item.icon} />
          </div>
        </Tilt3D>
        {!isLast && (
          <div className="ii-connector" ref={connectorRef}>
            <motion.div className="ii-connector-fill" style={{ scaleY: connectorScale }} />
          </div>
        )}
      </div>
      <div className="ii-content">
        <span className="ii-step">Step {String(step).padStart(2, '0')}</span>
        <div className="ii-title">{item.section_title}</div>
        <div className="ii-description">{item.description}</div>
      </div>
    </div>
  );
};

export default InfoItem;
