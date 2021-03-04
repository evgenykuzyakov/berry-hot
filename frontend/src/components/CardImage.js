import React, {useEffect, useRef, useState} from 'react';
import BrokenCard from "../images/tomato.png"
import LoadingCard from "../images/avocado.gif"

const loadedCards = {};
const loadedImages = {};
const cardPreloading = {};

function preloadCard(cardId) {
  if (cardId in cardPreloading) {
    return cardPreloading[cardId];
  }
  return cardPreloading[cardId] = new Promise((resolve) => {
    loadedImages[cardId] = new Image();
    loadedImages[cardId].onload = () => {
      loadedCards[cardId] = true;
      resolve()
    }
    loadedImages[cardId].onerror = (e) => {
      loadedCards[cardId] = false;
      resolve()
    }
    loadedImages[cardId].src = `https://i.berry.cards/${cardId}`;
  });

}

function CardImage(props) {
  const [cardImage, setCardImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [badCard, setBadCard] = useState(false);
  const canvasEl = useRef(null);

  const cardReady = props.cardReady;
  const cardId = props.cardId;

  useEffect(() => {
    setLoading(true);
    setCardImage(null);
    cardReady(false);
    setBadCard(false);
    preloadCard(cardId).then(() => {
      setBadCard(!loadedCards[cardId]);
      setLoading(false);
      if (loadedCards[cardId]) {
        cardReady(true);
        setCardImage(loadedImages[cardId]);
      }
    });
  }, [cardId, cardReady, canvasEl])

  useEffect(() => {
    if (canvasEl.current && cardImage) {
      const ctx = canvasEl.current.getContext('2d');
      ctx.drawImage(cardImage, 0, 0);
    }
  }, [cardImage])

  return (
    <div>
      {loading ? (
        <img className={props.className} src={LoadingCard} alt={`The card #${cardId} is loading`}/>
      ) : badCard ? (
        <img className={props.className} src={BrokenCard} alt={`The card #${cardId} is broken`}/>
      ): ("")}
      <canvas
        className={`${props.className}${(!cardImage || loading || badCard) ? " d-none": ""}`}
        ref={canvasEl}
        width={400}
        height={400}
        alt={`Card #${cardId}`}
      />
    </div>
  )
}

export { preloadCard, CardImage };
