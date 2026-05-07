import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { YTPlaylist } from '../types';
import { theme } from '../theme';

export function PlaylistCard({
  playlist,
  onPress,
}: {
  playlist: YTPlaylist;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      {playlist.thumbnailHigh || playlist.thumbnail ? (
        <Image
          source={{ uri: playlist.thumbnailHigh || playlist.thumbnail }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="musical-notes" size={40} color={theme.colors.muted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {playlist.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {playlist.channelTitle}
        </Text>
        {playlist.itemCount > 0 && (
          <Text style={styles.count}>{playlist.itemCount} tracks</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 158,
    marginRight: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.75,
  },
  image: {
    width: 158,
    height: 158,
    backgroundColor: theme.colors.panel,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 10,
    paddingBottom: 12,
    gap: 3,
  },
  title: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 11,
  },
  count: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
