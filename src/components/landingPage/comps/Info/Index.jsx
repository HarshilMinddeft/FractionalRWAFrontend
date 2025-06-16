import React from 'react'
import "./info.css"
import { INFO_ITEMS } from '../../data/infoItems'
import "./Infoitem"
import InfoItem from './Infoitem'

const Info = () => {
  return (
    <div className='info-section'>
        <div className='is-heading absolute-center'>
            <span className='heading-gradient' > How To Tokenize Your Property </span>
        </div>
        <div className='is-items-container'>
            {INFO_ITEMS.map((_infoItem)=>(
            <InfoItem item={_infoItem} />
             ))}
        </div>
    </div>
  )
};

export default Info