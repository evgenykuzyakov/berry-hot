import React, {useState} from 'react';
import {fromNear} from "./BuyButton";
import Card from "./Card";
import uuid from "react-uuid";

function PriceButton(props) {
  const [hidden, setHidden] = useState(true);
  const [gkey] = useState(uuid());

  return (
    <div>
      <button
        className="btn btn-success" disabled={!props.signedIn}
        data-bs-toggle="modal"
        data-bs-target={`#card-modal-${gkey}`}
        onClick={(e) => setHidden(false)}
      >
        {fromNear(props.price).toFixed(2)} NEAR
      </button>
      <div className="modal fade" id={`card-modal-${gkey}`} tabIndex="-1" aria-labelledby={`card-label-${gkey}`} aria-hidden={true}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id={`card-label-${gkey}`}>Card #{props.cardId}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <Card {...props} hidden={hidden} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceButton;
