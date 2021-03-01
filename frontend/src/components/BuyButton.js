import React from 'react';

const fromNear = (s) => parseFloat(s) / 1e24;

function BuyButton(props) {
  async function buyCard(e) {
    e.preventDefault();
    await props._near.contract.buy_card({card_id: props.cardId}, "100000000000000", props.price)
  }

  return (
    <button className="btn btn-success" disabled={!props.signedIn} onClick={(e) => buyCard(e)}>
      Buy for {fromNear(props.price).toFixed(2)} NEAR
    </button>
  );
}

export { fromNear, BuyButton };
