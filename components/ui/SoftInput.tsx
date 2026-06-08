/**
 * SoftInput — Text input with soft purple-tinted background and focus state.
 */
import React, { useState } from 'react';
import { TextInput, View, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface SoftInputProps extends TextInputProps {
  leftIcon?: React.ComponentProps<typeof Feather>['name'];
  rightIcon?: React.ComponentProps<typeof Feather>['name'];
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function SoftInput({
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...rest
}: SoftInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.container,
        focused && styles.focused,
        containerStyle,
      ]}
    >
      {leftIcon && (
        <Feather
          name={leftIcon}
          size={18}
          color={focused ? theme.colors.primary : theme.colors.text.muted}
          style={styles.leftIcon}
        />
      )}
      <TextInput
        placeholderTextColor={theme.colors.text.muted}
        style={[styles.input, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {rightIcon && (
        <View style={styles.rightIcon}>
          <Feather
            name={rightIcon}
            size={18}
            color={focused ? theme.colors.primary : theme.colors.text.muted}
            onPress={onRightIconPress}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceTint,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    height: 52,
    paddingHorizontal: 16,
  },
  focused: {
    borderColor: theme.colors.primaryGlow,
    backgroundColor: theme.colors.surface,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    fontSize: theme.font.size.body,
    color: theme.colors.text.primary,
    padding: 0,
  },
});

export default SoftInput;
