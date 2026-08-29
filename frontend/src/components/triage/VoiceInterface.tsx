import React from 'react';
import { Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceInterfaceProps {
  isRecording: boolean;
  recordingDuration?: number;
  isPlayingAudio: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStopAudioPlayback: () => void;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  isRecording,
  recordingDuration = 0,
  isPlayingAudio,
  onStartRecording,
  onStopRecording,
  onStopAudioPlayback,
}) => {
  const { t, isHindi } = useLanguage();

  return (
    <div className="flex items-center gap-3">
      {/* Glow mic button */}
      <button
        type="button"
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-full font-black text-xs sm:text-sm text-white shadow-md transition-all ${
          isRecording
            ? 'bg-red-600 animate-pulse-glow hover:bg-red-700 shadow-red-500/30'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/20'
        }`}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4 fill-white" />
            <span>
              {t('stopRecording')} ({recordingDuration}s)
            </span>
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            <span>{t('speakInHindi')}</span>
          </>
        )}
      </button>

      {/* Stop Speech Synthesis button */}
      {isPlayingAudio && (
        <button
          type="button"
          onClick={onStopAudioPlayback}
          className="px-4 py-3 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-extrabold text-xs flex items-center gap-1.5 transition-colors"
          title="Stop Audio"
        >
          <VolumeX className="w-4 h-4" />
          <span>{isHindi ? 'रोकें' : 'Stop Audio'}</span>
        </button>
      )}
    </div>
  );
};
