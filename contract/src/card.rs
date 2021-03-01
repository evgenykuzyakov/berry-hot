use crate::*;
use near_sdk::BlockHeight;

pub type CardId = BlockHeight;

#[near_bindgen]
impl Contract {
    pub fn get_num_cards(&self) -> u64 {
        self.rating.len()
    }

    pub fn get_top(&self, from_key: Option<(Rating, CardId)>, limit: u64) -> Vec<(Rating, CardId)> {
        if let Some((r, b)) = from_key {
            self.leaders
                .iter_rev_from((r.into(), b))
                .take(limit as usize)
                .map(|((r, b), _)| (r.into(), b))
                .collect()
        } else {
            self.leaders
                .iter_rev()
                .take(limit as usize)
                .map(|((r, b), _)| (r.into(), b))
                .collect()
        }
    }

    pub fn get_rating(&self, card_id: CardId) -> Rating {
        self.rating.get(&card_id).unwrap_or_default().into()
    }
}
