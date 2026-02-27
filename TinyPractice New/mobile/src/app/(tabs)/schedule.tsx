import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { ScheduledAppointment } from '@/lib/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const appointments = useAppStore((s) => s.appointments);
  const sessions = useAppStore((s) => s.sessions);
  const clients = useAppStore((s) => s.clients);


  const getClientName = useCallback((clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name ?? 'Unknown';
  }, [clients]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Get appointments/sessions count for each day
  const dayData = useMemo(() => {
    const data: Record<number, { appointments: number; sessions: number }> = {};

    appointments.forEach((apt) => {
      const date = new Date(apt.scheduledDate);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        if (!data[day]) data[day] = { appointments: 0, sessions: 0 };
        if (!apt.isCompleted) data[day].appointments++;
      }
    });

    sessions.forEach((session) => {
      const date = new Date(session.date);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        if (!data[day]) data[day] = { appointments: 0, sessions: 0 };
        data[day].sessions++;
      }
    });

    return data;
  }, [appointments, sessions, currentMonth, currentYear]);

  const selectedDateAppointments = useMemo(() => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);
    return appointments
      .filter((a) => {
        if (a.isCompleted) return false;
        const appointmentDate = new Date(a.scheduledDate);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate.getTime() === targetDate.getTime();
      })
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [appointments, selectedDate]);

  const selectedDateSessions = useMemo(() => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    return sessions
      .filter((s) => {
        const sessionDate = new Date(s.date);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === targetDate.getTime();
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedDate, sessions]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    Haptics.selectionAsync();
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    Haptics.selectionAsync();
  };

  const selectDay = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    Haptics.selectionAsync();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatSelectedDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const diffDays = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-3 flex-row items-center justify-between">
        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          Schedule
        </Text>
        <Pressable
          onPress={() => router.push('/schedule-appointment')}
          className="p-2.5 rounded-full active:opacity-80"
          style={{ backgroundColor: colors.accent }}
        >
          <Plus size={20} color={isDark ? '#2B3830' : '#FFFFFF'} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Calendar */}
        <Animated.View
          entering={FadeIn.delay(100)}
          className="mx-4 rounded-2xl p-4 mb-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
        >
          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={goToPreviousMonth}
              className="w-10 h-10 items-center justify-center rounded-full active:opacity-60"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              {MONTHS[currentMonth]} {currentYear}
            </Text>
            <Pressable
              onPress={goToNextMonth}
              className="w-10 h-10 items-center justify-center rounded-full active:opacity-60"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <ChevronRight size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Day Headers */}
          <View className="flex-row mb-2">
            {DAYS.map((day) => (
              <View key={day} className="flex-1 items-center">
                <Text className="text-xs font-medium" style={{ color: colors.textTertiary }}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((day, index) => {
              const hasData = day ? dayData[day] : null;
              const selected = day ? isSelected(day) : false;
              const today = day ? isToday(day) : false;

              return (
                <Pressable
                  key={index}
                  onPress={() => day && selectDay(day)}
                  disabled={!day}
                  className="items-center justify-center"
                  style={{ width: '14.28%', height: 44 }}
                >
                  {day && (
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
                        {day}
                      </Text>
                      {hasData && (hasData.appointments > 0 || hasData.sessions > 0) && !selected && (
                        <View className="absolute -bottom-0.5 flex-row gap-0.5">
                          {hasData.appointments > 0 && (
                            <View
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: '#3B82F6' }}
                            />
                          )}
                          {hasData.sessions > 0 && (
                            <View
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: '#10B981' }}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Selected Date Header */}
        <View className="px-4 mb-3">
          <Text className="text-xl font-semibold" style={{ color: colors.text }}>
            {formatSelectedDate()}
          </Text>
          <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
            {selectedDateAppointments.length} scheduled · {selectedDateSessions.length} completed
          </Text>
        </View>

        {/* Scheduled Appointments */}
        {selectedDateAppointments.length > 0 && (
          <View className="mb-4">
            <Text
              className="text-xs font-semibold uppercase tracking-wide px-4 mb-2"
              style={{ color: colors.textSecondary }}
            >
              Scheduled
            </Text>
            {selectedDateAppointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                clientName={getClientName(appointment.clientId)}
                index={index}
                colors={colors}
                isDark={isDark}
                onPress={() => router.push(`/appointment/${appointment.id}`)}
              />
            ))}
          </View>
        )}

        {/* Completed Sessions */}
        {selectedDateSessions.length > 0 && (
          <View>
            <Text
              className="text-xs font-semibold uppercase tracking-wide px-4 mb-2"
              style={{ color: colors.textSecondary }}
            >
              Completed Sessions
            </Text>
            {selectedDateSessions.map((session, index) => (
              <Animated.View
                key={session.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  onPress={() => router.push(`/session/${session.id}`)}
                  className="flex-row items-center rounded-2xl p-4 mb-2 mx-4 active:opacity-80"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: '#10B98120' }}
                  >
                    <Check size={18} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>
                      {getClientName(session.clientId)}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Clock size={12} color={colors.textTertiary} />
                      <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                        {formatTime(session.date)} · {session.duration} min
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {selectedDateAppointments.length === 0 && selectedDateSessions.length === 0 && (
          <Animated.View
            entering={FadeIn.delay(200)}
            className="items-center justify-center px-8 py-12"
          >
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <CalendarIcon size={28} color={colors.textTertiary} />
            </View>
            <Text className="text-base font-medium text-center" style={{ color: colors.text }}>
              No sessions scheduled
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: colors.textSecondary }}>
              Tap + to schedule an appointment
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppointmentCard({
  appointment,
  clientName,
  index,
  colors,
  isDark,
  onPress,
}: {
  appointment: ScheduledAppointment;
  clientName: string;
  index: number;
  colors: ReturnType<typeof useTheme>['colors'];
  isDark: boolean;
  onPress: () => void;
}) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center rounded-2xl p-4 mb-2 mx-4 active:opacity-80"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderLeftWidth: 3,
          borderLeftColor: '#3B82F6',
        }}
      >
        <View className="flex-1">
          <Text className="text-base font-semibold" style={{ color: colors.text }}>
            {clientName}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <Clock size={12} color={colors.textTertiary} />
            <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
              {formatTime(appointment.scheduledDate)} · {appointment.duration} min
            </Text>
          </View>
          {appointment.notes && (
            <Text
              className="text-sm mt-1.5"
              numberOfLines={1}
              style={{ color: colors.textTertiary }}
            >
              {appointment.notes}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
