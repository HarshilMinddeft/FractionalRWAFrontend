import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import envConfig from '../../config/env.config';
import { useWeb3 } from '../../context/Web3Context';

const Nav = ({ signer }) => {
  const navigate = useNavigate();
  const { address } = useWeb3();
  const currentAddress = address || signer || '';

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="border-gray-200 bg-[#ffffff] dark:border-gray-700">
      <div className="mx-auto w-full max-w-[1360px]">
        <div className="max-w-screen flex flex-wrap items-center justify-between p-3">
          <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
            <img src="/logoD.webp" className="h-10" alt="Logo" />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-grey">TrueFraction</span>
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
          <div className={`${isNavOpen ? 'block' : 'hidden'} md:flex md:items-center md:space-x-4 md:w-auto`} id="navbar-dropdown">
            <ul className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-4 md:mt-0 font-medium border border-gray-100 rounded-lg md:border-0 bg-gray-50 md:bg-transparent dark:bg-gray-800 md:dark:bg-transparent dark:border-gray-700 p-4 md:p-0">
              {currentAddress.toLowerCase() === envConfig.adminWalletAddress && (
                <li>
                  <button
                    onClick={() => navigate('/TP')}
                    className="rounded-lg border border-transparent px-3 py-2 text-base font-medium bg-[#0c162c] text-white cursor-pointer transition-colors duration-200 hover:border-[#646cff]"
                  >
                    Tokenize Property
                  </button>
                </li>
              )}

              {/* Dropdown */}
              <li className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-between w-full py-2 px-3 rounded bg-[#0c162c] md:border-0 text-white"
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
                  <div className="absolute z-10 mt-4 w-49 rounded-lg shadow-lg dark:bg-[#424874] left-[-40px] md:left-[-110px]">
                    <ul className="py-2 text-[15px]">
                      <li>
                        <a href="/FP" className="block px-4 py-2 !text-white visited:!text-white hover:bg-gray-600 hover:!text-white">
                          Fractionalize Property
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

              {/* WalletConnect Web3Modal Button */}
              <li className="mt-2 md:mt-0">
                <w3m-button balance="show" size="md" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
