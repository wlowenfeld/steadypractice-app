import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { DEFAULT_TAGS } from '@/lib/types';

export default function AddClientScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const addClient = useAppStore((s) => s.addClient);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const isValidEmail = (emailStr: string): boolean => {
    if (!emailStr.trim()) return true; // Email is optional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newClientId = addClient({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: selectedTags,
    });

    // Navigate to the new client's detail page for immediate feedback
    router.replace(`/client/${newClientId}`);
  };

  const isValid = name.trim().length > 0 && isValidEmail(email);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3"
          style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <X size={24} color={colors.textTertiary} />
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
            New Client
          </Text>
          <Pressable
            onPress={handleSave}
            disabled={!isValid}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: isValid ? colors.accent : colors.bgSecondary }}
          >
            <Check size={20} color={isValid ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textTertiary} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
              className="rounded-xl px-4 py-3.5 text-base"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                color: colors.text,
              }}
            />
          </Animated.View>

          {/* Email */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mt-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Email
            </Text>
            <TextInput
              placeholder="email@example.com"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="rounded-xl px-4 py-3.5 text-base"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: email.trim().length > 0 && !isValidEmail(email) ? '#DC2626' : colors.cardBorder,
                color: colors.text,
              }}
            />
            {email.trim().length > 0 && !isValidEmail(email) && (
              <Text className="text-xs mt-1 ml-1" style={{ color: '#DC2626' }}>
                Please enter a valid email address
              </Text>
            )}
          </Animated.View>

          {/* Phone */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mt-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Phone
            </Text>
            <TextInput
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.textTertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="rounded-xl px-4 py-3.5 text-base"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                color: colors.text,
              }}
            />
          </Animated.View>

          {/* Tags */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Tags
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DEFAULT_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{
                        color: isSelected ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textSecondary,
                      }}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(250).springify()} className="mt-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Notes
            </Text>
            <TextInput
              placeholder="Any initial notes about this client..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="rounded-xl px-4 py-3.5 text-base min-h-[120px]"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                color: colors.text,
              }}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
