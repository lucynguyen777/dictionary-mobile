export async function getStoredItem(key: string) {
  if (typeof window === 'undefined') return null;

  return window.localStorage.getItem(key);
}

export async function setStoredItem(key: string, value: string) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(key, value);
}
