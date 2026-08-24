import React, { createContext, useContext, useState, useEffect } from 'react';
import offlineSyncService from '../services/offlineSyncService';
import triageService from '../services/triageService';

const OfflineQueueContext = createContext();

export const OfflineQueueProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [queue, setQueue] = useState(() => offlineSyncService.getQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      autoSyncPending();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshQueue = () => {
    setQueue(offlineSyncService.getQueue());
  };

  const enqueue = (item) => {
    const queued = offlineSyncService.enqueue(item);
    refreshQueue();
    return queued;
  };

  const autoSyncPending = async () => {
    if (offlineSyncService.getQueue().length > 0) {
      await syncNow();
    }
  };

  const syncNow = async () => {
    if (!effectiveOnline) return { success: false, message: 'Cannot sync while offline' };
    setIsSyncing(true);
    try {
      const result = await offlineSyncService.syncAll(async (item) => {
        if (item.type === 'TRIAGE_ASSESSMENT') {
          await triageService.submitAssessment(item.data);
        }
      });
      refreshQueue();
      setLastSyncTime(new Date());
      return { success: true, result };
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline(prev => !prev);
  };

  return (
    <OfflineQueueContext.Provider
      value={{
        isOnline: effectiveOnline,
        realOnline: isOnline,
        isSimulatedOffline,
        queue,
        pendingCount: queue.length,
        isSyncing,
        lastSyncTime,
        enqueue,
        syncNow,
        toggleSimulatedOffline,
        refreshQueue
      }}
    >
      {children}
    </OfflineQueueContext.Provider>
  );
};

export const useOfflineQueue = () => useContext(OfflineQueueContext);
export default OfflineQueueContext;

