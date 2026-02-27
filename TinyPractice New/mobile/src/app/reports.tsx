import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  TrendingUp,
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { INVOICE_STATUS_COLORS, getDisplayStatus } from '@/lib/types';

export default function ReportsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const invoices = useAppStore(useShallow((s) => s.invoices));
  const clients = useAppStore(useShallow((s) => s.clients));

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const totalRevenue = useMemo(
    () => invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
    [invoices]
  );

  const outstandingAmount = useMemo(
    () => invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0),
    [invoices]
  );

  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv) => {
      if (inv.status === 'paid') return false;
      const dueDate = new Date(inv.dueDate);
      return dueDate < now;
    });
  }, [invoices]);

  const invoicesByMonth = useMemo(() => {
    const grouped: Record<string, typeof invoices> = {};

    invoices.forEach((inv) => {
      const date = new Date(inv.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(inv);
    });

    return Object.entries(grouped)
      .map(([month, invs]) => ({
        month,
        invoices: invs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        total: invs.reduce((sum, inv) => sum + inv.amount, 0),
        paid: invs.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [invoices]);

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
      year: 'numeric',
    });
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let report = 'REVENUE REPORT\n';
    report += '==============\n\n';
    report += `Total Revenue: ${formatCurrency(totalRevenue)}\n`;
    report += `Outstanding: ${formatCurrency(outstandingAmount)}\n`;
    report += `Overdue: ${formatCurrency(overdueInvoices.reduce((s, i) => s + i.amount, 0))}\n\n`;

    report += 'INVOICES BY MONTH\n';
    report += '-----------------\n\n';

    invoicesByMonth.forEach(({ month, invoices: invs, total, paid }) => {
      const [yearStr, monthStr] = month.split('-');
      const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      report += `${monthName}\n`;
      report += `  Total: ${formatCurrency(total)} | Paid: ${formatCurrency(paid)}\n`;
      invs.forEach((inv) => {
        const client = clientMap.get(inv.clientId);
        report += `  - ${client?.name ?? 'Unknown'}: ${formatCurrency(inv.amount)} (${inv.status})\n`;
      });
      report += '\n';
    });

    try {
      await Share.share({
        message: report,
        title: 'Revenue Report',
      });
    } catch {
      // User cancelled
    }
  };

  const toggleMonth = (month: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedMonth(expandedMonth === month ? null : month);
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
          Reports
        </Text>
        <Pressable
          onPress={handleExport}
          className="w-10 h-10 items-center justify-center"
        >
          <Download size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <Animated.View entering={FadeIn.delay(100)} className="px-4 mb-6">
          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: '#10B981' }}
            >
              <Text className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Total Revenue
              </Text>
              <Text className="text-xl font-bold mt-1" style={{ color: '#FFFFFF' }}>
                {formatCurrency(totalRevenue)}
              </Text>
            </View>
            <View
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Outstanding
              </Text>
              <Text className="text-xl font-bold mt-1" style={{ color: '#F59E0B' }}>
                {formatCurrency(outstandingAmount)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Overdue Section */}
        {overdueInvoices.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()} className="mx-4 mb-6">
            <Text className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: colors.textSecondary }}>
              Overdue Invoices
            </Text>
            <View
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' }}
            >
              {overdueInvoices.map((invoice, index) => {
                const client = clientMap.get(invoice.clientId);
                return (
                  <View key={invoice.id}>
                    {index > 0 && <View className="h-px mx-4" style={{ backgroundColor: '#FECACA' }} />}
                    <Pressable
                      onPress={() => router.push(`/client/${invoice.clientId}`)}
                      className="flex-row items-center p-4 active:opacity-80"
                    >
                      <View className="flex-1">
                        <Text className="text-base font-medium" style={{ color: '#991B1B' }}>
                          {client?.name ?? 'Unknown'}
                        </Text>
                        <Text className="text-sm" style={{ color: '#B91C1C' }}>
                          Due {formatDate(invoice.dueDate)}
                        </Text>
                      </View>
                      <Text className="text-base font-bold" style={{ color: '#DC2626' }}>
                        {formatCurrency(invoice.amount)}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Monthly Breakdown */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mx-4">
          <Text className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: colors.textSecondary }}>
            Monthly Breakdown
          </Text>

          {invoicesByMonth.length === 0 ? (
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
                Invoices will appear here once created
              </Text>
            </View>
          ) : (
            invoicesByMonth.map(({ month, invoices: invs, total, paid }, monthIndex) => {
              const [yearStr, monthStr] = month.split('-');
              const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1);
              const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const isExpanded = expandedMonth === month;

              return (
                <Animated.View
                  key={month}
                  entering={FadeInDown.delay(250 + monthIndex * 50).springify()}
                  className="mb-3"
                >
                  <Pressable
                    onPress={() => toggleMonth(month)}
                    className="rounded-2xl p-4 active:opacity-80"
                    style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: '#D1FAE5' }}
                        >
                          <TrendingUp size={18} color="#047857" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-base font-semibold" style={{ color: colors.text }}>
                            {monthName}
                          </Text>
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {invs.length} invoice{invs.length !== 1 ? 's' : ''} · {formatCurrency(paid)} paid
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <Text className="text-base font-bold mr-2" style={{ color: '#10B981' }}>
                          {formatCurrency(total)}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={20} color={colors.textTertiary} />
                        ) : (
                          <ChevronDown size={20} color={colors.textTertiary} />
                        )}
                      </View>
                    </View>

                    {isExpanded && (
                      <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.cardBorder }}>
                        {invs.map((invoice, index) => {
                          const client = clientMap.get(invoice.clientId);
                          const displayStatus = getDisplayStatus(invoice);
                          const statusColors = INVOICE_STATUS_COLORS[displayStatus];
                          return (
                            <Pressable
                              key={invoice.id}
                              onPress={() => router.push(`/client/${invoice.clientId}`)}
                              className={`flex-row items-center justify-between py-3 ${index > 0 ? 'border-t' : ''}`}
                              style={index > 0 ? { borderTopWidth: 1, borderTopColor: colors.cardBorder } : undefined}
                            >
                              <View className="flex-1">
                                <Text className="text-base" style={{ color: colors.text }}>
                                  {client?.name ?? 'Unknown'}
                                </Text>
                                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                                  {invoice.description}
                                </Text>
                              </View>
                              <View className="items-end">
                                <Text className="text-base font-medium" style={{ color: colors.text }}>
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
                          );
                        })}
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
