import React from 'react';
import "error-polyfill";
import 'bootstrap/dist/js/bootstrap.bundle';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./App.scss";
import './gh-fork-ribbon.css';
import * as nearAPI from 'near-api-js'
import Logo from "./images/logo.png"
import DiscoverPage from "./pages/Discover";
import HomePage from "./pages/Home";
import {HashRouter as Router, Link, Route, Switch} from 'react-router-dom'
import {fromNear} from "./components/BuyButton";
import ls from "local-storage";
import CardPage from "./pages/Card";
import AccountPage from "./pages/Account";
import StatsPage from "./pages/Stats";

const IsMainnet = window.location.hostname === "berry.cards";
const TestNearConfig = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  archivalNodeUrl: 'https://rpc.testnet.internal.near.org',
  contractName: 'dev-1614796345972-8721304',
  walletUrl: 'https://wallet.testnet.near.org',
};
const MainNearConfig = {
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  archivalNodeUrl: 'https://rpc.mainnet.internal.near.org',
  contractName: 'cards.berryclub.ek.near',
  walletUrl: 'https://wallet.near.org',
};

const NearConfig = IsMainnet ? MainNearConfig : TestNearConfig;

const FetchLimit = 50;

const mapAccount = (a) => {
  return {
    requests: a.requests,
    numCards: a.num_cards,
    purchaseVolume: fromNear(a.purchase_volume),
    numPurchases: a.num_purchases,
    saleProfit: fromNear(a.sale_profit),
    numSales: a.num_sales,
    numVotes: a.num_votes,
  };
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this._near = {};

    this._near.lsKey = NearConfig.contractName + ':v01:';
    this._near.lsKeyRecentCards = this._near.lsKey + "recentCards";

    this.state = {
      connected: false,
      isNavCollapsed: true,
      account: null,
      requests: null,
      recentCards: ls.get(this._near.lsKeyRecentCards) || [],
    };

    this._initNear().then(() => {
      this.setState({
        signedIn: !!this._near.accountId,
        signedAccountId: this._near.accountId,
        connected: true,
      });
    });
  }


  async _initNear() {
    const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();
    const near = await nearAPI.connect(Object.assign({deps: {keyStore}}, NearConfig));
    this._near.keyStore = keyStore;
    this._near.near = near;

    this._near.walletConnection = new nearAPI.WalletConnection(near, NearConfig.contractName);
    this._near.accountId = this._near.walletConnection.getAccountId();

    this._near.account = this._near.walletConnection.account();
    this._near.contract = new nearAPI.Contract(this._near.account, NearConfig.contractName, {
      viewMethods: ['get_account', 'get_accounts', 'get_num_cards', 'get_top', 'get_rating', 'get_trade_data', 'get_card_info', 'get_account_cards'],
      changeMethods: ['register_account', 'vote', 'buy_card'],
    });

    this._near.accounts = {};

    this._near.getAccount = (accountId) => {
      if (accountId in this._near.accounts) {
        return this._near.accounts[accountId];
      }
      return this._near.accounts[accountId] = Promise.resolve((async () => {
        const a = await this._near.contract.get_account({account_id: accountId});
        const account = a ? mapAccount(a) : null;
        if (account) {
          account.fetchCards = () => {
            if (account.cardFetching) {
              return account.cardFetching;
            }
            const promises = [];
            for (let i = 0; i < account.numCards; i += FetchLimit) {
              promises.push(this._near.contract.get_account_cards({
                account_id: accountId,
                from_index: i,
                limit: FetchLimit,
              }));
            }
            return account.cardFetching = Promise.resolve((async () => {
              return (await Promise.all(promises)).flat();
            })());
          };
        }
        return account;
      })());
    };

    if (this._near.accountId) {
      let account = await this._near.getAccount(this._near.accountId);
      if (account === null) {
        await this._near.contract.register_account();
        delete this._near.accounts[this._near.accountId];
        account = await this._near.getAccount(this._near.accountId);
      }
      this.setState({
        account,
        requests: account.requests,
      });
    }
  }

  async requestSignIn(e) {
    e && e.preventDefault();
    const appTitle = 'Berry Cards';
    await this._near.walletConnection.requestSignIn(
      NearConfig.contractName,
      appTitle
    )
    return false;
  }

  async logOut() {
    this._near.walletConnection.signOut();
    this._near.accountId = null;
    this.setState({
      signedIn: !!this._accountId,
      signedAccountId: this._accountId,
    })
  }

  popRequest(c) {
    const requests = this.state.requests.slice(1);
    this.setState({
      requests,
    }, c);
  }

  addRequest(r, c) {
    const requests = this.state.requests.slice(0);
    requests.push(r);
    this.setState({
      requests,
    }, c);
  }

  addRecentCard(cardId) {
    let recentCards = this.state.recentCards.slice(0);
    const index = recentCards.indexOf(cardId);
    if (index !== -1) {
      recentCards.splice(index, 1);
    }
    recentCards.unshift(cardId);
    recentCards = recentCards.slice(0, 5);
    ls.set(this._near.lsKeyRecentCards, recentCards);
    this.setState({
      recentCards
    })
  }

  async refreshAllowance() {
    alert("You're out of access key allowance. Need sign in again to refresh it");
    await this.logOut();
    await this.requestSignIn();
  }

  render() {
    const passProps = {
      _near: this._near,
      updateState: (s, c) => this.setState(s, c),
      popRequest: (c) => this.popRequest(c),
      addRequest: (r, c) => this.addRequest(r, c),
      addRecentCard: (cardId) => this.addRecentCard(cardId),
      refreshAllowance: () => this.refreshAllowance(),
      ...this.state
    };
    const header = !this.state.connected ? (
      <div>Connecting... <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span></div>
    ) : (this.state.signedIn ? (
      <div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => this.logOut()}>Sign out ({this.state.signedAccountId})</button>
      </div>
    ) : (
      <div>
        <button
          className="btn btn-primary"
          onClick={(e) => this.requestSignIn(e)}>Sign in with NEAR Wallet</button>
      </div>
    ));

    return (
      <div className="App">
        <Router basename={process.env.PUBLIC_URL}>
          <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3">
            <div className="container-fluid">
              <Link className="navbar-brand" to="/" title="NEAR.fm">
                <img src={Logo} alt="Berry Cards" className="d-inline-block align-middle" />
                [BETA] Berry Cards
              </Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                      data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                      aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  <li className="nav-item">
                    <Link className="nav-link" aria-current="page" to="/">Home</Link>
                  </li>
                  {this.state.signedIn && (
                    <li className="nav-item">
                      <Link className="nav-link" aria-current="page" to="/discover">Discover</Link>
                    </li>
                  )}
                  {this.state.signedIn && (
                    <li className="nav-item">
                      <Link className="nav-link" aria-current="page"
                            to={`/a/${this.state.signedAccountId}`}>Profile</Link>
                    </li>
                  )}
                  <li className="nav-item">
                    <Link className="nav-link" aria-current="page" to="/stats">Stats</Link>
                  </li>
                </ul>
                <form className="d-flex">
                  {header}
                </form>
              </div>
            </div>
          </nav>

          <a className="github-fork-ribbon right-bottom fixed" href="https://github.com/evgenykuzyakov/berry-hot" data-ribbon="Fork me on GitHub"
             title="Fork me on GitHub">Fork me on GitHub</a>

          <Switch>
            <Route exact path={"/"}>
              {this.state.signedIn ? (
                <HomePage {...passProps}/>
              ) : (
                <DiscoverPage {...passProps}/>
              )}
            </Route>
            <Route exact path={"/discover"}>
              <DiscoverPage {...passProps}/>
            </Route>
            <Route exact path={"/stats"}>
              <StatsPage {...passProps}/>
            </Route>
            <Route exact path={"/a/:accountId"}>
              <AccountPage {...passProps} />
            </Route>
            <Route exact path={"/c/:cardId"}>
              <CardPage {...passProps} />
            </Route>
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App;
