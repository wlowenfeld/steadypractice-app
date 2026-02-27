import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';

const SECURITY_TIPS = [
  'Set a strong device passcode (or use Face ID / Touch ID)',
  'Enable the SteadyPractice PIN lock in Settings',
  'Keep your iPhone updated to the latest iOS version',
  'Enable "Find My iPhone" so you can remotely wipe if your device is lost',
];

export default function SecurityRecommendationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full active:opacity-70"
          style={{ backgroundColor: colors.bgSecondary }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold ml-3 flex-1" style={{ color: colors.text }}>
          Security Recommendations
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <Animated.View entering={FadeIn.delay(100)} className="items-center mt-6 mb-6">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <ShieldCheck size={32} color={colors.accent} />
          </View>
        </Animated.View>

        {/* Intro */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mx-4 mb-6">
          <Text className="text-2xl font-bold text-center mb-2" style={{ color: colors.text }}>
            Protect Your Client Data
          </Text>
          <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
            Your data lives only on this device. Here's how to keep it safe:
          </Text>
        </Animated.View>

        {/* Tips Card */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mx-4 mb-4">
          <View
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <View className="gap-4">
              {SECURITY_TIPS.map((tip, index) => (
                <View key={tip} className="flex-row items-start">
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mt-0.5"
                    style={{ backgroundColor: '#D1FAE5' }}
                  >
                    <Check size={14} color="#047857" strokeWidth={3} />
                  </View>
                  <Text className="text-base ml-3 flex-1 leading-relaxed" style={{ color: colors.text }}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Encryption Note */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="mx-4">
          <View
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
              When your device is locked with a passcode, iOS automatically encrypts everything on it.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
