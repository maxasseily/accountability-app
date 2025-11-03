export type QuestType = 'alliance' | 'battle' | 'prophecy' | 'curse';
export type QuestStatus = 'pending' | 'accepted' | 'rejected';

export interface ArenaQuest {
  id: string;
  group_id: string;
  sender_id: string;
  receiver_id: string;
  quest_type: QuestType;
  status: QuestStatus;
  created_at: string;
  updated_at: string;
}

export interface ArenaQuestWithProfiles extends ArenaQuest {
  sender_profile: {
    full_name: string | null;
    email: string;
  };
  receiver_profile: {
    full_name: string | null;
    email: string;
  };
}
