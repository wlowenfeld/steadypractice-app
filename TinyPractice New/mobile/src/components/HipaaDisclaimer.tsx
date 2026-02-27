import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Check, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';

const SECURITY_TIPS = [
  'Set a strong device passcode (or use Face ID / Touch ID)',
  'Enable the SteadyPractice PIN lock in Settings',
  'Keep your iPhone updated to the latest iOS version',
  'Enable "Find My iPhone" so you can remotely wipe if your device is lost',
];

export default function HipaaDisclaimer() {
  const { colors, isDark } = useTheme();
  const { acceptHipaa } = useSecurity();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleAccept = async () => {
    if (!acknowledged) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptHipaa();
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(100)}
          className="items-center pt-12 pb-6 px-6"
        >
          <Lock size={32} color={colors.textTertiary} />
          <Text className="text-2xl font-bold text-center mt-6" style={{ color: colors.text }}>
            Privacy Notice
          </Text>
          <Text className="text-base text-center mt-2" style={{ color: colors.textSecondary }}>
            Please review before using SteadyPractice
          </Text>
        </Animated.View>

        {/* Content Card */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          className="mx-4 mb-4"
        >
          <View
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <View className="gap-4">
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                All data is stored <Text className="font-semibold" style={{ color: colors.text }}>locally on your device only</Text>. Nothing is transmitted to external servers or cloud services.
              </Text>
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                You are responsible for securing your device with a passcode. PIN protection adds an extra layer of security within the app.
              </Text>
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                This app is a tool to assist with record-keeping. It is your responsibility to ensure compliance with all applicable privacy laws and regulations.
              </Text>
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                Do not share your device or app PIN with unauthorized individuals. Regularly back up your device to prevent data loss.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Legal Notice */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="mx-4 mb-4"
        >
          <View
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-sm leading-relaxed" style={{ color: colors.textTertiary }}>
              By using this application, you acknowledge that you understand and agree to these terms. This app is provided "as is" without warranty of any kind. The developer is not responsible for any unauthorized access to your data resulting from inadequate device security measures or user error.
            </Text>
          </View>
        </Animated.View>

        {/* Legal Links */}
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          className="mx-4 mb-6 flex-row justify-center gap-4"
        >
          <Pressable onPress={() => Linking.openURL('https://steadypractice.app/privacy.html')}>
            <Text className="text-sm underline" style={{ color: colors.accent }}>
              Privacy Policy
            </Text>
          </Pressable>
          <Text className="text-sm" style={{ color: colors.textTertiary }}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://steadypractice.app/terms.html')}>
            <Text className="text-sm underline" style={{ color: colors.accent }}>
              Terms of Service
            </Text>
          </Pressable>
        </Animated.View>

        {/* Security Recommendations */}
        <Animated.View
          entering={FadeInDown.delay(275).springify()}
          className="mx-4 mb-4"
        >
          <View className="flex-row items-center mb-3 px-1">
            <ShieldCheck size={20} color={colors.accent} />
            <Text className="text-lg font-bold ml-2" style={{ color: colors.text }}>
              Protect Your Client Data
            </Text>
          </View>
          <View
            className="rounded-2xl p-5"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-sm mb-4" style={{ color: colors.textSecondary }}>
              Your data lives only on this device. Here's how to keep it safe:
            </Text>
            <View className="gap-3">
              {SECURITY_TIPS.map((tip) => (
                <View key={tip} className="flex-row items-start">
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center mt-0.5"
                    style={{ backgroundColor: '#D1FAE5' }}
                  >
                    <Check size={12} color="#047857" strokeWidth={3} />
                  </View>
                  <Text className="text-sm ml-3 flex-1 leading-relaxed" style={{ color: colors.text }}>
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="text-xs mt-4 leading-relaxed" style={{ color: colors.textTertiary }}>
              When your device is locked with a passcode, iOS automatically encrypts everything on it.
            </Text>
          </View>
        </Animated.View>

        {/* Acknowledgment Checkbox */}
        <Animated.View
          entering={FadeInDown.delay(325).springify()}
          className="mx-4 mb-6"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAcknowledged(!acknowledged);
            }}
            className="flex-row items-center p-4 rounded-2xl"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <View
              className="w-6 h-6 rounded items-center justify-center mr-3"
              style={{
                backgroundColor: acknowledged ? '#10B981' : colors.bgSecondary,
                borderWidth: acknowledged ? 0 : 2,
                borderColor: colors.cardBorder,
              }}
            >
              {acknowledged && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
            </View>
            <Text className="flex-1 text-base" style={{ color: colors.text }}>
              I have read and understand the privacy notice and my responsibilities
            </Text>
          </Pressable>
        </Animated.View>

        {/* Accept Button */}
        <Animated.View
          entering={FadeInDown.delay(375).springify()}
          className="mx-4"
        >
          <Pressable
            onPress={handleAccept}
            disabled={!acknowledged}
            className="py-4 rounded-2xl items-center active:opacity-80"
            style={{
              backgroundColor: acknowledged ? colors.accent : colors.bgSecondary,
            }}
          >
            <Text
              className="text-lg font-semibold"
              style={{ color: acknowledged ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textTertiary }}
            >
              I Agree & Continue
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
