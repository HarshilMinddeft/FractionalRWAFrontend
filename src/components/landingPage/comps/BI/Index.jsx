import React from 'react';
import './bi.css';
import mmpng from '../../assets/mmpng.png';
import ops from '../../assets/ops.png';

const BI = () => {
  return (
    <div className='brands-intigration absolute-center'>
      <img src={mmpng} className='bi-logos' alt='brand-logos' />
      <img src={ops} className='bi-logoss' alt='brand-logos' />
    </div>
  );
};

export default BI;
