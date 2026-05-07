import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMusic } from '../../src/store/player-store';
import { TrackRow } from '../../src/components/TrackRow';
import { theme } from '../../src/theme';

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const {
    shownPlaylistSongs,
    activePlaylist,
    activeUserPlaylist,
    current,
    likedSongs,
    playTrack,
    toggleLike,
    playList,
    removeFromPlaylist,
    loading,
  } = useMusic();

  const likedSet = useMemo(() => new Set(likedSongs.map((s) => s.videoId)), [likedSongs]);

  const playlistName =
    activeUserPlaylist?.name ?? activePlaylist?.title ?? 'Liked Songs';
  const playlistMeta = activeUserPlaylist
    ? `${shownPlaylistSongs.length} songs`
    : activePlaylist
    ? `${activePlaylist.channelTitle} · ${shownPlaylistSongs.length} tracks`
    : `${shownPlaylistSongs.length} liked tracks`;

  const renderItem = useCallback(
    ({ item, index }: any) => (
      <TrackRow
        track={item}
        index={index}
        active={current?.videoId === item.videoId}
        liked={likedSet.has(item.videoId)}
        onPress={() => playTrack(item, shownPlaylistSongs)}
        onLike={() => toggleLike(item)}
        onAdd={() => undefined}
        onRemove={
          activeUserPlaylist
            ? () => removeFromPlaylist(activeUserPlaylist.id, item.videoId)
            : undefined
        }
      />
    ),
    [current, likedSet, shownPlaylistSongs, playTrack, toggleLike, activeUserPlaylist, removeFromPlaylist],
  );

  const header = (
    <View style={styles.header}>
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
      </Pressable>

      <View style={styles.iconWrap}>
        <Ionicons
          name={activeUserPlaylist ? 'musical-notes' : activePlaylist ? 'list' : 'heart'}
          size={32}
          color={theme.colors.accent}
        />
      </View>

      <Text style={styles.playlistName} numberOfLines={2}>{playlistName}</Text>
      <Text style={styles.playlistMeta}>{playlistMeta}</Text>

      {shownPlaylistSongs.length > 0 && (
        <Pressable
          style={styles.shuffleBtn}
          onPress={() => {
            const idx = Math.floor(Math.random() * shownPlaylistSongs.length);
            playList(shownPlaylistSongs, idx);
          }}
        >
          <Ionicons name="shuffle" size={16} color="#fff" />
          <Text style={styles.shuffleBtnText}>Shuffle play</Text>
        </Pressable>
      )}

      <View style={styles.divider} />
    </View>
  );

  return (
    <FlatList
      data={shownPlaylistSongs}
      keyExtractor={(item, idx) => `${item.videoId}-${idx}`}
      contentContainerStyle={styles.content}
      style={styles.list}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="musical-notes-outline" size={48} color={theme.colors.muted} />
            <Text style={styles.emptyText}>No songs here yet</Text>
          </View>
        )
      }
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
    paddingTop: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  playlistName: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  playlistMeta: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 18,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 20,
  },
  shuffleBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 50,
    gap: 12,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
});
