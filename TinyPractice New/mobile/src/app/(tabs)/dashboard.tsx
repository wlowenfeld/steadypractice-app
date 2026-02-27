import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  ChevronRight,
  Clock,
  FileText,
  Crown,
  Download,
  Lock,
  Calendar,
  Sparkles,
  Zap,
  LucideIcon,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { INVOICE_STATUS_COLORS, getDisplayStatus } from '@/lib/types';
import { useSubscription } from '@/lib/useSubscription';
import Paywall from '@/components/Paywall';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRO_FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Users, title: 'Unlimited Clients', description: 'Grow without limits' },
  { icon: Download, title: 'CSV Export', description: 'Export all your data' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [showPaywall, setShowPaywall] = useState(false);
  const { isPro, isConfigError, checkSubscription } = useSubscription();

  const clients = useAppStore((s) => s.clients);
  const sessions = useAppStore((s) => s.sessions);
  const invoices = useAppStore((s) => s.invoices);
  const appointments = useAppStore((s) => s.appointments);

  // Warn if subscription check failed in production
  useEffect(() => {
    if (isConfigError && !__DEV__) {
      Alert.alert(
        'Subscription Check Failed',
        'We could not verify your subscription status. If you are a Pro subscriber, please contact support.'
      );
    }
  }, [isConfigError]);

  // Single-pass invoice aggregation
  const { totalRevenue, outstandingAmount, overdueInvoices, revenueByMonth, recentInvoices } = useMemo(() => {
    const now = new Date();
    let totalRev = 0;
    let outstanding = 0;
    const overdue: typeof invoices = [];
    const monthlyRevenue: Record<string, number> = {};
    const sorted = [...invoices].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const inv of invoices) {
      if (inv.status === 'paid') {
        totalRev += inv.amount;
        if (inv.paidDate) {
          const date = new Date(inv.paidDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + inv.amount;
        }
      } else {
        outstanding += inv.amount;
        if (new Date(inv.dueDate) < now) {
          overdue.push(inv);
        }
      }
    }

    const revByMonth = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      totalRevenue: totalRev,
      outstandingAmount: outstanding,
      overdueInvoices: overdue,
      revenueByMonth: revByMonth,
      recentInvoices: sorted.slice(0, 5),
    };
  }, [invoices]);

  const activeClients = useMemo(
    () => clients.filter((c) => !c.isArchived).length,
    [clients]
  );

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter((a) => !a.isCompleted && new Date(a.scheduledDate) >= now)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
      .slice(0, 3);
  }, [appointments]);

  const totalSessions = sessions.length;

  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  // Usage-based milestone triggers
  const showSessionMilestone = totalSessions >= 10 && totalSessions < 25;
  const showRevenueMilestone = totalRevenue >= 500 && totalRevenue < 2000;
  const showGrowthBanner = activeClients >= 3 && activeClients < 5;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
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

  const formatAppointmentDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(100)} className="px-4 pt-4 pb-6">
          <Text className="text-3xl font-bold" style={{ color: colors.text }}>
            Dashboard
          </Text>
          <Text className="text-base mt-1" style={{ color: colors.textSecondary }}>
            Revenue & client overview
          </Text>
        </Animated.View>

        {/* Usage-Based Milestone Banners */}
        {!isPro && showSessionMilestone && (
          <Animated.View entering={FadeInDown.delay(120).springify()} className="mx-4 mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/settings');
              }}
              className="overflow-hidden rounded-2xl active:opacity-90"
            >
              <LinearGradient
                colors={['#7C3AED', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Zap size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold" style={{ color: '#FFFFFF' }}>
                    {totalSessions} sessions logged!
                  </Text>
                  <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    You're on a roll! Upgrade to Pro for unlimited clients
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {!isPro && showRevenueMilestone && !showSessionMilestone && (
          <Animated.View entering={FadeInDown.delay(120).springify()} className="mx-4 mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/settings');
              }}
              className="overflow-hidden rounded-2xl active:opacity-90"
            >
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <TrendingUp size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold" style={{ color: '#FFFFFF' }}>
                    You've earned {formatCurrency(totalRevenue)}!
                  </Text>
                  <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Time to go Pro? Export reports & grow unlimited
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {!isPro && showGrowthBanner && !showSessionMilestone && !showRevenueMilestone && (
          <Animated.View entering={FadeInDown.delay(120).springify()} className="mx-4 mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/settings');
              }}
              className="overflow-hidden rounded-2xl active:opacity-90"
            >
              <LinearGradient
                colors={['#D97706', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Sparkles size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold" style={{ color: '#FFFFFF' }}>
                    Growing your practice?
                  </Text>
                  <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Upgrade to Pro for unlimited clients
                  </Text>
                </View>
                <ChevronRight size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Revenue Cards */}
        <View className="flex-row px-4 gap-3 mb-6">
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: '#10B981' }}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <DollarSign size={20} color="#FFFFFF" />
            </View>
            <Text className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Total Revenue
            </Text>
            <Text className="text-2xl font-bold mt-1" style={{ color: '#FFFFFF' }}>
              {formatCurrency(totalRevenue)}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <View className="w-10 h-10 rounded-full items-center justify-center mb-3" style={{ backgroundColor: '#FEF3C7' }}>
              <Clock size={20} color="#B45309" />
            </View>
            <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              Outstanding
            </Text>
            <Text className="text-2xl font-bold mt-1" style={{ color: colors.text }}>
              {formatCurrency(outstandingAmount)}
            </Text>
          </Animated.View>
        </View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          className="mx-4 mb-6 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
        >
          <View className="flex-row">
            <Pressable
              onPress={() => router.push('/(tabs)')}
              className="flex-1 p-4 items-center active:opacity-80"
            >
              <Users size={22} color={colors.textTertiary} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                {activeClients}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Active Clients
              </Text>
            </Pressable>
            <View className="w-px" style={{ backgroundColor: colors.cardBorder }} />
            <Pressable
              onPress={() => router.push('/invoices')}
              className="flex-1 p-4 items-center active:opacity-80"
            >
              <FileText size={22} color={colors.textTertiary} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                {invoices.length}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Invoices
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Overdue Invoices Alert */}
        {overdueInvoices.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="mx-4 mb-6"
          >
            <Pressable
              onPress={() => router.push('/reports')}
              className="rounded-2xl p-4 flex-row items-center active:opacity-80"
              style={{ backgroundColor: '#FEE2E2' }}
            >
              <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#FECACA' }}>
                <AlertCircle size={24} color="#DC2626" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-base font-semibold" style={{ color: '#991B1B' }}>
                  {overdueInvoices.length} Overdue Invoice{overdueInvoices.length > 1 ? 's' : ''}
                </Text>
                <Text className="text-sm" style={{ color: '#B91C1C' }}>
                  {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0))} total outstanding
                </Text>
              </View>
              <ChevronRight size={20} color="#DC2626" />
            </Pressable>
          </Animated.View>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <Animated.View entering={FadeInDown.delay(320).springify()} className="mx-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                Upcoming Appointments
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/schedule')} className="active:opacity-80">
                <Text className="text-sm font-medium" style={{ color: colors.textTertiary }}>
                  See All
                </Text>
              </Pressable>
            </View>
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              {upcomingAppointments.map((appointment, index) => {
                const client = clientMap.get(appointment.clientId);
                return (
                  <View key={appointment.id}>
                    {index > 0 && <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />}
                    <Pressable
                      onPress={() => router.push(`/appointment/${appointment.id}`)}
                      className="flex-row items-center p-4 active:opacity-80"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#E0F2FE' }}
                      >
                        <Calendar size={18} color="#0369A1" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-base font-medium" style={{ color: colors.text }}>
                          {client?.name ?? 'Unknown Client'}
                        </Text>
                        <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                          {formatAppointmentDate(appointment.scheduledDate)} · {formatTime(appointment.scheduledDate)}
                        </Text>
                      </View>
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: '#E0F2FE' }}
                      >
                        <Text className="text-xs font-medium" style={{ color: '#0369A1' }}>
                          {appointment.duration}m
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Monthly Revenue */}
        {revenueByMonth.length > 0 && (
          <Animated.View entering={FadeInDown.delay(350).springify()} className="mx-4 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                Revenue by Month
              </Text>
              <Pressable onPress={() => router.push('/reports')} className="active:opacity-80">
                <Text className="text-sm font-medium" style={{ color: colors.textTertiary }}>
                  See All
                </Text>
              </Pressable>
            </View>
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              {revenueByMonth.slice(0, 3).map((item, index) => {
                const [yearStr, monthStr] = item.month.split('-');
                const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1);
                const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <View key={item.month}>
                    {index > 0 && <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />}
                    <View className="flex-row items-center justify-between p-4">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#D1FAE5' }}
                        >
                          <TrendingUp size={18} color="#047857" />
                        </View>
                        <Text className="text-base font-medium ml-3" style={{ color: colors.text }}>
                          {monthName}
                        </Text>
                      </View>
                      <Text className="text-base font-semibold" style={{ color: '#10B981' }}>
                        {formatCurrency(item.revenue)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Recent Invoices */}
        <Animated.View entering={FadeInDown.delay(400).springify()} className="mx-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
              Recent Invoices
            </Text>
            <Pressable onPress={() => router.push('/invoices')} className="active:opacity-80">
              <Text className="text-sm font-medium" style={{ color: colors.textTertiary }}>
                See All
              </Text>
            </Pressable>
          </View>

          {recentInvoices.length === 0 ? (
            <View
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <FileText size={24} color={colors.textTertiary} />
              </View>
              <Text className="text-base font-medium" style={{ color: colors.text }}>
                No invoices yet
              </Text>
              <Text className="text-sm text-center mt-1" style={{ color: colors.textSecondary }}>
                Create your first invoice from a client page
              </Text>
            </View>
          ) : (
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              {recentInvoices.map((invoice, index) => {
                const client = clientMap.get(invoice.clientId);
                const displayStatus = getDisplayStatus(invoice);
                const statusColors = INVOICE_STATUS_COLORS[displayStatus];
                return (
                  <View key={invoice.id}>
                    {index > 0 && <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />}
                    <Pressable
                      onPress={() => router.push(`/client/${invoice.clientId}`)}
                      className="flex-row items-center p-4 active:opacity-80"
                    >
                      <View className="flex-1">
                        <Text className="text-base font-medium" style={{ color: colors.text }}>
                          {client?.name ?? 'Unknown Client'}
                        </Text>
                        <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                          {invoice.description} · Due {formatDate(invoice.dueDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-base font-semibold" style={{ color: colors.text }}>
                          {formatCurrency(invoice.amount)}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-full mt-1"
                          style={{ backgroundColor: statusColors.bg }}
                        >
                          <Text className="text-xs font-medium capitalize" style={{ color: statusColors.text }}>
                            {displayStatus}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Pro Features Preview - Enhanced */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(450).springify()} className="mx-4 mt-6">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPaywall(true);
              }}
              className="rounded-2xl overflow-hidden active:opacity-95"
              style={{ borderWidth: 2, borderColor: '#F59E0B' }}
            >
              {/* Gradient Header */}
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Crown size={24} color="#FFFFFF" />
                    <View className="ml-3">
                      <Text className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                        Upgrade to Pro
                      </Text>
                      <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
                        Unlock all features
                      </Text>
                    </View>
                  </View>
                  <View className="bg-white/20 px-3 py-1.5 rounded-full">
                    <Text className="text-sm font-bold" style={{ color: '#FFFFFF' }}>
                      Upgrade
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Feature List */}
              <View style={{ backgroundColor: colors.card }}>
                {PRO_FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <View key={feature.title}>
                      {index > 0 && <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />}
                      <View className="flex-row items-center p-4">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#FEF3C7' }}
                        >
                          <Icon size={18} color="#B45309" />
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-base font-medium" style={{ color: colors.text }}>
                            {feature.title}
                          </Text>
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {feature.description}
                          </Text>
                        </View>
                        <Lock size={16} color={colors.textTertiary} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Pro Active Badge */}
        {isPro && (
          <Animated.View entering={FadeInDown.delay(450).springify()} className="mx-4 mt-6">
            <View
              className="rounded-2xl overflow-hidden"
              style={{ borderWidth: 2, borderColor: '#10B981' }}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center">
                  <Crown size={24} color="#FFFFFF" />
                  <View className="ml-3 flex-1">
                    <Text className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                      TinyPractice Pro
                    </Text>
                    <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      All features unlocked
                    </Text>
                  </View>
                  <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <Check size={18} color="#FFFFFF" strokeWidth={3} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* Feature Tease: Export Button */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(500).springify()} className="mx-4 mt-4 mb-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPaywall(true);
              }}
              className="flex-row items-center justify-center py-3 rounded-xl active:opacity-80"
              style={{ backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Download size={18} color={colors.textTertiary} />
              <Text className="text-base font-medium ml-2" style={{ color: colors.textTertiary }}>
                Export All Data
              </Text>
              <View className="ml-2 px-2 py-0.5 rounded-full flex-row items-center" style={{ backgroundColor: '#FEF3C7' }}>
                <Lock size={10} color="#B45309" />
                <Text className="text-xs font-medium ml-1" style={{ color: '#B45309' }}>
                  Pro
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Paywall Modal */}
        <Paywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onSuccess={checkSubscription}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
