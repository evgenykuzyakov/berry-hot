mod card;
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
    pub leaders: TreeMap<(u128, BlockHeight), ()>,

    pub accounts: LookupMap<AccountId, ReviewRequest>,

    pub rating: UnorderedMap<BlockHeight, u128>,

    pub num_votes: u128,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            leaders: TreeMap::new(b"t".to_vec()),
            accounts: LookupMap::new(b"a".to_vec()),
            rating: UnorderedMap::new(b"r".to_vec()),
            num_votes: Default::default(),
        }
    }
}
