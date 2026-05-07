import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusic } from '../../src/store/player-store';
import { TrackRow } from '../../src/components/TrackRow';
import { theme } from '../../src/theme';

export default function LikedScreen() {
  const { likedSongs, current, playTrack, toggleLike } = useMusic();
  const likedSet = useMemo(() => new Set(likedSongs.map((s) => s.videoId)), [likedSongs]);

  const renderItem = useCallback(
    ({ item, index }: any) => (
      <TrackRow
        track={item}
        index={index}
        active={current?.videoId === item.videoId}
        liked={likedSet.has(item.videoId)}
        onPress={() => playTrack(item, likedSongs)}
        onLike={() => toggleLike(item)}
        onAdd={() => undefined}
      />
    ),
    [current, likedSet, likedSongs, playTrack, toggleLike],
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.iconBadge}>
        <Ionicons name="heart" size={28} color={theme.colors.accent} />
      </View>
      <Text style={styles.title}>Liked Songs</Text>
      <Text style={styles.sub}>{likedSongs.length} tracks</Text>
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <Ionicons name="heart-outline" size={52} color={theme.colors.muted} />
      <Text style={styles.emptyTitle}>No liked songs yet</Text>
      <Text style={styles.emptyMeta}>Heart any song and it'll appear here</Text>
    </View>
  );

  return (
    <FlatList
      data={likedSongs}
      keyExtractor={(item, idx) => `${item.videoId}-${idx}`}
      contentContainerStyle={styles.content}
      style={styles.list}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'flex-start',
    gap: 8,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sub: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyMeta: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});
