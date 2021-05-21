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

    pub fn get_recent_cards(
        &self,
        from_index: Option<u64>,
        limit: Option<u64>,
    ) -> Vec<(CardId, Rating)> {
        if self.recent_buys_end == 0 {
            return Vec::new();
        }
        let from_index = from_index.unwrap_or(self.recent_buys_end - 1);
        let limit = std::cmp::min(from_index + 1, limit.unwrap_or(RECENT_BUY_LIMIT));
        (0..std::cmp::min(limit, self.recent_buys_end))
            .filter_map(|index| {
                self.recent_buys
                    .get(&(from_index - index))
                    .map(|card_id| (card_id, self.rating.get(&card_id).unwrap_or(0).into()))
            })
            .collect()
    }
}
