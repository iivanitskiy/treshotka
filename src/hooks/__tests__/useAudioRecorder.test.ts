import { renderHook, act } from '@testing-library/react';
import { useAudioRecorder } from '../useAudioRecorder';
import RecordRTC from 'recordrtc';

jest.mock('recordrtc', () => {
  return jest.fn().mockImplementation(() => ({
    startRecording: jest.fn(),
    stopRecording: jest.fn((cb) => cb('blob-url')),
    getBlob: jest.fn(() => new Blob(['audio data'], { type: 'audio/webm' })),
    destroy: jest.fn(),
  }));
});

const mockGetTracks = jest.fn(() => [
  { stop: jest.fn(), kind: 'audio' }
]);

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: mockGetTracks
    }))
  },
  writable: true
});

describe('useAudioRecorder', () => {
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (RecordRTC as unknown as jest.Mock).mockClear();
    mockGetTracks.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAudioRecorder({ channelName: 'test' }));
    expect(result.current.isAudioRecording).toBe(false);
  });

  it('should start recording successfully', async () => {
    const { result } = renderHook(() => useAudioRecorder({ channelName: 'test' }));

    await act(async () => {
      await result.current.startAudioRecording();
    });

    expect(result.current.isAudioRecording).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true, video: false });
    expect(RecordRTC).toHaveBeenCalled();
  });

  it('should not start recording if already recording', async () => {
    const { result } = renderHook(() => useAudioRecorder({ channelName: 'test' }));
    
    await act(async () => {
      await result.current.startAudioRecording();
    });

    expect(result.current.isAudioRecording).toBe(true);
    
    (global.navigator.mediaDevices.getUserMedia as jest.Mock).mockClear();
    (RecordRTC as unknown as jest.Mock).mockClear();

    await act(async () => {
      await result.current.startAudioRecording();
    });
    
    expect(global.navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(RecordRTC).not.toHaveBeenCalled();
  });

  it('should stop recording and return blob', async () => {
    const { result } = renderHook(() => useAudioRecorder({ channelName: 'test' }));

    await act(async () => {
      await result.current.startAudioRecording();
    });

    let recordedBlob;
    await act(async () => {
      recordedBlob = await result.current.stopAudioRecording();
    });

    expect(result.current.isAudioRecording).toBe(false);
  });

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useAudioRecorder({ channelName: 'test' }));

    await act(async () => {
      await result.current.startAudioRecording();
    });

    expect(RecordRTC).toHaveBeenCalled();
    const mockRecorderInstance = (RecordRTC as unknown as jest.Mock).mock.results[0].value;

    unmount();

    expect(mockGetTracks).toHaveBeenCalled();
    
    expect(mockRecorderInstance.destroy).toHaveBeenCalled();
  });
});
