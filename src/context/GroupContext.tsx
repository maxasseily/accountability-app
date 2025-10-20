import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { GroupWithMembers } from '../types/groups';
import {
  createGroup as createGroupAPI,
  joinGroup as joinGroupAPI,
  leaveGroup as leaveGroupAPI,
  getUserGroup,
  subscribeToGroupChanges,
} from '../lib/groups';
import { useAuth } from './AuthContext';

interface GroupContextType {
  group: GroupWithMembers | null;
  isLoading: boolean;
  isInGroup: boolean;
  createGroup: (groupName: string) => Promise<void>;
  joinGroup: (accessCode: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  refreshGroup: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupWithMembers | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's group on mount and when user changes
  const loadGroup = useCallback(async () => {
    if (!user) {
      setGroup(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userGroup = await getUserGroup();
      setGroup(userGroup);
    } catch (error) {
      console.error('Error loading group:', error);
      setGroup(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // Subscribe to real-time group changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToGroupChanges(user.id, (updatedGroup) => {
      setGroup(updatedGroup);
    });

    return unsubscribe;
  }, [user]);


  const createGroup = async (groupName: string) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      await createGroupAPI(groupName);
      await loadGroup();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const joinGroup = async (accessCode: string) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      await joinGroupAPI(accessCode);
      await loadGroup();
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  };

  const leaveGroup = async () => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      await leaveGroupAPI();
      setGroup(null);
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  };

  const refreshGroup = useCallback(async () => {
    await loadGroup();
  }, [loadGroup]);

  const value: GroupContextType = {
    group,
    isLoading,
    isInGroup: group !== null,
    createGroup,
    joinGroup,
    leaveGroup,
    refreshGroup,
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
}
