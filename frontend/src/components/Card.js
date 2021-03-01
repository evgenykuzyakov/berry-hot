import React, {useCallback, useEffect, useState} from 'react';
import {BuyButton, fromNear} from "./BuyButton";
import {CardImage, preloadCard} from "./CardImage";
import TimeAgo from "timeago-react";

const mapCardInfo = (c) => {
  return c ? {
    ownerId: c.owner_id,
    purchasePrice: fromNear(c.purchase_price),
    purchaseTime: new Date(parseFloat(c.purchase_time) / 1e6),
    volume: fromNear(c.volume),
  } : {
    ownerId: null,
    purchasePrice: 0,
    purchaseTime: null,
    volume: 0,
  };
}

function Card(props) {
  const [cardInfo, setCardInfo] = useState(null);
  const cardId = props.cardId;
  const refreshTime = props.refreshTime;
  const hidden = props.hidden;

  const fetchInfo = useCallback(async () => {
    const rating = await props._near.contract.get_rating({
      card_id: cardId,
    })
    const cardInfo = mapCardInfo(await props._near.contract.get_card_info({
      card_id: cardId,
    }));
    cardInfo.refreshTime = refreshTime;
    cardInfo.rating = rating;
    return cardInfo;
  }, [props._near, cardId, refreshTime])

  useEffect(() => {
    if (props.connected && !hidden) {
      preloadCard(cardId);
      fetchInfo().then(setCardInfo)
    }
  }, [props.connected, fetchInfo, cardId, hidden])

  return cardInfo ? (
    <div className="card m-2">
      <CardImage className="card-img-top" cardId={cardId} cardReady={() => false}/>
      <div className="card-body text-start">
        <h3>#{cardId}</h3>
        {cardInfo.ownerId ? (
          <div>
            <p>
              Owned by @{cardInfo.ownerId}<br/>
              Purchased <TimeAgo datetime={cardInfo.purchaseTime} /><br/>
              Purchased for {cardInfo.purchasePrice.toFixed(2)} NEAR<br/>
            </p>
          </div>
        ) : (
          <div>
            <p>
              Not owned by anyone.
            </p>
          </div>
        )}
      </div>
      <div className="card-footer">
        <p className="card-text text-center">
          <BuyButton {...props} cardId={cardId} price={cardInfo.rating} />
        </p>
      </div>
    </div>
  ) : (
    <div className="card m-2">
      <div className="d-flex justify-content-center">
        <div className="spinner-grow" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
}

export default Card;
