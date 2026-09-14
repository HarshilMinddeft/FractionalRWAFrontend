import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import TokenizePropertyPage from './pages/TokenizePropertyPage';
import FractionalizePage from './pages/FractionalizePage';
import RedeemTokensPage from './pages/RedeemTokensPage';
import ListMarketplacePage from './pages/ListMarketplacePage';
import MarketplacePage from './pages/MarketplacePage';
import WithdrawBuyBackPage from './pages/WithdrawBuyBackPage';
import UpdatePricePage from './pages/UpdatePricePage';
import CancelListingPage from './pages/CancelListingPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import BlockpassKycPage from './pages/BlockpassKycPage';
import ThemeToggle from './components/ui/ThemeToggle';
import { ROUTES, getPropertyDetailsPath } from './config/routes';
import './App.css';

const LegacyPropertyRedirect = () => {
  const { id } = useParams();

  return <Navigate to={getPropertyDetailsPath(id)} replace />;
};

function App() {
  const location = useLocation();
  const isHome = location.pathname === ROUTES.home;

  return (
    <>
      <Routes>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.tokenizeProperty} element={<TokenizePropertyPage />} />
        <Route path={ROUTES.fractionalizeProperty} element={<FractionalizePage />} />
        <Route path={ROUTES.redeemProperty} element={<RedeemTokensPage />} />
        <Route path={ROUTES.listProperty} element={<ListMarketplacePage />} />
        <Route path={ROUTES.marketplace} element={<MarketplacePage />} />
        <Route path={ROUTES.withdrawBuyBack} element={<WithdrawBuyBackPage />} />
        <Route path={ROUTES.updatePrice} element={<UpdatePricePage />} />
        <Route path={ROUTES.cancelListing} element={<CancelListingPage />} />
        <Route path={ROUTES.propertyDetails} element={<PropertyDetailPage />} />
        <Route path={ROUTES.identityVerification} element={<BlockpassKycPage />} />

        <Route path="/property/:id" element={<LegacyPropertyRedirect />} />
      </Routes>

      {isHome && (
        <div className="fixed right-5 bottom-5 z-[60]">
          <ThemeToggle className="h-11 w-11 rounded-full shadow-lg" />
        </div>
      )}
    </>
  );
}

export default App;
