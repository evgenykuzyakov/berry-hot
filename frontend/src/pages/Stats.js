import React, {useCallback, useEffect, useState} from 'react';
import {fromNear} from "../components/BuyButton";

function StatsPage(props) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const [t, numAccounts] = await Promise.all([
      props._near.contract.get_trade_data(),
      props._near.contract.get_num_accounts(),
    ]);
    return {
      numAccounts,
      numPurchases: t.num_purchases,
      numUniqueCardsBought: t.num_unique_cards_bought,
      nearVolume: fromNear(t.near_volume),
      appCommission: fromNear(t.app_owner_profit),
      artDaoProfit: fromNear(t.art_dao_profit),
      appOwnerId: t.app_owner_id,
      artDaoId: t.art_dao_id,
      totalVotes: t.total_votes,
    };
  }, [props._near])

  useEffect(() => {
    if (props.connected) {
      fetchStats().then((stats) => {
        setStats(stats);
        setLoading(false);
      })
    }
  }, [props.connected, fetchStats])

  return (
    <div className="container">
      <div className="row">
        {loading ? (
          <div className="col">
            <div className="d-flex justify-content-center">
              <div className="spinner-grow" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="col col-12 col-lg-6 col-xl-6">
            <h3>Global Stats</h3>
            <ul>
              <li>Num accounts: {stats.numAccounts}</li>
              <li>Total votes: {stats.totalVotes}</li>
              <li>Total purchases: {stats.numPurchases}</li>
              <li>Total unique purchases: {stats.numUniqueCardsBought}</li>
              <li>Total volume: {stats.nearVolume.toFixed(2)} NEAR</li>
              <li>Total Art DAO profit: {stats.artDaoProfit.toFixed(2)} NEAR</li>
              <li>Art DAO account ID: <a href={`https://explorer.near.org/accounts/${stats.artDaoId}`}>@{stats.artDaoId}</a></li>
              <li>Total App commission: {stats.appCommission.toFixed(2)} NEAR</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsPage;
