import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  Easing,
  interpolate,
  FadeIn
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useWorkoutStore } from '@/store/workoutStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { groqChatRaw } from '@/lib/groq';
import { checkRateLimit, recordRequest, validateAIResponse, getRemainingDaily } from '@/lib/aiRateLimiter';
import { AI_TRAINER_SYSTEM_PROMPT } from '@/constants/aiTrainerSystemPrompt';
import { FadeInView } from '@/components/ui/FadeInView';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { TypingIndicator } from '@/components/ui/TypingIndicator';

const stripJson = (text: string) => text.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').trim();

const SUGGESTION_CHIPS: { label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { label: 'Create a workout plan', icon: 'zap' },
  { label: 'Review my nutrition', icon: 'pie-chart' },
  { label: 'Help me lose weight', icon: 'trending-down' },
  { label: 'Improve my strength', icon: 'award' },
];

const SuggestionChips = React.memo(({ onSelect }: { onSelect: (text: string) => void }) => {
  return (
    <View style={styles.chipsGrid}>
      {SUGGESTION_CHIPS.map((chip) => (
        <Pressable
          key={chip.label}
          style={styles.chip}
          onPress={() => onSelect(chip.label)}
        >
          <Feather name={chip.icon} size={14} color={theme.colors.accent.brand} />
          <Text style={styles.chipText}>{chip.label}</Text>
        </Pressable>
      ))}
    </View>
  );
});
SuggestionChips.displayName = 'SuggestionChips';

const typedIdsRef = new Set<string>();
let pendingRequest = false;

export default function PulseAIScreen() {
  const { user } = useUserStore();
  const { coachChatHistory = [], addChatMessage } = useWorkoutStore();
  const { calorieGoal, getTotalCalories, getTotalProtein, getTotalCarbs, getTotalFats, todayFoodLogs } = useNutritionStore();
  const { days: splitDays } = useSplitBuilderStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const typedMessageIds = useRef<Set<string>>(typedIdsRef);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerProgress = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const toggleDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = drawerOpen ? 0 : 1;
    drawerProgress.value = withSpring(toValue, { damping: 20, stiffness: 150 });
    setDrawerOpen(!drawerOpen);
  };

  const handleSend = async (overrideMsg?: string) => {
    const raw = overrideMsg ?? input;
    if (!raw.trim() || loading) return;
    if (pendingRequest) return;
    pendingRequest = true;

    // Rate limiting check
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      addChatMessage({ role: 'assistant', content: `⏳ ${rateCheck.reason}` });
      return;
    }

    const userMsg = raw.trim();
    setInput('');
    addChatMessage({ role: 'user', content: userMsg });

    setLoading(true);
    try {
      const consumedCalories = getTotalCalories?.() || 0;
      const consumedProtein = getTotalProtein?.() || 0;
      const consumedCarbs = getTotalCarbs?.() || 0;
      const consumedFats = getTotalFats?.() || 0;

      const mealsLogged = todayFoodLogs?.length || 0;

      const activeSplitDays = (splitDays || []).filter(d => !d.isRest && d.workoutName?.trim());
      const splitSummary = activeSplitDays.length > 0
        ? activeSplitDays.map(d => `${d.dayName}: ${d.workoutName}`).join(' | ')
        : 'No active split configured';

      const conditionGuidance = user?.health_profile?.conditions?.length > 0
        ? `\nCONDITION-SPECIFIC GUIDANCE REQUIRED:\nThe user has ${user.health_profile.conditions.join(', ')}.\nEvery response MUST consider these conditions. Adapt ALL advice accordingly.\n- Avoid generic fitness advice that ignores their health context.\n- NEVER recommend anything contraindicated for their conditions.\n- ALWAYS include a brief safety note when relevant.`
        : '';

      const systemContext = `${AI_TRAINER_SYSTEM_PROMPT}

CURRENT USER PROFILE:
- Name: ${user?.name || 'User'}
- Goal: ${user?.health_profile?.goal || 'Not set'}
- Conditions: ${user?.health_profile?.conditions?.join(', ') || 'None reported'}
- Age: ${user?.health_profile?.age || 'Unknown'}
- Weight: ${user?.health_profile?.weight || 'Unknown'}${user?.health_profile?.weightUnit || 'kg'}
- Experience: Based on profile and conversation context${conditionGuidance}

DAILY NUTRITION STATUS:
- Calorie goal: ${calorieGoal || 1800} kcal
- Consumed: ${consumedCalories} kcal (${calorieGoal > 0 ? Math.round(consumedCalories / calorieGoal * 100) : 0}% of goal)
- Protein: ${consumedProtein}g
- Carbs: ${consumedCarbs}g
- Fat: ${consumedFats}g
- Meals logged today: ${mealsLogged}

WORKOUT SPLIT:
${splitSummary}

You are Pulse AI — an elite fitness coach, nutrition advisor, and recovery specialist.
Focus strictly on world-class conversational coaching, analysis, and accountability.
Use the user's name naturally. Reference their goals and conditions.
Be science-based, premium, supportive, and non-judgmental.`;

      const response = await groqChatRaw(
        [
          { role: 'system', content: systemContext },
          ...(coachChatHistory || []).slice(-15).map(m => ({ role: (m?.role || 'user') as any, content: m?.content || '' })),
          { role: 'user', content: userMsg }
        ],
        'llama-3.3-70b-versatile'
      );
      
      // Record successful request
      recordRequest();
      
      // Validate AI response for safety
      const conditions = user?.health_profile?.conditions || [];
      const validation = validateAIResponse(response, conditions);
      let safeResponse = response;
      if (!validation.safe || validation.warnings.length > 0) {
        const warnings = validation.warnings
          .filter(w => w.severity === 'high' || w.severity === 'critical')
          .map(w => `⚠️ ${w.message}`);
        if (warnings.length > 0) {
          safeResponse = response + '\n\n---\n⚠️ **Safety Note**:\n' + warnings.join('\n');
        }
      }
      
      addChatMessage({ role: 'assistant', content: safeResponse });
    } catch (e: any) {
      const errMsg = e?.message || '';
      if (errMsg.includes('EXPO_PUBLIC_GROQ_API_KEY') || errMsg.includes('API key')) {
        addChatMessage({ role: 'assistant', content: '⚠️ **Configuration Required**: The AI service API key is missing. Please add `EXPO_PUBLIC_GROQ_API_KEY` to your `.env` file and restart the app.' });
      } else if (errMsg.includes('rate limit') || errMsg.includes('429')) {
        addChatMessage({ role: 'assistant', content: '⏳ **Rate limit reached**. Please wait a moment and try again.' });
      } else {
        addChatMessage({ role: 'assistant', content: `I encountered an issue: ${errMsg || 'Please try again.'}` });
      }
    } finally {
      setLoading(false);
      pendingRequest = false;
    }
  };

  // Drawer Animations
  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(drawerProgress.value, [0, 1], [-300, 0]) }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drawerProgress.value, [0, 1], [0, 0.5]),
    pointerEvents: drawerOpen ? 'auto' : 'none',
  }));

  const processedMessages = useMemo(() =>
    coachChatHistory.map((msg, i) => {
      const msgId = msg.id || `msg-${i}`;
      const isLast = i === coachChatHistory.length - 1;
      const isAssistant = msg.role === 'assistant';
      const cleanText = stripJson(msg.content?.toString() || '');
      const shouldType = isLast && isAssistant && !typedMessageIds.current.has(msgId);
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { ...msg, msgId, isLast, isAssistant, cleanText, shouldType, timestamp, index: i };
    }),
    [coachChatHistory]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Drawer Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleDrawer} />
      </Animated.View>

      {/* Sidebar Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Chat History</Text>
            <TouchableOpacity onPress={toggleDrawer}>
              <Feather name="x" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.drawerContent}>
            <TouchableOpacity style={styles.historyItemActive}>
              <Feather name="message-square" size={18} color={theme.colors.accent.brand} />
              <View>
                <Text style={styles.historyItemTextActive}>Current Session</Text>
                <Text style={styles.historyItemTime}>Active now</Text>
              </View>
            </TouchableOpacity>
            
            {/* Future history items can be mapped here */}
            <TouchableOpacity style={styles.historyItem}>
              <Feather name="message-square" size={18} color={theme.colors.text.muted} />
              <View>
                <Text style={styles.historyItemText}>Weekly Review</Text>
                <Text style={styles.historyItemTime}>Yesterday</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.historyItem}>
              <Feather name="message-square" size={18} color={theme.colors.text.muted} />
              <View>
                <Text style={styles.historyItemText}>Diet Adjustments</Text>
                <Text style={styles.historyItemTime}>3 days ago</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity style={styles.newChatBtn}>
            <Feather name="plus" size={20} color="white" />
            <Text style={styles.newChatText}>New Conversation</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer} style={styles.menuIcon}>
          <Feather name="menu" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Pulse AI</Text>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.headerModelLabel}>Llama 3.3 · 70B</Text>
        </View>

        <TouchableOpacity style={styles.menuIcon} onPress={() => {
          if (coachChatHistory.length > 0) {
            useWorkoutStore.getState().clearChat();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}>
          <Feather name="more-horizontal" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatScroll}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS === 'android'}
        >
          {coachChatHistory.length <= 1 && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.emptyCoach}>
              <View style={styles.emptyIconCircle}>
                <Feather name="cpu" size={40} color={theme.colors.accent.brand} />
              </View>
              <Text style={styles.emptyTitle}>Meet Pulse AI</Text>
              <Text style={styles.emptySub}>Your elite fitness and nutrition architect. Ask me anything to elevate your training.</Text>

              {/* Quick suggestion chips */}
              <SuggestionChips onSelect={(text) => {
                setInput(text);
                setTimeout(() => handleSend(text), 50);
              }} />
            </Animated.View>
          )}

          {processedMessages.map((msg) => (
            <FadeInView key={msg.msgId} delay={msg.index * 20}>
              <View style={[styles.msgWrapper, msg.role === 'user' ? styles.userMsg : styles.aiMsg]}>
                {msg.isAssistant && (
                  <View style={styles.aiAvatar}>
                    <Feather name="cpu" size={14} color="white" />
                  </View>
                )}
                <View style={styles.bubbleColumn}>
                  <View style={[styles.msgBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                    {msg.shouldType ? (
                      <TypewriterText 
                        text={msg.cleanText}
                        style={[styles.msgText, styles.aiMsgText]}
                        onComplete={() => { typedMessageIds.current.add(msg.msgId); }}
                      />
                    ) : (
                      <Text style={[styles.msgText, msg.role === 'user' ? styles.userMsgText : styles.aiMsgText]}>
                        {msg.cleanText}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.msgTimestamp, msg.role === 'user' && styles.msgTimestampUser]}>
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            </FadeInView>
          ))}
          {coachChatHistory.length > 1 && !loading && (
            <TouchableOpacity
              style={styles.suggestionsToggle}
              onPress={() => {
                useWorkoutStore.getState().clearChat();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="refresh-cw" size={14} color={theme.colors.accent.brand} />
              <Text style={styles.suggestionsToggleText}>Show suggestions</Text>
            </TouchableOpacity>
          )}
          {loading && (
            <View style={[styles.msgWrapper, styles.aiMsg]}>
               <View style={styles.aiAvatar}>
                  <Feather name="cpu" size={14} color="white" />
                </View>
              <View style={[styles.msgBubble, styles.aiBubble, { paddingVertical: 18, paddingHorizontal: 24 }]}>
                <TypingIndicator />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputWrapper, keyboardVisible && styles.inputWrapperKeyboard]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Message Pulse AI..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <Feather name="arrow-up" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
    shadowOpacity: 0.05,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerModelLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: 2,
  },

  // Chat Area
  chatArea: { flex: 1 },
  chatScroll: { padding: 16, paddingBottom: 120 },
  msgWrapper: { marginBottom: 20, maxWidth: '85%', flexDirection: 'row', alignItems: 'flex-end' },
  bubbleColumn: { flex: 1 },
  msgTimestamp: { fontSize: 11, color: '#9CA3AF', marginTop: 4, marginLeft: 4 },
  msgTimestampUser: { textAlign: 'right', marginRight: 4 },
  userMsg: { alignSelf: 'flex-end' },
  aiMsg: { alignSelf: 'flex-start' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  msgBubble: { padding: 16, borderRadius: 20 },
  userBubble: { 
    backgroundColor: '#111827', 
    borderBottomRightRadius: 6,
  },
  aiBubble: { 
    backgroundColor: 'white', 
    borderBottomLeftRadius: 6,
    borderTopLeftRadius: 6,
    ...theme.shadow.card,
    shadowOpacity: 0.03,
  },
  msgText: { fontSize: 16, lineHeight: 24 },
  userMsgText: { color: 'white' },
  aiMsgText: { color: '#374151' },

  // Empty State
  emptyCoach: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...theme.shadow.premium, shadowOpacity: 0.1 },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12 },
  emptySub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  // Suggestion chips
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 32, justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    maxWidth: 180,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151', flexShrink: 1 },
  suggestionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  suggestionsToggleText: {
    fontSize: 13,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.accent.brand,
  },

  // Input
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // accommodate custom Tab Bar
    backgroundColor: '#F9FAFB',
  },
  inputWrapperKeyboard: { paddingBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: { 
    flex: 1, 
    paddingHorizontal: 16, 
    maxHeight: 120, 
    minHeight: 44, 
    fontSize: 16, 
    color: '#111827' 
  },
  sendBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#111827', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sendBtnDisabled: { opacity: 0.3 },

  // Drawer
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: 'white',
    zIndex: 101,
    ...theme.shadow.hero,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  drawerContent: {
    flex: 1,
    padding: 16,
  },
  historyItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.accent.lavender + '15',
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.accent.brand + '30',
  },
  historyItemTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.accent.brand,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  historyItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  historyItemTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    margin: 20,
    padding: 16,
    borderRadius: 20,
    gap: 8,
    ...theme.shadow.button,
  },
  newChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
