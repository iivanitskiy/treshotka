import { useState, useRef } from 'react';
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

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      streamRef.current = stream;

      const recorder = new RecordRTC(stream, {
        type: 'audio',
        recorderType: StereoAudioRecorder,
        mimeType: 'audio/webm',
        numberOfAudioChannels: 2,
        checkForInactiveTracks: true,
        bufferSize: 16384,
        disableLogs: false,
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsAudioRecording(true);
      
      stream.getAudioTracks()[0].onended = () => {
        stopAudioRecording();
      };

    } catch (err) {
      console.error("Ошибка записи аудио", err);
    }
  };

  const stopAudioRecording = () => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const fileName = `audio-recording-${channelName}-${new Date().toISOString().replace(/[:.]/g, '-')}.wav`;
        
        RecordRTC.invokeSaveAsDialog(blob, fileName);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        recorder.destroy();
        recorderRef.current = null;
        setIsAudioRecording(false);
      });
    }
  };

  return {
    isAudioRecording,
    startAudioRecording,
    stopAudioRecording
  };
};
