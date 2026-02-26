import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Lock } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';

// ---------------------------------------------------------------------------
// Mini preview components — styled Views that mimic real app screens
// ---------------------------------------------------------------------------

function MiniSessionNote({ colors, isDark }: { colors: ReturnType<typeof useTheme>['colors']; isDark: boolean }) {
  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        width: 260,
      }}
    >
      {/* Header bar */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              Sarah M.
            </Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
              Feb 14, 2026 · 50 min
            </Text>
          </View>
          {/* Mood dot */}
          <View
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: isDark ? '#1a3328' : '#D1FAE5' }}
          >
            <Text style={{ fontSize: 14 }}>😊</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.cardBorder }} />

      {/* Notes preview */}
      <View className="px-4 py-3">
        <Text
          className="text-sm leading-5"
          style={{ color: colors.textSecondary }}
          numberOfLines={3}
        >
          Good session. Discussed coping strategies for workplace stress. Sarah reported improved sleep this week and progress on journaling...
        </Text>
      </View>

      {/* Follow-up */}
      <View className="px-4 pb-4">
        <View
          className="rounded-lg px-3 py-2"
          style={{ backgroundColor: colors.bgSecondary }}
        >
          <Text className="text-xs font-medium" style={{ color: colors.textTertiary }}>
            Follow-up
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            Review journal entries next week
          </Text>
        </View>
      </View>
    </View>
  );
}

function MiniPracticeTools({ colors, isDark }: { colors: ReturnType<typeof useTheme>['colors']; isDark: boolean }) {
  return (
    <View className="gap-3" style={{ width: 260 }}>
      {/* Calendar snippet */}
      <View
        className="rounded-xl px-4 py-3"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        <Text className="text-xs font-medium mb-2" style={{ color: colors.textTertiary }}>
          Schedule
        </Text>
        <View className="gap-2">
          {[
            { time: '9:00 AM', name: 'Sarah M.', type: 'Session' },
            { time: '10:30 AM', name: 'David K.', type: 'Intake' },
            { time: '2:00 PM', name: 'Rachel T.', type: 'Session' },
          ].map((appt, i) => (
            <View key={i} className="flex-row items-center">
              <Text className="text-xs w-16" style={{ color: colors.textTertiary }}>
                {appt.time}
              </Text>
              <View
                className="w-0.5 h-4 rounded-full mr-2"
                style={{ backgroundColor: colors.accent }}
              />
              <Text className="text-sm flex-1" style={{ color: colors.text }}>
                {appt.name}
              </Text>
              <Text className="text-xs" style={{ color: colors.textTertiary }}>
                {appt.type}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Invoice snippet */}
      <View
        className="rounded-xl px-4 py-3"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        <Text className="text-xs font-medium mb-2" style={{ color: colors.textTertiary }}>
          Invoices
        </Text>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm" style={{ color: colors.text }}>
              3 pending
            </Text>
            <Text className="text-xs" style={{ color: colors.textTertiary }}>
              $450 outstanding
            </Text>
          </View>
          <View
            className="px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: isDark ? '#1a3328' : '#D1FAE5' }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: isDark ? '#6EE7B7' : '#047857' }}
            >
              2 paid this week
            </Text>
          </View>
        </View>
      </View>

      {/* Client list snippet */}
      <View
        className="rounded-xl px-4 py-3"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        }}
      >
        <Text className="text-xs font-medium mb-2" style={{ color: colors.textTertiary }}>
          Clients
        </Text>
        <View className="flex-row items-center gap-2">
          {['SM', 'DK', 'RT', 'JL'].map((initials, i) => {
            const bgColors = ['#FEF3C7', '#D1FAE5', '#E0F2FE', '#EDE9FE'];
            const txtColors = ['#B45309', '#047857', '#0369A1', '#7C3AED'];
            return (
              <View
                key={i}
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: bgColors[i] }}
              >
                <Text className="text-xs font-semibold" style={{ color: txtColors[i] }}>
                  {initials}
                </Text>
              </View>
            );
          })}
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.textTertiary }}>
              +8
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Dot indicators
// ---------------------------------------------------------------------------

function DotIndicator({
  count,
  activeIndex,
  colors,
}: {
  count: number;
  activeIndex: number;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === activeIndex ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor:
              i === activeIndex ? colors.accent : colors.cardBorder,
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const { completeOnboarding } = useSecurity();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const SCREEN_COUNT = 4;

  const handleComplete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // No sample data loading — user lands on empty client list
    await completeOnboarding();
  }, [completeOnboarding]);

  const handleSkip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
  }, [completeOnboarding]);

  const handleNext = useCallback(() => {
    if (activeIndex < SCREEN_COUNT - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    }
  }, [activeIndex, width]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      setActiveIndex(index);
    },
    [width]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Skip button — not shown on last screen */}
        {activeIndex < SCREEN_COUNT - 1 && (
          <Animated.View entering={FadeIn.duration(300)} className="absolute top-0 right-0 z-10">
            <SafeAreaView edges={['top']}>
              <Pressable
                onPress={handleSkip}
                className="px-5 py-3"
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Text
                  className="text-base font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Skip
                </Text>
              </Pressable>
            </SafeAreaView>
          </Animated.View>
        )}

        {/* Horizontal pager */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          bounces={false}
          className="flex-1"
        >
          {/* Screen 1: Privacy */}
          <View style={{ width }} className="flex-1 justify-center px-8">
            <Animated.View entering={FadeInUp.delay(100).duration(500)}>
              {/* Small, understated shield */}
              <View className="items-center mb-8">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center"
                  style={{ backgroundColor: isDark ? '#1a3328' : '#ECFDF5' }}
                >
                  <ShieldCheck size={28} color={isDark ? '#6EE7B7' : '#059669'} />
                </View>
              </View>

              {/* Device illustration — minimal */}
              <View className="items-center mb-10">
                <View
                  className="rounded-2xl items-center justify-center py-5 px-8"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Lock size={20} color={colors.textTertiary} />
                  <Text
                    className="text-xs font-medium mt-2 tracking-wider uppercase"
                    style={{ color: colors.textTertiary }}
                  >
                    Local Storage Only
                  </Text>
                </View>
              </View>

              <Text
                className="text-2xl font-bold text-center mb-3"
                style={{ color: colors.text }}
              >
                Your data never leaves this device.
              </Text>
              <Text
                className="text-base text-center"
                style={{ color: colors.textSecondary }}
              >
                No cloud. No accounts. No tracking.
              </Text>
            </Animated.View>
          </View>

          {/* Screen 2: Session Notes */}
          <View style={{ width }} className="flex-1 justify-center items-center px-8">
            <Animated.View entering={FadeInUp.delay(100).duration(500)} className="items-center">
              <View className="mb-10">
                <MiniSessionNote colors={colors} isDark={isDark} />
              </View>

              <Text
                className="text-2xl font-bold text-center mb-3"
                style={{ color: colors.text }}
              >
                Session notes that stay private.
              </Text>
              <Text
                className="text-base text-center"
                style={{ color: colors.textSecondary }}
              >
                Mood tracking, follow-ups, all on your phone.
              </Text>
            </Animated.View>
          </View>

          {/* Screen 3: Practice Tools */}
          <View style={{ width }} className="flex-1 justify-center items-center px-8">
            <Animated.View entering={FadeInUp.delay(100).duration(500)} className="items-center">
              <View className="mb-10">
                <MiniPracticeTools colors={colors} isDark={isDark} />
              </View>

              <Text
                className="text-2xl font-bold text-center mb-3"
                style={{ color: colors.text }}
              >
                Scheduling. Invoicing. Clients.
              </Text>
              <Text
                className="text-base text-center"
                style={{ color: colors.textSecondary }}
              >
                Everything you actually use. Nothing you don't.
              </Text>
            </Animated.View>
          </View>

          {/* Screen 4: Get Started */}
          <View style={{ width }} className="flex-1 justify-center px-8">
            <Animated.View entering={FadeInUp.delay(100).duration(500)} className="items-center">
              <Text
                className="text-2xl font-bold text-center mb-3"
                style={{ color: colors.text }}
              >
                Free for your first 5 clients.
              </Text>
              <Text
                className="text-base text-center mb-12"
                style={{ color: colors.textSecondary }}
              >
                $4.99/month when you're ready for more.
              </Text>

              {/* CTA button */}
              <Pressable
                onPress={handleComplete}
                className="py-4 rounded-2xl items-center active:opacity-80 w-full"
                style={{ backgroundColor: colors.accent }}
              >
                <Text
                  className="text-lg font-semibold"
                  style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}
                >
                  Get Started
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>

        {/* Dot indicators + Continue button */}
        <View className="pb-8 pt-4 px-8">
          <DotIndicator count={SCREEN_COUNT} activeIndex={activeIndex} colors={colors} />
          {activeIndex < SCREEN_COUNT - 1 && (
            <Pressable
              onPress={handleNext}
              className="py-4 rounded-2xl items-center active:opacity-80 mt-6"
              style={{ backgroundColor: colors.accent }}
            >
              <Text
                className="text-base font-semibold"
                style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}
              >
                Continue
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
