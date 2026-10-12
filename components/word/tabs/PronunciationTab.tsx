import Ionicons from '@expo/vector-icons/Ionicons';
import { RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Touchable from '@/components/app/Touchable';
import { DictionaryEntry } from '@/data/dictionary';

import { EmptyState, PreviewNotice } from '@/components/word/tabs/common';
import { useTabPagerStyles, useTabPagerToken } from '@/components/word/tabs/tabPagerStyles';

export function PronunciationTab({ entry }: { entry: DictionaryEntry }) {
  const styles = useTabPagerStyles();
  const { colors } = useTabPagerToken();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackPlayer, setPlaybackPlayer] = useState<AudioPlayer | null>(null);
  const [recordedUri, setRecordedUri] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('Chưa có bản ghi.');

  const handleStartRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setRecordingStatus('Cần cấp quyền microphone để ghi âm.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setRecordedUri('');
      setRecordingStatus('Đang ghi âm phát âm của bạn...');
    } catch {
      setRecordingStatus('Chưa thể bắt đầu ghi âm. Thử lại sau.');
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;

    try {
      await recorder.stop();
      const uri = recorder.uri ?? '';
      setRecordedUri(uri);
      setIsRecording(false);
      setRecordingStatus(uri ? 'Đã lưu bản ghi tạm thời trên thiết bị.' : 'Không tạo được bản ghi.');
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      setIsRecording(false);
      setRecordingStatus('Chưa thể dừng ghi âm. Thử lại sau.');
    }
  };

  const handlePlayRecording = async () => {
    if (!recordedUri) return;

    try {
      playbackPlayer?.remove();
      const player = createAudioPlayer(recordedUri);
      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (status.isLoaded && status.didJustFinish) {
          subscription.remove();
          player.remove();
          setPlaybackPlayer((currentPlayer) => (currentPlayer?.id === player.id ? null : currentPlayer));
        }
      });
      setPlaybackPlayer(player);
      player.play();
      setRecordingStatus('Đang phát lại bản ghi của bạn.');
    } catch {
      setRecordingStatus('Chưa thể phát lại bản ghi.');
    }
  };

  useEffect(() => {
    return () => {
      playbackPlayer?.remove();
    };
  }, [playbackPlayer]);

  return (
    <View>
      <PreviewNotice
        title="Ghi âm phát âm"
        text="Bạn có thể ghi âm và phát lại phát âm của mình. Căn chỉnh phoneme và chấm điểm sẽ thuộc phase sau."
      />
      <View style={styles.recordingCard}>
        <View style={styles.recordingCopy}>
          <Text style={styles.recordingTitle}>Bản ghi của bạn</Text>
          <Text style={styles.recordingText}>{recordingStatus}</Text>
        </View>
        <View style={styles.recordingActions}>
          <Touchable
            activeOpacity={0.82}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            style={[styles.recordingButton, isRecording && styles.stopRecordingButton]}>
            <Ionicons name={isRecording ? 'stop' : 'mic-outline'} size={17} color={isRecording ? colors.textOnAccent : colors.accentPrimary} />
            <Text style={[styles.recordingButtonText, isRecording && styles.stopRecordingButtonText]}>
              {isRecording ? 'Dừng' : 'Ghi âm'}
            </Text>
          </Touchable>
          <Touchable
            activeOpacity={0.82}
            disabled={!recordedUri || isRecording}
            onPress={handlePlayRecording}
            style={[styles.playRecordingButton, (!recordedUri || isRecording) && styles.disabledRecordingButton]}>
            <Ionicons name="play-outline" size={17} color={recordedUri && !isRecording ? colors.accentSuccess : colors.textTertiary} />
            <Text style={[styles.playRecordingText, (!recordedUri || isRecording) && styles.disabledRecordingText]}>
              Nghe lại
            </Text>
          </Touchable>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Hướng dẫn IPA</Text>
      <Text style={styles.body}>Dùng nút loa phía trên để nghe phát âm mẫu của {entry.word}.</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.tableCell}>Phoneme</Text>
        <Text style={styles.tableCell}>Trọng tâm</Text>
      </View>
      {entry.pronunciationTips.length ? entry.pronunciationTips.map((row) => (
        <View key={row.phoneme} style={styles.tableRow}>
          <Text style={styles.tableCell}>{row.phoneme}</Text>
          <Text style={styles.tableCell}>Luyện tập</Text>
          <Text style={styles.note}>{row.note}</Text>
        </View>
      )) : <EmptyState text="Chưa có tip phát âm chi tiết cho từ này." />}
    </View>
  );
}
