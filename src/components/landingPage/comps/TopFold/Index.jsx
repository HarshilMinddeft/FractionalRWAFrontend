import './topfold.css';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../config/routes';

const TopFold = () => {
  const navigate = useNavigate();
  return (
    <div className="topfold absolute-center">
      <div className="tf-left">
        <h1 className="tf-heding">
          Unlock <br></br>
          <span className="heading-gradient">Fractional</span> Ownership of Real-World Assets
        </h1>
        <div className="tf-desc">
          {' '}
          Step into the future of investing where properties, infrastructure, and real estate are no longer limited to
          the elite. With TrueFraction, anyone can own a slice of high-value assets and earn real-world returns.
        </div>
        <div className="tf-left-btns">
          <Button
            btnType="PRIMARY"
            btnText="Tokenize Your Property"
            btnonClick={() => navigate(ROUTES.tokenizeProperty)}
          />
        </div>
      </div>
      <div className="tf-right">
        <div className="tf-r-bg-blob"></div>
        <div className="tf-right-diamond">
          <div className="tf-r-diamond-items absolute-center">
            <img
              className="tf-r-diamond-img"
              alt="diamond-banner"
              src="https://brown-leading-scallop-142.mypinata.cloud/ipfs/bafkreicouqxxw3kqtrws2rrghgom6p7d5diuoepo4gdztx7nf4itbet4wy"
            />
          </div>
          <div className="tf-r-diamond-items absolute-center">
            <img
              className="tf-r-diamond-img"
              alt="diamond-banner"
              src="https://brown-leading-scallop-142.mypinata.cloud/ipfs/QmfRYuVo7gDzUeodqHtnMxqZuBXoPLQAkyyhzmMGEHfety"
            />
          </div>
          <div className="tf-r-diamond-items absolute-center">
            <img
              className="tf-r-diamond-img"
              alt="diamond-banner"
              src="https://brown-leading-scallop-142.mypinata.cloud/ipfs/QmQSosWCn9TV6Sg7pQ4TxeRjeZFfq6Ay5QqEy94wE1wk8H"
            />
          </div>
          <div className="tf-r-diamond-items absolute-center">
            <img
              className="tf-r-diamond-img"
              alt="diamond-banner"
              src="https://brown-leading-scallop-142.mypinata.cloud/ipfs/QmeinPk44AMkxDt8xnh3BxrstppHQKrBiYVD46GEPgQK54"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopFold;
