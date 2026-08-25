import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TokenizePropertyPage from './pages/TokenizePropertyPage';
import FractionalizePage from './pages/FractionalizePage';
import RedeemTokensPage from './pages/RedeemTokensPage';
import ListMarketplacePage from './pages/ListMarketplacePage';
import MarketplacePage from './pages/MarketplacePage';
import CancelListingPage from './pages/CancelListingPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import BlockpassKycPage from './pages/BlockpassKycPage';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/TP" element={<TokenizePropertyPage />} />
      <Route path="/FP" element={<FractionalizePage />} />
      <Route path="/RT" element={<RedeemTokensPage />} />
      <Route path="/LT" element={<ListMarketplacePage />} />
      <Route path="/MP" element={<MarketplacePage />} />
      <Route path="/CL" element={<CancelListingPage />} />
      <Route path="/property/:id" element={<PropertyDetailPage />} />
      <Route path="/B" element={<BlockpassKycPage />} />
    </Routes>
  );
}

export default App;
