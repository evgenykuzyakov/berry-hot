import React from 'react';
import {useParams} from "react-router";
import Card from "../components/Card";

function CardPage(props) {
  const { cardId } = useParams();

  return (
    <div className="container">
      <div className="row">
        <div className="col col-12 col-lg-8 col-xl-6">
          <Card {...props} cardId={parseInt(cardId)} />
        </div>
      </div>
    </div>
  );
}

export default CardPage;
