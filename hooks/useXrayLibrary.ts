import { useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StrokePoint { x: number; y: number }

export interface Stroke {
  id: string;
  tool: 'pen' | 'line' | 'arrow' | 'text';
  color: string;
  points?: StrokePoint[];
  start?: StrokePoint;
  end?: StrokePoint;
  text?: string;
  position?: StrokePoint;
}

export interface CaptureEntry {
  id: string;
  uri: string;
  createdAt: number;
  strokes: Stroke[];
}

export interface XRayEntry {
  id: string;
  uri: string;
  label: string;
  createdAt: number;
  notes?: string;
  tags?: string[];
  inverted?: boolean;
  captures?: CaptureEntry[];
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
        for (const cap of entry.captures ?? []) {
          await FileSystem.deleteAsync(cap.uri, { idempotent: true });
        }
      }
      await save(library.filter((e) => e.id !== id));
    },
    [library, save]
  );

  const updateXRay = useCallback(
    async (id: string, fields: Partial<Omit<XRayEntry, 'id' | 'uri' | 'createdAt'>>) => {
      await save(library.map((e) => (e.id === id ? { ...e, ...fields } : e)));
    },
    [library, save]
  );

  const addCapture = useCallback(
    async (caseId: string, sourceUri: string): Promise<CaptureEntry> => {
      await ensureDir();
      const id = `capture_${Date.now()}`;
      const dest = `${XRAY_DIR}${id}.jpg`;
      await FileSystem.copyAsync({ from: sourceUri, to: dest });
      const entry: CaptureEntry = { id, uri: dest, createdAt: Date.now(), strokes: [] };
      await save(library.map(e =>
        e.id === caseId ? { ...e, captures: [entry, ...(e.captures ?? [])] } : e
      ));
      return entry;
    },
    [library, save]
  );

  const updateCapture = useCallback(
    async (caseId: string, captureId: string, strokes: Stroke[]) => {
      await save(library.map(e =>
        e.id === caseId
          ? { ...e, captures: (e.captures ?? []).map(c => c.id === captureId ? { ...c, strokes } : c) }
          : e
      ));
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

  return { library, loading, addXRay, removeXRay, updateXRay, addCapture, updateCapture, clearAll, reload: load };
}
