import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerBar } from '../../src/components/PlayerBar';
import { theme } from '../../src/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { label: string; active: IoniconName; inactive: IoniconName }> = {
  index:     { label: 'Home',    active: 'home',     inactive: 'home-outline' },
  search:    { label: 'Search',  active: 'search',   inactive: 'search-outline' },
  playlists: { label: 'Library', active: 'library',  inactive: 'library-outline' },
  liked:     { label: 'Liked',   active: 'heart',    inactive: 'heart-outline' },
  profile:   { label: 'You',     active: 'person',   inactive: 'person-outline' },
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <PlayerBar />
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const cfg = TAB_CONFIG[route.name] ?? TAB_CONFIG.index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: true }}
            >
              <Ionicons
                name={isFocused ? cfg.active : cfg.inactive}
                size={22}
                color={isFocused ? theme.colors.accent : theme.colors.muted}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="playlists" />
      <Tabs.Screen name="liked" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.panel,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.panel,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 3,
  },
  tabLabel: {
    color: theme.colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: theme.colors.accent,
  },
});
