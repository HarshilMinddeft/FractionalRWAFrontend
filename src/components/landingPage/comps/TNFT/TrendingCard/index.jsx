import "./trendingCard.css"

const TrendingCard = (props) => {
    const  { nft } = props;

  return (
    <div className='trending-card absolute-center'> 
    <div className='tc-inner-wrapper'>
        <div className='tc-content'>
            < img alt= {nft.user_name} src={nft.banner} className='tc-banner' />
            <div className='tc-user-info'>
                <div className='tc-ui-left' >
                    {/* <img alt={nft.user_name} className='tc-user-logo' src={nft.user_photo} 
                    /> */}
                    <div >
                        <div className='tc-ui-username'>{nft.user_name}</div>
                        <div className='tc-ui-userhandel'>Price {nft.userhandel}</div>
                    </div>
                </div>
                {/* <img alt='Eth'
                    className='tc-solana-logo'
                    src='https://cryptologos.cc/logos/polygon-matic-logo.png' /> */}
            </div>
        </div>
    </div>
    </div>
  )
};

export default TrendingCard;

// banner: "https://i.seadn.io/gae/dcREcwXGV7rX0PXqbmZFi0lT6rxu3CVEWsZY3exH48qwlvF2xyNgsGo49ZZCmF4hwtARIgIf4Zh2sbqrnnyQvlwpNsDMCJLxjIzy?auto=format&dpr=1&w=1080",
//         userhandel:"jackape",
//         user_name:"jack ape club",
//         user_photo:
