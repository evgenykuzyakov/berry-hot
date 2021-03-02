import React from 'react';

const fromNear = (s) => parseFloat(s) / 1e24;

function BuyButton(props) {
  async function buyCard(e) {
    e.preventDefault();
    await props._near.contract.buy_card({card_id: props.cardId}, "200000000000000", props.price);
  }

  const price = fromNear(props.price);
  const appCommission = price / 100;
  let artDaoProfit = price / 10;
  let ownerPrice = price - appCommission - artDaoProfit;
  if (!props.ownerId) {
    artDaoProfit += ownerPrice;
    ownerPrice = 0;
  }

  const newPrice = price * 1.2;

  return (
    <div>
      <button
        className="btn btn-success"
        disabled={!props.signedIn}
        onClick={(e) => buyCard(e)}
      >
        Buy for {price.toFixed(2)} NEAR
      </button>
      <div className="text-muted text-start">
        <p>
          Price breakdown:
          <ul>
            {props.ownerId && (
              <li>Owner @{props.ownerId} will get {ownerPrice.toFixed(2)} NEAR</li>
            )}
            <li>Art DAO will get {artDaoProfit.toFixed(2)} NEAR</li>
            <li>1% App commission is {appCommission.toFixed(2)} NEAR</li>
          </ul>
        </p>
        <p>
          The new price will be {newPrice.toFixed(2)} NEAR
        </p>
      </div>
    </div>
  );
}

export { fromNear, BuyButton };
