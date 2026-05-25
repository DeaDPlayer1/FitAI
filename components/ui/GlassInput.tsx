import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface GlassInputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  containerStyle?: ViewStyle;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  label, 
  icon, 
  error, 
  containerStyle,
  onFocus,
  onBlur,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // If the input was meant to be secure, but the user toggled visibility, we override it
  const isSecure = props.secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputFocused,
        !!error && styles.inputError
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.TEXT.muted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
          secureTextEntry={isSecure}
        />
        {props.secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color={theme.TEXT.muted} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.SPACING.md,
  },
  label: {
    fontSize: theme.FONT_SIZE.sm,
    color: theme.TEXT.secondary,
    marginBottom: theme.SPACING.xs,
    fontWeight: '500',
  },
  inputWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.BACKGROUND.input,
    borderRadius: theme.RADIUS.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.BACKGROUND.cardBorder,
  },
  inputFocused: {
    borderColor: theme.COLORS.primary,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: theme.COLORS.danger,
  },
  iconContainer: {
    marginRight: theme.SPACING.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.TEXT.primary,
    fontSize: theme.FONT_SIZE.md,
  },
  errorText: {
    color: theme.COLORS.danger,
    fontSize: theme.FONT_SIZE.xs,
    marginTop: theme.SPACING.xs,
  },
  eyeIcon: {
    padding: theme.SPACING.xs,
    marginLeft: theme.SPACING.xs,
  },
});
