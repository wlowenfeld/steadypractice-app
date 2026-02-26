import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Clock,
  Calendar,
  FileText,
  ChevronRight,
  Archive,
  DollarSign,
  Check,
  Send,
  Receipt,
  Play,
  CalendarPlus,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';
import { MOOD_OPTIONS, INVOICE_STATUS_COLORS, Invoice, getDisplayStatus } from '@/lib/types';
import { sendInvoiceEmail } from '@/lib/emailInvoice';

type TabType = 'meetings' | 'invoices';

export default function ClientDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { businessName, paymentInstructions } = useSecurity();
  const [activeTab, setActiveTab] = useState<TabType>('meetings');

  const client = useAppStore((s) => s.clients.find((c) => c.id === (id ?? '')));
  const allSessions = useAppStore((s) => s.sessions);
  const allInvoices = useAppStore((s) => s.invoices);
  const allAppointments = useAppStore((s) => s.appointments);
  const archiveClient = useAppStore((s) => s.archiveClient);
  const deleteClient = useAppStore((s) => s.deleteClient);
  const markInvoicePaid = useAppStore((s) => s.markInvoicePaid);
  const deleteInvoice = useAppStore((s) => s.deleteInvoice);

  const sessions = useMemo(
    () => allSessions
      .filter((s) => s.clientId === (id ?? ''))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allSessions, id]
  );

  const invoices = useMemo(
    () => allInvoices
      .filter((inv) => inv.clientId === (id ?? ''))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allInvoices, id]
  );

  const appointments = useMemo(
    () => allAppointments
      .filter((a) => a.clientId === (id ?? ''))
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()),
    [allAppointments, id]
  );

  const totalRevenue = useMemo(
    () => invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
    [invoices]
  );

  const unbilledSessions = useMemo(
    () => allSessions
      .filter((s) => s.clientId === (id ?? '') && !s.invoiceId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [allSessions, id]
  );

  const handleSendInvoiceEmail = async (invoice: Invoice) => {
    if (!client) return;
    await sendInvoiceEmail({
      invoice,
      client,
      businessName: businessName || '',
      paymentInstructions: paymentInstructions || '',
    });
  };

  const handleInvoiceActions = (invoice: Invoice) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    Alert.alert(
      `Invoice - ${formatCurrency(invoice.amount)}`,
      invoice.description,
      [
        {
          text: 'Edit',
          onPress: () => router.push({ pathname: '/add-invoice', params: { clientId: client?.id, invoiceId: invoice.id } }),
        },
        {
          text: invoice.status !== 'paid' ? 'Mark as Paid' : 'Already Paid',
          onPress: invoice.status !== 'paid' ? () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markInvoicePaid(invoice.id);
          } : undefined,
          style: invoice.status === 'paid' ? 'cancel' : 'default',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Invoice',
              `Are you sure you want to delete this ${formatCurrency(invoice.amount)} invoice?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    deleteInvoice(invoice.id);
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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

  const handleMenu = () => {
    Alert.alert(client.name, undefined, [
      {
        text: 'Edit Client',
        onPress: () => router.push(`/edit-client/${client.id}`),
      },
      {
        text: client.isArchived ? 'Unarchive' : 'Archive',
        onPress: () => archiveClient(client.id),
      },
      {
        text: 'Delete Client',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Client',
            `Are you sure you want to delete ${client.name}? This will also delete all their data.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteClient(client.id);
                  router.back();
                },
              },
            ]
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeTab === 'meetings') {
      router.push({ pathname: '/schedule-appointment', params: { clientId: client.id } });
    } else if (activeTab === 'invoices') {
      router.push({ pathname: '/add-invoice', params: { clientId: client.id } });
    }
  };

  const formatSessionDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const upcomingAppointments = appointments.filter((a) => !a.isCompleted && new Date(a.scheduledDate) >= new Date());
  const meetingsCount = sessions.length + upcomingAppointments.length;

  // Find today's appointment(s) for this client
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const todaysAppointment = appointments.find((a) => {
    if (a.isCompleted) return false;
    const apptDate = new Date(a.scheduledDate);
    return apptDate >= todayStart && apptDate < todayEnd;
  });

  // Check if appointment is ready for session (within 30 min before or anytime after start)
  const isAppointmentReady = (appt: typeof appointments[0]) => {
    const apptTime = new Date(appt.scheduledDate).getTime();
    const now = Date.now();
    const thirtyMinBefore = apptTime - 30 * 60 * 1000;
    return now >= thirtyMinBefore;
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'meetings', label: 'Meetings', count: meetingsCount },
    { key: 'invoices', label: 'Invoices', count: invoices.length },
  ];

  const pendingInvoices = invoices.filter((i) => getDisplayStatus(i) !== 'paid');
  const overdueInvoices = invoices.filter((i) => getDisplayStatus(i) === 'overdue');

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
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleAddAction}
            className="px-4 py-2 rounded-full flex-row items-center active:opacity-80"
            style={{ backgroundColor: colors.accent }}
          >
            <Plus size={18} color={isDark ? '#2B3830' : '#FFFFFF'} strokeWidth={2.5} />
            <Text className="font-semibold ml-1" style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>
              {activeTab === 'meetings' ? 'Schedule' : 'Invoice'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleMenu}
            className="w-10 h-10 items-center justify-center"
          >
            <MoreHorizontal size={24} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Animated.View
          entering={FadeIn.delay(100)}
          className="items-center pt-4 pb-4"
        >
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: avatarColor.bg }}
          >
            <Text className="text-2xl font-bold" style={{ color: avatarColor.text }}>
              {getInitials(client.name)}
            </Text>
          </View>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            {client.name}
          </Text>

          {client.isArchived && (
            <View
              className="flex-row items-center mt-2 px-3 py-1 rounded-full"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <Archive size={14} color={colors.textTertiary} />
              <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                Archived
              </Text>
            </View>
          )}

          {client.tags.length > 0 && (
            <View className="flex-row flex-wrap justify-center gap-2 mt-2 px-8">
              {client.tags.map((tag) => (
                <View
                  key={tag}
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Today's Appointment Banner */}
        {todaysAppointment && (
          <Animated.View
            entering={FadeInDown.delay(120).springify()}
            className="mx-4 mb-4"
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (isAppointmentReady(todaysAppointment)) {
                  router.push({
                    pathname: '/add-session',
                    params: { clientId: client.id, appointmentId: todaysAppointment.id },
                  });
                } else {
                  router.push(`/appointment/${todaysAppointment.id}`);
                }
              }}
              className="rounded-2xl p-4 active:opacity-90"
              style={{
                backgroundColor: isAppointmentReady(todaysAppointment) ? '#047857' : '#E0F2FE',
                borderWidth: 1,
                borderColor: isAppointmentReady(todaysAppointment) ? '#065F46' : '#BAE6FD',
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{
                      backgroundColor: isAppointmentReady(todaysAppointment) ? '#065F46' : '#0369A1',
                    }}
                  >
                    {isAppointmentReady(todaysAppointment) ? (
                      <Play size={18} color="#FFFFFF" />
                    ) : (
                      <Clock size={18} color="#FFFFFF" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold"
                      style={{ color: isAppointmentReady(todaysAppointment) ? '#FFFFFF' : '#0C4A6E' }}
                    >
                      {isAppointmentReady(todaysAppointment) ? 'Ready to Start' : 'Today\'s Appointment'}
                    </Text>
                    <Text
                      className="text-sm"
                      style={{ color: isAppointmentReady(todaysAppointment) ? '#D1FAE5' : '#0369A1' }}
                    >
                      {formatTime(todaysAppointment.scheduledDate)} · {todaysAppointment.duration} min
                    </Text>
                  </View>
                </View>
                <View
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: isAppointmentReady(todaysAppointment) ? '#FFFFFF' : '#0369A1',
                  }}
                >
                  <Text
                    className="font-semibold text-sm"
                    style={{ color: isAppointmentReady(todaysAppointment) ? '#047857' : '#FFFFFF' }}
                  >
                    {isAppointmentReady(todaysAppointment) ? 'Start Session' : 'View'}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(135).springify()}
          className="flex-row justify-center gap-4 mx-4 mb-4"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/schedule-appointment', params: { clientId: client.id } });
            }}
            className="flex-1 flex-row items-center justify-center py-3 rounded-2xl active:opacity-80"
            style={{ backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD' }}
          >
            <CalendarPlus size={18} color="#0369A1" />
            <Text className="font-medium ml-2" style={{ color: '#0369A1' }}>
              Schedule
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/add-invoice', params: { clientId: client.id } });
            }}
            className="flex-1 flex-row items-center justify-center py-3 rounded-2xl active:opacity-80"
            style={{ backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' }}
          >
            <Receipt size={18} color="#047857" />
            <Text className="font-medium ml-2" style={{ color: '#047857' }}>
              Invoice
            </Text>
          </Pressable>
        </Animated.View>

        {/* Contact Info */}
        {(client.email || client.phone) && (
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mx-4 mb-4">
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              {client.email && (
                <Pressable
                  onPress={() => client.email && Linking.openURL(`mailto:${client.email}`)}
                  className="flex-row items-center p-4 active:opacity-80"
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.bgSecondary }}
                  >
                    <Mail size={18} color={colors.textTertiary} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>Email</Text>
                    <Text className="text-base" style={{ color: colors.text }}>{client.email}</Text>
                  </View>
                </Pressable>
              )}
              {client.email && client.phone && (
                <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />
              )}
              {client.phone && (
                <Pressable
                  onPress={() => client.phone && Linking.openURL(`tel:${client.phone}`)}
                  className="flex-row items-center p-4 active:opacity-80"
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.bgSecondary }}
                  >
                    <Phone size={18} color={colors.textTertiary} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-sm" style={{ color: colors.textSecondary }}>Phone</Text>
                    <Text className="text-base" style={{ color: colors.text }}>{client.phone}</Text>
                  </View>
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="flex-row mx-4 mb-4"
        >
          <View
            className="flex-1 rounded-2xl p-3 mr-2 items-center"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Clock size={18} color={colors.textTertiary} />
            <Text className="text-xl font-bold mt-1" style={{ color: colors.text }}>
              {client.sessionCount}
            </Text>
            <Text className="text-xs" style={{ color: colors.textSecondary }}>Sessions</Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-3 mr-2 items-center"
            style={{ backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' }}
          >
            <DollarSign size={18} color="#047857" />
            <Text className="text-xl font-bold mt-1" style={{ color: '#047857' }}>
              {formatCurrency(totalRevenue)}
            </Text>
            <Text className="text-xs" style={{ color: '#059669' }}>Revenue</Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-3 items-center"
            style={{
              backgroundColor: overdueInvoices.length > 0 ? '#FEE2E2' : colors.card,
              borderWidth: 1,
              borderColor: overdueInvoices.length > 0 ? '#FECACA' : colors.cardBorder
            }}
          >
            <FileText size={18} color={overdueInvoices.length > 0 ? '#DC2626' : colors.textTertiary} />
            <Text className="text-xl font-bold mt-1" style={{ color: overdueInvoices.length > 0 ? '#DC2626' : colors.text }}>
              {pendingInvoices.length}
            </Text>
            <Text className="text-xs" style={{ color: overdueInvoices.length > 0 ? '#B91C1C' : colors.textSecondary }}>
              {overdueInvoices.length > 0 ? 'Overdue' : 'Pending'}
            </Text>
          </View>
        </Animated.View>

        {/* Notes */}
        {client.notes && (
          <Animated.View entering={FadeInDown.delay(250).springify()} className="mx-4 mb-4">
            <View
              className="rounded-2xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Text className="text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
                {client.notes}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mx-4 mb-4">
          <View
            className="flex-row rounded-xl overflow-hidden"
            style={{ backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    setActiveTab(tab.key);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="flex-1 flex-row items-center justify-center py-3"
                  style={{
                    backgroundColor: isActive ? colors.accent : 'transparent',
                    borderRadius: isActive ? 10 : 0,
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: isActive ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textSecondary }}
                  >
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View
                      className="ml-2 px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : colors.cardBorder }}
                    >
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: isActive ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textTertiary }}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Tab Content */}
        <View className="mx-4">
          {activeTab === 'meetings' && (
            <>
              {/* Upcoming Appointments Section */}
              {upcomingAppointments.length > 0 && (
                <>
                  <Text className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: colors.textSecondary }}>
                    Upcoming
                  </Text>
                  {upcomingAppointments.map((appointment, index) => {
                    const ready = isAppointmentReady(appointment);
                    return (
                      <Animated.View
                        key={appointment.id}
                        entering={FadeInDown.delay(350 + index * 50).springify()}
                      >
                        <Pressable
                          onPress={() => {
                            if (ready) {
                              router.push({
                                pathname: '/add-session',
                                params: { clientId: client.id, appointmentId: appointment.id },
                              });
                            } else {
                              router.push(`/appointment/${appointment.id}`);
                            }
                          }}
                          className="flex-row items-center rounded-2xl p-4 mb-2 active:opacity-80"
                          style={{
                            backgroundColor: ready ? '#D1FAE5' : '#E0F2FE',
                            borderWidth: 1,
                            borderColor: ready ? '#A7F3D0' : '#BAE6FD',
                          }}
                        >
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: ready ? '#047857' : '#0369A1' }}
                          >
                            {ready ? (
                              <Play size={18} color="#FFFFFF" />
                            ) : (
                              <Calendar size={18} color="#FFFFFF" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-semibold" style={{ color: ready ? '#065F46' : '#0C4A6E' }}>
                              {formatSessionDate(appointment.scheduledDate)}
                            </Text>
                            <Text className="text-sm mt-0.5" style={{ color: ready ? '#047857' : '#0369A1' }}>
                              {formatTime(appointment.scheduledDate)} · {appointment.duration} min
                            </Text>
                          </View>
                          {ready ? (
                            <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: '#047857' }}>
                              <Text className="text-xs font-semibold" style={{ color: '#FFFFFF' }}>
                                Start Session
                              </Text>
                            </View>
                          ) : (
                            <ChevronRight size={18} color="#0369A1" />
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </>
              )}

              {/* Past Sessions Section */}
              {sessions.length > 0 && (
                <>
                  <Text className="text-sm font-semibold uppercase tracking-wide mb-2 mt-4" style={{ color: colors.textSecondary }}>
                    Past Sessions
                  </Text>
                  {sessions.map((session, index) => {
                    const moodOption = MOOD_OPTIONS.find((m) => m.value === session.mood);
                    return (
                      <Animated.View
                        key={session.id}
                        entering={FadeInDown.delay(350 + (upcomingAppointments.length + index) * 50).springify()}
                      >
                        <Pressable
                          onPress={() => router.push(`/session/${session.id}`)}
                          className="flex-row items-center rounded-2xl p-4 mb-2 active:opacity-80"
                          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
                        >
                          <View className="flex-1">
                            <Text className="text-base font-semibold" style={{ color: colors.text }}>
                              {formatSessionDate(session.date)}
                            </Text>
                            <View className="flex-row items-center mt-1">
                              <Clock size={14} color={colors.textTertiary} />
                              <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                                {formatTime(session.date)} · {session.duration} min
                              </Text>
                            </View>
                            {session.notes && (
                              <Text
                                className="text-sm mt-2"
                                numberOfLines={2}
                                style={{ color: colors.textSecondary }}
                              >
                                {session.notes}
                              </Text>
                            )}
                          </View>
                          <View className="items-end ml-3">
                            {session.invoiceId && (
                              <View
                                className="px-2 py-1 rounded-full mb-1"
                                style={{ backgroundColor: '#D1FAE5' }}
                              >
                                <Text
                                  className="text-xs font-medium"
                                  style={{ color: '#047857' }}
                                >
                                  Billed
                                </Text>
                              </View>
                            )}
                            {moodOption && (
                              <View
                                className="px-2 py-1 rounded-full mb-2"
                                style={{ backgroundColor: moodOption.color + '20' }}
                              >
                                <Text
                                  className="text-xs font-medium"
                                  style={{ color: moodOption.color }}
                                >
                                  {moodOption.label}
                                </Text>
                              </View>
                            )}
                            <ChevronRight size={18} color={colors.textTertiary} />
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </>
              )}

              {/* Empty State */}
              {sessions.length === 0 && upcomingAppointments.length === 0 && (
                <Animated.View
                  entering={FadeInDown.delay(350).springify()}
                  className="rounded-2xl p-8 items-center"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: '#E0F2FE' }}
                  >
                    <Calendar size={24} color="#0369A1" />
                  </View>
                  <Text className="text-base font-medium" style={{ color: colors.text }}>
                    No meetings yet
                  </Text>
                  <Text className="text-sm text-center mt-1 mb-4" style={{ color: colors.textSecondary }}>
                    Schedule an appointment to get started
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push({ pathname: '/schedule-appointment', params: { clientId: client.id } });
                    }}
                    className="flex-row items-center px-6 py-3 rounded-full active:opacity-80"
                    style={{ backgroundColor: '#0369A1' }}
                  >
                    <CalendarPlus size={18} color="#FFFFFF" />
                    <Text className="font-semibold ml-2" style={{ color: '#FFFFFF' }}>
                      Schedule Appointment
                    </Text>
                  </Pressable>
                </Animated.View>
              )}

              {/* Log Unscheduled Session Link */}
              {(sessions.length > 0 || upcomingAppointments.length > 0) && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/add-session', params: { clientId: client.id } });
                  }}
                  className="mt-4 py-3 items-center active:opacity-70"
                >
                  <Text className="text-sm" style={{ color: colors.textTertiary }}>
                    Log unscheduled session
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {activeTab === 'invoices' && (
            <>
              {/* Unbilled Sessions Banner */}
              {unbilledSessions.length > 0 && (
                <Animated.View
                  entering={FadeInDown.delay(300).springify()}
                  className="mb-4"
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push({ pathname: '/add-invoice', params: { clientId: client.id } });
                    }}
                    className="rounded-xl p-3 flex-row items-center active:opacity-80"
                    style={{ backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#FDE68A' }}>
                      <Clock size={20} color="#B45309" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-sm font-semibold" style={{ color: '#92400E' }}>
                        {unbilledSessions.length} unbilled session{unbilledSessions.length > 1 ? 's' : ''}
                      </Text>
                      <Text className="text-xs" style={{ color: '#B45309' }}>
                        Tap to create an invoice
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#B45309" />
                  </Pressable>
                </Animated.View>
              )}

              {invoices.length === 0 ? (
                <Animated.View
                  entering={FadeInDown.delay(350).springify()}
                  className="rounded-2xl p-8 items-center"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
                >
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                    style={{ backgroundColor: '#D1FAE5' }}
                  >
                    <Receipt size={28} color="#047857" />
                  </View>
                  <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                    No invoices yet
                  </Text>
                  <Text className="text-sm text-center mt-1 mb-4" style={{ color: colors.textSecondary }}>
                    Create your first invoice to track payments for {client.name}
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push({ pathname: '/add-invoice', params: { clientId: client.id } });
                    }}
                    className="flex-row items-center px-6 py-3 rounded-full active:opacity-80"
                    style={{ backgroundColor: '#047857' }}
                  >
                    <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="font-semibold ml-2" style={{ color: '#FFFFFF' }}>
                      Create Invoice
                    </Text>
                  </Pressable>
                </Animated.View>
              ) : (
                invoices.map((invoice, index) => {
                  const displayStatus = getDisplayStatus(invoice);
                  const statusColors = INVOICE_STATUS_COLORS[displayStatus];
                  return (
                    <Animated.View
                      key={invoice.id}
                      entering={FadeInDown.delay(350 + index * 50).springify()}
                    >
                      <Pressable
                        onPress={() => router.push({ pathname: '/add-invoice', params: { clientId: client.id, invoiceId: invoice.id } })}
                        onLongPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          handleInvoiceActions(invoice);
                        }}
                        className="flex-row items-center rounded-2xl p-4 mb-2 active:opacity-80"
                        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
                      >
                        <View className="flex-1">
                          <Text className="text-base font-semibold" style={{ color: colors.text }}>
                            {invoice.description}
                          </Text>
                          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                            Due {formatSessionDate(invoice.dueDate)}
                          </Text>
                        </View>
                        <View className="items-end ml-3">
                          <Text className="text-base font-bold" style={{ color: colors.text }}>
                            {formatCurrency(invoice.amount)}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <View
                              className="px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: statusColors.bg }}
                            >
                              <Text
                                className="text-xs font-medium capitalize"
                                style={{ color: statusColors.text }}
                              >
                              {displayStatus}
                            </Text>
                            </View>
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                handleSendInvoiceEmail(invoice);
                              }}
                              className="ml-2 w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: '#E0F2FE' }}
                            >
                              <Send size={14} color="#0369A1" />
                            </Pressable>
                            {displayStatus !== 'paid' && (
                              <Pressable
                                onPress={(e) => {
                                  e.stopPropagation();
                                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                  markInvoicePaid(invoice.id);
                                }}
                                className="ml-1 w-8 h-8 rounded-full items-center justify-center"
                                style={{ backgroundColor: '#D1FAE5' }}
                              >
                                <Check size={16} color="#047857" strokeWidth={3} />
                              </Pressable>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
