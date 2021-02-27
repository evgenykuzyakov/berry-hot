use crate::*;
use std::convert::TryInto;

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct ReviewRequest {
    pub left: BlockHeight,
    pub right: BlockHeight,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub enum ReviewResponse {
    SelectedLeft,
    SelectedRight,
    Skipped,
}

const FIRST_BERRY_BLOCK: u64 = 21793900;
const MIN_CARDS_FOR_FIGHTS: u64 = 10;

#[near_bindgen]
impl Contract {
    pub fn get_request(&self, account_id: ValidAccountId) -> Option<ReviewRequest> {
        self.accounts.get(account_id.as_ref())
    }

    pub fn new_request(&mut self) -> ReviewRequest {
        let account_id = env::predecessor_account_id();
        let new_request = self.random_request();
        if let Some(old_request) = self.accounts.insert(&account_id, &new_request) {
            self.resolve_request(&old_request, ReviewResponse::Skipped);
        }
        new_request
    }

    pub fn vote(&mut self, request: ReviewRequest, response: ReviewResponse) -> ReviewRequest {
        let account_id = env::predecessor_account_id();
        if let Some(old_request) = self.accounts.remove(&account_id) {
            if old_request != request {
                env::panic(b"Voted on the invalid request");
            }
        }
        self.resolve_request(&request, response);
        self.new_request()
    }

    fn random_request(&self) -> ReviewRequest {
        let seed = env::random_seed();
        ReviewRequest {
            left: self.random_card(u128::from_le_bytes((&seed[..16]).try_into().unwrap())),
            right: self.random_card(u128::from_le_bytes((&seed[16..]).try_into().unwrap())),
        }
    }

    fn random_card(&self, r: u128) -> BlockHeight {
        if (r & (1u128 << 64)) > 0 && self.cards.len() > MIN_CARDS_FOR_FIGHTS {
            self.cards
                .keys_as_vector()
                .get((r % (self.cards.len() as u128)) as u64)
                .unwrap()
        } else {
            let num_blocks = env::block_index() - FIRST_BERRY_BLOCK;
            FIRST_BERRY_BLOCK + (r % (num_blocks as u128)) as u64
        }
    }

    fn resolve_request(&mut self, old_request: &ReviewRequest, response: ReviewResponse) {
        match response {
            ReviewResponse::SelectedLeft => {
                self.add_rating(old_request.left, Rating { wins: 1, views: 1 });
                self.add_rating(old_request.right, Rating { wins: 0, views: 1 });
            }
            ReviewResponse::SelectedRight => {
                self.add_rating(old_request.left, Rating { wins: 0, views: 1 });
                self.add_rating(old_request.right, Rating { wins: 1, views: 1 });
            }
            ReviewResponse::Skipped => {
                self.add_rating(old_request.left, Rating { wins: 0, views: 1 });
                self.add_rating(old_request.right, Rating { wins: 0, views: 1 });
            }
        }
    }
}
