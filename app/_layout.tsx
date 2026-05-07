import { Slot, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicProvider, useMusic } from '../src/store/player-store';
import { PlayerEngine } from '../src/player/PlayerEngine';
import { PLAYER_BAR_HEIGHT, PlayerBar } from '../src/components/PlayerBar';
import { theme } from '../src/theme';
import { TAB_BAR_HEIGHT } from './(tabs)/_layout';

function RootShell() {
  const insets = useSafeAreaInsets();
  const { toast, hasActiveMedia } = useMusic();
  const segments = useSegments();
  const inTabsGroup = segments[0] === '(tabs)';
  const onFullPlayerRoute = segments[0] === 'player';
  const showGlobalPlayerBar = hasActiveMedia && !onFullPlayerRoute;
  // Tab bar uses paddingBottom: Math.max(insets.bottom, 8) internally, so the real
  // rendered height is TAB_BAR_HEIGHT + Math.max(insets.bottom, 8), not just + insets.bottom.
  const tabBarOffset = inTabsGroup ? Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT : insets.bottom;
  const contentBottomPad = !inTabsGroup && hasActiveMedia ? PLAYER_BAR_HEIGHT + insets.bottom : 0;
  const toastBottom = tabBarOffset + (showGlobalPlayerBar ? PLAYER_BAR_HEIGHT + 16 : 16);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" translucent />
      <PlayerEngine />
      <View style={[styles.content, { paddingBottom: contentBottomPad }]}>
        <Slot />
      </View>
      {showGlobalPlayerBar && (
        <View style={[styles.playerOverlay, { bottom: tabBarOffset }]}>
          <PlayerBar />
        </View>
      )}
      {!!toast && (
        <View
          style={[styles.toastWrap, { bottom: toastBottom }]}
          pointerEvents="none"
        >
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <MusicProvider>
        <RootShell />
      </MusicProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
  },
  playerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  toastWrap: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(28,28,28,0.97)',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
