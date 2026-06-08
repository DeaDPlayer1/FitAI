import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotFound() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={styles.container}>
      <Feather name="map-pin" size={64} color="#8B5CF6" />
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page Not Found</Text>
      <Text style={styles.message}>The page you're looking for doesn't exist.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
        <Feather name="home" size={16} color="white" />
        <Text style={styles.buttonText}>Go Home</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  code: { fontSize: 72, fontWeight: '800', color: '#A78BFA', letterSpacing: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#C4B5FD' },
  message: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 16 },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(139,92,246,0.3)' },
  buttonText: { fontSize: 15, fontWeight: '600', color: 'white' },
});
