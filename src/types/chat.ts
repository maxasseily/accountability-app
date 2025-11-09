import { Profile } from './groups';

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_system_message?: boolean;
  emoji_type?: 'lock' | 'mayday' | 'rally';
}

export interface MessageWithProfile extends Message {
  profile: Profile;
}

export type MessageInsert = {
  group_id: string;
  user_id: string;
  content: string;
  is_system_message?: boolean;
  emoji_type?: 'lock' | 'mayday' | 'rally';
};
