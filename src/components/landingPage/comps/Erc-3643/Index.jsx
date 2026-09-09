import './tfInfo.css';

const Erc3643 = () => {
  return (
    <div className="mt-12 mb-16 md:mt-24 md:mb-28">
      <div className="tf-left">
        <div className="tf-heding">
          {/* ERC-3643  <br></br> */}
          {/* <span className=''>Ecosystem </span> */}
          {/* <span className='heading-gradient'>
                <TypeAnimation
                sequence={[
                  "OnChainId",
                  3000,
                  "OnChainKyc",
                  2000,
                  "ModularCompliance",
                  2000,
                  "",
                  2000,
                ]}
                speed={50}
                className="text-accent"
                wapper="span"
                repeat={Infinity}
              />
              </span> */}
        </div>
      </div>
      <img src="/Erc3643IMG.png" className="w-full h-auto bg-transparent" alt="Logo" />
    </div>
  );
};

export default Erc3643;
