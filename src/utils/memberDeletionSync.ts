/**
 * Cross-Portal Member Deletion Synchronization Utility
 * 
 * This utility ensures that when a member is deleted in one portal,
 * all other portals are immediately updated to reflect the change.
 */

export interface MemberDeletionEvent {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberTNS: string | null;
  deletedBy: string;
  timestamp: string;
  summary: string[];
  action: 'MEMBER_DELETED';
}

export interface SystemUpdateEvent {
  type: 'MEMBER_DELETION';
  data: MemberDeletionEvent;
  requiresRefresh: boolean;
}

/**
 * Sets up cross-portal event listeners for member deletion synchronization
 */
export const setupMemberDeletionSync = (
  onMemberDeleted?: (event: MemberDeletionEvent) => void,
  onSystemUpdate?: (event: SystemUpdateEvent) => void
) => {
  const handleMemberDeleted = (event: CustomEvent<MemberDeletionEvent>) => {
    console.log('🔄 Received member deletion sync event:', event.detail);
    
    if (onMemberDeleted) {
      onMemberDeleted(event.detail);
    }
    
    // Default behavior: refresh member-related data
    if (typeof window !== 'undefined') {
      // Trigger any global refresh functions that might be available
      const refreshFunctions = [
        'refreshMemberList',
        'refreshMemberData', 
        'updateMemberCache',
        'reloadMembers'
      ];
      
      refreshFunctions.forEach(funcName => {
        if (window[funcName as keyof Window] && typeof window[funcName as keyof Window] === 'function') {
          try {
            (window[funcName as keyof Window] as Function)();
            console.log(`✅ Triggered ${funcName} for member deletion sync`);
          } catch (error) {
            console.warn(`Could not trigger ${funcName}:`, error);
          }
        }
      });
    }
  };

  const handleSystemUpdate = (event: CustomEvent<SystemUpdateEvent>) => {
    console.log('🔄 Received system update event:', event.detail);
    
    if (event.detail.type === 'MEMBER_DELETION') {
      handleMemberDeleted(new CustomEvent('memberDeleted', { detail: event.detail.data }));
    }
    
    if (onSystemUpdate) {
      onSystemUpdate(event.detail);
    }
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'memberDeleted' && event.newValue) {
      try {
        const memberData = JSON.parse(event.newValue) as MemberDeletionEvent & { triggerTime: number };
        
        // Only process recent events (within last 5 seconds) to avoid stale data
        if (Date.now() - memberData.triggerTime < 5000) {
          console.log('🔄 Received cross-tab member deletion event:', memberData);
          handleMemberDeleted(new CustomEvent('memberDeleted', { 
            detail: {
              memberId: memberData.memberId,
              memberName: memberData.memberName,
              memberEmail: memberData.memberEmail,
              memberTNS: memberData.memberTNS,
              deletedBy: memberData.deletedBy,
              timestamp: memberData.timestamp,
              summary: memberData.summary,
              action: memberData.action
            }
          }));
        }
      } catch (error) {
        console.warn('Error parsing cross-tab member deletion event:', error);
      }
    }
  };

  // Set up event listeners
  const eventNames = [
    'memberDeleted',
    'memberListUpdated', 
    'memberDataChanged',
    'memberRemoved',
    'dataRefreshRequired'
  ];

  const listeners: Array<() => void> = [];

  eventNames.forEach(eventName => {
    const listener = (event: Event) => handleMemberDeleted(event as CustomEvent<MemberDeletionEvent>);
    window.addEventListener(eventName, listener);
    listeners.push(() => window.removeEventListener(eventName, listener));
  });

  // System update listener
  const systemListener = (event: Event) => handleSystemUpdate(event as CustomEvent<SystemUpdateEvent>);
  window.addEventListener('systemDataUpdate', systemListener);
  listeners.push(() => window.removeEventListener('systemDataUpdate', systemListener));

  // Storage change listener for cross-tab sync
  window.addEventListener('storage', handleStorageChange);
  listeners.push(() => window.removeEventListener('storage', handleStorageChange));

  // Return cleanup function
  return () => {
    listeners.forEach(cleanup => cleanup());
    console.log('🧹 Cleaned up member deletion sync listeners');
  };
};

/**
 * Triggers a member deletion sync event
 */
export const triggerMemberDeletionSync = (memberData: MemberDeletionEvent) => {
  // Dispatch multiple events for different components
  const events = [
    'memberDeleted',
    'memberListUpdated', 
    'memberDataChanged',
    'memberRemoved',
    'dataRefreshRequired'
  ];
  
  events.forEach(eventName => {
    const event = new CustomEvent(eventName, {
      detail: memberData
    });
    window.dispatchEvent(event);
    console.log(`📡 Dispatched ${eventName} event for member deletion sync`);
  });
  
  // Also trigger a general system update event
  const systemUpdateEvent = new CustomEvent('systemDataUpdate', {
    detail: {
      type: 'MEMBER_DELETION' as const,
      data: memberData,
      requiresRefresh: true
    }
  });
  window.dispatchEvent(systemUpdateEvent);
  
  // Use localStorage to signal other tabs/windows
  try {
    localStorage.setItem('memberDeleted', JSON.stringify({
      ...memberData,
      triggerTime: Date.now()
    }));
    
    // Clear the localStorage after a short delay to prevent repeated triggers
    setTimeout(() => {
      localStorage.removeItem('memberDeleted');
    }, 1000);
  } catch (error) {
    console.warn('Could not update localStorage for cross-tab sync:', error);
  }
};

/**
 * Force refresh member data across all portals
 */
export const forceMemberDataRefresh = () => {
  const refreshEvent = new CustomEvent('forceDataRefresh', {
    detail: {
      type: 'MEMBER_DATA',
      timestamp: new Date().toISOString()
    }
  });
  window.dispatchEvent(refreshEvent);
  
  console.log('🔄 Forced member data refresh across all portals');
};