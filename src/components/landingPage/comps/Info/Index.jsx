import './info.css';
import { INFO_ITEMS } from '../../data/infoItems';
import './Infoitem';
import InfoItem from './Infoitem';

const Info = () => {
  return (
    <div className="info-section">
      <h2 className="is-heading absolute-center">
        <span className="heading-gradient"> How To Tokenize Your Property </span>
      </h2>
      <div className="is-items-container">
        {INFO_ITEMS.map((_infoItem) => (
          <InfoItem key={_infoItem.id} item={_infoItem} />
        ))}
      </div>
    </div>
  );
};

export default Info;
