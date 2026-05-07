import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusic } from '../../src/store/player-store';
import { TrackRow } from '../../src/components/TrackRow';
import { PlaylistCard } from '../../src/components/PlaylistCard';
import { theme } from '../../src/theme';

export default function SearchScreen() {
  const router = useRouter();
  const {
    query,
    setQuery,
    runSearch,
    searchTab,
    setSearchTab,
    searchSongs,
    searchPls,
    current,
    likedSongs,
    playTrack,
    toggleLike,
    openPlaylist,
    loadMoreContent,
    loading,
    loadingMore,
  } = useMusic();

  const likedSet = useMemo(() => new Set(likedSongs.map((s) => s.videoId)), [likedSongs]);

  const renderSong = useCallback(
    ({ item, index }: any) => (
      <TrackRow
        track={item}
        index={index}
        active={current?.videoId === item.videoId}
        liked={likedSet.has(item.videoId)}
        onPress={() => playTrack(item, searchSongs)}
        onLike={() => toggleLike(item)}
        onAdd={() => undefined}
      />
    ),
    [current, likedSet, searchSongs, playTrack, toggleLike],
  );

  const renderPlaylist = useCallback(
    ({ item }: any) => (
      <PlaylistCard
        playlist={item}
        onPress={() => { openPlaylist(item); router.push('/playlist/detail'); }}
      />
    ),
    [openPlaylist, router],
  );

  const header = (
    <View style={styles.headerWrap}>
      <Text style={styles.pageTitle}>Search</Text>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={theme.colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Songs, artists, playlists…"
          placeholderTextColor={theme.colors.muted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
          autoFocus={false}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, searchTab === 'songs' && styles.tabActive]}
          onPress={() => setSearchTab('songs')}
        >
          <Text style={[styles.tabText, searchTab === 'songs' && styles.tabTextActive]}>
            Songs
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, searchTab === 'playlists' && styles.tabActive]}
          onPress={() => setSearchTab('playlists')}
        >
          <Text style={[styles.tabText, searchTab === 'playlists' && styles.tabTextActive]}>
            Playlists
          </Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 8, marginBottom: 4 }} />}
    </View>
  );

  const empty = !loading && (
    <View style={styles.emptyWrap}>
      <Ionicons name="search-outline" size={52} color={theme.colors.muted} />
      <Text style={styles.emptyTitle}>
        {query.trim().length < 2 ? 'Start searching' : 'No results'}
      </Text>
      <Text style={styles.emptyMeta}>
        {query.trim().length < 2
          ? 'Type at least 2 characters and hit Search'
          : `Nothing found for "${query}"`}
      </Text>
    </View>
  );

  if (searchTab === 'songs') {
    return (
      <FlatList
        data={searchSongs}
        keyExtractor={(item, idx) => `${item.videoId}-${idx}`}
        onEndReached={loadMoreContent}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.content}
        style={styles.list}
        renderItem={renderSong}
        ListHeaderComponent={header}
        ListEmptyComponent={empty || undefined}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={theme.colors.accent} style={styles.loader} /> : null
        }
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <FlatList
      data={searchPls}
      keyExtractor={(item, idx) => `${item.id}-${idx}`}
      onEndReached={loadMoreContent}
      onEndReachedThreshold={0.4}
      contentContainerStyle={[styles.content, styles.playlistContent]}
      style={styles.list}
      renderItem={renderPlaylist}
      ListHeaderComponent={header}
      ListEmptyComponent={empty || undefined}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator color={theme.colors.accent} style={styles.loader} /> : null
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
  playlistContent: {
    paddingHorizontal: 16,
  },
  headerWrap: {
    paddingBottom: 4,
  },
  pageTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: 16,
    height: 46,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  tabText: {
    color: theme.colors.mutedLight,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#000',
  },
  emptyWrap: {
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
    paddingHorizontal: 20,
  },
  loader: {
    marginVertical: 20,
  },
});
