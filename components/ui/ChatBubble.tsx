import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { TypewriterText } from './TypewriterText';
import { MarkdownText } from './MarkdownText';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
  onTypeComplete?: () => void;
  timestamp?: string;
}



function parseChecklistItems(text: string): { lines: { text: string; checked: boolean }[]; hasChecklist: boolean } {
  const lines = text.split('\n');
  const items = lines.map(line => {
    if (/^[-•*]\s+\[([ xX])\]/.test(line) || /^[-•*]\s+(✅|☑️|✔️)/.test(line)) {
      const checked = line.includes('[x]') || line.includes('[X]') || line.includes('✅') || line.includes('☑️') || line.includes('✔️');
      return { text: line.replace(/^[-•*]\s+(\[[ xX]\]|✅|☑️|✔️)\s*/, ''), checked };
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ') || line.trim().startsWith('* ')) {
      return { text: line.replace(/^[-•*]\s*/, ''), checked: false };
    }
    return { text: line, checked: false };
  });
  const hasChecklist = text.includes('- [') || text.includes('✅') || text.includes('☑️');
  return { lines: items, hasChecklist };
}

function UserInitials({ name }: { name: string }) {
  const initials = name
    ?.split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';
  return (
    <View style={styles.userAvatar}>
      <Text style={styles.userAvatarText}>{initials}</Text>
    </View>
  );
}

export function ChatBubble({ role, content, isTyping, onTypeComplete, timestamp }: ChatBubbleProps) {
  const { lines, hasChecklist } = parseChecklistItems(content);

  if (role === 'user') {
    return (
      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.userWrapper}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{content}</Text>
        </View>
        <View style={styles.userFooter}>
          <Text style={styles.timestamp}>{timestamp || ''}</Text>
          <UserInitials name="" />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.aiWrapper}>
      <View style={styles.aiAvatarSmall}>
        <Text style={styles.aiAvatarText}>P</Text>
      </View>
      <View style={styles.aiColumn}>
        <LinearGradient
          colors={['#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiBubble}
        >
          {isTyping ? (
            <TypewriterText
              text={content}
              style={styles.aiText}
              onComplete={onTypeComplete}
            />
          ) : hasChecklist ? (
            <View style={styles.checklist}>
              {lines.map((line, i) => {
                if (line.text.match(/^[-•*]/)) {
                  return (
                    <View key={i} style={styles.checkItem}>
                      <View style={styles.checkDot}>
                        <Feather name="check" size={10} color="white" />
                      </View>
                      <Text style={styles.checkText}>{line.text.replace(/^[-•*]\s*/, '')}</Text>
                    </View>
                  );
                }
                if (line.text.trim() === '') return <View key={i} style={{ height: 4 }} />;
                return (
                  <Text key={i} style={styles.aiText}>{line.text}</Text>
                );
              })}
            </View>
          ) : (
            <MarkdownText content={content} />
          )}
        </LinearGradient>
        {timestamp && <Text style={styles.aiTimestamp}>{timestamp}</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  userWrapper: {
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: '88%',
    alignSelf: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  userFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  userAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.accent.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
  },
  aiWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: '88%',
    alignSelf: 'flex-start',
  },
  aiAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  aiAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
  },
  aiColumn: {
    flex: 1,
  },
  aiBubble: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
  },
  aiText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
  },
  checklist: {
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
    flex: 1,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  aiTimestamp: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 4,
    marginLeft: 32,
  },
});
