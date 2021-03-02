use crate::*;
use near_sdk::json_types::WrappedBalance;
use near_sdk::Balance;

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Account {
    pub requests: Vec<ReviewRequest>,

    pub cards: UnorderedSet<CardId>,

    pub purchase_volume: Balance,

    pub num_purchases: u64,

    pub sale_profit: Balance,

    pub num_sales: u64,

    pub num_votes: u64,
}

#[derive(Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AccountView {
    pub requests: Vec<ReviewRequest>,

    pub num_cards: u64,

    pub purchase_volume: WrappedBalance,

    pub num_purchases: u64,

    pub sale_profit: WrappedBalance,

    pub num_sales: u64,

    pub num_votes: u64,
}

impl From<&Account> for AccountView {
    fn from(a: &Account) -> Self {
        Self {
            requests: a.requests.clone(),
            num_cards: a.cards.len(),
            purchase_volume: a.purchase_volume.into(),
            num_purchases: a.num_purchases,
            sale_profit: a.sale_profit.into(),
            num_sales: a.num_sales,
            num_votes: a.num_votes,
        }
    }
}

#[near_bindgen]
impl Contract {
    pub fn get_account(&self, account_id: ValidAccountId) -> Option<AccountView> {
        self.accounts.get(account_id.as_ref()).map(|a| (&a).into())
    }

    pub fn register_account(&mut self) -> AccountView {
        let account_id = env::predecessor_account_id();
        let account = self.get_account_or_create(&account_id);
        self.save_account(&account_id, &account);
        (&account).into()
    }

    pub fn get_accounts(&self, from_index: u64, limit: u64) -> Vec<(AccountId, AccountView)> {
        let account_ids = self.accounts.keys_as_vector();
        let accounts = self.accounts.values_as_vector();
        (from_index..std::cmp::min(from_index + limit, account_ids.len()))
            .map(|index| {
                let account_id = account_ids.get(index).unwrap();
                let account_view = (&accounts.get(index).unwrap()).into();
                (account_id, account_view)
            })
            .collect()
    }

    pub fn get_account_cards(
        &self,
        account_id: ValidAccountId,
        from_index: u64,
        limit: u64,
    ) -> Vec<CardId> {
        let account = self
            .accounts
            .get(account_id.as_ref())
            .expect("Account not found");
        let card_ids = account.cards.as_vector();
        (from_index..std::cmp::min(from_index + limit, card_ids.len()))
            .filter_map(|index| card_ids.get(index))
            .collect()
    }
}

impl Contract {
    pub(crate) fn get_account_or_create(&self, account_id: &AccountId) -> Account {
        self.accounts.get(&account_id).unwrap_or_else(|| {
            let mut prefix = Vec::with_capacity(33);
            prefix.push(b'u');
            prefix.extend(env::sha256(account_id.as_bytes()));
            Account {
                requests: self.generate_requests(REQUEST_QUEUE_LEN),
                cards: UnorderedSet::new(prefix),
                purchase_volume: 0,
                num_purchases: 0,
                sale_profit: 0,
                num_sales: 0,
                num_votes: 0,
            }
        })
    }

    pub(crate) fn save_account(&mut self, account_id: &AccountId, account: &Account) {
        self.accounts.insert(account_id, account);
    }
}
