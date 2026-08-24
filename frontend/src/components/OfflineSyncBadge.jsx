import React, { useState } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, CheckCircle2, 
  CloudOff, Cloud, Clock, ChevronRight, X 
} from 'lucide-react';
import { useOfflineQueue } from '../context/OfflineQueueContext';

const OfflineSyncBadge = () => {
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, queue, pendingCount, isSyncing, syncNow, lastSyncTime } = useOfflineQueue();
  const [isOpen, setIsOpen] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(null);

  const handleSync = async () => {
    const res = await syncNow();
    if (res?.success) {
      setSyncSuccessMsg(`Successfully synchronized ${res.result?.syncedCount || 0} offline reports!`);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  return (
    <>
      {/* Floating Network & Sync Pill */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold shadow-soft border transition-all ${
            isOnline
              ? pendingCount > 0
                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                : 'bg-white text-slatecalm-700 border-slatecalm-200 hover:border-tealmed-400'
              : 'bg-rose-600 text-white border-rose-700 animate-pulse'
          }`}
        >
          {isOnline ? (
            pendingCount > 0 ? (
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}

          <span>
            {isOnline
              ? pendingCount > 0
                ? `${pendingCount} Offline Pending`
                : 'Network Online'
              : `Offline (${pendingCount} Queued)`}
          </span>
        </button>
      </div>

      {/* Sync Drawer / Popover */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-40 w-80 bg-white rounded-2xl border border-slatecalm-200 shadow-soft-lg p-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slatecalm-100">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <CloudOff className="w-4 h-4" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-slatecalm-900 text-xs">Offline Resilient Storage</h4>
                <p className="text-[10px] text-slatecalm-500">
                  {isOnline ? 'Connected to District Cloud' : 'Caching locally until network returns'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slatecalm-400 hover:text-slatecalm-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="my-3 space-y-2">
            <div className="p-2.5 bg-slatecalm-50 rounded-xl border border-slatecalm-100 text-xs flex justify-between items-center">
              <span className="text-slatecalm-600">Pending Sync Items:</span>
              <span className="font-bold text-slatecalm-900 bg-white px-2 py-0.5 rounded border border-slatecalm-200">
                {pendingCount}
              </span>
            </div>

            {lastSyncTime && (
              <p className="text-[10px] text-slatecalm-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last Synced: {lastSyncTime.toLocaleTimeString()}
              </p>
            )}

            {syncSuccessMsg && (
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slatecalm-100">
            {pendingCount > 0 && isOnline && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full py-2 bg-tealmed-600 hover:bg-tealmed-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing Records...' : 'Sync All Pending Now'}</span>
              </button>
            )}

            <button
              onClick={toggleSimulatedOffline}
              className="w-full py-1.5 bg-slatecalm-100 hover:bg-slatecalm-200 text-slatecalm-700 text-[11px] font-medium rounded-xl transition-colors"
            >
              {isSimulatedOffline ? 'Switch Back to Online' : 'Simulate Low Connectivity (Offline)'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineSyncBadge;

