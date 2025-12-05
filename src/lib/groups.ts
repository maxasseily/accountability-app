// Supabase client functions for group management
import { supabase } from './supabase';
import type {
  Group,
  GroupWithMembers,
  CreateGroupResponse,
  JoinGroupResponse,
  GroupMemberWithProfile,
} from '../types/groups';

/**
 * Create a new group
 * @param groupName - Name of the group to create
 * @returns The created group with access code
 */
export async function createGroup(groupName: string): Promise<CreateGroupResponse> {
  const { data, error } = await supabase.rpc('create_group', {
    group_name: groupName,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as CreateGroupResponse;
}

/**
 * Join an existing group using an access code
 * @param accessCode - The group's access code
 * @returns The joined group details
 */
export async function joinGroup(accessCode: string): Promise<JoinGroupResponse> {
  const { data, error } = await supabase.rpc('join_group', {
    code: accessCode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as JoinGroupResponse;
}

/**
 * Leave the current group
 */
export async function leaveGroup(): Promise<void> {
  const { error } = await supabase.rpc('leave_group');

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current user's group with all members
 * @returns The user's group with member details, or null if not in a group
 */
export async function getUserGroup(): Promise<GroupWithMembers | null> {
  // First, get the user's group membership
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (!membership) {
    return null; // User is not in a group
  }

  // Get the group details
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', membership.group_id)
    .single();

  if (groupError) {
    throw new Error(groupError.message);
  }

  // Get all members
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('id, user_id, group_id, joined_at')
    .eq('group_id', membership.group_id)
    .order('joined_at', { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  if (!members || members.length === 0) {
    return {
      ...group,
      members: [],
      member_count: 0,
    };
  }

  // Get profiles for all members
  const userIds = members.map(m => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, created_at, updated_at')
    .in('id', userIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  // Create a map of profiles by user_id for easy lookup
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Transform the data to match our types
  const membersWithProfiles: GroupMemberWithProfile[] = members.map((member: any) => ({
    id: member.id,
    user_id: member.user_id,
    group_id: member.group_id,
    joined_at: member.joined_at,
    profile: profileMap.get(member.user_id) || {
      id: member.user_id,
      email: 'unknown@example.com',
      full_name: null,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  }));

  return {
    ...group,
    members: membersWithProfiles,
    member_count: membersWithProfiles.length,
  };
}

/**
 * Update group name (only creator can do this)
 * @param groupId - ID of the group to update
 * @param newName - New name for the group
 */
export async function updateGroupName(groupId: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('groups')
    .update({ name: newName })
    .eq('id', groupId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Subscribe to changes in the user's group
 * @param userId - Current user's ID
 * @param callback - Function to call when group data changes
 * @returns Unsubscribe function
 */
export function subscribeToGroupChanges(
  userId: string,
  callback: (group: GroupWithMembers | null) => void
) {
  // Subscribe to group_members changes for the user
  const membershipSubscription = supabase
    .channel('group_membership_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_members',
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const group = await getUserGroup();
        callback(group);
      }
    )
    .subscribe();

  // Subscribe to group changes
  const groupSubscription = supabase
    .channel('group_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'groups',
      },
      async () => {
        const group = await getUserGroup();
        callback(group);
      }
    )
    .subscribe();

  // Subscribe to member changes (other members joining/leaving)
  const membersSubscription = supabase
    .channel('group_members_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'group_members',
      },
      async () => {
        const group = await getUserGroup();
        callback(group);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    membershipSubscription.unsubscribe();
    groupSubscription.unsubscribe();
    membersSubscription.unsubscribe();
  };
}
