import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useMemo, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMusic } from '../src/store/player-store';
import { fmtTime } from '../src/utils/time';
import { theme } from '../src/theme';
import { PlaybackSeekbar } from '../src/components/PlaybackSeekbar';

const { width: SCREEN_W } = Dimensions.get('window');
// Artwork fills screen width minus horizontal padding (24 each side)
const ART_SIZE = Math.min(SCREEN_W - 48, 380);

export default function FullPlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    current,
    hasActiveMedia,
    playing,
    displayTime,
    duration,
    repeat,
    shuffle,
    likedSongs,
    previous,
    togglePlay,
    next,
    toggleLike,
    setRepeat,
    setShuffle,
    beginSeek,
    updateSeek,
    endSeek,
    cancelSeek,
  } = useMusic();

  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      tension: 55,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  if (!hasActiveMedia || !current) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-down" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={styles.emptyBody}>
          <Ionicons name="musical-note-outline" size={56} color={theme.colors.muted} />
          <Text style={styles.emptyTitle}>Nothing playing</Text>
          <Text style={styles.emptySub}>Pick a song to start listening</Text>
        </View>
      </View>
    );
  }

  const liked = likedSongs.some((s) => s.videoId === current.videoId);
  const remaining = useMemo(
    () => Math.max(0, duration - displayTime),
    [displayTime, duration],
  );

  const repeatCycle = () =>
    setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off');
  const repeatIcon: React.ComponentProps<typeof Ionicons>['name'] =
    repeat === 'one' ? 'return-down-forward' : 'repeat';

  return (
    <Animated.View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 10,
          paddingBottom: Math.max(insets.bottom, 28),
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) },
          ],
        },
      ]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-down" size={22} color={theme.colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          <Text style={styles.headerChannel} numberOfLines={1}>
            {current.channelTitle}
          </Text>
        </View>

        <Pressable style={styles.iconBtn} onPress={() => toggleLike(current)} hitSlop={10}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? theme.colors.accent : theme.colors.text}
          />
        </Pressable>
      </View>

      {/* ── Artwork ── */}
      <View style={styles.artShadowWrap}>
        <View style={styles.artContainer}>
          <Image
            source={{ uri: current.thumbnailHigh || current.thumbnail }}
            style={styles.art}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* ── Track meta ── */}
      <View style={styles.meta}>
        <Text style={styles.trackTitle} numberOfLines={2}>
          {current.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {current.channelTitle}
        </Text>
      </View>

      {/* ── Seekbar + timestamps ── */}
      <View style={styles.seekSection}>
        <PlaybackSeekbar
          duration={duration}
          progressSeconds={displayTime}
          onSeekStart={beginSeek}
          onSeekChange={updateSeek}
          onSeekCommit={endSeek}
          onSeekCancel={cancelSeek}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{fmtTime(displayTime)}</Text>
          <Text style={styles.timeText}>-{fmtTime(remaining)}</Text>
        </View>
      </View>

      {/* ── Playback controls ── */}
      <View style={styles.controls}>
        {/* Shuffle */}
        <Pressable
          style={styles.sideBtn}
          onPress={() => setShuffle(!shuffle)}
          hitSlop={10}
        >
          <Ionicons
            name="shuffle"
            size={22}
            color={shuffle ? theme.colors.accent : theme.colors.mutedLight}
          />
        </Pressable>

        {/* Previous */}
        <Pressable style={styles.skipBtn} onPress={previous} hitSlop={8}>
          <Ionicons name="play-skip-back" size={28} color={theme.colors.text} />
        </Pressable>

        {/* Play / Pause */}
        <Pressable style={styles.playBtn} onPress={togglePlay}>
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={30}
            color="#fff"
            style={playing ? undefined : { marginLeft: 3 }}
          />
        </Pressable>

        {/* Next */}
        <Pressable style={styles.skipBtn} onPress={() => next(false)} hitSlop={8}>
          <Ionicons name="play-skip-forward" size={28} color={theme.colors.text} />
        </Pressable>

        {/* Repeat */}
        <View style={styles.sideBtn}>
          <Pressable onPress={repeatCycle} hitSlop={10}>
            <Ionicons
              name={repeatIcon}
              size={22}
              color={repeat !== 'off' ? theme.colors.accent : theme.colors.mutedLight}
            />
          </Pressable>
          {/* Dot indicator for repeat-one mode */}
          {repeat === 'one' && <View style={styles.repeatDot} />}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 24,
  },

  // ── Empty state ──────────────────────────────────────────────────────────────
  empty: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 24,
  },
  emptyBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: -60,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  headerLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  headerChannel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Shared icon button ────────────────────────────────────────────────────────
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Artwork ───────────────────────────────────────────────────────────────────
  artShadowWrap: {
    alignItems: 'center',
    marginBottom: 24,
    // Shadow lives here so it isn't clipped by overflow:hidden on the inner container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 18,
  },
  artContainer: {
    width: ART_SIZE,
    height: ART_SIZE,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  art: {
    width: '100%',
    height: '100%',
  },

  // ── Track meta ────────────────────────────────────────────────────────────────
  meta: {
    gap: 5,
    marginBottom: 18,
  },
  trackTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  trackArtist: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Seek + timestamps ─────────────────────────────────────────────────────────
  seekSection: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: theme.colors.mutedLight,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // ── Controls ──────────────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  repeatDot: {
    position: 'absolute',
    bottom: 7,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
});
