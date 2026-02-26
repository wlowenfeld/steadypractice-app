import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActionSheetIOS,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Calendar,
  FileText,
  Play,
  User,
  Receipt,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { MOOD_OPTIONS, INVOICE_STATUS_COLORS, getDisplayStatus } from '@/lib/types';

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();

  const appointments = useAppStore((s) => s.appointments);
  const clients = useAppStore((s) => s.clients);
  const sessions = useAppStore((s) => s.sessions);
  const invoices = useAppStore((s) => s.invoices);
  const deleteAppointment = useAppStore((s) => s.deleteAppointment);
  const updateAppointment = useAppStore((s) => s.updateAppointment);

  const appointment = appointments.find((a) => a.id === id);
  const client = appointment ? clients.find((c) => c.id === appointment.clientId) : null;
  const completedSession = appointment?.completedSessionId
    ? sessions.find((s) => s.id === appointment.completedSessionId)
    : null;
  const invoice = completedSession?.invoiceId
    ? invoices.find((i) => i.id === completedSession.invoiceId)
    : null;

  const [notes, setNotes] = useState(appointment?.notes ?? '');

  if (!appointment || !client) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <Text style={{ color: colors.textSecondary }}>Appointment not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-medium" style={{ color: colors.text }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarColors = [
    { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#D1FAE5', text: '#047857' },
    { bg: '#E0F2FE', text: '#0369A1' },
    { bg: '#FFE4E6', text: '#BE123C' },
    { bg: '#EDE9FE', text: '#7C3AED' },
    { bg: '#FFEDD5', text: '#C2410C' },
  ];
  const colorIndex = client.name.charCodeAt(0) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

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

  const isUpcoming = new Date(appointment.scheduledDate) > new Date();

  const handleDelete = () => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAppointment(appointment.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  const handleReschedule = () => {
    router.push({
      pathname: '/schedule-appointment',
      params: { editAppointmentId: appointment.id },
    });
  };

  const handleMenu = () => {
    if (Platform.OS === 'ios') {
      const options = isUpcoming
        ? ['Cancel', 'Reschedule', 'Delete']
        : ['Cancel', 'Delete'];
      const destructiveIndex = isUpcoming ? 2 : 1;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (isUpcoming && buttonIndex === 1) {
            handleReschedule();
          } else if (buttonIndex === destructiveIndex) {
            handleDelete();
          }
        }
      );
    } else {
      // Android fallback
      if (isUpcoming) {
        Alert.alert('Appointment Options', undefined, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reschedule', onPress: handleReschedule },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete() },
        ]);
      } else {
        handleDelete();
      }
    }
  };

  const handleStartSession = () => {
    router.push({
      pathname: '/add-session',
      params: { clientId: client.id, appointmentId: appointment.id },
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text className="text-lg font-semibold" style={{ color: colors.text }}>
          Appointment
        </Text>
        <Pressable
          onPress={handleMenu}
          className="w-10 h-10 items-center justify-center"
        >
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Info */}
        <Animated.View
          entering={FadeIn.delay(100)}
          className="items-center pt-4 pb-6"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: avatarColor.bg }}
          >
            <Text className="text-2xl font-bold" style={{ color: avatarColor.text }}>
              {getInitials(client.name)}
            </Text>
          </View>
          <Pressable onPress={() => router.push(`/client/${client.id}`)}>
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {client.name}
            </Text>
          </Pressable>
          <View
            className="flex-row items-center mt-2 px-3 py-1 rounded-full"
            style={{ backgroundColor: '#3B82F620' }}
          >
            <Calendar size={14} color="#3B82F6" />
            <Text className="text-sm ml-1" style={{ color: '#3B82F6' }}>
              {isUpcoming ? 'Upcoming' : 'Past'}
            </Text>
          </View>
        </Animated.View>

        {/* Date & Time */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mx-4 mb-4">
          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <View className="flex-row items-center p-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Calendar size={18} color={colors.textTertiary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Date</Text>
                <Text className="text-base" style={{ color: colors.text }}>
                  {formatDate(appointment.scheduledDate)}
                </Text>
              </View>
            </View>
            <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />
            <View className="flex-row items-center p-4">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Clock size={18} color={colors.textTertiary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm" style={{ color: colors.textSecondary }}>Time & Duration</Text>
                <Text className="text-base" style={{ color: colors.text }}>
                  {formatTime(appointment.scheduledDate)} · {appointment.duration} minutes
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mx-4 mb-6">
          <Text
            className="text-sm font-semibold uppercase tracking-wide mb-2"
            style={{ color: colors.textSecondary }}
          >
            Notes
          </Text>
          <TextInput
            placeholder="Add notes, agenda items..."
            placeholderTextColor={colors.textTertiary}
            value={notes}
            onChangeText={(text) => {
              setNotes(text);
              updateAppointment(appointment.id, { notes: text.trim() || undefined });
            }}
            multiline
            textAlignVertical="top"
            className="rounded-2xl px-4 py-3.5 text-base min-h-[100px]"
            style={{
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              color: colors.text,
            }}
          />
        </Animated.View>

        {/* Completed Session & Invoice — only for past appointments */}
        {!isUpcoming && completedSession && (
          <>
            {/* Session card */}
            <Animated.View entering={FadeInDown.delay(250).springify()} className="mx-4 mb-4">
              <Text
                className="text-sm font-semibold uppercase tracking-wide mb-2"
                style={{ color: colors.textSecondary }}
              >
                Session
              </Text>
              <Pressable
                onPress={() => router.push(`/session/${completedSession.id}`)}
                className="rounded-2xl p-4 flex-row items-center active:opacity-80"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <FileText size={18} color={colors.textTertiary} />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-base font-medium" style={{ color: colors.text }}>
                    {new Date(completedSession.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })} · {completedSession.duration} min
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    {completedSession.mood && (
                      <View className="flex-row items-center mr-2">
                        <View
                          className="w-2 h-2 rounded-full mr-1"
                          style={{
                            backgroundColor: MOOD_OPTIONS.find((m) => m.value === completedSession.mood)?.color ?? colors.textTertiary,
                          }}
                        />
                        <Text className="text-xs capitalize" style={{ color: colors.textTertiary }}>
                          {completedSession.mood}
                        </Text>
                      </View>
                    )}
                    {completedSession.notes && (
                      <Text
                        className="text-xs flex-1"
                        style={{ color: colors.textTertiary }}
                        numberOfLines={1}
                      >
                        {completedSession.notes}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </Pressable>
            </Animated.View>

            {/* Invoice status */}
            <Animated.View entering={FadeInDown.delay(300).springify()} className="mx-4 mb-6">
              <Text
                className="text-sm font-semibold uppercase tracking-wide mb-2"
                style={{ color: colors.textSecondary }}
              >
                Billing
              </Text>
              {invoice ? (() => {
                const displayStatus = getDisplayStatus(invoice);
                return (
                <Pressable
                  onPress={() => router.push(`/invoice/${invoice.id}`)}
                  className="flex-row items-center rounded-2xl p-4 active:opacity-80"
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
                      params: { clientId: appointment.clientId, sessionId: completedSession.id },
                    })
                  }
                  className="flex-row items-center rounded-2xl p-4 active:opacity-80"
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
          </>
        )}

        {/* Start Session Button */}
        {isUpcoming && (
          <Animated.View entering={FadeInDown.delay(250).springify()} className="mx-4">
            <Pressable
              onPress={handleStartSession}
              className="flex-row items-center justify-center rounded-2xl py-4 active:opacity-80"
              style={{ backgroundColor: '#10B981' }}
            >
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text className="text-base font-semibold ml-2" style={{ color: '#FFFFFF' }}>
                Start Session
              </Text>
            </Pressable>
            <Text className="text-sm text-center mt-2" style={{ color: colors.textTertiary }}>
              Begin a session and log notes
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
