import { renderHook, act } from '@testing-library/react';
import { useScreenRecorder } from '../useScreenRecorder';
import RecordRTC from 'recordrtc';

// Mock RecordRTC
jest.mock('recordrtc', () => {
  const mockRecordRTC = jest.fn().mockImplementation(() => ({
    startRecording: jest.fn(),
    stopRecording: jest.fn((cb) => cb && cb()),
    getBlob: jest.fn(() => new Blob(['test'], { type: 'video/webm' })),
    destroy: jest.fn(),
    save: jest.fn(),
  }));
  // Add static method
  (mockRecordRTC as any).invokeSaveAsDialog = jest.fn();
  return mockRecordRTC;
});

const mockStream = {
  getTracks: jest.fn(() => [{ stop: jest.fn() }]),
  getVideoTracks: jest.fn(() => [{ onended: null }]),
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getDisplayMedia: jest.fn(() => Promise.resolve(mockStream)),
  },
  writable: true
});

describe('useScreenRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with isRecording false', () => {
    const { result } = renderHook(() => useScreenRecorder({ channelName: 'test' }));
    expect(result.current.isRecording).toBe(false);
  });

  it('should start recording', async () => {
    const { result } = renderHook(() => useScreenRecorder({ channelName: 'test' }));
    
    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(global.navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
    expect(RecordRTC).toHaveBeenCalled();
  });

  it('should stop recording', async () => {
    const { result } = renderHook(() => useScreenRecorder({ channelName: 'test' }));
    
    await act(async () => {
      await result.current.startRecording();
    });

    await act(async () => {
      result.current.stopRecording();
    });

    const mockInstance = (RecordRTC as unknown as jest.Mock).mock.results[0].value;
    expect(mockInstance.stopRecording).toHaveBeenCalled();
    expect(RecordRTC.invokeSaveAsDialog).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });
});
