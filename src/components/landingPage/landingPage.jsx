import Header from './comps/Header/Index';
import TopFold from './comps/TopFold/Index';
import TNFT from './comps/TNFT/Index';
import Info from './comps/Info/Index';
import Footer from './comps/Footer/Index';
import TfInfo from './comps/TFU/tfInfo';
import Robinhood from './comps/Robinhood/Index';

const LandingPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1360px]">
      <Header />
      <TopFold />
      <TfInfo />
      {/* <BI/> */}
      <TNFT />
      <Robinhood />
      <Info />
      <Footer />
    </div>
  );
};

export default LandingPage;

