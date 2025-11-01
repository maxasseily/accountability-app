import { Profile } from './groups';

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MessageWithProfile extends Message {
  profile: Profile;
}

export type MessageInsert = {
  group_id: string;
  user_id: string;
  content: string;
};
