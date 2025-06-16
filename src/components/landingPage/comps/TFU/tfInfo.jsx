import React from 'react'
import "./tfInfo.css"
import Button from '../../common/Button'
import { TypeAnimation } from "react-type-animation";
import { useNavigate } from 'react-router-dom';


const TfInfo = () => {
        const navigate = useNavigate();
  return (
        <div className='mb-28 mt-24'>
           <div className='tf-left'>
            <div className='tf-heding'>
                With TrueFraction <br></br>
                <span className=''>You can </span>
                 <span className='heading-gradient'>
                <TypeAnimation
                sequence={[
                  "Fractionalize",
                  3000,
                  "Redeem Back",
                  2000,
                  "List as much you want",
                  2000,
                  "Cancel Listing",
                  2000,
                ]}
                speed={50}
                className="text-accent"
                wapper="span"
                repeat={Infinity}
              />
              </span>
            </div>
            <div className='tf-desc'>TrueFraction is world first Usercentric Platform.
                Once property is tokenized by Truefraction SVP, PropertyOwner has full control over PropertyTokens then users can Fractionalize
                property Nft into tokens, List as much tokens they want to TrueFraction marketplace, Iniciate buy back program,
                CancelListing, And redeem back property.
              </div>
              <div className='tf-left-btns absolute-center'>
                  <Button
                    btnType="PRIMARY"
                    btnText="Fractionalize Your Property"
                    btnonClick={() => navigate('/FP') }
                />
              </div>
        </div>
        </div>
  )
}

export default TfInfo