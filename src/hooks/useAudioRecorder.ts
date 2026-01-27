import { useState, useRef, useCallback, useEffect } from 'react';
import { useWakeLock } from './useWakeLock';

interface UseAudioRecorderProps {
  channelName: string;
}

interface UseAudioRecorderReturn {
  isAudioRecording: boolean;
  startAudioRecording: () => Promise<void>;
  stopAudioRecording: () => void;
}

export const useAudioRecorder = ({ channelName }: UseAudioRecorderProps): UseAudioRecorderReturn => {
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Prevent screen sleep during recording
  useWakeLock(isAudioRecording);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAudioRecording) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAudioRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startAudioRecording = useCallback(async () => {
    if (isAudioRecording) return;
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      streamRef.current = mediaStream;
      chunksRef.current = [];

      // Prefer standard codecs
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") 
        ? "audio/webm;codecs=opus" 
        : "audio/webm";

      const recorder = new MediaRecorder(mediaStream, {
        mimeType
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `audio-recording-${timestamp}.webm`;
        a.click();
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 100);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setIsAudioRecording(false);
        chunksRef.current = [];
      };

      recorder.start(1000); // Collect chunks every second
      mediaRecorderRef.current = recorder;
      setIsAudioRecording(true);
    } catch (error) {
      console.error("Ошибка при старте записи аудио:", error);
    }
  }, [isAudioRecording]);

  const stopAudioRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  return {
    isAudioRecording,
    startAudioRecording,
    stopAudioRecording
  };
};
