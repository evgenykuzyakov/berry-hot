import "./Home.scss";
import React, {useState} from 'react';
import { WaybackCard, preloadCard } from "../components/WaybackCard";


function HomePage(props) {
  const [voting, setVoting] = useState(false);
  const [leftReady, setLeftReady] = useState(false);
  const [rightReady, setRightReady] = useState(false);

  const voteRequest = props.requests ? props.requests[0] : null;
  if (props.requests) {
    props.requests.slice(1).forEach((nextRequest) => {
      preloadCard(nextRequest.left);
      preloadCard(nextRequest.right);
    });
  }

  const vote = async (e, voteRequest, response) => {
    if (voting) {
      return;
    }
    if (response === "SelectedLeft" && !leftReady) {
      return;
    }
    if (response === "SelectedRight" && !rightReady) {
      return;
    }
    e.preventDefault();
    setVoting(true);
    props.popRequest();
    const newRequest = await props._near.contract.vote({
      request: voteRequest,
      response,
    }, "100000000000000");
    props.addRequest(newRequest, () => setVoting(false));
  }

  return (
    <div>
      <div className="container">
        {voteRequest ? (
          <div>
            <div className="row justify-content-md-center mb-3">
              <div className="col col-sm-6">
                <div className={`card-picker${(voting || !leftReady) ? " disabled": ""}`} onClick={(e) => vote(e, voteRequest, "SelectedLeft")}>
                  <WaybackCard className="img-fluid" cardId={voteRequest.left} cardReady={setLeftReady}/>
                </div>
              </div>
              <div className="col col-sm-6">
                <div className={`card-picker${(voting || !rightReady) ? " disabled": ""}`} onClick={(e) => vote(e, voteRequest,"SelectedRight")}>
                  <WaybackCard className="img-fluid" cardId={voteRequest.right} cardReady={setRightReady}/>
                </div>
              </div>
            </div>
            <div className="row justify-content-md-center">
              {voting ? (
                <button disabled={true} className="btn btn-lg btn-secondary">
                  <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
                  <span className="visually-hidden">Loading...</span>
                    {' '}Voting
                </button>
              ) : (
                <button className="btn btn-lg btn-danger" onClick={(e) => vote(e, voteRequest,"Skipped")}>Skip both cards</button>
              )}
            </div>
          </div>
        ) : (
          <div className="d-flex justify-content-center">
            <div className="spinner-grow" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
