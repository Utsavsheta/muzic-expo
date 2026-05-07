import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMusic } from '../store/player-store';
import { theme } from '../theme';

export const PLAYER_BAR_HEIGHT = 70;

const ARTWORK_SIZE = 46;

export function PlayerBar() {
  const router = useRouter();
  const {
    current,
    hasActiveMedia,
    playing,
    displayTime,
    duration,
    togglePlay,
    previous,
    next,
  } = useMusic();

  if (!hasActiveMedia || !current) return null;

  const progress = duration > 0 ? Math.min(1, Math.max(0, displayTime / duration)) : 0;

  return (
    <Pressable style={styles.container} onPress={() => router.push('/player')}>
      {/* Thin accent progress line — shows where we are at a glance */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Main content */}
      <View style={styles.row}>
        {/* Artwork */}
        <View style={styles.artShadow}>
          <Image source={{ uri: current.thumbnail }} style={styles.art} />
        </View>

        {/* Track info — shrinks before controls do */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {current.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {current.channelTitle}
          </Text>
        </View>

        {/* Controls: prev | play/pause | next */}
        <View style={styles.controls}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); previous(); }}
            hitSlop={12}
          >
            <Ionicons name="play-skip-back" size={20} color={theme.colors.text} />
          </Pressable>

          <Pressable
            onPress={(e) => { e.stopPropagation(); togglePlay(); }}
            style={styles.playBtn}
            hitSlop={8}
          >
            <Ionicons
              name={playing ? 'pause' : 'play'}
              size={19}
              color="#fff"
              style={playing ? undefined : { marginLeft: 2 }}
            />
          </Pressable>

          <Pressable
            onPress={(e) => { e.stopPropagation(); next(false); }}
            hitSlop={12}
          >
            <Ionicons name="play-skip-forward" size={20} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PLAYER_BAR_HEIGHT,
    backgroundColor: theme.colors.panel,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },

  // ── Progress line ─────────────────────────────────────────────────────────────
  progressTrack: {
    height: 2,
    backgroundColor: theme.colors.borderStrong,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 1,
  },

  // ── Content row ───────────────────────────────────────────────────────────────
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },

  // ── Artwork ───────────────────────────────────────────────────────────────────
  artShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  art: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
  },

  // ── Track info ────────────────────────────────────────────────────────────────
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  artist: {
    color: theme.colors.mutedLight,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Controls ──────────────────────────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
});
