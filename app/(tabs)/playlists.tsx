import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMusic } from '../../src/store/player-store';
import { CreatePlaylistModal, AddToPlaylistModal } from '../../src/components/PlaylistModals';
import { theme } from '../../src/theme';

export default function PlaylistsScreen() {
  const router = useRouter();
  const { userPlaylists, openUserPlaylist, createPlaylist, addToPlaylist, current } = useMusic();
  const [createVisible, setCreateVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addVisible, setAddVisible] = useState(false);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Your Library</Text>
      <Pressable
        style={styles.newBtn}
        onPress={() => setCreateVisible(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.newBtnText}>New</Text>
      </Pressable>
    </View>
  );

  const empty = (
    <View style={styles.empty}>
      <Ionicons name="library-outline" size={52} color={theme.colors.muted} />
      <Text style={styles.emptyTitle}>No playlists yet</Text>
      <Text style={styles.emptyMeta}>Tap New to create your first playlist</Text>
      <Pressable style={styles.emptyBtn} onPress={() => setCreateVisible(true)}>
        <Text style={styles.emptyBtnText}>Create playlist</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={userPlaylists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => { openUserPlaylist(item); router.push('/playlist/detail'); }}
          >
            <View style={styles.itemThumb}>
              <Ionicons name="musical-notes" size={22} color={theme.colors.muted} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.songs.length} songs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted} />
          </Pressable>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB — add current song to a playlist */}
      {current && (
        <Pressable style={styles.fab} onPress={() => setAddVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      )}

      <CreatePlaylistModal
        visible={createVisible}
        name={newPlaylistName}
        setName={setNewPlaylistName}
        onClose={() => { setCreateVisible(false); setNewPlaylistName(''); }}
        onCreate={async () => {
          const ok = await createPlaylist(newPlaylistName);
          if (ok) {
            setNewPlaylistName('');
            setCreateVisible(false);
          }
        }}
      />

      <AddToPlaylistModal
        visible={addVisible}
        playlists={userPlaylists}
        onClose={() => setAddVisible(false)}
        onCreate={() => { setAddVisible(false); setCreateVisible(true); }}
        onAdd={async (playlistId) => {
          if (!current) return;
          await addToPlaylist(playlistId, current);
          setAddVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  list: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
  },
  title: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  itemPressed: {
    backgroundColor: theme.colors.card,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    color: theme.colors.muted,
    fontSize: 12,
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
  },
  emptyBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
});
