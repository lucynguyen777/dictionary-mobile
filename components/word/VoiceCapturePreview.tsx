import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView, type CameraType } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
  camera: {
    height: '100%',
    width: '100%',
  },
  centered: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 30,
    justifyContent: 'center',
    marginHorizontal: 12,
    padding: 12,
  },
  controls: {
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    width: '80%',
  },
  error: {
    color: '#DC2626',
    fontSize: 16,
    marginBottom: 16,
  },
});
