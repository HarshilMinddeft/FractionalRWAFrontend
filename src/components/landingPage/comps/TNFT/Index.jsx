import './tnft.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Slider from 'react-slick';
import TrendingCard from './TrendingCard';
import { TNRENDING_NFTS } from '../../data/tn';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';
import ScrollReveal from '../../common/ScrollReveal';

const settings = {
  slideToScroll: 1,
  slidesToShow: 3,
  autoplay: true,
  speed: 200,
  arrows: true,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1,
        arrows: false,
      },
    },
  ],
};

const TNFT = () => {
  const navigate = useNavigate();
  return (
    <div className="trending-nfts">
      <div className="tn-glow" />
      <div className="tn-grid-overlay" />
      <ScrollReveal as="div" className="tn-heading-wrap absolute-center" direction="up" scale>
        <span className="tn-eyebrow">Marketplace</span>
        <h2 className="tn-title">
          <span className="tn-title-gradient">Trending Properties</span>
        </h2>
      </ScrollReveal>
      <ScrollReveal direction="up" delay={0.1} viewportAmount={0.1}>
        <Slider {...settings}>
          {TNRENDING_NFTS.map((_nft) => (
            <TrendingCard key={_nft.id} nft={_nft} />
          ))}
        </Slider>
      </ScrollReveal>
      <ScrollReveal as="div" className="absolute-center mt-16 w-full" direction="up" delay={0.15}>
        <Button btnType="PRIMARY" btnText="See More" btnonClick={() => navigate(ROUTES.marketplace)} />
      </ScrollReveal>
    </div>
  );
};

export default TNFT;
