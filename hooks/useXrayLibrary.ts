import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface XRayEntry {
  id: string;
  uri: string;
  label: string;
  createdAt: number;
}

const LIBRARY_KEY = 'xray_library';
const XRAY_DIR = `${FileSystem.documentDirectory}xrays/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(XRAY_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(XRAY_DIR, { intermediates: true });
  }
}

export function useXrayLibrary() {
  const [library, setLibrary] = useState<XRayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LIBRARY_KEY);
      setLibrary(raw ? JSON.parse(raw) : []);
    } catch {
      setLibrary([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (entries: XRayEntry[]) => {
    await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(entries));
    setLibrary(entries);
  }, []);

  const addXRay = useCallback(
    async (sourceUri: string, label: string): Promise<XRayEntry> => {
      await ensureDir();
      const id = `xray_${Date.now()}`;
      const dest = `${XRAY_DIR}${id}.jpg`;
      await FileSystem.copyAsync({ from: sourceUri, to: dest });
      const entry: XRayEntry = { id, uri: dest, label, createdAt: Date.now() };
      const updated = [entry, ...library];
      await save(updated);
      return entry;
    },
    [library, save]
  );

  const removeXRay = useCallback(
    async (id: string) => {
      const entry = library.find((e) => e.id === id);
      if (entry) {
        await FileSystem.deleteAsync(entry.uri, { idempotent: true });
      }
      await save(library.filter((e) => e.id !== id));
    },
    [library, save]
  );

  const renameXRay = useCallback(
    async (id: string, label: string) => {
      await save(library.map((e) => (e.id === id ? { ...e, label } : e)));
    },
    [library, save]
  );

  const clearAll = useCallback(async () => {
    try {
      await FileSystem.deleteAsync(XRAY_DIR, { idempotent: true });
    } catch { /* directory may not exist */ }
    await AsyncStorage.removeItem(LIBRARY_KEY);
    setLibrary([]);
  }, []);

  return { library, loading, addXRay, removeXRay, renameXRay, clearAll, reload: load };
}
