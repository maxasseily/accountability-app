// Group and member types for the accountability app

export interface Group {
  id: string;
  name: string;
  access_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  joined_at: string;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMemberWithProfile extends GroupMember {
  profile: Profile;
}

export interface GroupWithMembers extends Group {
  members: GroupMemberWithProfile[];
  member_count: number;
}

// API response types
export interface CreateGroupResponse {
  id: string;
  name: string;
  access_code: string;
  created_by: string;
  created_at: string;
}

export interface JoinGroupResponse {
  id: string;
  name: string;
  access_code: string;
  created_by: string;
  created_at: string;
}

// Error types
export class GroupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroupError';
  }
}

export class GroupFullError extends GroupError {
  constructor() {
    super('Group is full (maximum 6 members)');
    this.name = 'GroupFullError';
  }
}

export class InvalidAccessCodeError extends GroupError {
  constructor() {
    super('Invalid access code');
    this.name = 'InvalidAccessCodeError';
  }
}

export class AlreadyInGroupError extends GroupError {
  constructor() {
    super('You must leave your current group before joining a new one');
    this.name = 'AlreadyInGroupError';
  }
}
