import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import Card from '@/components/ui/Card';
import { useUserStore } from '@/store/userStore';
import { signOutUser } from '@/lib/auth';
import { theme } from '@/constants/theme';

const SettingRow = ({ 
  icon, 
  title, 
  value, 
  onPress, 
  iconBg = '#F3F4F6', 
  iconColor = theme.colors.text.secondary, 
  isLast = false, 
  isDestructive = false,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
}: any) => (
  <View>
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={isSwitch ? undefined : onPress} 
      activeOpacity={isSwitch ? 1 : 0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={20} color={isDestructive ? 'white' : iconColor} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, isDestructive && { color: theme.colors.status.danger }]}>{title}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      
      {isSwitch ? (
        <Switch 
          value={switchValue} 
          onValueChange={onSwitchChange}
          trackColor={{ false: '#E5E7EB', true: theme.colors.accent.brand }}
        />
      ) : (
        <Feather name="chevron-right" size={18} color={theme.colors.text.muted} />
      )}
    </TouchableOpacity>
    {!isLast && <View style={styles.innerDivider} />}
  </View>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useUserStore();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Logout', 
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
            router.replace('/(auth)/login');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Account Section */}
        <Text style={styles.groupLabel}>ACCOUNT</Text>
        <Card style={styles.settingsCard} padding={0}>
          <SettingRow 
            icon="user" 
            title="Edit Profile" 
            value={user?.name || 'User'}
            onPress={() => router.push('/modals/edit-settings')}
          />
          <SettingRow 
            icon="lock" 
            title="Privacy & Security" 
            isLast={true}
          />
        </Card>

        {/* Health Integrations Section */}
        <Text style={styles.groupLabel}>HEALTH INTEGRATIONS</Text>
        <Card style={styles.settingsCard} padding={0}>
          <SettingRow 
            icon="activity" 
            title="Apple Health" 
            value="Connected"
            iconBg="rgba(255, 59, 48, 0.1)"
            iconColor="#FF3B30"
            isSwitch
            switchValue={true}
          />
          <SettingRow 
            icon="heart" 
            title="Google Fit" 
            value="Not connected"
            iconBg="rgba(66, 133, 244, 0.1)"
            iconColor="#4285F4"
            isSwitch
            switchValue={false}
          />
          <SettingRow 
            icon="watch" 
            title="Garmin Connect" 
            value="Not connected"
            iconBg="rgba(0, 124, 195, 0.1)"
            iconColor="#007CC3"
            isSwitch
            switchValue={false}
            isLast={true}
          />
        </Card>

        {/* Pulse AI Settings */}
        <Text style={styles.groupLabel}>PULSE AI</Text>
        <Card style={styles.settingsCard} padding={0}>
          <SettingRow 
            icon="cpu" 
            title="AI Coaching Style" 
            value="Hypertrophy Focused" 
            iconBg={theme.colors.accent.lavender + '30'}
            iconColor={theme.colors.accent.brand}
          />
          <SettingRow 
            icon="mic" 
            title="Voice Feedback" 
            value="Enabled during workouts"
            isLast={true}
          />
        </Card>

        {/* Preferences */}
        <Text style={styles.groupLabel}>PREFERENCES</Text>
        <Card style={styles.settingsCard} padding={0}>
          <SettingRow 
            icon="bell" 
            title="Notifications" 
            value="All enabled" 
          />
          <SettingRow 
            icon="moon" 
            title="Dark Mode" 
            value="System default" 
            isLast={true}
          />
        </Card>

        {/* Support & Logout */}
        <Text style={styles.groupLabel}>SUPPORT</Text>
        <Card style={styles.settingsCard} padding={0}>
          <SettingRow 
            icon="help-circle" 
            title="Help Center" 
          />
          <SettingRow 
            icon="message-square" 
            title="Contact Support" 
          />
          <SettingRow 
            icon="log-out" 
            title="Sign Out" 
            onPress={handleSignOut}
            iconBg={theme.colors.status.danger}
            iconColor="white"
            isDestructive={true}
            isLast={true}
          />
        </Card>

        <Text style={styles.version}>Pulse Fitness v2.0.0 (Premium)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 60, paddingTop: 12 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    ...theme.shadow.card,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: '#111827',
  },

  groupLabel: { 
    fontSize: 12, 
    fontFamily: theme.font.family.bold, 
    color: theme.colors.text.muted, 
    letterSpacing: 1.2, 
    marginBottom: 12, 
    marginTop: 8,
    paddingLeft: 4 
  },
  settingsCard: { marginBottom: 24, overflow: 'hidden', backgroundColor: 'white' },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, fontFamily: theme.font.family.semibold, color: '#111827' },
  settingValue: { fontSize: 13, fontFamily: theme.font.family.medium, color: theme.colors.text.muted, marginTop: 4 },
  innerDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 72 },
  version: { fontSize: 13, fontFamily: theme.font.family.medium, color: theme.colors.text.muted, textAlign: 'center', marginTop: 12 },
});
