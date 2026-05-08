import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useXrayLibrary, Stroke, StrokePoint } from '../hooks/useXrayLibrary';
import { colors, radii, fontSize, tracking, space } from '../theme';

// ─── helpers ────────────────────────────────────────────────────────────────

function uid() { return `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function penPath(points: StrokePoint[]): string {
  if (!points?.length) return '';
  return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
}

function arrowHeadPoints(start: StrokePoint, end: StrokePoint): string {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const len = 14, spread = Math.PI / 6;
  const p1 = { x: end.x - len * Math.cos(angle - spread), y: end.y - len * Math.sin(angle - spread) };
  const p2 = { x: end.x - len * Math.cos(angle + spread), y: end.y - len * Math.sin(angle + spread) };
  return `${end.x},${end.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`;
}

// ─── stroke renderer ────────────────────────────────────────────────────────

function StrokeShape({ stroke }: { stroke: Partial<Stroke> }) {
  const { tool, color = '#ef4444', points, start, end, text, position } = stroke;

  if (tool === 'pen' && points?.length) {
    return <Path d={penPath(points)} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (tool === 'line' && start && end) {
    return <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />;
  }
  if (tool === 'arrow' && start && end) {
    return (
      <>
        <Line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <Polygon points={arrowHeadPoints(start, end)} fill={color} />
      </>
    );
  }
  if (tool === 'text' && text && position) {
    return (
      <SvgText x={position.x} y={position.y} fill={color} fontSize={18} fontWeight="bold">
        {text}
      </SvgText>
    );
  }
  return null;
}

// ─── tool / color configs ────────────────────────────────────────────────────

type Tool = Stroke['tool'];
const TOOLS: { id: Tool; label: string }[] = [
  { id: 'pen',   label: 'Pen'   },
  { id: 'line',  label: 'Line'  },
  { id: 'arrow', label: 'Arrow' },
  { id: 'text',  label: 'Text'  },
];
const COLORS = ['#ef4444', '#fbbf24', '#ffffff'];

// ─── screen ─────────────────────────────────────────────────────────────────

export default function AnnotateScreen() {
  const router = useRouter();
  const { caseId, captureId } = useLocalSearchParams<{ caseId: string; captureId: string }>();
  const { library, loading, updateCapture } = useXrayLibrary();

  const entry   = library.find(e => e.id === caseId);
  const capture = entry?.captures?.find(c => c.id === captureId);

  const [strokes, setStrokes]           = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Partial<Stroke> | null>(null);
  const [activeTool, setActiveTool]     = useState<Tool>('pen');
  const [activeColor, setActiveColor]   = useState(COLORS[0]);
  const [textModal, setTextModal]       = useState<{ pos: StrokePoint } | null>(null);
  const [textInput, setTextInput]       = useState('');
  const [saving, setSaving]             = useState(false);

  const canvasRef = useRef<View>(null);

  // Load existing strokes once capture is available
  useEffect(() => {
    if (capture?.strokes?.length) setStrokes(capture.strokes);
  }, [capture?.id]);

  // ── gesture handlers ──────────────────────────────────────────────────────

  const drawGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onStart(e => {
      const pt = { x: e.x, y: e.y };
      if (activeTool === 'pen') {
        setActiveStroke({ id: uid(), tool: 'pen', color: activeColor, points: [pt] });
      } else {
        setActiveStroke({ id: uid(), tool: activeTool, color: activeColor, start: pt, end: pt });
      }
    })
    .onUpdate(e => {
      const pt = { x: e.x, y: e.y };
      setActiveStroke(prev => {
        if (!prev) return prev;
        if (prev.tool === 'pen') return { ...prev, points: [...(prev.points ?? []), pt] };
        return { ...prev, end: pt };
      });
    })
    .onEnd(() => {
      setActiveStroke(prev => {
        if (prev) setStrokes(s => [...s, prev as Stroke]);
        return null;
      });
    });

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd(e => setTextModal({ pos: { x: e.x, y: e.y } }));

  const activeGesture = activeTool === 'text' ? tapGesture : drawGesture;

  // ── actions ───────────────────────────────────────────────────────────────

  function confirmText() {
    if (textInput.trim() && textModal) {
      setStrokes(s => [...s, {
        id: uid(), tool: 'text', color: activeColor,
        text: textInput.trim(), position: textModal.pos,
      }]);
    }
    setTextModal(null);
    setTextInput('');
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateCapture(caseId, captureId, strokes);
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save annotations.');
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    setSaving(true);
    try {
      await updateCapture(caseId, captureId, strokes);
      const flat = await captureRef(canvasRef, { format: 'jpg', quality: 0.95 });
      await Sharing.shareAsync(flat, { mimeType: 'image/jpeg', dialogTitle: 'Share annotated image' });
    } catch (e: any) {
      Alert.alert('Share Failed', e?.message ?? 'Could not share image.');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    Alert.alert('Save annotations?', 'Your annotations will be lost if you leave without saving.', [
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      { text: 'Save & Exit', onPress: handleSave },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // ── loading / not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.cyan300} />
      </View>
    );
  }

  if (!capture) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Capture not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const captureDate = new Date(capture.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.bg}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HUD */}
      <View style={styles.hud}>
        <TouchableOpacity style={styles.hudBtn} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.hudBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.hudMeta}>
          <Text style={styles.hudLabel} numberOfLines={1}>{entry?.label}</Text>
          <Text style={styles.hudDate}>{captureDate}</Text>
        </View>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareBtn, saving && { opacity: 0.5 }]}
          onPress={handleShare}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color={colors.bg} size="small" />
            : <Text style={styles.shareBtnText}>Share</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Canvas — captured by view-shot for sharing (HUD excluded) */}
      <View style={styles.canvas} ref={canvasRef} collapsable={false}>
        <Image source={{ uri: capture.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
        <GestureDetector gesture={activeGesture}>
          <Svg style={StyleSheet.absoluteFill}>
            {strokes.map(s => <StrokeShape key={s.id} stroke={s} />)}
            {activeStroke && <StrokeShape stroke={activeStroke} />}
          </Svg>
        </GestureDetector>
      </View>

      {/* Tool palette */}
      <View style={styles.palette}>
        {/* Tool buttons */}
        <View style={styles.toolGroup}>
          {TOOLS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.toolBtn, activeTool === t.id && styles.toolBtnActive]}
              onPress={() => setActiveTool(t.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolLabel, activeTool === t.id && styles.toolLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.paletteDivider} />

        {/* Color swatches */}
        <View style={styles.colorGroup}>
          {COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, activeColor === c && styles.colorDotActive]}
              onPress={() => setActiveColor(c)}
              activeOpacity={0.75}
            />
          ))}
        </View>

        <View style={styles.paletteDivider} />

        {/* Undo */}
        <TouchableOpacity
          style={styles.undoBtn}
          onPress={() => setStrokes(s => s.slice(0, -1))}
          disabled={strokes.length === 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.undoLabel, strokes.length === 0 && { opacity: 0.3 }]}>Undo</Text>
        </TouchableOpacity>
      </View>

      {/* Text placement modal */}
      <Modal visible={!!textModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Label</Text>
            <TextInput
              style={styles.modalInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="e.g. Fracture site"
              placeholderTextColor={colors.fg4}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setTextModal(null); setTextInput(''); }}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmText} style={[styles.modalBtn, styles.modalBtnAccent]}>
                <Text style={[styles.modalBtnText, { color: colors.bg }]}>Place</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: space[3] },
  errorText: { color: colors.fg3, fontSize: fontSize.sm },
  errorBack: { paddingHorizontal: space[4], paddingVertical: space[2] },
  errorBackText: { color: colors.cyan300, fontSize: fontSize.sm },

  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: space[4],
    paddingBottom: space[3],
    gap: space[3],
    backgroundColor: 'rgba(5,8,15,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border1,
  },
  hudBtn: {
    width: 36, height: 36,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: colors.border2,
    alignItems: 'center', justifyContent: 'center',
  },
  hudBtnText: { color: colors.fg2, fontSize: 16, fontWeight: '600' },
  hudMeta: { flex: 1, gap: 1 },
  hudLabel: { color: colors.fg1, fontSize: fontSize.sm, fontWeight: '600' },
  hudDate: { color: colors.fg4, fontSize: fontSize.xs },
  shareBtn: {
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    minWidth: 64,
    alignItems: 'center',
  },
  shareBtnText: { color: colors.bg, fontWeight: '700', fontSize: fontSize.sm },

  canvas: { flex: 1 },

  palette: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[3],
    paddingVertical: space[3],
    paddingBottom: 32,
    backgroundColor: 'rgba(5,8,15,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border1,
    gap: space[2],
  },
  toolGroup: { flexDirection: 'row', gap: space[1] },
  toolBtn: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: colors.surface1,
  },
  toolBtnActive: {
    borderColor: colors.cyan300,
    backgroundColor: 'rgba(79,195,247,0.15)',
  },
  toolLabel: { fontSize: fontSize.xs, color: colors.fg3, fontWeight: '600' },
  toolLabelActive: { color: colors.cyan300 },
  paletteDivider: { width: 1, height: 28, backgroundColor: colors.border2, marginHorizontal: space[1] },
  colorGroup: { flexDirection: 'row', gap: space[2], alignItems: 'center' },
  colorDot: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: colors.cyan300 },
  undoBtn: { paddingHorizontal: space[2], paddingVertical: space[2] },
  undoLabel: { fontSize: fontSize.xs, color: colors.fg3, fontWeight: '500' },
  saveBtn: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border2,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    minWidth: 56,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.fg1, fontWeight: '600', fontSize: fontSize.sm },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modalBox: {
    backgroundColor: colors.surface2, borderRadius: radii.lg,
    padding: space[6], width: '80%', gap: space[4],
  },
  modalTitle: { color: colors.fg1, fontSize: fontSize.md, fontWeight: '700' },
  modalInput: {
    borderWidth: 1, borderColor: colors.border2, borderRadius: radii.sm,
    padding: space[3], color: colors.fg1, fontSize: fontSize.sm,
  },
  modalActions: { flexDirection: 'row', gap: space[3] },
  modalBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border2,
    borderRadius: radii.sm, paddingVertical: space[3], alignItems: 'center',
  },
  modalBtnAccent: { backgroundColor: colors.brand, borderColor: colors.brand },
  modalBtnText: { color: colors.fg1, fontWeight: '600', fontSize: fontSize.sm },
});
