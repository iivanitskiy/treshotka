import { useState, useRef, useCallback, useEffect } from 'react';
import RecordRTC from 'recordrtc';
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
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      if (recorderRef.current) {
        recorderRef.current.destroy();
        recorderRef.current = null;
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

      const recorder = new RecordRTC(mediaStream, {
        type: "audio",
        mimeType: "audio/webm",
        numberOfAudioChannels: 1,
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsAudioRecording(true);
    } catch (error) {
      console.error("Ошибка при старте записи аудио:", error);
    }
  }, [isAudioRecording]);

  const stopAudioRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
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
          document.body.removeChild(a);
        }, 100);
        
        recorder.destroy();
        recorderRef.current = null;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setIsAudioRecording(false);
      });
    }
  }, []);

  return {
    isAudioRecording,
    startAudioRecording,
    stopAudioRecording
  };
};
