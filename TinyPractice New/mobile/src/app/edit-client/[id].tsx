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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { DEFAULT_TAGS } from '@/lib/types';

export default function EditClientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();

  const allClients = useAppStore((s) => s.clients);
  const updateClient = useAppStore((s) => s.updateClient);

  const client = allClients.find((c) => c.id === (id ?? ''));

  const [name, setName] = useState(client?.name ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [notes, setNotes] = useState(client?.notes ?? '');
  const [selectedTags, setSelectedTags] = useState<string[]>(client?.tags ?? []);

  if (!client) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Text style={{ color: colors.textSecondary }}>Client not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-medium" style={{ color: colors.text }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;

    updateClient(client.id, {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: selectedTags,
    });

    router.back();
  };

  const isValid = name.trim().length > 0;

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
            Edit Client
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
                borderColor: colors.cardBorder,
                color: colors.text,
              }}
            />
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
              placeholder="Any notes about this client..."
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
