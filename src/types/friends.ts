// Friendship types for the accountability app

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted' | 'blocked';
  requester_id: string;
  created_at: string;
  updated_at: string;
}

export interface FriendProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  user_rank: number;
  credibility: number;
  mojo: number;
  goal_type: string | null;
  sub_activity: string | null;
  displayed_badge_icon: string | null;
  displayed_badge_name: string | null;
  friendship_status: 'pending' | 'accepted' | 'blocked' | null;
  friendship_id: string | null;
  requester_id: string | null;
}

export interface Friend {
  user_id: string;
  username: string;
  avatar_url: string | null;
  friendship_id: string;
  user_rank: number;
  credibility: number;
  displayed_badge_icon: string | null;
  displayed_badge_name: string | null;
}

export interface PendingFriendRequest {
  friendship_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  user_rank: number;
  credibility: number;
  displayed_badge_icon: string | null;
  displayed_badge_name: string | null;
  is_requester: boolean;
}
