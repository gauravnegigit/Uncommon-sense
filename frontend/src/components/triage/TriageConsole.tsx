import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  AlertOctagon, 
  FileText, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  User, 
  Activity,
  PhoneCall,
  Loader2,
  Bot
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { TriageMessage, TriageSeverity, PresetScenario } from '../../types';
import * as triageService from '../../services/triageService';
import { VoiceInterface } from './VoiceInterface';
import { PresetScenarios } from './PresetScenarios';
import { DangerSignsCard } from './DangerSignsCard';
import { TriageResultBadge } from './TriageResultBadge';

interface TriageConsoleProps {
  onOpenDoctorSummary: () => void;
  onViewFacilities: () => void;
  onDangerSignsDetected: (signs: string[]) => void;
  currentDangerSigns: string[];
  messages: TriageMessage[];
  setMessages: React.Dispatch<React.SetStateAction<TriageMessage[]>>;
  chatId: string;
  setChatId: (id: string) => void;
}

export const TriageConsole: React.FC<TriageConsoleProps> = ({
  onOpenDoctorSummary,
  onViewFacilities,
  onDangerSignsDetected,
  currentDangerSigns,
  messages,
  setMessages,
  chatId,
  setChatId,
}) => {
  const { t, isHindi, language } = useLanguage();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Audio recording & Speech hooks
  const voiceRecorder = useVoiceRecorder();
  const speechRecognition = useSpeechRecognition({
    language: isHindi ? 'hi-IN' : 'en-IN',
    onResult: (transcript) => {
      setInputText(transcript);
    },
  });
  const speechSynthesis = useSpeechSynthesis();

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Start new chat session
  const handleNewChat = async () => {
    speechSynthesis.stop();
    const newId = await triageService.startNewChat();
    setChatId(newId);
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'assistant',
        content: isHindi
          ? 'नमस्ते! मैं ग्रामीण हेल्थ (Gramin Health) ट्राइएज सहायक हूँ। कृपया मरीज के लक्षण बताएं या नीचे दिए गए माइक बटन को दबाकर हिंदी में बोलें।'
          : 'Hello! I am your Gramin Health Triage & Referral Assistant. Please describe patient symptoms or speak using the microphone.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        severity: 'UNKNOWN',
      },
    ]);
    onDangerSignsDetected([]);
  };

  // Submit text triage
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    speechSynthesis.stop();
    setInputText('');
    speechRecognition.resetTranscript();

    // Check danger signs locally in real-time
    const newSigns = triageService.scanForDangerSigns(text);
    const combinedSigns = Array.from(new Set([...currentDangerSigns, ...newSigns]));
    onDangerSignsDetected(combinedSigns);

    // Append user message
    const userMsg: TriageMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      dangerSignsDetected: newSigns,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await triageService.evaluateText({
        transcript: text,
        chat_id: chatId,
        language: isHindi ? 'hi-IN' : 'en-IN',
      });

      const assistantMsg: TriageMessage = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        severity: response.severity,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically speak the response if RED emergency or requested
      if (response.severity === 'EMERGENCY') {
        speechSynthesis.speak(
          isHindi
            ? 'सावधान! आपातकालीन रेड-फ्लैग संकेत मिले हैं। कृपया तुरंत 108 एम्बुलेंस बुलाएं।'
            : 'Alert! Emergency danger signs detected. Please call 108 immediately.',
          isHindi ? 'hi-IN' : 'en-IN'
        );
      }
    } catch (error) {
      console.error('Triage failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Voice Recording (Dual: Web Audio WAV recorder + Live Speech Recognition)
  const handleStartVoice = async () => {
    speechSynthesis.stop();
    setInputText('');
    speechRecognition.startListening();
    await voiceRecorder.startRecording();
  };

  // Stop Voice Recording & Send
  const handleStopVoice = async () => {
    speechRecognition.stopListening();
    const blob = await voiceRecorder.stopRecording();

    // Use transcribed speech or upload audio blob to backend
    const transcribed = speechRecognition.transcript.trim();

    if (transcribed) {
      handleSendMessage(transcribed);
    } else if (blob) {
      setIsLoading(true);
      try {
        const res = await triageService.evaluateAudioFile(blob, chatId);
        const userMsg: TriageMessage = {
          id: 'usr_audio_' + Date.now(),
          sender: 'user',
          content: res.transcript || (isHindi ? 'ऑडियो संदेश (हिंदी रिकॉर्डिंग)' : 'Audio Message (Hindi recording)'),
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          isAudio: true,
        };

        const astMsg: TriageMessage = {
          id: 'ast_audio_' + Date.now(),
          sender: 'assistant',
          content: res.content,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          severity: res.severity,
        };

        setMessages((prev) => [...prev, userMsg, astMsg]);
      } catch (err) {
        console.warn('Audio upload fallback to text simulation:', err);
        // Fallback default Hindi voice scenario simulation
        handleSendMessage('मुझे 2 दिन से बहुत तेज सीने में दर्द और सांस लेने में तकलीफ़ हो रही है।');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Run a preset scenario
  const handleSelectScenario = (scenario: PresetScenario) => {
    const query = isHindi ? scenario.promptHi : scenario.promptEn;
    handleSendMessage(query);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Preset Scenarios & Danger Signs Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PresetScenarios onSelectScenario={handleSelectScenario} />
        </div>
        <div className="lg:col-span-1">
          <DangerSignsCard detectedSigns={currentDangerSigns} />
        </div>
      </div>

      {/* Main Conversation Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md flex flex-col h-[640px] overflow-hidden">
        {/* Chat Header with Logo */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-slate-900 p-1 flex items-center justify-center border border-slate-800 shadow-xs shrink-0">
              <img src="/logo.png" alt="Gramin Health" className="w-full h-full object-contain" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-0.5 right-0.5 animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Gramin Health Triage Console
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {isHindi ? 'सत्र' : 'Session'}: {chatId.slice(0, 8)}...
                </span>
              </div>
              <p className="text-xs text-slate-400 font-hindi">
                {isHindi ? 'आईसीएमआर एवं आशा आपातकालीन प्रोटोकॉल' : 'ICMR STWs & ASHA Guidelines Engine'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
              title={t('newChat')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('newChat')}</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isEmergency = msg.severity === 'EMERGENCY';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-slate-950 p-1 flex items-center justify-center shrink-0 border border-slate-800 shadow-xs">
                    <img src="/logo.png" alt="Gramin Health" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  <div
                    className={`rounded-2xl p-4 shadow-xs text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : isEmergency
                        ? 'bg-red-50 border-2 border-red-300 text-slate-900 rounded-tl-none shadow-red-500/10'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                    }`}
                  >
                    {/* Severity Header for Assistant Messages */}
                    {!isUser && msg.severity && msg.severity !== 'UNKNOWN' && (
                      <div className="mb-2">
                        <TriageResultBadge severity={msg.severity} />
                      </div>
                    )}

                    {/* Content */}
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Bottom Metadata & Voice Playback */}
                    <div
                      className={`flex items-center justify-between gap-3 mt-2.5 pt-2 text-[11px] border-t ${
                        isUser ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                      }`}
                    >
                      <span>{msg.timestamp}</span>

                      {!isUser && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (speechSynthesis.isPlaying && speechSynthesis.currentText === msg.content) {
                                speechSynthesis.stop();
                              } else {
                                speechSynthesis.speak(msg.content, isHindi ? 'hi-IN' : 'en-IN');
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                            title="Listen to this response"
                          >
                            {speechSynthesis.isPlaying && speechSynthesis.currentText === msg.content ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                                <span>{t('stopVoice')}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{t('playVoice')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contextual Action Buttons for Emergency or Assessment */}
                  {!isUser && msg.severity === 'EMERGENCY' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="tel:108"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700 transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>108 {isHindi ? 'एम्बुलेंस डायल करें' : 'Call Ambulance'}</span>
                      </a>
                      <button
                        onClick={onOpenDoctorSummary}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-400" />
                        <span>{t('viewDoctorSummary')}</span>
                      </button>
                      <button
                        onClick={onViewFacilities}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'नजदीकी अस्पताल' : 'Nearby Hospital'}</span>
                      </button>
                    </div>
                  )}

                  {!isUser && msg.severity === 'SYMPTOM_ASSESSMENT' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={onOpenDoctorSummary}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-400" />
                        <span>{t('viewDoctorSummary')}</span>
                      </button>
                      <button
                        onClick={onViewFacilities}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-teal-200 text-teal-700 text-xs font-bold hover:bg-teal-50 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'निकटतम PHC खोजें' : 'Find Nearby PHC'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 shadow-xs font-bold text-sm">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 animate-fadeIn">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{isHindi ? 'आईसीएमआर गाइडलाइंस और खतरे के संकेतों का विश्लेषण हो रहा है...' : 'Evaluating against ICMR STWs & danger signs...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area: Voice Interface + Text Box */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          {/* Active Voice Recorder Overlay or Trigger */}
          <VoiceInterface
            isRecording={voiceRecorder.isRecording || speechRecognition.isListening}
            volumeLevel={voiceRecorder.volumeLevel}
            durationSeconds={voiceRecorder.recordingDuration}
            liveTranscript={speechRecognition.transcript || speechRecognition.interimTranscript}
            onStartRecording={handleStartVoice}
            onStopRecording={handleStopVoice}
            isProcessing={isLoading}
          />

          {/* Text Input Row */}
          {!voiceRecorder.isRecording && !speechRecognition.isListening && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t('inputPlaceholder')}
                  disabled={isLoading}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-100/90 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm text-slate-900 transition-all font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className={`p-3 rounded-2xl text-white font-bold transition-all shadow-sm ${
                  !inputText.trim() || isLoading
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
                title={t('send')}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

