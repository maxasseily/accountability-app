import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../../utils/colors';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  rightIcon,
  value,
  onChangeText,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPassword = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
          <View style={styles.blurOverlay} />
        </BlurView>
        <View style={styles.inputWrapper}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <TextInput
            style={[styles.input, icon ? styles.inputWithIcon : undefined]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={showPassword}
            textContentType={props.textContentType ?? 'none'}
            autoComplete={props.autoComplete ?? 'off'}
            importantForAutofill={props.importantForAutofill ?? 'no'}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity
              style={styles.iconRight}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Text style={styles.eyeIcon}>{isPasswordVisible ? '👁️' : '👁️‍🗨️'}</Text>
            </TouchableOpacity>
          )}
          {rightIcon && !secureTextEntry && (
            <View style={styles.iconRight}>{rightIcon}</View>
          )}
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputContainer: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    position: 'relative',
  },
  inputFocused: {
    borderColor: colors.inputFocus,
    shadowColor: colors.inputFocus,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: colors.inputError,
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: colors.glassLight,
  },
  inputWrapper: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '400',
  },
  inputWithIcon: {
    marginLeft: 12,
  },
  iconLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
