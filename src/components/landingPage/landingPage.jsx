import React from 'react'
import Header from './comps/Header/Index';
import TopFold from './comps/TopFold/Index';
import BI from './comps/BI/Index';
import TNFT from './comps/TNFT/Index';
import Info from './comps/Info/Index';
import Footer from './comps/Footer/Index';
import TfInfo from './comps/TFU/tfInfo';
import Erc3643 from './comps/Erc-3643/Index';

const LandingPage = () => {
  return (
      <div className='mx-auto w-full max-w-[1360px]'>
     <Header/>
     <TopFold/>
     <TfInfo/>
     {/* <BI/> */}
      <TNFT/>
      <Erc3643/>
      <Info/>
      <Footer/>
    </div>
  )
}

export default LandingPage