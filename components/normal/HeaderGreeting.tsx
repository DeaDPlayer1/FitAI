import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

interface Props {
  name: string | null;
}

export default function HeaderGreeting({ name }: Props) {
  const firstName = useMemo(() => name?.split(' ')[0] || 'User', [name]);
  const initials = useMemo(() => getInitials(name || 'User'), [name]);
  const greeting = useMemo(() => getGreeting(), []);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>{greeting} 👋</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textBlock: {
    marginLeft: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 1,
  },
});
