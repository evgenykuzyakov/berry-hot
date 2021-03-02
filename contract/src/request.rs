use crate::*;
use std::convert::TryInto;

#[derive(Copy, Clone, BorshDeserialize, BorshSerialize, Serialize, Deserialize, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct ReviewRequest {
    pub left: CardId,
    pub right: CardId,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub enum ReviewResponse {
    SelectedLeft,
    SelectedRight,
    Skipped,
}

const FIRST_BERRY_BLOCK: u64 = 21793900;
// const MAINNET_LAST_BLOCK: u64 = 30955009;
const MIN_CARDS_FOR_FIGHTS: u64 = 10;

pub const REQUEST_QUEUE_LEN: usize = 3;

#[near_bindgen]
impl Contract {
    pub fn vote(&mut self, request: ReviewRequest, response: ReviewResponse) -> ReviewRequest {
        let account_id = env::predecessor_account_id();
        let mut account = self.get_account_or_create(&account_id);
        if account.requests[0] != request {
            env::panic(b"Voted on the invalid request");
        }
        account.requests.remove(0);
        account.requests.extend(self.generate_requests(1));
        self.resolve_request(&request, response);

        account.num_votes += 1;

        self.save_account(&account_id, &account);
        account.requests.pop().unwrap()
    }
}

impl Contract {
    pub(crate) fn generate_requests(&self, num_requests: usize) -> Vec<ReviewRequest> {
        let mut seed = env::random_seed();
        (0..num_requests)
            .map(|_| self.random_request(&mut seed))
            .collect()
    }

    fn random_request(&self, seed: &mut Vec<u8>) -> ReviewRequest {
        loop {
            *seed = env::sha256(&seed);
            let request = ReviewRequest {
                left: self.random_card(u128::from_le_bytes((&seed[..16]).try_into().unwrap())),
                right: self.random_card(u128::from_le_bytes((&seed[16..]).try_into().unwrap())),
            };
            if request.left != request.right {
                break request;
            }
        }
    }

    fn random_card(&self, r: u128) -> CardId {
        if (r & (1u128 << 64)) > 0 && self.rating.len() > MIN_CARDS_FOR_FIGHTS {
            self.rating
                .keys_as_vector()
                .get((r % (self.rating.len() as u128)) as u64)
                .unwrap()
        } else {
            let num_blocks = env::block_index() - FIRST_BERRY_BLOCK;
            // let num_blocks = MAINNET_LAST_BLOCK - FIRST_BERRY_BLOCK;
            FIRST_BERRY_BLOCK + (r % (num_blocks as u128)) as u64
        }
    }

    fn resolve_request(&mut self, old_request: &ReviewRequest, response: ReviewResponse) {
        match response {
            ReviewResponse::SelectedLeft => {
                self.update_rating(old_request.left, old_request.right);
            }
            ReviewResponse::SelectedRight => {
                self.update_rating(old_request.right, old_request.left);
            }
            ReviewResponse::Skipped => (),
        }
    }
}
