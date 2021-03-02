import React from 'react';
import {fromNear} from "./BuyButton";
import {Link} from "react-router-dom";

function PriceButton(props) {
  return (
    <div>
      <Link
        to={`/c/${props.cardId}`}
        className="btn btn-success" disabled={!props.signedIn}
      >
        {fromNear(props.price).toFixed(2)} NEAR
      </Link>
    </div>
  );
}

export default PriceButton;
