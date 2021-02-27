mod cards;
mod rating;
mod request;

use crate::rating::*;
use crate::request::*;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, TreeMap, UnorderedMap};
use near_sdk::json_types::ValidAccountId;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near_bindgen, AccountId, BlockHeight, PanicOnDefault};

near_sdk::setup_alloc!();

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    pub leaders: TreeMap<(Rating, BlockHeight), ()>,

    pub accounts: LookupMap<AccountId, ReviewRequest>,

    pub cards: UnorderedMap<BlockHeight, Rating>,

    pub total_rating: Rating,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            leaders: TreeMap::new(b"t".to_vec()),
            accounts: LookupMap::new(b"a".to_vec()),
            cards: UnorderedMap::new(b"c".to_vec()),
            total_rating: Default::default(),
        }
    }
}
