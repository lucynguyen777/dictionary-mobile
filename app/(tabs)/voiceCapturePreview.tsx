import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Camera, CameraView, type CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

type VoiceCapturePreviewProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (uri: string) => void;
};

export default function VoiceCapturePreview({ visible, onClose, onCapture }: VoiceCapturePreviewProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
  const [type, setType] = useState<CameraType>('back');

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync({ quality: 0.8, base64: false });
      onCapture(photo.uri);
      onClose();
    }
  };

  if (!visible) return null;
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Cần quyền truy cập camera để chụp ảnh.</Text>
        <TouchableOpacity onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={type} ref={setCameraRef} />
      <View style={styles.controls}>
        <TouchableOpacity onPress={onClose} style={styles.controlButton}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCapture} style={styles.controlButton}>
          <Ionicons name="camera" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setType(type === 'back' ? 'front' : 'back')} style={styles.controlButton}>
          <Ionicons name="camera-reverse" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  controlButton: {
    backgroundColor: '#0F766E',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  error: {
    color: '#DC2626',
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
});
