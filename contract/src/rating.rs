use crate::*;
use near_sdk::json_types::U128;

pub type Rating = U128;

const WIN_BONUS: u128 = 1_000000_000000_000000_000000;

impl Contract {
    pub(crate) fn update_rating(&mut self, winner_id: BlockHeight, loser_id: BlockHeight) {
        let winner_rating = self.rating.remove(&winner_id).unwrap_or_default();
        if winner_rating > 0 {
            self.leaders.remove(&(winner_rating, winner_id));
        }
        let loser_rating = self.rating.remove(&loser_id).unwrap_or_default();
        if loser_rating > 0 {
            self.leaders.remove(&(loser_rating, loser_id));
        }
        let bet = loser_rating / 10;
        let winner_rating = (winner_rating + bet + WIN_BONUS).into();
        let loser_rating = (loser_rating - bet).into();
        self.num_votes += 1;
        self.rating.insert(&winner_id, &winner_rating);
        self.leaders.insert(&(winner_rating, winner_id), &());
        if loser_rating > 0 {
            self.rating.insert(&loser_id, &loser_rating);
            self.leaders.insert(&(loser_rating, loser_id), &());
        }
    }
}
