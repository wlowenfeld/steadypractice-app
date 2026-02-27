import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Code2 } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';

interface LicenseEntry {
  name: string;
  license: string;
  copyright: string;
}

const LICENSES: LicenseEntry[] = [
  { name: 'React', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates' },
  { name: 'React Native', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates' },
  { name: 'Expo', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: 'Expo Router', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: 'Zustand', license: 'MIT', copyright: 'Copyright (c) 2019 Paul Henschel' },
  { name: 'React Native Purchases (RevenueCat)', license: 'MIT', copyright: 'Copyright (c) 2017 RevenueCat, Inc.' },
  { name: '@react-native-async-storage/async-storage', license: 'MIT', copyright: 'Copyright (c) 2015-present Facebook, Inc.' },
  { name: '@tanstack/react-query', license: 'MIT', copyright: 'Copyright (c) 2021-present Tanner Linsley' },
  { name: 'React Native Reanimated', license: 'MIT', copyright: 'Copyright (c) 2016 Software Mansion' },
  { name: 'React Native Gesture Handler', license: 'MIT', copyright: 'Copyright (c) 2016 Software Mansion' },
  { name: 'React Native Safe Area Context', license: 'MIT', copyright: 'Copyright (c) 2019 Th3rd Wave' },
  { name: 'React Native Screens', license: 'MIT', copyright: 'Copyright (c) 2018 Software Mansion' },
  { name: 'React Navigation', license: 'MIT', copyright: 'Copyright (c) 2017 React Navigation Contributors' },
  { name: 'NativeWind', license: 'MIT', copyright: 'Copyright (c) 2022 Mark Lawlor' },
  { name: 'Tailwind CSS', license: 'MIT', copyright: 'Copyright (c) Tailwind Labs, Inc.' },
  { name: 'Lucide React Native', license: 'ISC', copyright: 'Copyright (c) 2020 Lucide Contributors' },
  { name: 'date-fns', license: 'MIT', copyright: 'Copyright (c) 2021 Sasha Koss and Lesha Koss' },
  { name: 'Expo Linear Gradient', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: 'Expo Haptics', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: 'Expo File System', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: 'Expo Secure Store', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: 'Expo Crypto', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: 'Expo Sharing', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)' },
  { name: '@gorhom/bottom-sheet', license: 'MIT', copyright: 'Copyright (c) 2020 Mo Gorhom' },
  { name: '@shopify/flash-list', license: 'MIT', copyright: 'Copyright (c) 2022 Shopify Inc.' },
  { name: 'React Native SVG', license: 'MIT', copyright: 'Copyright (c) React Native Community' },
  { name: 'React Native Calendars', license: 'MIT', copyright: 'Copyright (c) 2017 Wix.com' },
  { name: 'Victory Native', license: 'MIT', copyright: 'Copyright (c) 2015 Formidable Labs' },
  { name: 'Zod', license: 'MIT', copyright: 'Copyright (c) 2020 Colin McDonnell' },
  { name: 'UUID', license: 'MIT', copyright: 'Copyright (c) 2010-2020 Robert Kieffer and other contributors' },
  { name: 'Lottie React Native', license: 'Apache-2.0', copyright: 'Copyright (c) 2017 Airbnb' },
  { name: 'React Native MMKV', license: 'MIT', copyright: 'Copyright (c) 2021 Marc Rousavy' },
  { name: 'Zeego', license: 'MIT', copyright: 'Copyright (c) 2022 Fernando Rojo' },
];

export default function OpenSourceLicensesScreen() {
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
          Open Source Licenses
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Animated.View entering={FadeIn.delay(100)} className="mx-4 mt-4 mb-6">
          <View
            className="flex-row items-center justify-center mb-4"
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <Code2 size={24} color={colors.accent} />
            </View>
          </View>
          <Text className="text-sm text-center leading-relaxed" style={{ color: colors.textSecondary }}>
            TinyPractice is built with the following open source software. We're grateful to the developers and communities behind these projects.
          </Text>
        </Animated.View>

        {/* License List */}
        <View className="mx-4">
          {LICENSES.map((entry, index) => (
            <Animated.View
              key={entry.name}
              entering={FadeInDown.delay(120 + Math.min(index, 10) * 20).springify()}
            >
              <View
                className="rounded-2xl p-4 mb-2"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-medium flex-1 mr-2" style={{ color: colors.text }}>
                    {entry.name}
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: colors.bgSecondary }}
                  >
                    <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                      {entry.license}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs" style={{ color: colors.textTertiary }}>
                  {entry.copyright}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
