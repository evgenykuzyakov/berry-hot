use crate::*;
use std::cmp::Ordering;
use std::ops::AddAssign;

#[derive(
    Default, PartialEq, Eq, Copy, Clone, BorshDeserialize, BorshSerialize, Serialize, Deserialize,
)]
#[serde(crate = "near_sdk::serde")]
pub struct Rating {
    pub wins: u64,
    pub views: u64,
}

impl AddAssign for Rating {
    fn add_assign(&mut self, other: Self) {
        self.wins += other.wins;
        self.views += other.views;
    }
}

const MIN_VIEWS_FOR_RATIO: u64 = 3;

impl Ord for Rating {
    fn cmp(&self, other: &Self) -> Ordering {
        if self.views >= MIN_VIEWS_FOR_RATIO && other.views >= MIN_VIEWS_FOR_RATIO {
            (self.wins as u128 * other.views as u128)
                .cmp(&(self.views as u128 * other.wins as u128))
        } else {
            self.wins.cmp(&other.wins)
        }
    }
}

impl PartialOrd for Rating {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Contract {
    pub(crate) fn add_rating(&mut self, block_height: BlockHeight, rating: Rating) {
        let mut card_rating = self.cards.remove(&block_height).unwrap_or_default();
        self.leaders.remove(&(card_rating, block_height));
        card_rating += rating;
        if card_rating.wins == 0 {
            // Do not store no-win cards
            return;
        }
        self.total_rating += card_rating;
        self.cards.insert(&block_height, &card_rating);
        self.leaders.insert(&(card_rating, block_height), &());
    }
}
