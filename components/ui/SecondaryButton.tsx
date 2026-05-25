import React from 'react';
import { 
  Text, 
  StyleSheet, 
  Animated,
  Pressable,
  View
} from 'react-native';
import { theme } from '../../constants/theme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ 
  label, 
  onPress, 
  disabled,
  style 
}) => {
  const scale = new Animated.Value(1);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.container,
        style,
        disabled && styles.disabled
      ]}
    >
      <Animated.View style={{ transform: [{ scale }], width: '100%', height: '100%' }}>
        <View style={styles.inner}>
          <Text style={styles.text}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 52,
    borderRadius: theme.RADIUS.pill,
    borderWidth: 1.5,
    borderColor: theme.COLORS.primary,
    backgroundColor: theme.COLORS.primaryLight,
  },
  inner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.COLORS.primary,
    fontSize: theme.FONT_SIZE.lg - 1, // 15px
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
