import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  User,
  Search,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { Client } from '@/lib/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TIME_SLOTS = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
];

function parseTimeSlot(slot: string): { hours: number; minutes: number } {
  const [time, period] = slot.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

export default function ScheduleAppointmentScreen() {
  const router = useRouter();
  const { clientId: preselectedClientId, date: preselectedDate, editAppointmentId } = useLocalSearchParams<{
    clientId?: string;
    date?: string;
    editAppointmentId?: string;
  }>();
  const { colors, isDark } = useTheme();

  const clients = useAppStore((s) => s.clients);
  const appointments = useAppStore((s) => s.appointments);
  const addAppointment = useAppStore((s) => s.addAppointment);
  const updateAppointment = useAppStore((s) => s.updateAppointment);

  const editingAppointment = editAppointmentId
    ? appointments.find((a) => a.id === editAppointmentId)
    : null;

  // Derive initial values from editing appointment if present
  const editClientId = editingAppointment?.clientId ?? preselectedClientId;
  const editDate = (() => {
    if (editingAppointment) return new Date(editingAppointment.scheduledDate);
    if (preselectedDate) {
      // Parse date string safely: extract YYYY-MM-DD to avoid UTC-to-local shift
      const parts = preselectedDate.split('T')[0].split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return new Date(preselectedDate);
    }
    return new Date();
  })();

  const formatTimeFromDate = (d: Date): string => {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const [step, setStep] = useState<'client' | 'datetime' | 'details'>(
    editingAppointment || editClientId ? 'datetime' : 'client'
  );
  const [selectedClient, setSelectedClient] = useState<Client | null>(
    editClientId ? clients.find((c) => c.id === editClientId) ?? null : null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(editDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(
    editingAppointment ? formatTimeFromDate(new Date(editingAppointment.scheduledDate)) : null
  );
  const [duration, setDuration] = useState(editingAppointment?.duration ?? 50);
  const [notes, setNotes] = useState(editingAppointment?.notes ?? '');
  const [searchQuery, setSearchQuery] = useState('');

  const [viewMonth, setViewMonth] = useState(editDate);

  const activeClients = useMemo(() => {
    return clients
      .filter((c) => !c.isArchived)
      .filter((c) =>
        searchQuery
          ? c.name.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      );
  }, [clients, searchQuery]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [viewMonth]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setStep('datetime');
    Haptics.selectionAsync();
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    Haptics.selectionAsync();
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    Haptics.selectionAsync();
  };

  const handleContinueToDetails = () => {
    if (selectedTime) {
      setStep('details');
      Haptics.selectionAsync();
    }
  };

  const adjustDuration = (amount: number) => {
    const newDuration = Math.max(15, Math.min(180, duration + amount));
    setDuration(newDuration);
    Haptics.selectionAsync();
  };

  const saveAppointment = () => {
    if (!selectedClient || !selectedTime) return;

    const { hours, minutes } = parseTimeSlot(selectedTime);
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hours, minutes, 0, 0);

    if (editingAppointment) {
      updateAppointment(editingAppointment.id, {
        clientId: selectedClient.id,
        scheduledDate: scheduledDate.toISOString(),
        duration,
        notes: notes.trim() || undefined,
      });
    } else {
      addAppointment({
        clientId: selectedClient.id,
        scheduledDate: scheduledDate.toISOString(),
        duration,
        notes: notes.trim() || undefined,
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleSave = () => {
    if (!selectedClient || !selectedTime) return;

    // Calculate the new appointment's time interval
    const { hours, minutes } = parseTimeSlot(selectedTime);
    const newStart = new Date(selectedDate);
    newStart.setHours(hours, minutes, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    const existingAppointments = useAppStore.getState().appointments;
    const hasConflict = existingAppointments.some((apt) => {
      if (apt.isCompleted) return false;
      // Exclude self when editing
      if (editingAppointment && apt.id === editingAppointment.id) return false;

      const aptStart = new Date(apt.scheduledDate).getTime();
      const aptEnd = aptStart + apt.duration * 60 * 1000;

      // Overlap: newStart < existingEnd && newEnd > existingStart
      return newStart.getTime() < aptEnd && newEnd.getTime() > aptStart;
    });

    if (hasConflict) {
      Alert.alert(
        'Time Conflict',
        'This appointment overlaps with an existing one. Schedule anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: editingAppointment ? 'Update Anyway' : 'Schedule Anyway', onPress: () => saveAppointment() },
        ]
      );
    } else {
      saveAppointment();
    }
  };


  const isDateSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

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
            onPress={() => {
              if (step === 'datetime' && !editClientId) {
                setStep('client');
              } else if (step === 'details') {
                setStep('datetime');
              } else {
                router.back();
              }
            }}
            className="w-10 h-10 items-center justify-center"
          >
            {step === 'client' || (step === 'datetime' && editClientId) ? (
              <X size={24} color={colors.textTertiary} />
            ) : (
              <ChevronLeft size={24} color={colors.text} />
            )}
          </Pressable>
          <View className="items-center">
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {editingAppointment ? 'Reschedule' : 'Schedule Appointment'}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {step === 'client' && 'Select a client'}
              {step === 'datetime' && selectedClient?.name}
              {step === 'details' && 'Session details'}
            </Text>
          </View>
          <Pressable
            onPress={step === 'details' ? handleSave : handleContinueToDetails}
            disabled={step === 'datetime' && !selectedTime}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                (step === 'datetime' && !selectedTime) ? colors.bgSecondary : colors.accent,
            }}
          >
            {step === 'details' ? (
              <Check size={20} color={isDark ? '#2B3830' : '#FFFFFF'} />
            ) : (
              <ChevronRight
                size={20}
                color={
                  step === 'datetime' && !selectedTime
                    ? colors.textTertiary
                    : isDark
                    ? '#2B3830'
                    : '#FFFFFF'
                }
              />
            )}
          </Pressable>
        </View>

        {/* Step 1: Client Selection */}
        {step === 'client' && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Search */}
            <View
              className="flex-row items-center rounded-xl px-4 py-3 mb-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Search size={20} color={colors.textTertiary} />
              <TextInput
                placeholder="Search clients..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-base"
                style={{ color: colors.text }}
              />
            </View>

            {activeClients.length === 0 ? (
              <View className="items-center py-12">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center mb-3"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <User size={28} color={colors.textTertiary} />
                </View>
                <Text className="text-base font-medium" style={{ color: colors.text }}>
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  {searchQuery ? 'Try a different search' : 'Add a client first'}
                </Text>
              </View>
            ) : (
              activeClients.map((client, index) => {
                const colorIndex = client.name.charCodeAt(0) % avatarColors.length;
                const avatarColor = avatarColors[colorIndex];

                return (
                  <Animated.View
                    key={client.id}
                    entering={FadeInDown.delay(index * 30).springify()}
                  >
                    <Pressable
                      onPress={() => handleSelectClient(client)}
                      className="flex-row items-center rounded-2xl p-4 mb-2 active:opacity-80"
                      style={{
                        backgroundColor: colors.card,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                      }}
                    >
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: avatarColor.bg }}
                      >
                        <Text className="text-lg font-semibold" style={{ color: avatarColor.text }}>
                          {getInitials(client.name)}
                        </Text>
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-base font-semibold" style={{ color: colors.text }}>
                          {client.name}
                        </Text>
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          {client.sessionCount} session{client.sessionCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 'datetime' && (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Calendar */}
            <Animated.View
              entering={FadeIn.delay(100)}
              className="mx-4 mt-4 rounded-2xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              {/* Month Navigation */}
              <View className="flex-row items-center justify-between mb-4">
                <Pressable
                  onPress={() => {
                    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
                    Haptics.selectionAsync();
                  }}
                  className="w-10 h-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <ChevronLeft size={20} color={colors.text} />
                </Pressable>
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                  {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </Text>
                <Pressable
                  onPress={() => {
                    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
                    Haptics.selectionAsync();
                  }}
                  className="w-10 h-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <ChevronRight size={20} color={colors.text} />
                </Pressable>
              </View>

              {/* Day Headers */}
              <View className="flex-row mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <View key={day} className="flex-1 items-center">
                    <Text className="text-xs font-medium" style={{ color: colors.textTertiary }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View className="flex-row flex-wrap">
                {calendarDays.map((date, index) => {
                  const selected = date ? isDateSelected(date) : false;
                  const today = date ? isToday(date) : false;

                  return (
                    <Pressable
                      key={index}
                      onPress={() => date && handleSelectDate(date)}
                      disabled={!date}
                      className="items-center justify-center"
                      style={{ width: '14.28%', height: 44 }}
                    >
                      {date && (
                        <View
                          className="w-9 h-9 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: selected
                              ? colors.accent
                              : today
                              ? colors.bgSecondary
                              : 'transparent',
                          }}
                        >
                          <Text
                            className="text-sm font-medium"
                            style={{
                              color: selected
                                ? isDark ? '#2B3830' : '#FFFFFF'
                                : today
                                ? colors.text
                                : colors.textSecondary,
                            }}
                          >
                            {date.getDate()}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Time Slots */}
            <View className="mt-4 px-4">
              <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                Select Time
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TIME_SLOTS.map((time, index) => {
                  const isSelected = selectedTime === time;
                  return (
                    <Animated.View
                      key={time}
                      entering={FadeInDown.delay(index * 20).springify()}
                    >
                      <Pressable
                        onPress={() => handleSelectTime(time)}
                        className="px-4 py-2.5 rounded-xl"
                        style={{
                          backgroundColor: isSelected ? colors.accent : colors.card,
                          borderWidth: isSelected ? 0 : 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text
                          className="text-sm font-medium"
                          style={{
                            color: isSelected
                              ? isDark ? '#2B3830' : '#FFFFFF'
                              : colors.textSecondary,
                          }}
                        >
                          {time}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Summary */}
            <Animated.View
              entering={FadeInDown.delay(50).springify()}
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Text className="text-base font-semibold mb-2" style={{ color: colors.text }}>
                {selectedClient?.name}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })} at {selectedTime}
              </Text>
            </Animated.View>

            {/* Duration */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                Duration
              </Text>
              <View
                className="flex-row items-center justify-center rounded-2xl p-4 mb-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <Pressable
                  onPress={() => adjustDuration(-15)}
                  className="w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <Minus size={24} color={colors.text} />
                </Pressable>
                <View className="flex-1 items-center mx-4">
                  <View className="flex-row items-baseline">
                    <Text className="text-4xl font-bold" style={{ color: colors.text }}>
                      {duration}
                    </Text>
                    <Text className="text-lg ml-2" style={{ color: colors.textSecondary }}>
                      min
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => adjustDuration(15)}
                  className="w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <Plus size={24} color={colors.text} />
                </Pressable>
              </View>
              {/* Quick Duration Buttons */}
              <View className="flex-row gap-2 mb-6">
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
                        style={{
                          color: isSelected
                            ? isDark ? '#2B3830' : '#FFFFFF'
                            : colors.textSecondary,
                        }}
                      >
                        {d}m
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Notes */}
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                Notes (optional)
              </Text>
              <TextInput
                placeholder="Agenda items, topics to discuss..."
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
