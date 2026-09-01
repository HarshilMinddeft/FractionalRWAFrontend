import "./tnft.css"
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import Slider from 'react-slick'
import TrendingCard from './TrendingCard'
import { TNRENDING_NFTS } from '../../data/tn'
import Button from '../../common/Button'
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';

const settings = {
    slideToScroll: 1,
    slidesToShow: 3,
    autoplay: true,
    speed:200,
    arrows:true,
}

const TNFT = () => {
  const navigate = useNavigate();
  return (
    <div className='trending-nfts'>
    <div className='tn-title absolute-center'>
        <span className='heading-gradient'>TRENDING PROPERTIES</span>
    </div>
    <Slider {...settings}>
        {TNRENDING_NFTS.map((_nft) => (
        <TrendingCard key={_nft.id} nft={_nft} />
        ))}
    </Slider>
    <div className='mt-16 absolute-center'>
      <Button
        btnType="PRIMARY"
        btnText="See More"
        btnonClick={() => navigate(ROUTES.marketplace)}
      />
    </div>
    </div>
  )
};

export default TNFT;
