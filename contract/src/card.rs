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
        offset: Option<u64>,
        limit: Option<u64>,
    ) -> Vec<(Rating, CardId)> {
        if self.recent_buys_end == 0 {
            return Vec::new();
        }
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(RECENT_BUY_LIMIT);
        (offset..std::cmp::min(limit, self.recent_buys_end))
            .filter_map(|index| {
                self.recent_buys
                    .get(&(self.recent_buys_end - index - 1))
                    .map(|card_id| (self.rating.get(&card_id).unwrap_or(0).into(), card_id))
            })
            .collect()
    }
}
