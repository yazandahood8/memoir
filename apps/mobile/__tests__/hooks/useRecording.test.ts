import { renderHook, act } from '@testing-library/react-native';
import { useRecording } from '@/hooks/useRecording';

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    uri: 'file://recording.m4a',
  })),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  },
  RecordingPresets: { HIGH_QUALITY: {} },
}));

describe('useRecording', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useRecording());
    expect(result.current.status).toBe('idle');
  });

  it('transitions to recording state on start', async () => {
    const { result } = renderHook(() => useRecording());
    await act(async () => { await result.current.startRecording(); });
    expect(result.current.status).toBe('recording');
  });

  it('returns audio URI on stop', async () => {
    const { result } = renderHook(() => useRecording());
    await act(async () => { await result.current.startRecording(); });
    await act(async () => { await result.current.stopRecording(); });
    expect(result.current.audioUri).toBe('file://recording.m4a');
    expect(result.current.status).toBe('stopped');
  });

  it('handles permission denied gracefully', async () => {
    const { AudioModule } = jest.requireMock('expo-audio');
    AudioModule.requestRecordingPermissionsAsync.mockResolvedValueOnce({ granted: false });
    const { result } = renderHook(() => useRecording());
    await act(async () => { await result.current.startRecording(); });
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBe('Microphone permission denied');
  });
});
