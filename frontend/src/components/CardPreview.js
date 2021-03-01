import "./CardPreview.scss"
import React, {useCallback, useEffect, useState} from 'react';
import {CardImage} from "./CardImage";
import {Link} from "react-router-dom";
import PriceButton from "./PriceButton";

function CardPreview(props) {
  const [rating, setRating] = useState(props.rating);
  const cardId = props.cardId;
  const propsRating = props.rating;

  const fetchRating = useCallback(async () => {
    return await props._near.contract.get_rating({
      card_id: cardId,
    })
  }, [props._near, cardId])

  useEffect(() => {
    if (props.connected) {
      if (!propsRating) {
        fetchRating().then(setRating)
      } else {
        setRating(propsRating)
      }
    }
  }, [props.connected, propsRating, fetchRating])

  return props.cardId ? (
    <div className="card card-preview m-2">
      <Link to={`/c/${cardId}`}>
        <CardImage className="card-img-top" cardId={cardId} cardReady={() => false}/>
      </Link>
      <div className="card-body">
        #{cardId}
      </div>
      <div className="card-footer text-center">
        <PriceButton {...props} cardId={cardId} price={rating} />
      </div>
    </div>
  ) : (
    <div className="card card-preview m-2">
     <div className="d-flex justify-content-center">
        <div className="spinner-grow" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
}

export default CardPreview;
