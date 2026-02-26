import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Lock, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';

export default function ChangePinScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { changePin } = useSecurity();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError('');

    if (currentPin.length !== 4) {
      setError('Current PIN must be 4 digits');
      return;
    }

    if (newPin.length !== 4) {
      setError('New PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PINs do not match');
      return;
    }

    const success = await changePin(currentPin, newPin);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Current PIN is incorrect');
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#D1FAE5' }}>
          <Check size={40} color="#047857" strokeWidth={3} />
        </View>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>PIN Changed</Text>
        <Text className="text-base mt-2" style={{ color: colors.textSecondary }}>Your PIN has been updated</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: colors.cardBorder }}>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <X size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold" style={{ color: colors.text }}>
          Change PIN
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-1 px-4 pt-6">
        <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center mb-8">
          <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.bgSecondary }}>
            <Lock size={28} color={colors.text} />
          </View>
        </Animated.View>

        {/* Current PIN */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Current PIN
          </Text>
          <TextInput
            value={currentPin}
            onChangeText={(text) => setCurrentPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="Enter current PIN"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            className="rounded-xl px-4 py-4 text-base"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, color: colors.text }}
          />
        </Animated.View>

        {/* New PIN */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            New PIN
          </Text>
          <TextInput
            value={newPin}
            onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="Enter new PIN"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            className="rounded-xl px-4 py-4 text-base"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, color: colors.text }}
          />
        </Animated.View>

        {/* Confirm New PIN */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-6">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Confirm New PIN
          </Text>
          <TextInput
            value={confirmPin}
            onChangeText={(text) => setConfirmPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="Confirm new PIN"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            className="rounded-xl px-4 py-4 text-base"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, color: colors.text }}
          />
        </Animated.View>

        {/* Error */}
        {error ? (
          <Animated.View entering={FadeInDown} className="mb-4">
            <Text className="text-sm text-center" style={{ color: '#DC2626' }}>
              {error}
            </Text>
          </Animated.View>
        ) : null}

        {/* Save Button */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Pressable
            onPress={handleSave}
            className="py-4 rounded-xl items-center active:opacity-80"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-lg font-semibold" style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>
              Update PIN
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
