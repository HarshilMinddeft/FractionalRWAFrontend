import { useEffect } from 'react';
import './truefraction.css';
import { initScene } from './scene.js';

// This component intentionally has NO state and must never re-render:
// scene.js drives this DOM directly (splits words into spans, toggles
// classes, sets inline transforms) exactly like the original vanilla
// script did. Keep every id / class / data-* attribute below untouched —
// the scene script finds elements by these.
const TrueFraction = () => {
  useEffect(() => {
    document.body.classList.add('loading');
    return initScene();
  }, []);

  return (
    <>
      <canvas id="gl"></canvas>
      <div className="vignette"></div>
      <div className="cursor"></div>

      <div id="loader" aria-live="polite">
        <div className="lc l">
          <span className="logo-mark">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>
          TrueFraction
        </div>
        <div className="lc r">Downtown Dubai · 828 m</div>
        <div className="lwrap">
          <div className="lpct">
            <span id="pct">0</span>
            <sup>%</sup>
          </div>
          <div className="lbar">
            <i id="bar"></i>
          </div>
          <div className="llabel" id="lstage">
            Loading experience
          </div>
        </div>
      </div>

      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <filter id="lg-liquid" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.0025 0.018" numOctaves="2" seed="7" result="n">
              <animate
                attributeName="baseFrequency"
                dur="14s"
                values="0.0025 0.018;0.0035 0.024;0.0025 0.018"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feGaussianBlur in="n" stdDeviation="1.5" result="nb" />
            <feDisplacementMap in="SourceGraphic" in2="nb" scale="14" xChannelSelector="R" yChannelSelector="G" result="d" />
            <feComponentTransfer in="d">
              <feFuncA type="identity" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <nav id="nav">
        <a href="#top" className="logo">
          <span className="logo-mark">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>
          TrueFraction
        </a>
        <div className="links">
          <a href="#why">Platform</a>
          <a href="#steps">How it works</a>
          <a href="#list">List a property</a>
        </div>
        <a href="#list" className="btn">
          Launch app <span className="arr">→</span>
        </a>
      </nav>

      <main id="top">
        <section className="hero" data-cam="hero">
          <span className="mono fade" style={{ marginBottom: '28px', display: 'block' }}>
            Tokenized real estate · Dubai
          </span>
          <h1>
            <span className="line">
              <span>Own a piece</span>
            </span>
            <span className="line">
              <span>of Dubai&apos;s</span>
            </span>
            <span className="line">
              <span className="grad">skyline.</span>
            </span>
          </h1>
          <p className="lead fade">
            TrueFraction splits premium Dubai property into on-chain fractions — SPV-backed, audited, and yours to
            hold or trade.
          </p>
          <div className="ctas fade">
            <a href="#why" className="btn primary">
              Explore properties <span className="arr">→</span>
            </a>
            <a href="#steps" className="btn">
              Tokenize yours
            </a>
          </div>
          <div className="hero-foot fade">
            <div className="scrollcue">
              <i></i>
              <span className="mono">Scroll to explore</span>
            </div>
            <span className="mono">25.1972° N, 55.2744° E</span>
          </div>
        </section>

        <section className="statement" data-cam="statement">
          <div className="wrap">
            <span className="mono">01 — The idea</span>
            <h2 id="words">
              Real estate has always been the world&apos;s biggest asset — and its most locked. We rebuild it as
              fractions, so anyone can own a floor of the skyline.
            </h2>
          </div>
        </section>

        <section className="platform" id="why" data-cam="why" data-screen-label="The platform">
          <div className="pl-sticky" id="plSticky">
            <div className="pl-left">
              <span className="pill">The platform</span>
              <h2 className="pl-h">
                With TrueFraction
                <br />
                you can
              </h2>
              <div className="pl-words" aria-live="polite">
                <div className="pl-reel" id="plReel">
                  <span>Fractionalize.</span>
                  <span>List as much as you want.</span>
                  <span>Buy back anytime.</span>
                  <span>Redeem the property.</span>
                </div>
              </div>
              <p className="pl-copy">
                Once the TrueFraction SPV tokenizes a property, the owner holds full control of its tokens —
                fractionalize the NFT, list as many as you want, run a buy-back, cancel listings, and redeem the
                property back.
              </p>
              <a href="#steps" className="btn primary xl">
                Fractionalize your property <span className="arr">→</span>
              </a>
            </div>
            <div className="pl-vis" id="plVis" data-stage="0">
              <span className="orbit o1"></span>
              <span className="orbit o2"></span>
              <div className="medal">
                <span className="m-ring"></span>
                <span className="m-k">Property NFT</span>
                <span className="m-id">#0421</span>
                <span className="m-sub">Downtown Dubai · 1 of 1</span>
              </div>
              <span className="coin" data-i="0">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="1">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="2">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="3">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="4">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="5">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="6">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="7">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="8">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="9">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="10">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="coin" data-i="11">
                <b>1/12</b>
                <em>AED 2,500</em>
              </span>
              <span className="pl-cap" id="plCap">
                1 property · 1 NFT
              </span>
            </div>
            <div className="pl-steps" id="plSteps">
              <span className="pl-line">
                <i id="plFill"></i>
              </span>
              <div className="ps">
                <b>01</b>Fractionalize
              </div>
              <div className="ps">
                <b>02</b>List
              </div>
              <div className="ps">
                <b>03</b>Buy back
              </div>
              <div className="ps">
                <b>04</b>Redeem
              </div>
            </div>
          </div>
        </section>

        <section className="steps" id="steps" data-cam="steps">
          <div className="sticky">
            <div className="s-eyebrow">
              <span className="mono">How to tokenize your property</span>
            </div>
            <div className="sweep" id="sweep"></div>
            <div className="slides">
              <article className="slide on" data-fx="wipe" data-screen-label="Step 01">
                <span className="big-num">01</span>
                <span className="s-label">Listing</span>
                <h3>Fill the property listing form</h3>
                <p>
                  Send us your property details through our listing form. Our team will get back to you to begin the
                  legal process.
                </p>
              </article>
              <article className="slide" data-fx="spread" data-screen-label="Step 02">
                <span className="big-num">02</span>
                <span className="s-label">Legal &amp; SPV</span>
                <h3>Legal documentation &amp; SPV ownership</h3>
                <p>
                  We verify your property, run audits and valuations, review documentation, and transfer ownership
                  to the legal SPV.
                </p>
              </article>
              <article className="slide" data-fx="mint" data-screen-label="Step 03">
                <span className="big-num">03</span>
                <span className="s-label">Tokenized</span>
                <h3>Property tokenized</h3>
                <p>
                  A unique NFT representing the property is minted and sent to your wallet. From there, proceed with
                  fractionalization and listing.
                </p>
                <div className="token">
                  <div className="chip">NFT</div>
                  <div>
                    <b>Property NFT minted</b>
                    <small>Ready to fractionalize</small>
                  </div>
                </div>
              </article>
            </div>
            <div className="prog">
              <button className="pseg">
                <b>
                  <i></i>
                </b>
                Listing
              </button>
              <button className="pseg">
                <b>
                  <i></i>
                </b>
                Legal &amp; SPV
              </button>
              <button className="pseg">
                <b>
                  <i></i>
                </b>
                Tokenized
              </button>
            </div>
            <div className="scount">
              <b id="scount">01</b>/ 03
            </div>
          </div>
        </section>

        <section className="chain" id="chain" data-cam="chain" data-screen-label="Robinhood Chain">
          <div className="wrap">
            <div className="rh-halo reveal">
              <div className="rh-logo">
                <img src="/assets/robinhood-logo.png" alt="Robinhood" />
              </div>
            </div>
            <span className="mono reveal">Powered by</span>
            <h2 className="reveal">
              Built on <em>Robinhood Chain</em>
            </h2>
            <p className="lead reveal">
              Every TrueFraction property token lives on Robinhood Chain — a permissionless Ethereum Layer 2
              designed for tokenized real-world assets, settling to Ethereum for security.
            </p>
            <div className="blocks reveal" aria-hidden="true">
              <i style={{ animationDelay: '0.00s' }}></i>
              <i style={{ animationDelay: '0.17s' }}></i>
              <i style={{ animationDelay: '0.34s' }}></i>
              <i style={{ animationDelay: '0.51s' }}></i>
              <i style={{ animationDelay: '0.68s' }}></i>
              <i style={{ animationDelay: '0.85s' }}></i>
              <i style={{ animationDelay: '1.02s' }}></i>
              <i style={{ animationDelay: '1.19s' }}></i>
              <i style={{ animationDelay: '1.36s' }}></i>
              <i style={{ animationDelay: '1.53s' }}></i>
              <i style={{ animationDelay: '1.70s' }}></i>
              <i style={{ animationDelay: '1.87s' }}></i>
              <i style={{ animationDelay: '2.04s' }}></i>
              <i style={{ animationDelay: '2.21s' }}></i>
            </div>
            <div className="specs reveal">
              <div className="spec">
                <b>Ethereum L2</b>
                <span>Built on Arbitrum technology</span>
              </div>
              <div className="spec">
                <b>~100 ms blocks</b>
                <span>Near-instant settlement</span>
              </div>
              <div className="spec">
                <b>EVM-compatible</b>
                <span>Use any Ethereum wallet</span>
              </div>
            </div>
          </div>
        </section>

        <section className="comp" id="compliance" data-cam="compliance" data-screen-label="Compliance">
          <div className="comp-sticky">
            <div className="comp-head">
              <span className="mono">Compliance by design</span>
              <h2>
                Standards built for <em>real-world assets</em>
              </h2>
            </div>
            <div className="stds">
              <span className="stds-link" id="stdLink"></span>
              <div className="std" id="stdL">
                <div className="tag">
                  <span className="glyph">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                      <path d="M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7z" />
                      <path d="M8.5 12l2.5 2.5 4.5-5" />
                    </svg>
                  </span>
                  <div>
                    <small>T-REX token standard · built for RWA</small>
                    <br />
                    <b>ERC-3643</b>
                  </div>
                </div>
                <p>
                  ERC-3643, the T-REX standard, was built for tokenizing real-world assets. Every TrueFraction
                  property token is issued as an ERC-3643 permissioned token. Transfers are checked on-chain against
                  identity and compliance rules before they settle.
                </p>
                <ul>
                  <li>Permissioned transfers</li>
                  <li>Built-in compliance</li>
                  <li>Recoverable tokens</li>
                </ul>
              </div>
              <div className="std" id="stdR">
                <div className="tag">
                  <span className="glyph">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <rect x="3" y="5" width="18" height="14" rx="2.5" />
                      <circle cx="9" cy="11" r="2.2" />
                      <path d="M5.8 16.2c.7-1.5 1.9-2.2 3.2-2.2s2.5.7 3.2 2.2M14.5 10h3.5M14.5 13.5h2.5" />
                    </svg>
                  </span>
                  <div>
                    <small>Decentralized identity</small>
                    <br />
                    <b>ONCHAINID</b>
                  </div>
                </div>
                <p>
                  Investors hold a self-sovereign ONCHAINID. Verified KYC claims are attached once and reused, so
                  only eligible wallets can hold or receive property tokens.
                </p>
                <ul>
                  <li>Self-sovereign identity</li>
                  <li>Reusable KYC claims</li>
                  <li>Privacy-preserving</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="cta" id="list" data-cam="cta">
          <span className="mono reveal">03 — Start</span>
          <h2 className="reveal">
            Build your share
            <br />
            <span className="grad">of the skyline.</span>
          </h2>
          <p className="reveal">
            List your property for tokenization, or start investing in fractions of Dubai&apos;s finest addresses.
          </p>
          <div className="ctas reveal" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#" className="btn primary">
              List your property <span className="arr">→</span>
            </a>
            <a href="#" className="btn">
              Browse fractions
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="big grad">TrueFraction</div>
        <div className="row">
          <span className="mono">© 2026 TrueFraction · Dubai, UAE</span>
          <div className="links" style={{ display: 'none' }}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
            <button id="dl">Download tower · GLB</button>
          </div>
        </div>
      </footer>
    </>
  );
};

export default TrueFraction;
