use crate::*;
use near_sdk::json_types::U128;

pub type Rating = U128;

pub const INFLATION_TIMESTAMP: u64 = 1621623768597000000;
pub const HALFLIFE_DURATION: f64 = 2628000000000000.0;

impl Contract {
    pub(crate) fn update_rating(&mut self, winner_id: CardId, loser_id: CardId) -> Option<CardId> {
        let mut new_card = None;
        let winner_rating = self.rating.remove(&winner_id).unwrap_or_default();
        if winner_rating > 0 {
            self.leaders.remove(&(winner_rating, winner_id));
        } else {
            new_card = Some(winner_id);
        }
        let loser_rating = self.rating.remove(&loser_id).unwrap_or_default();
        if loser_rating > 0 {
            self.leaders.remove(&(loser_rating, loser_id));
        }
        let bet = loser_rating / 10;
        let winner_rating = (winner_rating + bet + Self::win_bonus()).into();
        let loser_rating = (loser_rating - bet).into();
        self.num_votes += 1;
        self.rating.insert(&winner_id, &winner_rating);
        self.leaders.insert(&(winner_rating, winner_id), &());
        if loser_rating > 0 {
            self.rating.insert(&loser_id, &loser_rating);
        }
        if loser_rating >= Self::min_rating() {
            self.leaders.insert(&(loser_rating, loser_id), &());
        }
        new_card
    }

    pub(crate) fn set_rating(&mut self, card_id: CardId, old_rating: u128, new_rating: u128) {
        self.leaders.remove(&(old_rating, card_id));
        if old_rating != self.rating.insert(&card_id, &new_rating).unwrap() {
            env::panic(b"Internal rating mismatch");
        }
        if new_rating >= Self::min_rating() {
            self.leaders.insert(&(new_rating, card_id), &());
        }
    }

    pub(crate) fn multiplier() -> f64 {
        let duration = (env::block_timestamp() - INFLATION_TIMESTAMP) as f64;
        2f64.powf(duration / HALFLIFE_DURATION)
    }

    pub(crate) fn min_rating() -> u128 {
        (1e24 * Self::multiplier()) as u128
    }

    pub(crate) fn win_bonus() -> u128 {
        (1e24 * Self::multiplier()) as u128
    }
}
