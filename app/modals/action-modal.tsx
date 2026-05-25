import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

const BlurViewIOS: null | React.ComponentType<any> =
  Platform.OS === 'ios' ? require('expo-blur').BlurView : null;

const { height } = Dimensions.get('window');

const ACTIONS = [
  {
    id: 'food',
    title: 'Log Nutrition',
    subtitle: 'Track meals and macros',
    icon: 'coffee',
    color: theme.colors.accent.orange,
    route: '/modals/log-food',
  },
  {
    id: 'weight',
    title: 'Track Weight',
    subtitle: 'Log body weight and metrics',
    icon: 'activity',
    color: theme.colors.accent.blue,
    route: '/modals/log-weight',
  },
];

export default function ActionModal() {
  const router = useRouter();

  const handleAction = (action: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (action.route) {
      router.dismiss();
      router.push(action.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={() => router.back()}>
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)} 
          style={StyleSheet.absoluteFill}
        >
          {BlurViewIOS ? (
            <BlurViewIOS intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.androidBackdrop]} />
          )}
        </Animated.View>
      </Pressable>

      <Animated.View 
        entering={SlideInDown.springify().damping(18).stiffness(150)} 
        exiting={SlideOutDown.duration(200)} 
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          
          <View style={styles.menuContainer}>
            {ACTIONS.map((action, i) => (
              <Animated.View 
                key={action.id} 
                entering={FadeIn.delay(100 + i * 100).springify()}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.actionItem,
                    pressed && styles.actionItemPressed
                  ]}
                  onPress={() => handleAction(action)}
                >
                  <View style={[styles.iconBox, { backgroundColor: action.color + '15' }]}>
                    <Feather name={action.icon as any} size={22} color={action.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colors.text.disabled} />
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Pressable 
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text style={styles.closeBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  sheetWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheet: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 32,
    padding: 24,
    ...theme.shadow.premium,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  menuContainer: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionItemPressed: {
    backgroundColor: '#F3F4F6',
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSubtitle: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  closeBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  closeBtnPressed: {
    backgroundColor: '#E5E7EB',
  },
  closeBtnText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '700',
  },
});
