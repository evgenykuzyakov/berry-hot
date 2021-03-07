import "./Discover.scss";
import React, {useCallback, useEffect, useState} from 'react';
import uuid from "react-uuid";
import CardPreview from "../components/CardPreview";

const FetchLimit = 25;

function DiscoverPage(props) {
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState([]);
  const [limit] = useState(100);
  const [gkey] = useState(uuid())

  const fetchMore = useCallback(async () => {
    if (feed.length >= limit) {
      return feed;
    }
    const f = [...feed];
    while (f.length < limit) {
      const lastKey = f.length > 0 ? f[f.length - 1] : null
      const fetched = await props._near.contract.get_top({
        from_key: lastKey,
        limit: FetchLimit,
      });
      f.push(...fetched);
      if (fetched.length === 0) {
        break;
      }
    }
    console.log(f);
    return f;
  }, [props._near, feed, limit])

  useEffect(() => {
    if (props.connected) {
      setLoading(true);
      fetchMore().then((feed) => {
        setFeed(feed);
        setLoading(false);
      });
    }
  }, [props.connected, fetchMore])

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
