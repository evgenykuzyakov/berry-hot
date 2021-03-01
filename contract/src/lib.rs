mod account;
mod card;
mod rating;
mod request;
mod trade;

use crate::account::*;
use crate::card::*;
use crate::rating::*;
use crate::request::*;
use crate::trade::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, TreeMap, UnorderedMap, UnorderedSet};
use near_sdk::json_types::ValidAccountId;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, PanicOnDefault};

near_sdk::setup_alloc!();

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub leaders: TreeMap<(u128, CardId), ()>,

    pub accounts: UnorderedMap<AccountId, Account>,

    pub rating: UnorderedMap<CardId, u128>,

    pub num_votes: u128,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(app_owner_id: ValidAccountId, art_dao_id: ValidAccountId) -> Self {
        assert!(!env::state_exists(), "Already initialized");
        let mut this = Self {
            leaders: TreeMap::new(b"t".to_vec()),
            accounts: UnorderedMap::new(b"a".to_vec()),
            rating: UnorderedMap::new(b"r".to_vec()),
            num_votes: 0,
        };

        this.save_trade_data(&TradeData::new(app_owner_id.into(), art_dao_id.into()));

        this
    }
}
