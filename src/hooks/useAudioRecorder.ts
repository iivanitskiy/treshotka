import { useState, useRef, useCallback } from 'react';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';

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

  const startAudioRecording = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      streamRef.current = mediaStream;

      // Используем StereoAudioRecorder для WebM, чтобы получить более надежную запись
      const recorder = new RecordRTC(mediaStream, {
        type: "audio",
        mimeType: "audio/webm",
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1, // Моно для уменьшения размера
        desiredSampRate: 44100,
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsAudioRecording(true);
    } catch (error) {
      console.error("Ошибка при старте записи аудио:", error);
    }
  }, []);

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
        // Генерируем имя файла с текущей датой и временем
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `audio-recording-${timestamp}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Очистка
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
