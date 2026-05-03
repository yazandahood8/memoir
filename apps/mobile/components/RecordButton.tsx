import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  status: 'idle' | 'recording' | 'stopped';
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ status, onStart, onStop }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [status]);

  const isRecording = status === 'recording';

  return (
    <Animated.View style={[styles.outer, isRecording && styles.outerActive, { transform: [{ scale: pulse }] }]}>
      <TouchableOpacity
        testID="record-button"
        style={[styles.button, isRecording && styles.buttonActive]}
        onPress={isRecording ? onStop : onStart}
        activeOpacity={0.8}
      >
        <View style={[styles.inner, isRecording && styles.innerStop]}>
          {isRecording ? null : <Ionicons name="mic" size={32} color="#fff" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#2a2a3e', justifyContent: 'center', alignItems: 'center' },
  outerActive: { borderColor: '#ff4444' },
  button: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center' },
  buttonActive: { backgroundColor: '#ff4444' },
  inner: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  innerStop: { width: 20, height: 20, borderRadius: 4, backgroundColor: '#fff' },
});
