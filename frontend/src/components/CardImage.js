import React, {useEffect, useState} from 'react';
import BrokenCard from "../images/tomato.png"
import LoadingCard from "../images/avocado.gif"

const loadedCards = {};

function preloadCard(cardId) {
  if (cardId in loadedCards) {
    return;
  }
  loadedCards[cardId] = true;
  let a = new Image();
  a.src = `https://wayback.berryclub.io/img/${cardId}`;
}

function CardImage(props) {
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
    <img className={props.className} src={LoadingCard} alt={`The card #${cardId} is loading`}/>
  ) : badCard ? (
    <img className={props.className} src={BrokenCard} alt={`The card #${cardId} is broken`}/>
  ) : (
    <img className={props.className} src={`https://wayback.berryclub.io/img/${cardId}`} alt={`Card #${cardId}`}/>
  );
}

export { preloadCard, CardImage };
