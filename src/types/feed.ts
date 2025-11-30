export type ReactionType = 'heart' | 'bicep' | 'brain' | 'star_eyes' | 'suspicious';

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
  // Profile info for the commenter
  profile?: {
    id: string;
    username: string;
    avatar_url: string | null;
    displayed_badge?: {
      id: string;
      icon: string;
      name: string;
    } | null;
  };
}

export interface ReactionCounts {
  heart?: number;
  bicep?: number;
  brain?: number;
  star_eyes?: number;
  suspicious?: number;
}

export interface ReactionEmojiConfig {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTION_EMOJIS: ReactionEmojiConfig[] = [
  { type: 'heart', emoji: '❤️', label: 'Heart' },
  { type: 'bicep', emoji: '💪', label: 'Strong' },
  { type: 'brain', emoji: '🧠', label: 'Smart' },
  { type: 'star_eyes', emoji: '🤩', label: 'Amazing' },
  { type: 'suspicious', emoji: '🤨', label: 'Suspicious' },
];
