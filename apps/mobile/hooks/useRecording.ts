import { useState, useRef } from 'react';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';

type RecordingStatus = 'idle' | 'recording' | 'stopped';

export function useRecording() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);

  async function startRecording() {
    setError(null);
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission denied');
      return;
    }

    await recorder.prepareToRecordAsync();
    recorder.record();
    startTimeRef.current = Date.now();
    setStatus('recording');
  }

  async function stopRecording() {
    await recorder.stop();
    const uri = recorder.uri;
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);

    setAudioUri(uri);
    setDuration(elapsed);
    setStatus('stopped');
  }

  function reset() {
    setStatus('idle');
    setAudioUri(null);
    setDuration(0);
    setError(null);
  }

  return { status, audioUri, duration, error, startRecording, stopRecording, reset };
}
