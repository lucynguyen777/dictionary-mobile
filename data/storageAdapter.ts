import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getStoredItem(key: string) {
  return AsyncStorage.getItem(key);
}

export async function setStoredItem(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

export async function removeStoredItem(key: string) {
  await AsyncStorage.removeItem(key);
}
