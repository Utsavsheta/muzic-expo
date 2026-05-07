import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMusic } from '../../src/store/player-store';
import { theme } from '../../src/theme';
import { PlaylistCard } from '../../src/components/PlaylistCard';
import { TrackRow } from '../../src/components/TrackRow';

export default function HomeScreen() {
  const router = useRouter();
  const {
    trending,
    popularPlaylists,
    current,
    likedSongs,
    openPlaylist,
    playTrack,
    toggleLike,
    loadMoreContent,
    loading,
    loadingMore,
  } = useMusic();

  const likedSet = useMemo(() => new Set(likedSongs.map((s) => s.videoId)), [likedSongs]);

  const renderTrack = useCallback(
    ({ item, index }: any) => (
      <TrackRow
        track={item}
        index={index}
        active={current?.videoId === item.videoId}
        liked={likedSet.has(item.videoId)}
        onPress={() => playTrack(item, trending)}
        onLike={() => toggleLike(item)}
        onAdd={() => router.push('/(tabs)/playlists')}
      />
    ),
    [current, likedSet, trending, playTrack, toggleLike, router],
  );

  const header = (
    <View>
      {/* App Header */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appName}>Music</Text>
          <Text style={styles.appSub}>Discover & Play</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.mutedLight} />
          </Pressable>
        </View>
      </View>

      {/* Search bar — tap opens the Search tab */}
      <Pressable
        style={styles.searchBar}
        onPress={() => router.push('/(tabs)/search')}
        accessibilityRole="search"
      >
        <Ionicons name="search" size={16} color={theme.colors.muted} />
        <Text style={styles.searchPlaceholder}>Songs, artists, playlists…</Text>
      </Pressable>

      {/* Popular Playlists */}
      {popularPlaylists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Playlists</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {popularPlaylists.map((p) => (
              <PlaylistCard
                key={p.id}
                playlist={p}
                onPress={() => { openPlaylist(p); router.push('/playlist/detail'); }}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Trending header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending</Text>
        {loading && <ActivityIndicator size="small" color={theme.colors.accent} />}
      </View>
    </View>
  );

  return (
    <FlatList
      data={trending}
      keyExtractor={(item, idx) => `${item.videoId}-${idx}`}
      onEndReached={loadMoreContent}
      onEndReachedThreshold={0.4}
      contentContainerStyle={styles.content}
      style={styles.list}
      renderItem={renderTrack}
      ListHeaderComponent={header}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={theme.colors.accent} style={styles.footerLoader} />
        ) : null
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
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 18,
  },
  appName: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appSub: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingHorizontal: 16,
    height: 46,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchPlaceholder: {
    flex: 1,
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 12,
  },
  horizontalList: {
    paddingBottom: 4,
  },
  footerLoader: {
    marginVertical: 20,
  },
});
