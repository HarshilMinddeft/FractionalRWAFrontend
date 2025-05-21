import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV = () => {
    const [navigationMod, setNavigationMod] = useState('MarketPlace');
    const navigate = useNavigate();
  // flex flex-row justify-center 
    return (
      <>
        <div className="flex flex-row justify-center ">
          <div className="flex flex-row">
            <div className="rounded-3xl text-gray-200">
              <button
                onClick={() => navigate('/')}
                className={`text-white mt-1 ml-3 border-[#170c31f5] from-[#b61a1abd] to-[#b6111998] hover:bg-gradient-to-b font-medium rounded-xl text-[19px] px-5 py-2 text-center me-2
                ${navigationMod === 'SearchApp' ? 'bg-[#361352f5] border-[#2d1672dc] from-[#170c31f5] to-[#170c31f5] hover:bg-gradient-to-bl' : ''}`}
              >
                Tokenize Property
              </button>

                <button
                onClick={() => navigate('/FP')}
                className={`text-white mt-1 ml-3 border-[#170c31f5] from-[#1e0e44bd] to-[#180b3698] hover:bg-gradient-to-bl font-medium rounded-xl text-[19px] px-5 py-2 text-center me-2
                ${navigationMod === 'SearchApp' ? 'bg-[#361352f5] border-[#2d1672dc] from-[#170c31f5] to-[#170c31f5] hover:bg-gradient-to-bl' : ''}`}
              >
                Fractonalize Property
              </button>

               <button
                onClick={() => navigate('/RT')}
                className={`text-white mt-1 ml-3 border-[#170c31f5] from-[#1e0e44bd] to-[#180b3698] hover:bg-gradient-to-bl font-medium rounded-xl text-[19px] px-5 py-2 text-center me-2
                ${navigationMod === 'SearchApp' ? 'bg-[#361352f5] border-[#2d1672dc] from-[#170c31f5] to-[#170c31f5] hover:bg-gradient-to-bl' : ''}`}
              >
                Redeem Property
              </button>              

              <button
                onClick={() => navigate('/LT') }
                className={`text-white mt-1 ml-3 border-[#170c31f5] from-[#1e0e44bd] to-[#180b3698] hover:bg-gradient-to-bl font-medium rounded-xl text-[19px] px-5 py-2 text-center me-2
                ${navigationMod === 'simpleTokenInfo' ? 'bg-[#361352f5] border-[#2d1672dc] from-[#170c31f5] to-[#170c31f5] hover:bg-gradient-to-bl' : ''}`}
              >
                List To Marketplace
              </button>

              <button
                onClick={() => navigate('/MP') }
                className={`text-white mt-1 ml-3 border-[#170c31f5] from-[#1e0e44bd] to-[#180b3698] hover:bg-gradient-to-bl font-medium rounded-xl text-[19px] px-5 py-2 text-center me-2
                ${navigationMod === 'MarketPlace' ? 'bg-[#361352f5] border-[#2d1672dc] from-[#170c31f5] to-[#170c31f5] hover:bg-gradient-to-bl' : ''}`}
              >
                Marketplace
              </button>
              
              
            </div>
          </div>
        </div>
      </>
    );
  };

export default NAV