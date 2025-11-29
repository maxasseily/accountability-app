export type QuestType = 'alliance' | 'battle' | 'prophecy' | 'curse' | 'speculation';
export type QuestStatus = 'pending' | 'accepted' | 'rejected' | 'resolved';
export type ProphecyCurseStatus = 'active' | 'won' | 'lost' | 'refunded';

export interface ArenaQuest {
  id: string;
  group_id: string;
  sender_id: string;
  receiver_id: string;
  quest_type: QuestType;
  status: QuestStatus;
  created_at: string;
  updated_at: string;
  // Prophecy/Curse betting fields
  mojo_stake?: number;
  odds?: number;
  potential_payout?: number;
  prophecy_curse_status?: ProphecyCurseStatus;
  resolution_date?: string;
  week_start_date?: string;
  // Speculation fields
  speculation_description?: string;
  speculation_creator_side?: boolean; // true = creator bets FOR, false = creator bets AGAINST
  speculation_accepter_id?: string;
  speculation_resolver_id?: string;
  speculation_result?: boolean; // true = description happened (FOR wins), false = didn't happen (AGAINST wins)
}

export interface ArenaQuestWithProfiles extends ArenaQuest {
  sender_profile: {
    username: string;
    email: string;
  };
  receiver_profile: {
    username: string;
    email: string;
  };
}
