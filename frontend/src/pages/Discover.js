import "./Discover.scss";
import React, {useCallback, useEffect, useState} from 'react';
import uuid from "react-uuid";
import CardPreview from "../components/CardPreview";

const FetchLimit = 30;

function DiscoverPage(props) {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [gkey] = useState(uuid())

  const fetchTop = useCallback(async () => {
    // const numCards = await props._near.contract.get_num_cards();
    return await props._near.contract.get_top({
      limit: FetchLimit,
    })
  }, [props._near])

  useEffect(() => {
    if (props.connected) {
      setLoading(true);
      fetchTop().then((feed) => {
        setFeed(feed);
        setLoading(false);
      })
    }
  }, [props.connected, fetchTop])

  const cards = feed.map(([rating, cardId]) => {
    const key = `${gkey}-${cardId}`;
    return (
      <CardPreview {...props} key={key} cardId={cardId} rating={rating} />
    );
  })

  return (
    <div>
      <div className="container">
        <div className="row justify-content-md-center">
          {loading ? (
            <div className="col col-12 col-lg-8 col-xl-6">
              <div className="d-flex justify-content-center">
                <div className="spinner-grow" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="col">
              {cards}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiscoverPage;
