// Service to queue and synchronize offline reports & triage records
const OFFLINE_QUEUE_KEY = 'gramin_health_offline_queue';

export const offlineSyncService = {
  // Get all pending offline items
  getQueue() {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // Add item to offline sync queue
  enqueue(item) {
    const queue = this.getQueue();
    const queuedItem = {
      id: `OFFLINE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING_NETWORK', // PENDING_NETWORK, SYNCING, SYNCED, FAILED
      ...item
    };
    queue.push(queuedItem);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return queuedItem;
  },

  // Clear specific item
  dequeue(itemId) {
    const queue = this.getQueue().filter(i => i.id !== itemId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return queue;
  },

  // Trigger sync of all pending items
  async syncAll(apiEndpointHandler) {
    const queue = this.getQueue();
    if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

    const remaining = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const item of queue) {
      try {
        if (apiEndpointHandler) {
          await apiEndpointHandler(item);
        }
        syncedCount++;
      } catch (err) {
        failedCount++;
        remaining.push({ ...item, syncStatus: 'FAILED', lastAttempt: new Date().toISOString() });
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    return { syncedCount, failedCount, remainingCount: remaining.length };
  },

  clearAll() {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
};

export default offlineSyncService;

