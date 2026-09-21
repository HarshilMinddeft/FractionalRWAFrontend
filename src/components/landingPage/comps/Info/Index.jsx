import './info.css';
import { INFO_ITEMS } from '../../data/infoItems';
import InfoItem from './Infoitem';
import ScrollReveal from '../../common/ScrollReveal';

const Info = () => {
  return (
    <ScrollReveal as="div" className="info-section" direction="up" viewportAmount={0.15}>
      <div className="is-glow" />
      <div className="is-grid-overlay" />
      <div className="is-heading-wrap">
        <span className="is-eyebrow">Getting Started</span>
        <h2 className="is-heading">
          <span className="is-heading-gradient">How To Tokenize Your Property</span>
        </h2>
      </div>
      <div className="is-items-container">
        {INFO_ITEMS.map((_infoItem, idx) => (
          <ScrollReveal
            key={_infoItem.id}
            className="is-item-slot"
            direction="up"
            delay={idx * 0.1}
            viewportAmount={0.4}
          >
            <InfoItem item={_infoItem} step={idx + 1} isLast={idx === INFO_ITEMS.length - 1} />
          </ScrollReveal>
        ))}
      </div>
    </ScrollReveal>
  );
};

export default Info;
