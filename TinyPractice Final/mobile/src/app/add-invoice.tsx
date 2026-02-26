import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, DollarSign, Calendar, FileText, Check, CreditCard, Clock, Mail, Send, Trash2, CircleCheck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useSecurity } from '@/lib/security';
import { InvoiceStatus, Session, Invoice } from '@/lib/types';
import { sendInvoiceEmail } from '@/lib/emailInvoice';
import {
  maybeRequestReview,
  hasInvoiceCelebrationBeenShown,
  markInvoiceCelebrationShown,
} from '@/lib/conversionTriggers';
import { isSampleClient } from '@/lib/sampleData';

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

export default function AddInvoiceScreen() {
  const router = useRouter();
  const { clientId, invoiceId, sessionId } = useLocalSearchParams<{ clientId: string; invoiceId?: string; sessionId?: string }>();
  const { colors, isDark } = useTheme();
  const { paymentInstructions, setPaymentInstructions, defaultSessionRate, businessName } = useSecurity();

  const addInvoice = useAppStore((s) => s.addInvoice);
  const updateInvoice = useAppStore((s) => s.updateInvoice);
  const deleteInvoice = useAppStore((s) => s.deleteInvoice);
  const linkSessionsToInvoice = useAppStore((s) => s.linkSessionsToInvoice);
  const invoices = useAppStore((s) => s.invoices);
  const allClients = useAppStore((s) => s.clients);
  const allSessions = useAppStore((s) => s.sessions);
  const sessionCount = useAppStore((s) => s.sessions.filter((sess) => !isSampleClient(sess.clientId)).length);
  const invoiceCount = useAppStore((s) => s.invoices.filter((inv) => !isSampleClient(inv.clientId)).length);
  const isDemoMode = useAppStore((s) => s.isDemoMode);

  const existingInvoice = invoiceId ? invoices.find((i) => i.id === invoiceId) : null;
  const client = useMemo(
    () => allClients.find((c) => c.id === (clientId ?? existingInvoice?.clientId ?? '')),
    [allClients, clientId, existingInvoice?.clientId]
  );
  const isFirstInvoice = invoices.filter((i) => !isSampleClient(i.clientId)).length === 0 && !existingInvoice;

  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup celebration timer on unmount
  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
      }
    };
  }, []);

  // Get unbilled sessions for this client
  const unbilledSessions = useMemo(() => {
    if (!clientId) return [];
    return allSessions
      .filter((s) => s.clientId === clientId && !s.invoiceId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allSessions, clientId]);

  // Find pre-selected session for initial values
  const preSelectedSession = sessionId ? allSessions.find((s) => s.id === sessionId) : null;

  const [amount, setAmount] = useState(() => {
    if (existingInvoice?.amount) return existingInvoice.amount.toString();
    if (preSelectedSession && defaultSessionRate) return defaultSessionRate.toString();
    return '';
  });
  const [description, setDescription] = useState(() => {
    if (existingInvoice?.description) return existingInvoice.description;
    if (preSelectedSession) {
      const dateStr = new Date(preSelectedSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Session on ${dateStr}`;
    }
    return '';
  });
  const [status, setStatus] = useState<InvoiceStatus>(existingInvoice?.status ?? 'pending');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>(() => {
    if (existingInvoice?.sessionIds) return existingInvoice.sessionIds;
    if (sessionId) return [sessionId];
    return [];
  });
  const [dueDate, setDueDate] = useState(() => {
    if (existingInvoice?.dueDate) {
      return new Date(existingInvoice.dueDate);
    }
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPaymentSetup, setShowPaymentSetup] = useState(false);
  const [tempPaymentInstructions, setTempPaymentInstructions] = useState(paymentInstructions);

  // Auto-calculate amount when sessions are selected
  const toggleSession = (sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const newSelection = prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId];

      // Auto-update amount if we have a default rate
      if (defaultSessionRate && newSelection.length > 0) {
        setAmount((defaultSessionRate * newSelection.length).toString());
      }

      // Auto-update description based on selected sessions
      if (newSelection.length === 1) {
        const session = unbilledSessions.find((s) => s.id === newSelection[0]);
        if (session) {
          const dateStr = new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          setDescription(`Session on ${dateStr}`);
        }
      } else if (newSelection.length > 1) {
        setDescription(`${newSelection.length} sessions`);
      }

      return newSelection;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDelete = () => {
    if (!existingInvoice) return;
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete this invoice for ${formatCurrency(existingInvoice.amount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteInvoice(existingInvoice.id);
            router.back();
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const isValid = amount.trim() !== '' && parseFloat(amount) > 0 && description.trim() !== '';

  const handleSave = () => {
    if (!isValid || !clientId) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const invoiceData = {
      clientId,
      amount: parseFloat(amount),
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      status,
      paidDate: status === 'paid' ? new Date().toISOString() : undefined,
      sessionIds: selectedSessionIds,
    };

    if (existingInvoice) {
      updateInvoice(existingInvoice.id, invoiceData);
      // Link sessions to this invoice
      if (selectedSessionIds.length > 0) {
        linkSessionsToInvoice(selectedSessionIds, existingInvoice.id);
      }
      router.back();
    } else {
      const newInvoiceId = addInvoice(invoiceData);
      // Link sessions to the new invoice
      if (selectedSessionIds.length > 0) {
        linkSessionsToInvoice(selectedSessionIds, newInvoiceId);
      }

      // Create a complete invoice object for the email prompt
      const newInvoice: Invoice = {
        ...invoiceData,
        id: newInvoiceId,
        createdAt: new Date().toISOString(),
      };
      setSavedInvoice(newInvoice);

      // Show payment setup modal if first invoice and no payment instructions set
      if (isFirstInvoice && !paymentInstructions) {
        setShowPaymentSetup(true);
      } else {
        // Show email prompt for new invoices
        setShowEmailPrompt(true);
      }
    }
  };

  const handleSavePaymentInstructions = async () => {
    if (tempPaymentInstructions.trim()) {
      await setPaymentInstructions(tempPaymentInstructions.trim());
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPaymentSetup(false);
    // Show email prompt after payment setup
    setShowEmailPrompt(true);
  };

  const handleSkipPaymentSetup = () => {
    setShowPaymentSetup(false);
    // Show email prompt even if payment setup skipped
    setShowEmailPrompt(true);
  };

  /**
   * After invoice is sent/skipped, check if this is the first invoice ever
   * and show celebration modal if so. After 2 seconds, trigger review prompt.
   */
  const runPostInvoiceTriggers = async () => {
    const alreadyCelebrated = await hasInvoiceCelebrationBeenShown();
    // isFirstInvoice means there were 0 invoices before this one
    if (isFirstInvoice && !alreadyCelebrated) {
      await markInvoiceCelebrationShown();
      setShowCelebration(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // After 2 seconds, dismiss celebration and trigger review
      celebrationTimerRef.current = setTimeout(async () => {
        setShowCelebration(false);
        await maybeRequestReview({ sessionCount, invoiceCount: invoiceCount + 1, isDemoMode });
        router.back();
      }, 2000);
      return;
    }
    // No celebration — just try review prompt
    await maybeRequestReview({ sessionCount, invoiceCount: invoiceCount + 1, isDemoMode });
    router.back();
  };

  const handleSkipEmail = () => {
    setShowEmailPrompt(false);
    runPostInvoiceTriggers();
  };

  const handleSendEmail = async () => {
    if (savedInvoice && client) {
      await sendInvoiceEmail({
        invoice: savedInvoice,
        client,
        businessName: businessName || '',
        paymentInstructions: paymentInstructions || '',
        onSuccess: () => {
          setShowEmailPrompt(false);
          runPostInvoiceTriggers();
        },
      });
    }
  };

  const handleDismissCelebration = async () => {
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
    }
    setShowCelebration(false);
    await maybeRequestReview({ sessionCount, invoiceCount: invoiceCount + 1, isDemoMode });
    router.back();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Simple date picker: current month calendar
  const generateCalendarDays = () => {
    const year = dueDate.getFullYear();
    const month = dueDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(dueDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setDueDate(newDate);
  };

  const selectDay = (day: number) => {
    const newDate = new Date(dueDate);
    newDate.setDate(day);
    setDueDate(newDate);
    setShowDatePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: colors.cardBorder }}>
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <X size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold" style={{ color: colors.text }}>
          {existingInvoice ? 'Edit Invoice' : 'New Invoice'}
        </Text>
        <View className="flex-row items-center gap-2">
          {existingInvoice && (
            <Pressable
              onPress={handleDelete}
              className="w-10 h-10 items-center justify-center"
            >
              <Trash2 size={20} color="#DC2626" />
            </Pressable>
          )}
          <Pressable
            onPress={handleSave}
            disabled={!isValid}
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: isValid ? colors.accent : colors.bgSecondary }}
          >
            <Text
              className="font-semibold"
              style={{ color: isValid ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textTertiary }}
            >
              Save
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {client && (
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mt-4 mb-6">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Invoice for
            </Text>
            <Text className="text-xl font-semibold" style={{ color: colors.text }}>
              {client.name}
            </Text>
          </Animated.View>
        )}

        {/* Link to Sessions - show only for new invoices with unbilled sessions */}
        {!existingInvoice && unbilledSessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(120).springify()} className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Link to Sessions (optional)
            </Text>
            <View
              className="rounded-xl p-3"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <View className="flex-row flex-wrap gap-2">
                {unbilledSessions.map((session) => {
                  const isSelected = selectedSessionIds.includes(session.id);
                  const sessionDate = new Date(session.date);
                  const dateStr = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <Pressable
                      key={session.id}
                      onPress={() => toggleSession(session.id)}
                      className="flex-row items-center px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: isSelected ? colors.accent : colors.bgSecondary,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      }}
                    >
                      <Clock size={14} color={isSelected ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textSecondary} />
                      <Text
                        className="text-sm font-medium ml-1.5"
                        style={{ color: isSelected ? (isDark ? '#2B3830' : '#FFFFFF') : colors.text }}
                      >
                        {dateStr}
                      </Text>
                      <Text
                        className="text-xs ml-1"
                        style={{ color: isSelected ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textSecondary }}
                      >
                        ({session.duration}m)
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedSessionIds.length > 0 && defaultSessionRate && (
                <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                  {selectedSessionIds.length} session{selectedSessionIds.length > 1 ? 's' : ''} × ${defaultSessionRate} = ${selectedSessionIds.length * defaultSessionRate}
                </Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Amount */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Amount
          </Text>
          <View
            className="flex-row items-center rounded-xl px-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <DollarSign size={20} color={colors.textTertiary} />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              className="flex-1 py-4 px-2 text-lg"
              style={{ color: colors.text }}
            />
          </View>
        </Animated.View>

        {/* Description */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Description
          </Text>
          <View
            className="flex-row items-center rounded-xl px-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <FileText size={20} color={colors.textTertiary} />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Monthly coaching session"
              placeholderTextColor={colors.textTertiary}
              className="flex-1 py-4 px-2 text-base"
              style={{ color: colors.text }}
            />
          </View>
        </Animated.View>

        {/* Due Date */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Due Date
          </Text>
          <Pressable
            onPress={() => setShowDatePicker(!showDatePicker)}
            className="flex-row items-center rounded-xl px-4 py-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Calendar size={20} color={colors.textTertiary} />
            <Text className="flex-1 px-2 text-base" style={{ color: colors.text }}>
              {formatDate(dueDate)}
            </Text>
          </Pressable>

          {showDatePicker && (
            <View
              className="mt-2 rounded-xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Pressable onPress={() => changeMonth(-1)} className="p-2">
                  <Text style={{ color: colors.text }}>{'<'}</Text>
                </Pressable>
                <Text className="font-semibold" style={{ color: colors.text }}>
                  {dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <Pressable onPress={() => changeMonth(1)} className="p-2">
                  <Text style={{ color: colors.text }}>{'>'}</Text>
                </Pressable>
              </View>
              <View className="flex-row flex-wrap">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <View key={i} className="w-[14.28%] items-center py-2">
                    <Text className="text-xs" style={{ color: colors.textTertiary }}>
                      {day}
                    </Text>
                  </View>
                ))}
                {generateCalendarDays().map((day, i) => (
                  <Pressable
                    key={i}
                    onPress={() => day && selectDay(day)}
                    className="w-[14.28%] items-center py-2"
                  >
                    {day && (
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          day === dueDate.getDate() ? '' : ''
                        }`}
                        style={
                          day === dueDate.getDate()
                            ? { backgroundColor: colors.accent }
                            : undefined
                        }
                      >
                        <Text
                          style={{
                            color:
                              day === dueDate.getDate()
                                ? isDark
                                  ? '#2B3830'
                                  : '#FFFFFF'
                                : colors.text,
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Status */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
            Status
          </Text>
          <View className="flex-row gap-2">
            {STATUS_OPTIONS.map((option) => {
              const isSelected = status === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setStatus(option.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                  style={{
                    backgroundColor: isSelected ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  }}
                >
                  {isSelected && (
                    <Check size={16} color={isDark ? '#2B3830' : '#FFFFFF'} strokeWidth={3} />
                  )}
                  <Text
                    className={`font-medium ${isSelected ? 'ml-1' : ''}`}
                    style={{ color: isSelected ? (isDark ? '#2B3830' : '#FFFFFF') : colors.text }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Payment Instructions Setup Modal */}
      <Modal
        visible={showPaymentSetup}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleSkipPaymentSetup}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }}>
          <View className="flex-1 px-4 pt-6">
            <Animated.View entering={FadeIn.delay(100)} className="items-center mb-6">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <CreditCard size={32} color="#047857" />
              </View>
              <Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
                Add Payment Instructions
              </Text>
              <Text className="text-base text-center mt-2" style={{ color: colors.textSecondary }}>
                How should your clients pay you? This will be included in all invoice emails.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <TextInput
                value={tempPaymentInstructions}
                onChangeText={setTempPaymentInstructions}
                placeholder="e.g., Venmo @yourname, Zelle to email@example.com, or check payable to Your Name"
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
                className="rounded-xl px-4 py-4 text-base min-h-[120px]"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  color: colors.text,
                }}
                autoFocus
              />
            </Animated.View>

            <View className="mt-auto pb-4">
              <Pressable
                onPress={handleSavePaymentInstructions}
                className="py-4 rounded-full items-center mb-3"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="font-semibold text-base" style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>
                  Save Payment Instructions
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSkipPaymentSetup}
                className="py-3 items-center"
              >
                <Text className="text-base" style={{ color: colors.textSecondary }}>
                  Skip for now
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Email Invoice Prompt Modal */}
      <Modal
        visible={showEmailPrompt}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleSkipEmail}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }}>
          <View className="flex-1 px-4 pt-6">
            <Animated.View entering={FadeIn.delay(100)} className="items-center mb-6">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#E0F2FE' }}
              >
                <Mail size={32} color="#0369A1" />
              </View>
              <Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
                Invoice Created!
              </Text>
              <Text className="text-base text-center mt-2" style={{ color: colors.textSecondary }}>
                Would you like to email this invoice to {client?.name}?
              </Text>
              {savedInvoice && (
                <View
                  className="mt-4 rounded-xl p-4 w-full"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-base font-medium" style={{ color: colors.text }}>
                      {savedInvoice.description}
                    </Text>
                    <Text className="text-lg font-bold" style={{ color: '#10B981' }}>
                      ${savedInvoice.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>

            <View className="mt-auto pb-4">
              <Pressable
                onPress={handleSendEmail}
                className="py-4 rounded-full items-center mb-3 flex-row justify-center"
                style={{ backgroundColor: '#0369A1' }}
              >
                <Send size={20} color="#FFFFFF" />
                <Text className="font-semibold text-base ml-2" style={{ color: '#FFFFFF' }}>
                  Send Invoice Email
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSkipEmail}
                className="py-3 items-center"
              >
                <Text className="text-base" style={{ color: colors.textSecondary }}>
                  Skip for now
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* First Invoice Celebration Modal */}
      <Modal
        visible={showCelebration}
        animationType="fade"
        transparent
        onRequestClose={handleDismissCelebration}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onPress={handleDismissCelebration}
        >
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            className="mx-8 rounded-3xl p-8 w-full max-w-sm items-center"
            style={{ backgroundColor: colors.card }}
          >
            <Animated.View
              entering={ZoomIn.delay(200).springify().damping(10)}
              className="w-20 h-20 rounded-full items-center justify-center mb-5"
              style={{ backgroundColor: '#D1FAE5' }}
            >
              <CircleCheck size={44} color="#059669" />
            </Animated.View>

            <Animated.Text
              entering={FadeInUp.delay(300).springify()}
              className="text-2xl font-bold text-center mb-2"
              style={{ color: colors.text }}
            >
              Your first invoice is on its way!
            </Animated.Text>

            <Animated.Text
              entering={FadeInUp.delay(400).springify()}
              className="text-base text-center"
              style={{ color: colors.textSecondary }}
            >
              You're building something great.
            </Animated.Text>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
