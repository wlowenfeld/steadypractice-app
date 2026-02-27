import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, Trash2, Clock, Minus, Plus, Receipt, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { MOOD_OPTIONS, INVOICE_STATUS_COLORS, getDisplayStatus, Session } from '@/lib/types';

export default function SessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();

  const sessions = useAppStore((s) => s.sessions);
  const clients = useAppStore((s) => s.clients);
  const invoices = useAppStore((s) => s.invoices);
  const updateSession = useAppStore((s) => s.updateSession);
  const deleteSession = useAppStore((s) => s.deleteSession);

  const session = sessions.find((s) => s.id === id);
  const client = clients.find((c) => c.id === session?.clientId);
  const invoice = session?.invoiceId ? invoices.find((i) => i.id === session.invoiceId) : null;

  const [notes, setNotes] = useState(session?.notes ?? '');
  const [duration, setDuration] = useState(session?.duration ?? 50);
  const [mood, setMood] = useState<Session['mood']>(session?.mood);
  const [followUp, setFollowUp] = useState(session?.followUp ?? '');

  if (!session || !client) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Text style={{ color: colors.textSecondary }}>Session not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-medium" style={{ color: colors.text }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const adjustDuration = (amount: number) => {
    const newDuration = Math.max(5, Math.min(180, duration + amount));
    setDuration(newDuration);
    Haptics.selectionAsync();
  };

  const handleSave = () => {
    updateSession(session.id, {
      duration,
      notes: notes.trim(),
      mood,
      followUp: followUp.trim() || undefined,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSession(session.id);
            router.back();
          },
        },
      ]
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

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
          <View className="items-center">
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>{client.name}</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>{formatDate(session.date)}</Text>
          </View>
          <Pressable
            onPress={handleSave}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.accent }}
          >
            <Check size={20} color={isDark ? '#2B3830' : '#FFFFFF'} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Time info */}
          <Animated.View
            entering={FadeInDown.delay(50).springify()}
            className="flex-row items-center rounded-xl p-3 mb-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Clock size={18} color={colors.textTertiary} />
            <Text className="text-sm ml-2" style={{ color: colors.textSecondary }}>
              Logged at {formatTime(session.date)}
            </Text>
          </Animated.View>

          {/* Duration */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
              Duration
            </Text>
            <View
              className="flex-row items-center justify-center rounded-2xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Pressable
                onPress={() => adjustDuration(-5)}
                className="w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Minus size={24} color={colors.text} />
              </Pressable>
              <View className="flex-1 items-center mx-4">
                <View className="flex-row items-baseline">
                  <Text className="text-5xl font-bold" style={{ color: colors.text }}>{duration}</Text>
                  <Text className="text-lg ml-2" style={{ color: colors.textSecondary }}>min</Text>
                </View>
              </View>
              <Pressable
                onPress={() => adjustDuration(5)}
                className="w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Plus size={24} color={colors.text} />
              </Pressable>
            </View>
          </Animated.View>

          {/* Invoice Status */}
          <Animated.View entering={FadeInDown.delay(125).springify()} className="mt-6">
            <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
              Billing
            </Text>
            {invoice ? (() => {
              const displayStatus = getDisplayStatus(invoice);
              return (
              <Pressable
                onPress={() => router.push(`/invoice/${invoice.id}`)}
                className="flex-row items-center rounded-xl p-4 active:opacity-80"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: INVOICE_STATUS_COLORS[displayStatus].bg }}
                >
                  <Receipt size={18} color={INVOICE_STATUS_COLORS[displayStatus].text} />
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: INVOICE_STATUS_COLORS[displayStatus].bg }}
                    >
                      <Text
                        className="text-xs font-semibold capitalize"
                        style={{ color: INVOICE_STATUS_COLORS[displayStatus].text }}
                      >
                        {displayStatus}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      ${invoice.amount.toFixed(2)}
                    </Text>
                  </View>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                    {displayStatus === 'paid' && invoice.paidDate
                      ? `Paid ${new Date(invoice.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : `Due ${new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </Pressable>
              );
            })() : (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/add-invoice',
                    params: { clientId: session.clientId, sessionId: session.id },
                  })
                }
                className="flex-row items-center rounded-xl p-4 active:opacity-80"
                style={{ backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.card }}
                >
                  <Receipt size={18} color={colors.textTertiary} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
                    Not Invoiced
                  </Text>
                </View>
                <View
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: colors.accent }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}
                  >
                    Create Invoice
                  </Text>
                </View>
              </Pressable>
            )}
          </Animated.View>

          {/* Mood */}
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mt-6">
            <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
              Session Mood
            </Text>
            <View className="flex-row gap-2">
              {MOOD_OPTIONS.map((option) => {
                const isSelected = mood === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setMood(mood === option.value ? undefined : option.value);
                      Haptics.selectionAsync();
                    }}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{
                      backgroundColor: isSelected ? option.color + '15' : colors.card,
                      borderWidth: 2,
                      borderColor: isSelected ? option.color : colors.cardBorder,
                    }}
                  >
                    <View
                      className="w-3 h-3 rounded-full mb-1"
                      style={{ backgroundColor: option.color }}
                    />
                    <Text
                      className="text-xs font-medium"
                      style={{ color: isSelected ? option.color : colors.textSecondary }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Session Notes
            </Text>
            <TextInput
              placeholder="What did you discuss? Key observations, themes, breakthroughs..."
              placeholderTextColor={colors.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
              className="rounded-xl px-4 py-3.5 text-base min-h-[160px]"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                color: colors.text,
              }}
            />
          </Animated.View>

          {/* Follow Up */}
          <Animated.View entering={FadeInDown.delay(250).springify()} className="mt-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Follow-up Items
            </Text>
            <TextInput
              placeholder="Homework, topics to revisit, referrals..."
              placeholderTextColor={colors.textTertiary}
              value={followUp}
              onChangeText={setFollowUp}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="rounded-xl px-4 py-3.5 text-base min-h-[100px]"
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                color: colors.text,
              }}
            />
          </Animated.View>

          {/* Delete */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="mt-8">
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center justify-center rounded-xl p-4 active:opacity-80"
              style={{ backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2' }}
            >
              <Trash2 size={20} color="#DC2626" />
              <Text className="font-medium ml-2" style={{ color: '#DC2626' }}>
                Delete Session
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
