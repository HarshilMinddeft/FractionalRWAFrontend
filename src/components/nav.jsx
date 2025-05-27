import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NAV = ({signer}) => {
    const [navigationMod, setNavigationMod] = useState('MarketPlace');
    const navigate = useNavigate();
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
      <>
      <nav className="border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div className="max-w-screen flex flex-wrap items-center justify-between p-3">
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="/logoD.webp" className="h-10" alt="Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">MDRWA</span>
        </a>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
        >
          <span className="sr-only">Open main menu</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 17 14" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 1h15M1 7h15M1 13h15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Navbar links */}
        <div className={`${isNavOpen ? 'block' : 'hidden'} md:flex md:w-auto`} id="navbar-dropdown">
          <ul className="flex flex-col md:flex-row md:space-x-6 mt-4 md:mt-0 font-medium border border-gray-100 rounded-lg md:border-0 bg-gray-50 md:bg-transparent dark:bg-gray-800 md:dark:bg-transparent dark:border-gray-700 p-4 md:p-0">
            {signer?.toLowerCase() === '0xe917e81c69bf15238c63abd45d1c335c2fc80bdd' && (
              <li>
              <button
                onClick={() => navigate('/TP') }
                className="rounded-lg border border-transparent px-3 py-2 text-base font-medium bg-gray-700 text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
              >
                 Tokenize Property
              </button>
              </li>
            )}
            <li>
              <button
                onClick={() => navigate('/') }
                className={`rounded-lg border border-transparent px-3 py-2 text-base font-medium bg-gray-700 text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]
                ${navigationMod === 'simpleTokenInfo' ? 'bg-[#361352f5] border-[#2d1672dc] from-[#170c31f5] to-[#170c31f5] hover:bg-gradient-to-bl' : ''}`}
              >
                Marketplace
              </button>
            </li>
                        {/* Dropdown */}
            <li className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full py-2 px-3 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 dark:text-white   md:dark:hover:bg-transparent"
              >
                More
                <svg className="w-2.5 h-2.5 ml-2.5" fill="none" viewBox="0 0 10 6" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 mt-4 w-49 rounded-lg shadow-lg dark:bg-gray-700 left-[-40px] md:left-[-110px]">
                  <ul className="py-2 text-[15px]">
                      <li>
                      <a href="/FP" className="block px-4 py-2 !text-white visited:!text-white hover:bg-gray-600 hover:!text-white">
                        Fractonalize Property
                      </a>
                    </li>
                    <li>
                      <a href="/LT" className="block px-4 py-2 !text-white visited:!text-white hover:bg-gray-600 hover:!text-white">
                         List To Marketplace
                      </a>
                    </li>
                    <li>
                      <a href="/RT" className="block px-4 py-2 !text-white visited:!text-white hover:bg-gray-600 hover:!text-white">
                         Redeem Property
                      </a>
                    </li>
                    <li>
                      <a href="/CL" className="block px-4 py-2 !text-white visited:!text-white hover:bg-gray-600 hover:!text-white">
                        Cancel Listing
                      </a>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
      </>
    );
  };

export default NAV