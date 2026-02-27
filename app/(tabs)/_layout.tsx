import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { COLORS, FONTS } from '../../src/constants/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2, paddingTop: 6 }}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text
        style={{
          fontFamily: FONTS.uiMedium,
          fontSize: 9,
          color: focused ? COLORS.primary : COLORS.textLight,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.divider,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="✨" label="Today" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📖" label="Browse" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎧" label="Listen" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🕒" label="History" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙️" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
