import "./Home.scss";
import React, {useState} from 'react';
import { WaybackCard, preloadCard } from "../components/WaybackCard";


function HomePage(props) {
  const [leftReady, setLeftReady] = useState(false);
  const [rightReady, setRightReady] = useState(false);
  const [votingPromise] = useState(Promise.resolve());

  const voteRequest = props.requests ? props.requests[0] : null;

  if (props.requests) {
    props.requests.slice(1).forEach((nextRequest) => {
      preloadCard(nextRequest.left);
      preloadCard(nextRequest.right);
    });
  }

  const vote = async (e, voteRequest, response) => {
    e.preventDefault();
    if (response === "SelectedLeft" && !leftReady) {
      return;
    }
    if (response === "SelectedRight" && !rightReady) {
      return;
    }
    props.popRequest();
    votingPromise.then(async () => {
      const newRequest = await props._near.contract.vote({
        request: voteRequest,
        response,
      }, "80000000000000");
      props.addRequest(newRequest);
    });
  }

  return (
    <div>
      <div className="container">
        {voteRequest ? (
          <div>
            <div className="row justify-content-md-center mb-3">
              <div className="col col-sm-6">
                <div className={`card-picker${!leftReady ? " disabled": ""}`} onClick={(e) => vote(e, voteRequest, "SelectedLeft")}>
                  <WaybackCard className="img-fluid" cardId={voteRequest.left} cardReady={setLeftReady}/>
                </div>
              </div>
              <div className="col col-sm-6">
                <div className={`card-picker${!rightReady ? " disabled": ""}`} onClick={(e) => vote(e, voteRequest,"SelectedRight")}>
                  <WaybackCard className="img-fluid" cardId={voteRequest.right} cardReady={setRightReady}/>
                </div>
              </div>
            </div>
            <div className="row justify-content-md-center">
              {false ? (
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
