use crate::*;
use near_sdk::json_types::{WrappedBalance, WrappedTimestamp};
use near_sdk::{env, log, Balance, Promise};

const TRADE_DATA_KEY: &[u8] = b"d";

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct CardInfo {
    pub owner_id: AccountId,
    pub purchase_price: WrappedBalance,
    pub purchase_time: WrappedTimestamp,
    pub volume: WrappedBalance,
}

#[derive(BorshDeserialize, BorshSerialize)]
pub struct TradeData {
    pub cards: LookupMap<CardId, CardInfo>,

    pub num_purchases: u64,

    pub num_unique_cards_bought: u64,

    pub near_volume: Balance,

    pub app_owner_profit: Balance,

    pub art_dao_profit: Balance,

    pub app_owner_id: AccountId,

    pub art_dao_id: AccountId,
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct TradeDataView {
    pub num_purchases: u64,

    pub num_unique_cards_bought: u64,

    pub near_volume: Balance,

    pub app_owner_profit: Balance,

    pub art_dao_profit: Balance,

    pub app_owner_id: AccountId,

    pub art_dao_id: AccountId,
}

impl From<&TradeData> for TradeDataView {
    fn from(t: &TradeData) -> Self {
        Self {
            num_purchases: t.num_purchases,
            num_unique_cards_bought: t.num_unique_cards_bought,
            near_volume: t.near_volume.into(),
            app_owner_profit: t.app_owner_profit.into(),
            art_dao_profit: t.art_dao_profit.into(),
            app_owner_id: t.app_owner_id.clone(),
            art_dao_id: t.art_dao_id.clone(),
        }
    }
}

impl TradeData {
    pub fn new(app_owner_id: AccountId, art_dao_id: AccountId) -> Self {
        Self {
            cards: LookupMap::new(b"o".to_vec()),
            num_purchases: 0,
            num_unique_cards_bought: 0,
            near_volume: 0,
            app_owner_profit: 0,
            art_dao_profit: 0,
            app_owner_id,
            art_dao_id,
        }
    }
}

impl Contract {
    pub(crate) fn save_trade_data(&mut self, trade_data: &TradeData) {
        env::storage_write(TRADE_DATA_KEY, &trade_data.try_to_vec().unwrap());
    }

    pub(crate) fn load_trade_data(&self) -> TradeData {
        TradeData::try_from_slice(&env::storage_read(TRADE_DATA_KEY).unwrap()).unwrap()
    }
}

#[near_bindgen]
impl Contract {
    /// Buying a given card at the attached deposit price. This attached deposit price should be
    /// not lower than the current card price.
    /// The new card price will be 120% of the purchase price.
    /// 1% of the sale goes to the app.
    /// If the card was owned by someone, they will get 90% of the purchase price and Art DAO will
    /// get 10% of the purchase price.
    /// If the card was not by anyone, then 99% will go to the Art DAO.
    #[payable]
    pub fn buy_card(&mut self, card_id: CardId) -> CardInfo {
        let new_owner_id = env::predecessor_account_id();
        let card_price = self.rating.get(&card_id).expect("The card is not active");
        let buy_price = env::attached_deposit();
        if buy_price < card_price {
            env::panic(
                format!(
                    "The card price {} exceeds attached deposit of {}",
                    card_price, buy_price
                )
                .as_bytes(),
            );
        }
        let mut art_dao_profit = buy_price / 10;
        let app_owner_profit = buy_price / 100;
        let owner_profit = buy_price - art_dao_profit - app_owner_profit;
        let mut trade_data = self.load_trade_data();

        let mut purchase_info = CardInfo {
            owner_id: new_owner_id,
            purchase_price: buy_price.into(),
            purchase_time: env::block_timestamp().into(),
            volume: buy_price.into(),
        };

        if let Some(previous_info) = trade_data.cards.remove(&card_id) {
            let mut account = self.get_account_or_create(&previous_info.owner_id);
            account.cards.remove(&card_id);
            log!(
                "Transferring {} NEAR to the previous owner {} for card {}",
                owner_profit,
                previous_info.owner_id,
                card_id,
            );
            purchase_info.volume.0 += previous_info.volume.0;
            account.num_sales += 1;
            account.sale_profit += owner_profit;
            self.save_account(&previous_info.owner_id, &account);
            Promise::new(previous_info.owner_id).transfer(owner_profit);
        } else {
            trade_data.num_unique_cards_bought += 1;
            // all profit goes to the art DAO.
            art_dao_profit += owner_profit;
        }

        trade_data.cards.insert(&card_id, &purchase_info);
        trade_data.near_volume += buy_price;
        trade_data.art_dao_profit += art_dao_profit;
        trade_data.app_owner_profit += app_owner_profit;
        trade_data.num_purchases += 1;

        self.save_trade_data(&trade_data);

        log!(
            "Transferring {} NEAR to the Art DAO {} for card {}",
            art_dao_profit,
            trade_data.art_dao_id,
            card_id,
        );
        Promise::new(trade_data.art_dao_id).transfer(art_dao_profit);

        let new_rating = buy_price * 6 / 5;
        self.set_rating(card_id, card_price, new_rating);

        let mut account = self.get_account_or_create(&purchase_info.owner_id);
        account.num_purchases += 1;
        account.purchase_volume += buy_price;

        purchase_info
    }

    pub fn get_trade_data(&self) -> TradeDataView {
        (&self.load_trade_data()).into()
    }

    pub fn get_card_info(&self, card_id: CardId) -> Option<CardInfo> {
        self.load_trade_data().cards.get(&card_id)
    }
}
