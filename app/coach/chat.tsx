import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { SlideInLeft, SlideInRight, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { StreamingText, type ThinkingStage } from '@/components/ui/StreamingText';
import { useLiveContextStore } from '@/store/liveContextStore';
import { supabase } from '@/lib/supabase';
import { getCoachResponse, buildCoachContext } from '@/lib/aiTrainer';

type Message = { id: string; role: 'coach' | 'user'; content: string; stages?: ThinkingStage[] };

const THINKING_STAGES: ThinkingStage[] = [
  { label: 'Reviewing your data', duration: 300 },
  { label: 'Analyzing context', duration: 250 },
  { label: 'Generating response', duration: 400 },
];

function CoachBubble({ message }: { message: Message }) {
  const [done, setDone] = useState(false);
  return (
    <Animated.View entering={SlideInLeft.duration(300).springify()} style={styles.coachBubble}>
      <View style={styles.coachDotOuter}><View style={styles.coachDotInner} /></View>
      {message.stages && !done ? (
        <StreamingText
          text={message.content}
          stages={message.stages}
          onComplete={() => setDone(true)}
          textStyle={styles.coachText}
        />
      ) : (
        <Text style={styles.coachText}>{message.content}</Text>
      )}
    </Animated.View>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <Animated.View entering={SlideInRight.duration(250).springify()} style={styles.userBubble}>
      <Text style={styles.userText}>{message.content}</Text>
    </Animated.View>
  );
}

export default function CoachChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const updateCoach = useLiveContextStore((s) => s.updateCoach);

  const addMsg = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const initialize = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) return;

    const today = new Date();
    const startToday = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const [meals, workouts] = await Promise.all([
      supabase.from('meal_logs').select('calories, protein_g').eq('user_id', user.id).gte('logged_at', startToday).lte('logged_at', new Date().toISOString()),
      supabase.from('workout_logs').select('focus, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1),
    ]);

    const mealData = meals.data || [];
    const calories = mealData.reduce((s, m) => s + (m.calories || 0), 0);
    const protein = mealData.reduce((s, m) => s + (m.protein_g || 0), 0);
    const recentWorkout = (workouts.data || [])[0];
    const lastSession = recentWorkout
      ? `Your last logged session was ${recentWorkout.focus || 'a workout'}. `
      : '';

    const openers = [
      `${lastSession}How are you feeling today — physically and mentally ready to train?`,
      `${lastSession}What's on your mind today? Any training, recovery, or nutrition questions?`,
      `${lastSession}How's everything going? Any wins or struggles since we last checked in?`,
    ];
    const opener = openers[Math.floor(Math.random() * openers.length)];

    updateCoach({ lastWorkoutSummary: recentWorkout?.focus || '' });

    addMsg({
      id: 'init',
      role: 'coach',
      content: opener,
      stages: THINKING_STAGES,
    });
    setInitialized(true);
  }, [addMsg, updateCoach]);

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addMsg({ id: `u-${Date.now()}`, role: 'user', content: text });
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single();

      const chatHistory = messages
        .filter(m => m.role === 'user' || m.role === 'coach')
        .slice(-10)
        .map(m => ({ role: m.role === 'coach' ? 'assistant' as const : 'user' as const, content: m.content }));

      if (profile && user) {
        const response = await getCoachResponse(text, {
          profile: {
            goal: profile.goal || 'general',
            conditions: profile.health_conditions || [],
            age: profile.age,
            weight: profile.weight_kg,
            weightUnit: 'kg',
            height: profile.height_cm,
            heightUnit: 'cm',
            experience_level: profile.experience_level,
            activity_level: profile.activity_level,
            available_days: profile.available_days,
            equipment: profile.equipment,
            diet_type: profile.diet_type,
            injuries: profile.injuries,
            sleep_hours: profile.sleep_hours,
            stress_level: profile.stress_level,
            cardio_preference: profile.cardio_preference,
            gender: null, targetWeight: null,
          },
          name: profile.full_name,
          userId: user.id,
        }, chatHistory);

        addMsg({
          id: `c-${Date.now()}`,
          role: 'coach',
          content: response.content,
          stages: THINKING_STAGES,
        });
      }
    } catch (e: any) {
      console.error('Coach error:', e);
      addMsg({ id: `c-${Date.now()}`, role: 'coach', content: "I hit a snag processing that. Can you rephrase?" });
    }

    setLoading(false);
  }, [input, loading, messages, addMsg]);

  return (
    <LinearGradient colors={['#1E1B4B', '#312E81', '#4C1D95']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
              <Feather name="arrow-left" size={20} color="#F5F5F5" />
            </TouchableOpacity>
            <View style={styles.statusDot} />
            <Text style={styles.headerTitle}>AI Coach</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scrollRef} style={styles.chatList} contentContainerStyle={styles.chatContent}>
            {messages.map((m) =>
              m.role === 'coach'
                ? <CoachBubble key={m.id} message={m} />
                : <UserBubble key={m.id} message={m} />
            )}
            {loading && (
              <Animated.View entering={FadeIn} style={styles.typingBubble}>
                {[0, 1, 2].map(i => <View key={i} style={styles.typingDot} />)}
              </Animated.View>
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your message..."
                placeholderTextColor={theme.colors.text.muted}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnInactive]}
                onPress={handleSend}
                disabled={!input.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="arrow-up" size={20} color={input.trim() ? '#FFFFFF' : theme.colors.text.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(196,181,253,0.2)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#F5F5F5' },
  chatList: { flex: 1 },
  chatContent: { padding: 16, gap: 12, paddingBottom: 20 },
  coachBubble: { alignSelf: 'flex-start', maxWidth: '80%', backgroundColor: 'rgba(249,250,251,0.08)', borderWidth: 1, borderColor: 'rgba(249,250,251,0.12)', borderRadius: 16, padding: 14, paddingLeft: 20 },
  coachDotOuter: { position: 'absolute', top: 12, left: -10, width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(139,92,246,0.2)', alignItems: 'center', justifyContent: 'center' },
  coachDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6' },
  coachText: { fontSize: 15, color: '#F5F5F5', lineHeight: 22 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '75%', backgroundColor: '#8B5CF6', borderRadius: 16, padding: 14 },
  userText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
  typingBubble: { alignSelf: 'flex-start', flexDirection: 'row', gap: 4, backgroundColor: 'rgba(249,250,251,0.08)', borderRadius: 16, padding: 14 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' },
  inputBar: { borderTopWidth: 1, borderTopColor: 'rgba(139,92,246,0.15)', padding: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  textInput: { flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: 'rgba(249,250,251,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#F5F5F5' },
  sendBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  sendBtnInactive: { backgroundColor: 'rgba(249,250,251,0.08)' },
});
