import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FractionalizeProperty from './components/fractionalizeProperty'
import TokenizeProperty from './components/tokenizeProperty'
import RedeemfracTokens from './components/redeemfracTokens'
import ListToMarketPlace from './components/listToMarketPlace'
import MarketPlace from './components/marketPlace'
import PropertyDetail from './components/propertyDetaile';
import CancelListing from './components/cancelListing';
import LandingPage from './components/landingPage/landingPage';
import './App.css'

function App() {

  return (
    <Routes>
    <Route path='/LP' element={< LandingPage/>} />
    <Route path='/TP' element={< TokenizeProperty/>} />
    <Route path='/FP' element={< FractionalizeProperty/>} />
    <Route path='/RT' element={< RedeemfracTokens/>} />
    <Route path='/LT' element={< ListToMarketPlace/>} />
    <Route path='/' element={< MarketPlace/>} />
    <Route path='/CL' element={< CancelListing/>} />    
    <Route path="/property/:id" element={<PropertyDetail />} />
    </Routes>
  )
}
export default App
