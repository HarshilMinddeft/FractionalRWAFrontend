import React from 'react'
import "./tfInfo.css"
import { TypeAnimation } from "react-type-animation";

const Erc3643 = () => {
 return (
        <div className='mb-28 mt-24'>
           <div className='tf-left'>
            <div className='tf-heding'>
                {/* ERC-3643  <br></br> */}
                {/* <span className=''>Ecosystem </span> */}
                 {/* <span className='heading-gradient'>
                <TypeAnimation
                sequence={[
                  "OnChainId",
                  3000,
                  "OnChainKyc",
                  2000,
                  "ModularCompliance",
                  2000,
                  "",
                  2000,
                ]}
                speed={50}
                className="text-accent"
                wapper="span"
                repeat={Infinity}
              />
              </span> */}
            </div>
        </div>
        <img src="/Erc3643IMG.png" className="bg-transparent" alt="Logo" />
        </div>
  )
}

export default Erc3643