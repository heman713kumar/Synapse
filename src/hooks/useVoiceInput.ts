import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps the Web Speech API for dictation.
 * Returns transcript chunks via `onResult` callback as the user speaks.
 *
 * Browser support: Chrome/Edge desktop, Safari iOS 14.5+, NOT Firefox.
 */

type SpeechRecognition = any;

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface UseVoiceInputOptions {
  onResult?: (transcript: string, isFinal: boolean) => void;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface UseVoiceInputState {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  error: string | null;
}

export function useVoiceInput(opts: UseVoiceInputOptions = {}): UseVoiceInputState {
  const { onResult, lang = 'en-US', continuous = true, interimResults = true } = opts;
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const ensureInstance = useCallback(() => {
    if (!isSupported) return null;
    if (recognitionRef.current) return recognitionRef.current;
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Ctor();
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.lang = lang;
    rec.onresult = (e: any) => {
      let text = '';
      let isFinal = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) isFinal = true;
      }
      onResult?.(text, isFinal);
    };
    rec.onerror = (e: any) => setError(e.error || 'voice error');
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return rec;
  }, [continuous, interimResults, lang, onResult, isSupported]);

  const start = useCallback(() => {
    setError(null);
    const rec = ensureInstance();
    if (!rec) return;
    try {
      rec.start();
      setIsListening(true);
    } catch (e: any) {
      // Calling start twice throws — ignore
    }
  }, [ensureInstance]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try { rec.stop(); } catch {/* noop */}
    }
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { isSupported, isListening, start, stop, toggle, error };
}
