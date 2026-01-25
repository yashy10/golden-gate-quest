import { useState, useRef, useCallback, useEffect } from 'react';

interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  error: string | null;
}

interface UseTTSReturn extends TTSState {
  speak: (text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const TTS_BASE_URL = import.meta.env.VITE_TTS_API_URL || 'http://10.196.219.208:9000';

export function useTTS(): UseTTSReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const cachedTextRef = useRef<string | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const generateSpeech = async (text: string): Promise<Blob> => {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('voice_url', 'alba');

    const response = await fetch(`${TTS_BASE_URL}/tts`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('TTS generation failed');
    }

    return await response.blob();
  };

  const speak = useCallback(async (text: string) => {
    // Clean the text - remove any markdown/HTML
    const cleanText = text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[#*_~`]/g, '') // Remove markdown characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanText) {
      setState(prev => ({ ...prev, error: 'No text to speak' }));
      return;
    }

    // If same text is cached and audio exists, just play it
    if (cachedTextRef.current === cleanText && audioRef.current) {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
      setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
      return;
    }

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setState({ isLoading: true, isPlaying: false, isPaused: false, error: null });

    try {
      const audioBlob = await generateSpeech(cleanText);
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      cachedTextRef.current = cleanText;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      };

      audio.onpause = () => {
        if (!audio.ended) {
          setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
        }
      };

      audio.onended = () => {
        setState({ isLoading: false, isPlaying: false, isPaused: false, error: null });
      };

      audio.onerror = () => {
        setState({ isLoading: false, isPlaying: false, isPaused: false, error: 'Audio playback failed' });
      };

      setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setState({ 
        isLoading: false, 
        isPlaying: false, 
        isPaused: false, 
        error: 'Unable to generate audio. Please try again.' 
      });
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState({ isLoading: false, isPlaying: false, isPaused: false, error: null });
  }, []);

  return {
    ...state,
    speak,
    pause,
    resume,
    stop,
  };
}
