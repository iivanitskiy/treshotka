import { renderHook, act } from '@testing-library/react';
import { useScreenRecorder } from '../useScreenRecorder';

const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  state: 'inactive',
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
};

const mockStream = {
  getTracks: jest.fn(() => [{ stop: jest.fn() }]),
  getVideoTracks: jest.fn(() => [{ onended: null }]),
};

global.MediaRecorder = jest.fn(() => mockMediaRecorder) as unknown as typeof MediaRecorder;
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getDisplayMedia: jest.fn(() => Promise.resolve(mockStream)),
  },
  writable: true
});

global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('useScreenRecorder', () => {
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
    expect(global.MediaRecorder).toHaveBeenCalled();
    expect(mockMediaRecorder.start).toHaveBeenCalled();
  });

  it('should stop recording', async () => {
    const { result } = renderHook(() => useScreenRecorder({ channelName: 'test' }));
    
    await act(async () => {
      await result.current.startRecording();
    });

    mockMediaRecorder.state = 'recording';

    await act(async () => {
      result.current.stopRecording();
    });

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });
});
