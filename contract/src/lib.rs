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

    pub num_votes: u64,

    pub recent_buys: LookupMap<u64, CardId>,

    pub recent_buys_end: u64,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(app_owner_id: ValidAccountId, art_dao_id: ValidAccountId) -> Self {
        let mut this = Self {
            leaders: TreeMap::new(b"t".to_vec()),
            accounts: UnorderedMap::new(b"a".to_vec()),
            rating: UnorderedMap::new(b"r".to_vec()),
            num_votes: 0,
            recent_buys: LookupMap::new(b"b".to_vec()),
            recent_buys_end: 0,
        };

        this.save_trade_data(&TradeData::new(app_owner_id.into(), art_dao_id.into()));

        this
    }

    #[private]
    #[init(ignore_state)]
    pub fn migrate() -> Self {
        #[derive(BorshDeserialize)]
        pub struct OldContract {
            pub leaders: TreeMap<(u128, CardId), ()>,

            pub accounts: UnorderedMap<AccountId, Account>,

            pub rating: UnorderedMap<CardId, u128>,

            pub num_votes: u64,
        }

        let state: OldContract = env::state_read().unwrap();

        Self {
            leaders: state.leaders,
            accounts: state.accounts,
            rating: state.rating,
            num_votes: state.num_votes,
            recent_buys: LookupMap::new(b"b".to_vec()),
            recent_buys_end: 0,
        }
    }
}
