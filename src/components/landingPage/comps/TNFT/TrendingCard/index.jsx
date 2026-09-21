import './trendingCard.css';
import Tilt3D from '../../../common/Tilt3D';

const TrendingCard = (props) => {
  const { nft } = props;

  return (
    <div className="trending-card absolute-center">
      <Tilt3D className="w-full" maxTilt={6}>
        <div className="tc-inner-wrapper">
          <div className="tc-banner-wrap">
            <img alt={nft.user_name} src={nft.banner} className="tc-banner" />
            <span className="tc-price-badge">{nft.userhandel}</span>
          </div>
          <div className="tc-user-info">
            <span className="tc-ui-username">{nft.user_name}</span>
          </div>
        </div>
      </Tilt3D>
    </div>
  );
};

export default TrendingCard;
