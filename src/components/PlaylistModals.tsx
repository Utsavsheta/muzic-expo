import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UserPlaylist } from '../services/db';
import { theme } from '../theme';

export function CreatePlaylistModal({
  visible,
  name,
  setName,
  onClose,
  onCreate,
}: {
  visible: boolean;
  name: string;
  setName: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>New Playlist</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Give it a name…"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onCreate}
          />
          <View style={styles.btnRow}>
            <Pressable style={styles.btnSecondary} onPress={onClose}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={onCreate}>
              <Text style={styles.btnPrimaryText}>Create</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function AddToPlaylistModal({
  visible,
  playlists,
  onClose,
  onCreate,
  onAdd,
}: {
  visible: boolean;
  playlists: UserPlaylist[];
  onClose: () => void;
  onCreate: () => void;
  onAdd: (id: string) => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Add to playlist</Text>

          <Pressable style={styles.newOption} onPress={onCreate}>
            <View style={styles.newIconWrap}>
              <Ionicons name="add" size={20} color={theme.colors.text} />
            </View>
            <Text style={styles.newOptionText}>New playlist</Text>
          </Pressable>

          {playlists.length > 0 && <View style={styles.divider} />}

          <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
            {playlists.map((p) => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
                onPress={() => onAdd(p.id)}
              >
                <View style={styles.listThumb}>
                  <Ionicons name="musical-notes" size={18} color={theme.colors.muted} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{p.name}</Text>
                  <Text style={styles.listMeta}>{p.songs.length} songs</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.muted} />
              </Pressable>
            ))}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 18,
  },
  input: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.full,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  btnSecondaryText: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  newOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  newIconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newOptionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  listScroll: {
    maxHeight: 260,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    paddingHorizontal: 4,
  },
  listItemPressed: {
    backgroundColor: theme.colors.panel,
  },
  listThumb: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfo: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  listMeta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  closeBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
});
