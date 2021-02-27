import "./Home.scss";
import React, {useState} from 'react';
import WaybackCard from "../components/WaybackCard";


function HomePage(props) {
  const [voting, setVoting] = useState(false);
  const [leftReady, setLeftReady] = useState(false);
  const [rightReady, setRightReady] = useState(false);

  const vote = async (e, response) => {
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
    const request = await props._near.contract.vote({
      request: props.request,
      response,
    }, "100000000000000");
    props.updateState({
      request
    }, () => setVoting(false));
  }

  return (
    <div>
      <div className="container">
        {props.request ? (
          <div>
            <div className="row justify-content-md-center mb-3">
              <div className="col col-sm-6">
                <div className={`card-picker${(voting || !leftReady) ? " disabled": ""}`} onClick={(e) => vote(e, "SelectedLeft")}>
                  <WaybackCard className="img-fluid" cardId={props.request.left} cardReady={setLeftReady}/>
                </div>
              </div>
              <div className="col col-sm-6">
                <div className={`card-picker${(voting || !rightReady) ? " disabled": ""}`} onClick={(e) => vote(e, "SelectedRight")}>
                  <WaybackCard className="img-fluid" cardId={props.request.right} cardReady={setRightReady}/>
                </div>
              </div>
            </div>
            <div className="row justify-content-md-center">
              {voting ? (
                <button disabled={true} className="btn btn-secondary">
                  <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span>
                  <span className="visually-hidden">Loading...</span>
                    {' '}Voting
                </button>
              ) : (
                <button className="btn btn-danger" onClick={(e) => vote(e, "Skipped")}>Skip both cards</button>
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
