import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { YTVideo } from '../types';
import { theme } from '../theme';

type Props = {
  track: YTVideo;
  index: number;
  active: boolean;
  liked: boolean;
  onPress: () => void;
  onLike: () => void;
  onAdd: () => void;
  onRemove?: () => void;
};

export function TrackRow({ track, index, active, liked, onPress, onLike, onAdd, onRemove }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        active && styles.rowActive,
        pressed && !active && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.indexWrap}>
        {active ? (
          <Ionicons name="musical-note" size={13} color={theme.colors.accent} />
        ) : (
          <Text style={styles.index}>{index + 1}</Text>
        )}
      </View>

      <Image source={{ uri: track.thumbnail }} style={styles.thumb} />

      <View style={styles.info}>
        <Text style={[styles.title, active && styles.titleActive]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {track.channelTitle}
          {track.durationFormatted ? `  ·  ${track.durationFormatted}` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onLike} hitSlop={10}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={18}
            color={liked ? theme.colors.accent : theme.colors.muted}
          />
        </Pressable>
        <Pressable onPress={onAdd} hitSlop={10}>
          <Ionicons name="add" size={20} color={theme.colors.muted} />
        </Pressable>
        {onRemove && (
          <Pressable onPress={onRemove} hitSlop={10}>
            <Ionicons name="close" size={18} color={theme.colors.muted} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: theme.radius.md,
    gap: 10,
  },
  rowActive: {
    backgroundColor: theme.colors.cardActive,
  },
  rowPressed: {
    backgroundColor: theme.colors.card,
  },
  indexWrap: {
    width: 22,
    alignItems: 'center',
  },
  index: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  titleActive: {
    color: theme.colors.accent,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
});
