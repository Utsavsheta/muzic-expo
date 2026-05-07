import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useMusic } from '../store/player-store';
import { fmtTime } from '../utils/time';
import { theme } from '../theme';

export function PlayerBar() {
  const {
    current,
    playing,
    time,
    duration,
    repeat,
    likedSongs,
    togglePlay,
    previous,
    next,
    setRepeat,
    toggleLike,
  } = useMusic();

  const pct = duration > 0 ? Math.min(1, time / duration) : 0;
  const liked = useMemo(
    () => !!current && likedSongs.some((s) => s.videoId === current.videoId),
    [current, likedSongs],
  );
  const repeatIcon: 'repeat' | 'repeat-outline' | 'return-down-forward-outline' =
    repeat === 'one'
      ? 'return-down-forward-outline'
      : repeat === 'all'
      ? 'repeat'
      : 'repeat-outline';

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
      </View>

      <View style={styles.inner}>
        {/* Thumbnail */}
        {current ? (
          <Image source={{ uri: current.thumbnail }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Ionicons name="musical-note" size={18} color={theme.colors.muted} />
          </View>
        )}

        {/* Song info — flex:1 so it shrinks before controls do */}
        <View style={styles.info}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {current?.title ?? 'Nothing playing'}
          </Text>

          {/* Second row: artist (shrinks) + time (never shrinks) */}
          <View style={styles.metaRow}>
            <Text style={styles.artistText} numberOfLines={1}>
              {current?.channelTitle ?? 'Select a track to play'}
            </Text>
            {current && (
              <Text style={styles.timeText} numberOfLines={1}>
                {fmtTime(time)}&thinsp;/&thinsp;{fmtTime(duration)}
              </Text>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={() => current && toggleLike(current)}
            hitSlop={10}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={19}
              color={liked ? theme.colors.accent : theme.colors.muted}
            />
          </Pressable>

          <Pressable onPress={previous} hitSlop={10}>
            <Ionicons
              name="play-skip-back"
              size={21}
              color={current ? theme.colors.text : theme.colors.muted}
            />
          </Pressable>

          <Pressable onPress={togglePlay} style={styles.playBtn} hitSlop={6}>
            <Ionicons
              name={playing ? 'pause' : 'play'}
              size={19}
              color="#fff"
              style={playing ? undefined : { marginLeft: 2 }}
            />
          </Pressable>

          <Pressable onPress={() => next(false)} hitSlop={10}>
            <Ionicons
              name="play-skip-forward"
              size={21}
              color={current ? theme.colors.text : theme.colors.muted}
            />
          </Pressable>

          <Pressable
            onPress={() =>
              setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')
            }
            hitSlop={10}
          >
            <Ionicons
              name={repeatIcon}
              size={17}
              color={repeat !== 'off' ? theme.colors.accent : theme.colors.muted}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.panel,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  progressTrack: {
    height: 2,
    backgroundColor: theme.colors.border,
  },
  progressFill: {
    height: 2,
    backgroundColor: theme.colors.accent,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    flexShrink: 0,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  songTitle: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artistText: {
    // flex:1 lets the artist name shrink so the time always has room
    flex: 1,
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  timeText: {
    // flexShrink:0 guarantees the time is NEVER truncated
    flexShrink: 0,
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
