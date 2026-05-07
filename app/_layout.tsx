import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicProvider, useMusic } from '../src/store/player-store';
import { PlayerEngine } from '../src/player/PlayerEngine';
import { theme } from '../src/theme';

function RootShell() {
  const insets = useSafeAreaInsets();
  const { toast } = useMusic();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" translucent />
      <PlayerEngine />
      <View style={styles.content}>
        <Slot />
      </View>
      {!!toast && (
        <View
          style={[styles.toastWrap, { bottom: insets.bottom + 140 }]}
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
