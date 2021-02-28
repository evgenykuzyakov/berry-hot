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

const IsMainnet = window.location.hostname === "berry.cards";
const TestNearConfig = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  archivalNodeUrl: 'https://rpc.testnet.internal.near.org',
  contractName: 'dev-1614470408772-5575011',
  walletUrl: 'https://wallet.testnet.near.org',
};

const MainNearConfig = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  archivalNodeUrl: 'https://rpc.testnet.internal.near.org',
  contractName: 'dev-1614470408772-5575011',
  walletUrl: 'https://wallet.testnet.near.org',
};

// const MainNearConfig = {
//   networkId: 'mainnet',
//   nodeUrl: 'https://rpc.mainnet.near.org',
//   contractName: 'berryclub.ek.near',
//   walletUrl: 'https://wallet.near.org',
// };
const NearConfig = IsMainnet ? MainNearConfig : TestNearConfig;


class App extends React.Component {
  constructor(props) {
    super(props);

    this._near = {};

    this.state = {
      connected: false,
      isNavCollapsed: true,
      request: null,
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
    const block = await this._near.account.connection.provider.block({ finality: 'final' });
    this._near.lastBlockHeight = block.header.height;
    this._near.contract = new nearAPI.Contract(this._near.account, NearConfig.contractName, {
      viewMethods: ['get_request', 'get_num_cards', 'get_top'],
      changeMethods: ['new_request', 'vote'],
    });

    if (this._near.accountId) {
      let request = await this._near.contract.get_request({account_id: this._near.accountId});
      if (request === null) {
        request = await this._near.contract.new_request();
      }
      this.setState({
        request,
      });
    }
  }


  async requestSignIn(e) {
    e.preventDefault();
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

  render() {
    const passProps = {
      _near: this._near,
      updateState: (s, c) => this.setState(s, c),
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
                [TESTNET] Berry Cards
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
          </Switch>
        </Router>
      </div>
    )
  }
}

export default App;
