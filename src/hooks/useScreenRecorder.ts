import { useState, useRef } from 'react';
import RecordRTC from 'recordrtc';

interface UseScreenRecorderProps {
  channelName: string;
}

interface UseScreenRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export const useScreenRecorder = ({ channelName }: UseScreenRecorderProps): UseScreenRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        selfBrowserSurface: "include"
      } as any);
      
      streamRef.current = stream;

      const recorder = new RecordRTC(stream, {
        type: 'video',
        mimeType: 'video/webm',
        disableLogs: false,
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        const fileName = `recording-${channelName}-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        
        RecordRTC.invokeSaveAsDialog(blob, fileName);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        recorder.destroy();
        recorderRef.current = null;
        setIsRecording(false);
      });
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};
