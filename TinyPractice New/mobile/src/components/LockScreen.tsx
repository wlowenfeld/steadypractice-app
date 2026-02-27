import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Delete, Shield, ShieldAlert } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';

const PIN_LENGTH = 4;

interface LockScreenProps {
  mode: 'unlock' | 'setup' | 'confirm';
  onSuccess?: () => void;
  setupPin?: string;
}

export default function LockScreen({ mode, onSuccess, setupPin }: LockScreenProps) {
  const { colors } = useTheme();
  const { verifyPin, setPin, unlock, pinAttempts, pinLockedUntil, requiresPinReentry } = useSecurity();
  const [pin, setLocalPin] = useState('');
  const [error, setError] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  const shakeX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  // Lockout countdown timer
  useEffect(() => {
    if (!pinLockedUntil || pinLockedUntil <= Date.now()) {
      setLockoutRemaining(0);
      return;
    }
    setLockoutRemaining(Math.ceil((pinLockedUntil - Date.now()) / 1000));
    const interval = setInterval(() => {
      const remaining = Math.ceil((pinLockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutRemaining(0);
        clearInterval(interval);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pinLockedUntil]);

  const isLockedOut = lockoutRemaining > 0;

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinComplete();
    }
  }, [pin]);

  const handlePinComplete = async () => {
    if (mode === 'unlock') {
      const isValid = await verifyPin(pin);
      if (isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        unlock();
        onSuccess?.();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerShake();
        setError('Incorrect PIN');
        setLocalPin('');
      }
    } else if (mode === 'setup') {
      if (step === 'enter') {
        setConfirmPin(pin);
        setLocalPin('');
        setStep('confirm');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        if (pin === confirmPin) {
          await setPin(pin);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSuccess?.();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          triggerShake();
          setError('PINs do not match');
          setLocalPin('');
          setStep('enter');
          setConfirmPin('');
        }
      }
    } else if (mode === 'confirm' && setupPin) {
      if (pin === setupPin) {
        await setPin(pin);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerShake();
        setError('PINs do not match');
        setLocalPin('');
      }
    }
  };

  const handleNumberPress = (num: string) => {
    if (isLockedOut) return;
    if (pin.length < PIN_LENGTH) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // fire-and-forget
      setLocalPin(prev => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // fire-and-forget
      setLocalPin(prev => prev.slice(0, -1));
    }
  };

  const getTitle = () => {
    if (mode === 'unlock') return 'Enter PIN';
    if (mode === 'setup') return step === 'enter' ? 'Create PIN' : 'Confirm PIN';
    return 'Confirm PIN';
  };

  const getSubtitle = () => {
    if (mode === 'unlock') return 'Enter your PIN to access the app';
    if (mode === 'setup') return step === 'enter'
      ? 'Create a 4-digit PIN to secure your data'
      : 'Enter your PIN again to confirm';
    return 'Enter your PIN again to confirm';
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="flex-1 justify-center px-8">
        {/* Icon */}
        <Animated.View
          entering={FadeIn.delay(100)}
          className="items-center mb-6"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            {mode === 'unlock' ? (
              <Lock size={36} color={colors.text} />
            ) : (
              <Shield size={36} color={colors.text} />
            )}
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="items-center mb-2">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {getTitle()}
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="items-center mb-8">
          <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
            {getSubtitle()}
          </Text>
        </Animated.View>

        {/* Legacy PIN Migration Banner */}
        {mode === 'unlock' && requiresPinReentry && (
          <Animated.View
            entering={FadeInDown.delay(250).springify()}
            className="mx-2 mb-6 rounded-xl p-3 flex-row items-center"
            style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }}
          >
            <ShieldAlert size={20} color="#B45309" />
            <Text className="ml-2 text-sm flex-1" style={{ color: '#92400E' }}>
              For your security, please re-enter your PIN to upgrade your app's encryption.
            </Text>
          </Animated.View>
        )}

        {/* PIN Dots - using plain View for performance */}
        <Animated.View
          style={animatedStyle}
          className="flex-row justify-center gap-4 mb-4"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: i < pin.length ? colors.text : colors.bgSecondary,
                borderWidth: i < pin.length ? 0 : 2,
                borderColor: colors.cardBorder,
              }}
            />
          ))}
        </Animated.View>

        {/* Error Message / Lockout */}
        <View className="h-6 items-center justify-center mb-6">
          {isLockedOut ? (
            <Animated.Text
              entering={FadeIn}
              className="text-sm"
              style={{ color: '#DC2626' }}
            >
              Too many attempts. Try again in {Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}
            </Animated.Text>
          ) : error ? (
            <Animated.Text
              entering={FadeIn}
              className="text-sm"
              style={{ color: '#DC2626' }}
            >
              {error}
            </Animated.Text>
          ) : null}
        </View>

        {/* Number Pad */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          className="px-8"
        >
          {/* Row 1: 1 2 3 */}
          <View className="flex-row justify-center mb-3">
            {['1', '2', '3'].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                activeOpacity={0.7}
                className="w-20 h-16 mx-2 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Row 2: 4 5 6 */}
          <View className="flex-row justify-center mb-3">
            {['4', '5', '6'].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                activeOpacity={0.7}
                className="w-20 h-16 mx-2 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Row 3: 7 8 9 */}
          <View className="flex-row justify-center mb-3">
            {['7', '8', '9'].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => handleNumberPress(num)}
                activeOpacity={0.7}
                className="w-20 h-16 mx-2 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Row 4: empty 0 delete */}
          <View className="flex-row justify-center">
            <View className="w-20 h-16 mx-2" />
            <TouchableOpacity
              onPress={() => handleNumberPress('0')}
              activeOpacity={0.7}
              className="w-20 h-16 mx-2 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Text className="text-2xl font-semibold" style={{ color: colors.text }}>
                0
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setLocalPin('');
              }}
              activeOpacity={0.7}
              className="w-20 h-16 mx-2 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <Delete size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
