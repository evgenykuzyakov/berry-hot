import "./Discover.scss";
import React, { useEffect, useState} from 'react';
import uuid from "react-uuid";
import CardPreview from "../components/CardPreview";
import InfiniteScroll from 'react-infinite-scroller';

const FetchLimit = 25;

function DiscoverPage(props) {
  const [feed, setFeed] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [gkey] = useState(uuid())

  const fetchMore = async () => {
    const f = [...feed];
    const lastKey = f.length > 0 ? f[f.length - 1] : null
    const fetched = await props._near.contract.get_top({
      from_key: lastKey,
      limit: FetchLimit,
    });
    f.push(...fetched);
    if (fetched.length === 0) {
      setHasMore(false);
    }
    setFeed(f);
  };

  useEffect(() => {
    if (props.connected) {
      setHasMore(true);
    }
  }, [props.connected])

  const cards = feed.map(([rating, cardId]) => {
    const key = `${gkey}-${cardId}`;
    return (
      <CardPreview {...props} key={key} cardId={cardId} rating={rating} />
    );
  })

  const loader = (
    <div className="d-flex justify-content-center" key={`${gkey}-loader`}>
      <div className="spinner-grow" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="container">
        <div className="row justify-content-md-center">
          <div className="col">
            <InfiniteScroll
              pageStart={0}
              loadMore={fetchMore}
              hasMore={hasMore}
              loader={loader}
            >
              {cards}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscoverPage;
