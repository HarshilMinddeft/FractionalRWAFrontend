import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Web3Provider>
          <App />
        </Web3Provider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
