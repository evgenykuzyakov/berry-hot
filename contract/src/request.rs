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

        if let Some(card_id) = self.resolve_request(&request, response) {
            let purchase_info = CardInfo {
                owner_id: account_id.clone(),
                purchase_price: 0.into(),
                purchase_time: env::block_timestamp().into(),
                num_trades: 0,
                volume: 0.into(),
                art_dao_profit: 0.into(),
            };

            let mut trade_data = self.load_trade_data();
            assert!(trade_data.cards.insert(&card_id, &purchase_info).is_none());
            self.save_trade_data(&trade_data);

            account.cards.insert(&card_id);

            self.insert_recent_buy(card_id);
        }

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
            let num_blocks = (env::block_index() - FIRST_BERRY_BLOCK) as u128;
            // let num_blocks = (37950489 - FIRST_BERRY_BLOCK) as u128;
            let sqr = r % (num_blocks * num_blocks);
            let sq = (sqr as f64).sqrt() as u64;
            FIRST_BERRY_BLOCK + sq
        }
    }

    fn resolve_request(
        &mut self,
        old_request: &ReviewRequest,
        response: ReviewResponse,
    ) -> Option<CardId> {
        match response {
            ReviewResponse::SelectedLeft => self.update_rating(old_request.left, old_request.right),
            ReviewResponse::SelectedRight => {
                self.update_rating(old_request.right, old_request.left)
            }
            ReviewResponse::Skipped => None,
        }
    }
}
