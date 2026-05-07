import { StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { theme } from '../theme';

type Props = {
  duration: number;
  progressSeconds: number;
  onSeekStart: (seconds: number) => void;
  onSeekChange: (seconds: number) => void;
  onSeekCommit: (seconds: number) => void;
  onSeekCancel: () => void;
  compact?: boolean;
};

export function PlaybackSeekbar({
  duration,
  progressSeconds,
  onSeekStart,
  onSeekChange,
  onSeekCommit,
  onSeekCancel,
  compact = false,
}: Props) {
  const [width, setWidth] = useState(0);

  // Local drag state: visual position updates immediately without waiting for a
  // store round-trip, which eliminates the thumb-jump-back glitch.
  const [isDragging, setIsDragging] = useState(false);
  const [localPct, setLocalPct] = useState(0);

  // Latest-ref pattern: PanResponder is created once (stable ref) but always
  // reads the current values through these refs so it never goes stale.
  const durationRef = useRef(duration);
  const widthRef = useRef(width);
  const onSeekStartRef = useRef(onSeekStart);
  const onSeekChangeRef = useRef(onSeekChange);
  const onSeekCommitRef = useRef(onSeekCommit);
  const onSeekCancelRef = useRef(onSeekCancel);

  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { widthRef.current = width; }, [width]);
  useEffect(() => { onSeekStartRef.current = onSeekStart; }, [onSeekStart]);
  useEffect(() => { onSeekChangeRef.current = onSeekChange; }, [onSeekChange]);
  useEffect(() => { onSeekCommitRef.current = onSeekCommit; }, [onSeekCommit]);
  useEffect(() => { onSeekCancelRef.current = onSeekCancel; }, [onSeekCancel]);

  const startPctRef = useRef(0);

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  // Created once — never recreated, so gesture tracking is never interrupted.
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const d = durationRef.current;
        const w = widthRef.current;
        if (!d || !w) return;
        const pct = clamp(evt.nativeEvent.locationX / w);
        startPctRef.current = pct;
        setIsDragging(true);
        setLocalPct(pct);
        onSeekStartRef.current(pct * d);
      },
      onPanResponderMove: (_, g) => {
        const d = durationRef.current;
        const w = widthRef.current;
        if (!d || !w) return;
        const pct = clamp(startPctRef.current + g.dx / w);
        setLocalPct(pct);
        onSeekChangeRef.current(pct * d);
      },
      onPanResponderRelease: (_, g) => {
        const d = durationRef.current;
        const w = widthRef.current;
        if (!d || !w) {
          setIsDragging(false);
          onSeekCancelRef.current();
          return;
        }
        const pct = clamp(startPctRef.current + g.dx / w);
        // Set localPct to final position before clearing isDragging so there is
        // no single frame where visualPct snaps back to the store's progressPct.
        setLocalPct(pct);
        setIsDragging(false);
        onSeekCommitRef.current(pct * d);
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        onSeekCancelRef.current();
      },
    })
  ).current;

  const progressPct = duration > 0 ? clamp(progressSeconds / duration) : 0;
  // During drag use the locally tracked pct (instant, no store round-trip).
  // Once released, switch back to the store's progressPct which, thanks to
  // seekTo() setting time immediately, will equal localPct — no visible jump.
  const visualPct = isDragging ? localPct : progressPct;

  const thumbLeft = width > 0 ? clamp(visualPct) * width : 0;

  return (
    <View
      style={[styles.touchArea, compact && styles.touchAreaCompact]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      {/* Separate wrapper so overflow:hidden on the track bar doesn't clip the thumb */}
      <View style={styles.trackWrapper}>
        {/* Track background + fill */}
        <View style={[styles.track, compact && styles.trackCompact]}>
          <View style={[styles.fill, { width: `${visualPct * 100}%` }]} />
        </View>

        {/* Thumb — absolutely positioned relative to trackWrapper, not clipped */}
        {width > 0 && (
          <View
            style={[
              styles.thumb,
              compact && styles.thumbCompact,
              { left: thumbLeft },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const TRACK_H = 4;
const THUMB_SIZE = 16;
const THUMB_SIZE_COMPACT = 13;

const styles = StyleSheet.create({
  touchArea: {
    // Large vertical hit area for comfortable touch
    paddingVertical: 14,
    justifyContent: 'center',
  },
  touchAreaCompact: {
    paddingVertical: 9,
  },
  trackWrapper: {
    // No overflow:hidden here — allows thumb to render outside track bounds
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    backgroundColor: theme.colors.borderStrong,
    overflow: 'hidden', // clips fill's rounded cap to track shape
  },
  trackCompact: {
    height: 3,
    borderRadius: 1.5,
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: TRACK_H / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    // Center horizontally on the touch point
    marginLeft: -THUMB_SIZE / 2,
    // Center vertically in trackWrapper (trackWrapper height = THUMB_SIZE)
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbCompact: {
    width: THUMB_SIZE_COMPACT,
    height: THUMB_SIZE_COMPACT,
    borderRadius: THUMB_SIZE_COMPACT / 2,
    marginLeft: -THUMB_SIZE_COMPACT / 2,
    top: (THUMB_SIZE - THUMB_SIZE_COMPACT) / 2,
  },
});
