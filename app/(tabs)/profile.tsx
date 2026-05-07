import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMusic } from '../../src/store/player-store';
import { theme } from '../../src/theme';

type StatCardProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number | string;
};

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={20} color={theme.colors.accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { likedSongs, userPlaylists, queue, current } = useMusic();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={theme.colors.muted} />
        </View>
        <Text style={styles.name}>My Profile</Text>
        <Text style={styles.subtitle}>Music listener</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="heart" label="Liked Songs" value={likedSongs.length} />
        <StatCard icon="library" label="Playlists" value={userPlaylists.length} />
        <StatCard icon="list" label="Queue Size" value={queue.length} />
        <StatCard icon="musical-note" label="Playing" value={current ? '▶' : '—'} />
      </View>

      {/* Now playing section */}
      {current && (
        <View style={styles.nowPlaying}>
          <Text style={styles.sectionTitle}>Now Playing</Text>
          <View style={styles.nowPlayingCard}>
            <Ionicons name="musical-note" size={20} color={theme.colors.accent} />
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>{current.title}</Text>
              <Text style={styles.nowPlayingMeta} numberOfLines={1}>{current.channelTitle}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Info cards */}
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="logo-youtube" size={18} color={theme.colors.accent} />
          <Text style={styles.infoText}>Powered by YouTube Music API</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="save-outline" size={18} color={theme.colors.mutedLight} />
          <Text style={styles.infoText}>Likes & playlists saved locally</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="shuffle-outline" size={18} color={theme.colors.mutedLight} />
          <Text style={styles.infoText}>Shuffle & repeat supported</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  name: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  nowPlaying: {
    marginBottom: 28,
  },
  nowPlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.accentDim,
  },
  nowPlayingInfo: {
    flex: 1,
    gap: 3,
  },
  nowPlayingTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  nowPlayingMeta: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 10,
  },
});
