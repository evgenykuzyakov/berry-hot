import "./Home.scss";
import React, {useState} from 'react';
import { CardImage, preloadCard } from "../components/CardImage";
import CardPreview from "../components/CardPreview";
import uuid from "react-uuid";

const SelectedLeft = "SelectedLeft";
const SelectedRight = "SelectedRight";
const Skipped = "Skipped";

const DefaultTGas = 100;
const ExtraTGas = 50;
const NumIter = 5;
let votingPromise = Promise.resolve();

function HomePage(props) {
  const [leftReady, setLeftReady] = useState(false);
  const [rightReady, setRightReady] = useState(false);
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
    const nextPromise = async () => {
      let tgas = DefaultTGas;
      let newRequest = null
      for (let iter = 0; iter < NumIter; ++iter) {
        try {
          newRequest = await props._near.contract.vote({
            request: voteRequest,
            response,
          }, tgas.toString() + "000000000000");
        } catch (e) {
          const msg = e.toString();
          console.warn(msg);
          if (msg.indexOf("prepaid gas") !== -1) {
            tgas += ExtraTGas;
            continue
          }
          if (msg.indexOf("does not have enough balance") !== -1) {
            await props.refreshAllowance();
            return;
          }
        }
        break;
      }
      if (newRequest) {
        if (response === SelectedLeft || response === SelectedRight) {
          const cardId = response === SelectedLeft ? voteRequest.left : voteRequest.right;
          props.addRecentCard(cardId);
        }
        props.addRequest(newRequest);
      }
    };

    votingPromise = votingPromise.then(nextPromise);
    // setVotingPromise(nextPromise);
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
            <h3>Vote</h3>
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
