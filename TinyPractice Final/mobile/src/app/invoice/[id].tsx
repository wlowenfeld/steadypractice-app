import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Send,
  Check,
  Receipt,
  FileText,
  DollarSign,
  Calendar,
  ChevronRight,
  User,
  Edit3,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';
import { INVOICE_STATUS_COLORS, getDisplayStatus } from '@/lib/types';
import { sendInvoiceEmail } from '@/lib/emailInvoice';

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { businessName, paymentInstructions } = useSecurity();

  const invoices = useAppStore((s) => s.invoices);
  const clients = useAppStore((s) => s.clients);
  const markInvoicePaid = useAppStore((s) => s.markInvoicePaid);

  const invoice = invoices.find((i) => i.id === id);
  const client = invoice ? clients.find((c) => c.id === invoice.clientId) : null;

  if (!invoice || !client) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }} edges={['top']}>
        <Text style={{ color: colors.textSecondary }}>Invoice not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="font-medium" style={{ color: colors.text }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const displayStatus = getDisplayStatus(invoice);
  const statusColors = INVOICE_STATUS_COLORS[displayStatus];

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await sendInvoiceEmail({
      invoice,
      client,
      businessName: businessName || '',
      paymentInstructions: paymentInstructions || '',
    });
  };

  const handleMarkPaid = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markInvoicePaid(invoice.id);
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/add-invoice',
      params: { clientId: invoice.clientId, invoiceId: invoice.id },
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
          Invoice
        </Text>
        <View className="w-10" />
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
            <View className="flex-row items-center gap-1">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                {client.name}
              </Text>
              <ChevronRight size={18} color={colors.textTertiary} />
            </View>
          </Pressable>
          <View
            className="flex-row items-center mt-3 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: statusColors.bg }}
          >
            <Receipt size={14} color={statusColors.text} />
            <Text className="text-sm font-semibold ml-1.5 capitalize" style={{ color: statusColors.text }}>
              {displayStatus}
            </Text>
          </View>
        </Animated.View>

        {/* Amount */}
        <Animated.View
          entering={FadeInDown.delay(130).springify()}
          className="mx-4 mb-4 items-center rounded-2xl py-6"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
        >
          <View className="flex-row items-start">
            <Text className="text-2xl font-bold mt-1" style={{ color: colors.textSecondary }}>$</Text>
            <Text className="text-5xl font-bold" style={{ color: colors.text }}>
              {invoice.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Text>
          </View>
        </Animated.View>

        {/* Details Card */}
        <Animated.View entering={FadeInDown.delay(180).springify()} className="mx-4 mb-4">
          <Text
            className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
            style={{ color: colors.textSecondary }}
          >
            Details
          </Text>
          <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            {/* Description */}
            <View className="flex-row items-center p-4">
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <FileText size={16} color={colors.textTertiary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Description</Text>
                <Text className="text-sm font-medium mt-0.5" style={{ color: colors.text }}>
                  {invoice.description}
                </Text>
              </View>
            </View>

            <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />

            {/* Due Date */}
            <View className="flex-row items-center p-4">
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Calendar size={16} color={colors.textTertiary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Due Date</Text>
                <Text className="text-sm font-medium mt-0.5" style={{ color: colors.text }}>
                  {formatDate(invoice.dueDate)}
                </Text>
              </View>
            </View>

            <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />

            {/* Created Date */}
            <View className="flex-row items-center p-4">
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <DollarSign size={16} color={colors.textTertiary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Created</Text>
                <Text className="text-sm font-medium mt-0.5" style={{ color: colors.text }}>
                  {formatDate(invoice.createdAt)}
                </Text>
              </View>
            </View>

            {/* Paid Date (if paid) */}
            {displayStatus === 'paid' && invoice.paidDate && (
              <>
                <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />
                <View className="flex-row items-center p-4">
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#D1FAE5' }}
                  >
                    <Check size={16} color="#047857" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>Paid Date</Text>
                    <Text className="text-sm font-medium mt-0.5" style={{ color: '#047857' }}>
                      {formatDate(invoice.paidDate)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Sessions Covered */}
            {invoice.sessionIds.length > 0 && (
              <>
                <View className="h-px mx-4" style={{ backgroundColor: colors.cardBorder }} />
                {invoice.sessionIds.length === 1 ? (
                  <Pressable
                    onPress={() => router.push(`/session/${invoice.sessionIds[0]}`)}
                    className="flex-row items-center p-4 active:opacity-80"
                  >
                    <View
                      className="w-9 h-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.bgSecondary }}
                    >
                      <User size={16} color={colors.textTertiary} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>Sessions Covered</Text>
                      <Text className="text-sm font-medium mt-0.5" style={{ color: colors.text }}>
                        1 session
                      </Text>
                    </View>
                    <ChevronRight size={16} color={colors.textTertiary} />
                  </Pressable>
                ) : (
                  <View className="flex-row items-center p-4">
                    <View
                      className="w-9 h-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: colors.bgSecondary }}
                    >
                      <User size={16} color={colors.textTertiary} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>Sessions Covered</Text>
                      <Text className="text-sm font-medium mt-0.5" style={{ color: colors.text }}>
                        {invoice.sessionIds.length} sessions
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.delay(230).springify()} className="mx-4 gap-3">
          <Text
            className="text-xs font-semibold uppercase tracking-wider px-1"
            style={{ color: colors.textSecondary }}
          >
            Actions
          </Text>

          {/* Send Invoice */}
          <Pressable
            onPress={handleSend}
            className="flex-row items-center rounded-2xl p-4 active:opacity-80"
            style={{ backgroundColor: '#E0F2FE', borderWidth: 1, borderColor: '#BAE6FD' }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: '#FFFFFF40' }}
            >
              <Send size={18} color="#0369A1" />
            </View>
            <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: '#0369A1' }}>
              Send Invoice
            </Text>
            <ChevronRight size={18} color="#0369A1" />
          </Pressable>

          {/* Mark as Paid */}
          {displayStatus !== 'paid' && (
            <Pressable
              onPress={handleMarkPaid}
              className="flex-row items-center rounded-2xl p-4 active:opacity-80"
              style={{ backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#A7F3D0' }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#FFFFFF40' }}
              >
                <Check size={18} color="#047857" strokeWidth={3} />
              </View>
              <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: '#047857' }}>
                Mark as Paid
              </Text>
              <ChevronRight size={18} color="#047857" />
            </Pressable>
          )}

          {/* Edit Invoice */}
          <Pressable
            onPress={handleEdit}
            className="flex-row items-center rounded-2xl p-4 active:opacity-80"
            style={{ backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.card }}
            >
              <Edit3 size={18} color={colors.textTertiary} />
            </View>
            <Text className="flex-1 ml-3 text-base font-semibold" style={{ color: colors.text }}>
              Edit Invoice
            </Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
