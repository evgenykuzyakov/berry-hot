import React, {useEffect, useState} from 'react';
import BrokenCard from "../images/broken-card.png"

const loadedCards = {};

function preloadCard(cardId) {
  if (cardId in loadedCards) {
    return;
  }
  loadedCards[cardId] = true;
  let a = new Image();
  a.src = `https://wayback.berryclub.io/img/${cardId}`;
}

function WaybackCard(props) {
  const [loading, setLoading] = useState(true);
  const [badCard, setBadCard] = useState(false);

  const cardReady = props.cardReady;
  const cardId = props.cardId;

  useEffect(() => {
    setLoading(true);
    setBadCard(false);
    cardReady(false);
    let a = new Image();
    a.src = `https://wayback.berryclub.io/img/${cardId}`;
    a.onload = () => {
      setLoading(false);
      cardReady(true);
    }
    a.onerror = (e) => {
      setBadCard(true);
      setLoading(false);
    }
  }, [cardId, cardReady])

  return loading ? (
    <div className="d-flex justify-content-center">
      <div className="spinner-grow" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  ) : badCard ? (
    <img className={props.className} src={BrokenCard} alt={"The card is broken"}/>
  ) : (
    <img className={props.className} src={`https://wayback.berryclub.io/img/${cardId}`} alt={`Card #${cardId}`}/>
  );
}

export { preloadCard, WaybackCard };
