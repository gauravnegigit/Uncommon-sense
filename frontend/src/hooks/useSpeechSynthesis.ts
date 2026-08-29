import { useState, useCallback, useEffect } from 'react';

export const useSpeechSynthesis = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  const speak = useCallback(
    (text: string, lang: 'hi' | 'en' = 'hi') => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
      }

      window.speechSynthesis.cancel();

      // Clean markdown characters and linebreaks
      const cleaned = text
        .replace(/[*#_~`>]/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      if (!cleaned) return;

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stop,
    isPlaying,
  };
};
