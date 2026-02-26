import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  FileText,
  Check,
  Send,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useSecurity } from '@/lib/security';
import { INVOICE_STATUS_COLORS, Invoice, InvoiceStatus, getDisplayStatus } from '@/lib/types';
import { sendInvoiceEmail } from '@/lib/emailInvoice';

type FilterType = 'all' | 'pending' | 'paid' | 'overdue';

export default function InvoicesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { businessName, paymentInstructions } = useSecurity();
  const [filter, setFilter] = useState<FilterType>('all');

  const invoices = useAppStore((s) => s.invoices);
  const clients = useAppStore((s) => s.clients);
  const markInvoicePaid = useAppStore((s) => s.markInvoicePaid);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    if (filter !== 'all') {
      filtered = filtered.filter((inv) => getDisplayStatus(inv) === filter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, filter]);

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

  const handleSendInvoiceEmail = async (invoice: Invoice) => {
    const client = clientMap.get(invoice.clientId);
    if (!client) return;
    await sendInvoiceEmail({
      invoice,
      client,
      businessName: businessName || '',
      paymentInstructions: paymentInstructions || '',
    });
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ];

  const counts = useMemo(() => ({
    all: invoices.length,
    pending: invoices.filter((i) => getDisplayStatus(i) === 'pending').length,
    paid: invoices.filter((i) => getDisplayStatus(i) === 'paid').length,
    overdue: invoices.filter((i) => getDisplayStatus(i) === 'overdue').length,
  }), [invoices]);

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
          All Invoices
        </Text>
        <View className="w-10" />
      </View>

      {/* Filter Tabs */}
      <Animated.View entering={FadeIn.delay(100)} className="px-4 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          {filters.map((f) => {
            const isActive = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  setFilter(f.key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className="flex-row items-center px-4 py-2 rounded-full"
                style={{
                  backgroundColor: isActive ? colors.accent : colors.bgSecondary,
                }}
              >
                <Text
                  className="font-medium"
                  style={{ color: isActive ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textSecondary }}
                >
                  {f.label}
                </Text>
                {counts[f.key] > 0 && (
                  <View
                    className="ml-2 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : colors.cardBorder }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: isActive ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textTertiary }}
                    >
                      {counts[f.key]}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredInvoices.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
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
              {filter === 'all' ? 'No invoices yet' : `No ${filter} invoices`}
            </Text>
            <Text className="text-sm text-center mt-1" style={{ color: colors.textSecondary }}>
              {filter === 'all'
                ? 'Create your first invoice from a client page'
                : 'No invoices match this filter'}
            </Text>
          </Animated.View>
        ) : (
          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            {filteredInvoices.map((invoice, index) => {
              const client = clientMap.get(invoice.clientId);
              const displayStatus = getDisplayStatus(invoice);
              const statusColors = INVOICE_STATUS_COLORS[displayStatus];
              return (
                <Animated.View
                  key={invoice.id}
                  entering={FadeInDown.delay(150 + index * 30).springify()}
                >
                  {index > 0 && <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />}
                  <Pressable
                    onPress={() => router.push(`/invoice/${invoice.id}`)}
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
                    <View className="items-end ml-3">
                      <Text className="text-base font-semibold" style={{ color: colors.text }}>
                        {formatCurrency(invoice.amount)}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: statusColors.bg }}
                        >
                          <Text className="text-xs font-medium capitalize" style={{ color: statusColors.text }}>
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
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
