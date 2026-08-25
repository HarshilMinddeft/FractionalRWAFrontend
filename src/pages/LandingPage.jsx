import React from 'react';
import Header from '../components/landingPage/comps/Header/Index';
import TopFold from '../components/landingPage/comps/TopFold/Index';
import TNFT from '../components/landingPage/comps/TNFT/Index';
import Info from '../components/landingPage/comps/Info/Index';
import Footer from '../components/landingPage/comps/Footer/Index';
import TfInfo from '../components/landingPage/comps/TFU/tfInfo';
import Erc3643 from '../components/landingPage/comps/Erc-3643/Index';

const LandingPage = () => {
  return (
    <div className="mx-auto w-full max-w-[1360px]">
      <Header />
      <TopFold />
      <TfInfo />
      <TNFT />
      <Erc3643 />
      <Info />
      <Footer />
    </div>
  );
};

export default LandingPage;
