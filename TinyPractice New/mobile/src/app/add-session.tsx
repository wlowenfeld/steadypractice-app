import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, Minus, Plus, Calendar, Receipt, Share2, Clock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';
import { MOOD_OPTIONS, Session } from '@/lib/types';
import {
  maybeRequestReview,
  hasSharePromptBeenShown,
  markSharePromptShown,
  shareApp,
} from '@/lib/conversionTriggers';
import { isSampleClient } from '@/lib/sampleData';

export default function AddSessionScreen() {
  const router = useRouter();
  const { clientId, appointmentId } = useLocalSearchParams<{ clientId: string; appointmentId?: string }>();
  const { colors, isDark, theme } = useTheme();
  const { defaultSessionRate } = useSecurity();

  const addSession = useAppStore((s) => s.addSession);
  const addInvoice = useAppStore((s) => s.addInvoice);
  const linkSessionsToInvoice = useAppStore((s) => s.linkSessionsToInvoice);
  const allClients = useAppStore((s) => s.clients);
  const completeAppointment = useAppStore((s) => s.completeAppointment);
  const appointments = useAppStore((s) => s.appointments);
  const sessionCount = useAppStore((s) => s.sessions.filter((sess) => !isSampleClient(sess.clientId)).length);
  const invoiceCount = useAppStore((s) => s.invoices.filter((inv) => !isSampleClient(inv.clientId)).length);
  const isDemoMode = useAppStore((s) => s.isDemoMode);

  const client = allClients.find((c) => c.id === (clientId ?? ''));
  const appointment = appointmentId ? appointments.find((a) => a.id === appointmentId) : undefined;

  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(appointment?.duration ?? 50);
  const [mood, setMood] = useState<Session['mood']>(undefined);
  const [followUp, setFollowUp] = useState('');
  const [sessionDate, setSessionDate] = useState<Date>(
    appointment ? new Date(appointment.scheduledDate) : new Date()
  );
  const [showDateEditor, setShowDateEditor] = useState(false);
  const [showInvoicePrompt, setShowInvoicePrompt] = useState(false);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [savedSessionDate, setSavedSessionDate] = useState<string | null>(null);

  // Pre-fill duration from appointment
  useEffect(() => {
    if (appointment) {
      setDuration(appointment.duration);
    }
  }, [appointment]);

  const adjustDuration = (amount: number) => {
    const newDuration = Math.max(5, Math.min(180, duration + amount));
    setDuration(newDuration);
    Haptics.selectionAsync();
  };

  const handleSave = () => {
    if (!clientId) return;

    const sessionDateISO = sessionDate.toISOString();

    const sessionId = addSession({
      clientId,
      date: sessionDateISO,
      duration,
      notes: notes.trim(),
      mood,
      followUp: followUp.trim() || undefined,
    });

    // Mark appointment as completed if this session came from one
    if (appointmentId) {
      completeAppointment(appointmentId, sessionId);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show invoice prompt
    setSavedSessionId(sessionId);
    setSavedSessionDate(sessionDateISO);
    setShowInvoicePrompt(true);
  };

  /**
   * After session save, run conversion triggers in priority order:
   * review (5th session) > share (10th session)
   */
  const runPostSessionTriggers = async (newSessionCount: number, newInvoiceCount: number) => {
    // Try review prompt first (5th session trigger)
    const reviewShown = await maybeRequestReview({
      sessionCount: newSessionCount,
      invoiceCount: newInvoiceCount,
      isDemoMode,
    });
    if (reviewShown) return;

    // Try 10th session share prompt (lower priority, show once only)
    if (newSessionCount >= 10) {
      const alreadyShown = await hasSharePromptBeenShown();
      if (!alreadyShown) {
        await markSharePromptShown();
        setShowSharePrompt(true);
        return;
      }
    }
  };

  const handleCreateInvoice = () => {
    if (!clientId || !savedSessionId || !savedSessionDate) return;

    const amount = defaultSessionRate ?? 0;
    const sessionDateFormatted = new Date(savedSessionDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Create invoice linked to this session
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoiceId = addInvoice({
      clientId,
      amount,
      description: `Session on ${sessionDateFormatted}`,
      dueDate: dueDate.toISOString(),
      status: 'pending',
      sessionIds: [savedSessionId],
    });

    // Link session to invoice
    const linked = linkSessionsToInvoice([savedSessionId], invoiceId);
    if (!linked) {
      Alert.alert(
        'Linking Failed',
        'Could not link session to invoice. Please link it manually from the invoice screen.'
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowInvoicePrompt(false);

    // Navigate to edit invoice if no default rate set
    if (!defaultSessionRate) {
      router.replace({ pathname: '/add-invoice', params: { clientId, invoiceId } });
    } else {
      runPostSessionTriggers(sessionCount + 1, invoiceCount + 1);
      router.back();
    }
  };

  const handleSkipInvoice = () => {
    setShowInvoicePrompt(false);
    runPostSessionTriggers(sessionCount + 1, invoiceCount);
    router.back();
  };

  const handleDismissSharePrompt = () => {
    setShowSharePrompt(false);
    router.back();
  };

  const handleShareFromPrompt = async () => {
    await shareApp();
    setShowSharePrompt(false);
    router.back();
  };

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
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {appointment ? 'Session Notes' : 'New Session'}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>{client.name}</Text>
          </View>
          <Pressable
            onPress={handleSave}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.accent }}
          >
            <Check size={20} color={isDark ? '#2B3830' : '#FFFFFF'} />
          </Pressable>
        </View>

        {/* Appointment Context Banner */}
        {appointment && (
          <Animated.View
            entering={FadeInDown.delay(25).springify()}
            className="mx-4 mt-4 rounded-xl p-3 flex-row items-center"
            style={{ backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD' }}
          >
            <Calendar size={18} color="#0369A1" />
            <Text className="ml-2 text-sm" style={{ color: '#0369A1' }}>
              Scheduled for {new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </Animated.View>
        )}

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Session Date/Time */}
          <Animated.View entering={FadeInDown.delay(25).springify()} className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Session Date & Time
            </Text>
            <Pressable
              onPress={() => {
                setShowDateEditor(!showDateEditor);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="flex-row items-center rounded-xl px-4 py-3.5"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Clock size={18} color={colors.textTertiary} />
              <Text className="flex-1 ml-3 text-base" style={{ color: colors.text }}>
                {sessionDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at{' '}
                {sessionDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
              <Text className="text-sm" style={{ color: colors.accent }}>Edit</Text>
            </Pressable>

            {showDateEditor && (
              <View
                className="mt-2 rounded-xl p-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                {/* Date Row */}
                <View className="flex-row items-center justify-between mb-3">
                  <Pressable
                    onPress={() => {
                      const d = new Date(sessionDate);
                      d.setDate(d.getDate() - 1);
                      setSessionDate(d);
                      Haptics.selectionAsync();
                    }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.bgSecondary }}
                  >
                    <Text style={{ color: colors.text }}>{'<'}</Text>
                  </Pressable>
                  <Text className="text-base font-medium" style={{ color: colors.text }}>
                    {sessionDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Pressable
                    onPress={() => {
                      const d = new Date(sessionDate);
                      d.setDate(d.getDate() + 1);
                      setSessionDate(d);
                      Haptics.selectionAsync();
                    }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.bgSecondary }}
                  >
                    <Text style={{ color: colors.text }}>{'>'}</Text>
                  </Pressable>
                </View>

                {/* Time Row */}
                <View className="flex-row items-center justify-center gap-2">
                  <Pressable
                    onPress={() => {
                      const d = new Date(sessionDate);
                      d.setHours(d.getHours() - 1);
                      setSessionDate(d);
                      Haptics.selectionAsync();
                    }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.bgSecondary }}
                  >
                    <Minus size={16} color={colors.text} />
                  </Pressable>
                  <View className="px-4 py-2 rounded-lg" style={{ backgroundColor: colors.bgSecondary }}>
                    <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                      {sessionDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      const d = new Date(sessionDate);
                      d.setHours(d.getHours() + 1);
                      setSessionDate(d);
                      Haptics.selectionAsync();
                    }}
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.bgSecondary }}
                  >
                    <Plus size={16} color={colors.text} />
                  </Pressable>
                </View>

                {/* Use Now button */}
                <Pressable
                  onPress={() => {
                    setSessionDate(new Date());
                    Haptics.selectionAsync();
                  }}
                  className="mt-3 py-2 items-center rounded-lg"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <Text className="text-sm font-medium" style={{ color: colors.accent }}>
                    Use Current Time
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>

          {/* Duration */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
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
            {/* Quick Duration Buttons */}
            <View className="flex-row gap-2 mt-3">
              {[30, 45, 50, 60, 90].map((d) => {
                const isSelected = duration === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => {
                      setDuration(d);
                      Haptics.selectionAsync();
                    }}
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: isSelected ? colors.accent : colors.card,
                      borderWidth: isSelected ? 0 : 1,
                      borderColor: colors.cardBorder,
                    }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: isSelected ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textSecondary }}
                    >
                      {d}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Mood */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mt-6">
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
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mt-6">
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
          <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-6">
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Invoice Prompt Modal */}
      <Modal
        visible={showInvoicePrompt}
        animationType="fade"
        transparent
        onRequestClose={handleSkipInvoice}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Animated.View
            entering={FadeIn.springify()}
            className="mx-6 rounded-3xl p-6 w-full max-w-sm"
            style={{ backgroundColor: colors.card }}
          >
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Receipt size={32} color="#047857" />
              </View>
              <Text className="text-xl font-bold text-center" style={{ color: colors.text }}>
                Session Saved!
              </Text>
              <Text className="text-base text-center mt-2" style={{ color: colors.textSecondary }}>
                Would you like to create an invoice for this session?
              </Text>
            </View>

            {defaultSessionRate ? (
              <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.bgSecondary }}>
                <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                  Amount: <Text className="font-semibold" style={{ color: colors.text }}>${defaultSessionRate}</Text>
                </Text>
              </View>
            ) : (
              <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FEF3C7' }}>
                <Text className="text-sm text-center" style={{ color: '#92400E' }}>
                  You'll be able to set the amount on the next screen
                </Text>
              </View>
            )}

            <Pressable
              onPress={handleCreateInvoice}
              className="py-4 rounded-full items-center mb-3"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="font-semibold text-base" style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>
                Create Invoice
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSkipInvoice}
              className="py-3 items-center"
            >
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                Not Now
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* 10th Session Share Prompt */}
      <Modal
        visible={showSharePrompt}
        animationType="fade"
        transparent
        onRequestClose={handleDismissSharePrompt}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Animated.View
            entering={FadeIn.springify()}
            className="mx-6 rounded-3xl p-6 w-full max-w-sm"
            style={{ backgroundColor: colors.card }}
          >
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#E0F2FE' }}
              >
                <Share2 size={32} color="#0369A1" />
              </View>
              <Text className="text-xl font-bold text-center" style={{ color: colors.text }}>
                Enjoying SteadyPractice?
              </Text>
              <Text className="text-base text-center mt-2" style={{ color: colors.textSecondary }}>
                Share it with a colleague.
              </Text>
            </View>

            <Pressable
              onPress={handleShareFromPrompt}
              className="py-4 rounded-full items-center mb-3 flex-row justify-center"
              style={{ backgroundColor: colors.accent }}
            >
              <Share2 size={18} color={isDark ? '#2B3830' : '#FFFFFF'} />
              <Text className="font-semibold text-base ml-2" style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>
                Share SteadyPractice
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDismissSharePrompt}
              className="py-3 items-center"
            >
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                Not Now
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
