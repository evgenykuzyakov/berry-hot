import "./Home.scss";
import React, {useState} from 'react';
import { CardImage, preloadCard } from "../components/CardImage";
import CardPreview from "../components/CardPreview";
import uuid from "react-uuid";

const SelectedLeft = "SelectedLeft";
const SelectedRight = "SelectedRight";
const Skipped = "Skipped";

function HomePage(props) {
  const [leftReady, setLeftReady] = useState(false);
  const [rightReady, setRightReady] = useState(false);
  const [votingPromise] = useState(Promise.resolve());
  const [gkey] = useState(uuid())

  const voteRequest = props.requests ? props.requests[0] : null;

  if (props.requests) {
    props.requests.slice(1).forEach((nextRequest) => {
      preloadCard(nextRequest.left);
      preloadCard(nextRequest.right);
    });
  }

  const vote = async (e, voteRequest, response) => {
    e.preventDefault();
    if (response === SelectedLeft && !leftReady) {
      return;
    }
    if (response === SelectedRight && !rightReady) {
      return;
    }
    props.popRequest();
    votingPromise.then(async () => {
      const newRequest = await props._near.contract.vote({
        request: voteRequest,
        response,
      }, "100000000000000");
      if (response === SelectedLeft || response === SelectedRight) {
        const cardId = response === SelectedLeft ? voteRequest.left : voteRequest.right;
        props.addRecentCard(cardId);
      }
      props.addRequest(newRequest);
    });
  }

  const cards = props.recentCards.map((cardId) => {
    const key = `${gkey}-${cardId}`;
    return (
      <CardPreview {...props} key={key} cardId={cardId} />
    );
  })

  return (
    <div>
      <div className="container">
        {voteRequest ? (
          <div>
            <div className="row justify-content-md-center mb-3">
              <div className="col col-sm-6">
                <div
                  className={`card-picker${!leftReady ? " disabled": ""}`}
                  onClick={(e) => vote(e, voteRequest, SelectedLeft)}
                >
                  <CardImage className="img-fluid" cardId={voteRequest.left} cardReady={setLeftReady}/>
                </div>
              </div>
              <div className="col col-sm-6">
                <div
                  className={`card-picker${!rightReady ? " disabled": ""}`}
                  onClick={(e) => vote(e, voteRequest, SelectedRight)}
                >
                  <CardImage className="img-fluid" cardId={voteRequest.right} cardReady={setRightReady}/>
                </div>
              </div>
            </div>
            <div className="row justify-content-md-center mb-3">
              <button
                className="btn btn-lg btn-danger"
                onClick={(e) => vote(e, voteRequest, Skipped)}
              >Skip both cards</button>
            </div>
          </div>
        ) : (
          <div className="d-flex justify-content-center">
            <div className="spinner-grow" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
        <div className="row justify-content-md-center mb-3">
          {(cards.length > 0) && (
            <div>
              <h3>Recent votes</h3>
              {cards}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
