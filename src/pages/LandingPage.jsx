import Header from '../components/landingPage/comps/Header/Index';
import TopFold from '../components/landingPage/comps/TopFold/Index';
import TNFT from '../components/landingPage/comps/TNFT/Index';
import Info from '../components/landingPage/comps/Info/Index';
import Footer from '../components/landingPage/comps/Footer/Index';
import TfInfo from '../components/landingPage/comps/TFU/tfInfo';
import Robinhood from '../components/landingPage/comps/Robinhood/Index';

const LandingPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-8">
      <Header />
      <TopFold />
      <TfInfo />
      <TNFT />
      <Robinhood />
      <Info />
      <Footer />
    </div>
  );
};

export default LandingPage;

