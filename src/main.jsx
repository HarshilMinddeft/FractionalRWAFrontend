import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// No <StrictMode>: it double-mounts in development, which would boot two
// WebGL scenes for the TrueFraction 3D landing page (src/truefraction).
createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <BrowserRouter>
      <Web3Provider>
        <App />
      </Web3Provider>
    </BrowserRouter>
  </ThemeProvider>,
);
