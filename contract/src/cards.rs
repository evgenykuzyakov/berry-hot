use crate::*;

#[near_bindgen]
impl Contract {
    pub fn get_num_cards(&self) -> u64 {
        self.cards.len()
    }

    pub fn get_top(
        &self,
        from: Option<(Rating, BlockHeight)>,
        limit: u64,
    ) -> Vec<(Rating, BlockHeight)> {
        if let Some(from) = from {
            self.leaders
                .iter_rev_from(from)
                .take(limit as usize)
                .map(|(k, _)| k)
                .collect()
        } else {
            self.leaders
                .iter_rev()
                .take(limit as usize)
                .map(|(k, _)| k)
                .collect()
        }
    }
}
