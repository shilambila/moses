import { useEffect, useCallback } from 'react';
import { mysql } from '@/integrations/mysql/client';

interface MemberUpdateEvent {
  action: 'UPDATE' | 'INSERT' | 'DELETE';
  memberId: string;
  updatedData?: any;
  timestamp: string;
  updatedBy?: string;
}

interface CrossPortalSyncOptions {
  onMemberUpdate?: (event: MemberUpdateEvent) => void;
  onRefreshRequired?: (source: string, reason: string) => void;
  onDataInvalidated?: () => void;
  autoRefresh?: boolean;
  portalName: string;
}

/**
 * Hook to enable cross-portal synchronization of member data
 * This ensures that when member data is updated in one portal (like AdminPortal),
 * all other portals (Secretary, Coordinator, etc.) automatically refresh their data
 */
export const useCrossPortalSync = (options: CrossPortalSyncOptions) => {
  const {
    onMemberUpdate,
    onRefreshRequired,
    onDataInvalidated,
    autoRefresh = true,
    portalName
  } = options;

  // Handle member data changes from other portals
  const handleMemberDataChanged = useCallback((event: CustomEvent) => {
    const detail = event.detail as MemberUpdateEvent;
    console.log(`${portalName}: Received member update`, detail);
    
    if (onMemberUpdate) {
      onMemberUpdate(detail);
    }
    
    // Auto-refresh if enabled
    if (autoRefresh && onRefreshRequired) {
      onRefreshRequired('cross-portal-sync', `Member ${detail.memberId} updated`);
    }
  }, [onMemberUpdate, onRefreshRequired, autoRefresh, portalName]);

  // Handle refresh requests from other portals
  const handleRefreshAllPortals = useCallback((event: CustomEvent) => {
    const { source, reason, affectedMemberId } = event.detail;
    console.log(`${portalName}: Refresh requested by ${source} - ${reason}`);
    
    if (onRefreshRequired) {
      onRefreshRequired(source, reason);
    }
  }, [onRefreshRequired, portalName]);

  // Handle localStorage-based cross-tab communication
  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === 'memberUpdate' && event.newValue) {
      try {
        const updateData = JSON.parse(event.newValue);
        console.log(`${portalName}: Storage sync - member update`, updateData);
        
        if (onMemberUpdate) {
          onMemberUpdate(updateData);
        }
        
        if (autoRefresh && onRefreshRequired) {
          onRefreshRequired('storage-sync', 'Member data updated in another tab');
        }
      } catch (error) {
        console.error('Error parsing storage sync data:', error);
      }
    }
  }, [onMemberUpdate, onRefreshRequired, autoRefresh, portalName]);

  // Real-time database subscription for member changes
  useEffect(() => {
    console.log(`${portalName}: Setting up cross-portal sync...`);

    // Set up real-time subscription for member changes
    const channel = mysql
      .channel(`cross-portal-sync-${portalName}`)
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'membership_registrations' }, 
          (payload) => {
            const updateEvent: MemberUpdateEvent = {
              action: 'UPDATE',
              memberId: payload.new.id,
              updatedData: payload.new,
              timestamp: new Date().toISOString()
            };
            
            console.log(`${portalName}: Real-time member update detected`, updateEvent);
            
            if (onMemberUpdate) {
              onMemberUpdate(updateEvent);
            }
            
            if (autoRefresh && onRefreshRequired) {
              onRefreshRequired('real-time-db', `Member ${payload.new.id} updated`);
            }
          })
      .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'membership_registrations' }, 
          (payload) => {
            const insertEvent: MemberUpdateEvent = {
              action: 'INSERT',
              memberId: payload.new.id,
              updatedData: payload.new,
              timestamp: new Date().toISOString()
            };
            
            console.log(`${portalName}: Real-time member insert detected`, insertEvent);
            
            if (onMemberUpdate) {
              onMemberUpdate(insertEvent);
            }
            
            if (autoRefresh && onRefreshRequired) {
              onRefreshRequired('real-time-db', `New member ${payload.new.id} added`);
            }
          })
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'membership_registrations' }, 
          (payload) => {
            const deleteEvent: MemberUpdateEvent = {
              action: 'DELETE',
              memberId: payload.old.id,
              timestamp: new Date().toISOString()
            };
            
            console.log(`${portalName}: Real-time member delete detected`, deleteEvent);
            
            if (onMemberUpdate) {
              onMemberUpdate(deleteEvent);
            }
            
            if (autoRefresh && onRefreshRequired) {
              onRefreshRequired('real-time-db', `Member ${payload.old.id} deleted`);
            }
          })
      .subscribe();

    // Set up cross-tab event listeners
    window.addEventListener('memberDataChanged', handleMemberDataChanged as EventListener);
    window.addEventListener('refreshAllPortals', handleRefreshAllPortals as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      console.log(`${portalName}: Cleaning up cross-portal sync...`);
      
      try {
        mysql.removeChannel(channel);
        window.removeEventListener('memberDataChanged', handleMemberDataChanged as EventListener);
        window.removeEventListener('refreshAllPortals', handleRefreshAllPortals as EventListener);
        window.removeEventListener('storage', handleStorageChange);
      } catch (error) {
        console.error('Error cleaning up cross-portal sync:', error);
      }
    };
  }, [handleMemberDataChanged, handleRefreshAllPortals, handleStorageChange, portalName]);

  // Utility function to broadcast member updates to other portals
  const broadcastMemberUpdate = useCallback((event: MemberUpdateEvent) => {
    console.log(`${portalName}: Broadcasting member update`, event);
    
    // Dispatch custom event
    const customEvent = new CustomEvent('memberDataChanged', { detail: event });
    window.dispatchEvent(customEvent);
    
    // Also use localStorage for cross-tab communication
    localStorage.setItem('memberUpdate', JSON.stringify(event));
    localStorage.removeItem('memberUpdate'); // Remove to trigger storage event
  }, [portalName]);

  // Utility function to request refresh from all portals
  const requestRefreshAllPortals = useCallback((reason: string) => {
    console.log(`${portalName}: Requesting refresh of all portals - ${reason}`);
    
    const refreshEvent = new CustomEvent('refreshAllPortals', {
      detail: {
        source: portalName,
        reason: reason,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(refreshEvent);
  }, [portalName]);

  return {
    broadcastMemberUpdate,
    requestRefreshAllPortals
  };
};

// Utility function to set up automatic data refresh for any component
export const useAutoRefresh = (refreshFunction: () => void, portalName: string) => {
  const { } = useCrossPortalSync({
    onRefreshRequired: (source: string, reason: string) => {
      console.log(`${portalName}: Auto-refreshing data due to: ${reason} (source: ${source})`);
      refreshFunction();
    },
    portalName,
    autoRefresh: true
  });
};
