import React from 'react'
import "./topfold.css"
import Button from '../../common/Button'
import { TypeAnimation } from "react-type-animation";
import { useNavigate } from 'react-router-dom';

const TopFold = () => {
const navigate = useNavigate();
  return (
    <div className='topfold absolute-center'>
        <div className='tf-left'>
            <div className='tf-heding'>
                Unlock <br></br>
                <span className='heading-gradient'>Fractional</span> Ownership of Real-World Assets
            </div>
            <div className='tf-desc'> Step into the future of investing where properties, infrastructure, and real estate 
            are no longer limited to the elite. With TrueFraction, anyone can own a slice 
            of high-value assets and earn real-world returns.
              </div>
              <div className='tf-left-btns'>
                <Button 
                 btnType="PRIMARY"
                    btnText="Tokenize Your Property"
                 btnonClick={() => navigate('/TP') } />
              </div>
        </div>
        <div className='tf-right'>
            <div className='tf-r-bg-blob'></div>
            <div className='tf-right-diamond'>
                <div className='tf-r-diamond-items absolute-center'>
                    <img className='tf-r-diamond-img' 
                    alt='diamond-banner'
                    src='https://ipfs.io/ipfs/QmTP8QzjTPTDEGHzyAvbauTMKPJKWphUr8gWKx1rm7sgQQ'
                    />

                </div>
                <div className='tf-r-diamond-items absolute-center'>
                    <img 
                    className='tf-r-diamond-img' 
                    alt='diamond-banner'
                    src='https://ipfs.io/ipfs/QmfGVm5vDqwYZ7eX59HGapSScxJrGaj74XPDZUm7tVh6cF'
                    />

                </div>
                <div className='tf-r-diamond-items absolute-center'>
                    <img 
                    className='tf-r-diamond-img' 
                    alt='diamond-banner'
                    src='https://ipfs.io/ipfs/QmQSosWCn9TV6Sg7pQ4TxeRjeZFfq6Ay5QqEy94wE1wk8H'
                    />

                </div>
                <div className='tf-r-diamond-items absolute-center'>
                    <img 
                    className='tf-r-diamond-img' 
                    alt='diamond-banner'
                    src='https://ipfs.io/ipfs/QmSxWvDuXCdf5K8Hipt2muSBXHhQPSc3sqTnNX9yBeayCJ'
                    />

                </div>

            </div>
        </div>
    </div >
  )
}

export default TopFold