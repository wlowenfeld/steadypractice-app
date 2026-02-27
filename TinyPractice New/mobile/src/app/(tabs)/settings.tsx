import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, Linking, TextInput, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Crown,
  FileText,
  Shield,
  HelpCircle,
  ChevronRight,
  Trash2,
  Sun,
  Moon,
  Check,
  Lock,
  BookOpen,
  Building,
  CreditCard,
  DollarSign,
  Download,
  Save,
  Play,
  Share2,
  ShieldCheck,
  Code2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppStore, ThemeMode } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useSecurity } from '@/lib/security';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { cn } from '@/lib/cn';
import { useSubscription } from '@/lib/useSubscription';
import Paywall from '@/components/Paywall';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  index: number;
  destructive?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, index, destructive }: SettingItemProps) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center rounded-2xl p-4 mb-2 mx-4 active:opacity-80"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.bgSecondary }}
        >
          {icon}
        </View>
        <View className="flex-1 ml-3">
          <Text
            className="text-base font-medium"
            style={{ color: destructive ? '#DC2626' : colors.text }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
              {subtitle}
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={destructive ? '#DC2626' : colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
];

export default function SettingsScreen() {
  const router = useRouter();
  const clients = useAppStore((s) => s.clients);
  const sessions = useAppStore((s) => s.sessions);
  const invoices = useAppStore((s) => s.invoices);
  const { colors, themeMode, setThemeMode, isDark, theme } = useTheme();
  const { businessName, setBusinessName, paymentInstructions, setPaymentInstructions, defaultSessionRate, setDefaultSessionRate, resetOnboarding, lock, fullReset } = useSecurity();
  const [showBusinessNameInput, setShowBusinessNameInput] = useState(false);
  const [tempBusinessName, setTempBusinessName] = useState(businessName);
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [tempPaymentInstructions, setTempPaymentInstructions] = useState(paymentInstructions);
  const [showRateInput, setShowRateInput] = useState(false);
  const [tempSessionRate, setTempSessionRate] = useState(defaultSessionRate?.toString() ?? '');
  const [showPaywall, setShowPaywall] = useState(false);
  const { isPro, isConfigError, checkSubscription } = useSubscription();
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  const loadDemoData = useAppStore((s) => s.loadDemoData);
  const clearDemoData = useAppStore((s) => s.clearDemoData);

  // Warn if subscription check failed in production
  useEffect(() => {
    if (isConfigError && !__DEV__) {
      Alert.alert(
        'Subscription Check Failed',
        'We could not verify your subscription status. If you are a Pro subscriber, please contact support.'
      );
    }
  }, [isConfigError]);

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    Haptics.selectionAsync();
  };

  const handleUpgrade = () => {
    setShowPaywall(true);
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Build CSV for clients
    let clientsCsv = 'Name,Email,Phone,Tags,Session Count,Created,Archived\n';
    clients.forEach(c => {
      clientsCsv += `"${c.name}","${c.email || ''}","${c.phone || ''}","${c.tags.join('; ')}",${c.sessionCount},"${c.createdAt}",${c.isArchived}\n`;
    });

    // Build CSV for sessions
    let sessionsCsv = 'Client,Date,Duration (min),Mood,Notes,Follow Up\n';
    sessions.forEach(s => {
      const clientName = clients.find(c => c.id === s.clientId)?.name || 'Unknown';
      sessionsCsv += `"${clientName}","${s.date}",${s.duration},"${s.mood || ''}","${(s.notes || '').replace(/"/g, '""')}","${(s.followUp || '').replace(/"/g, '""')}"\n`;
    });

    // Build CSV for invoices
    let invoicesCsv = 'Client,Amount,Description,Status,Due Date,Paid Date,Created\n';
    invoices.forEach(inv => {
      const clientName = clients.find(c => c.id === inv.clientId)?.name || 'Unknown';
      invoicesCsv += `"${clientName}",${inv.amount},"${inv.description}","${inv.status}","${inv.dueDate}","${inv.paidDate || ''}","${inv.createdAt}"\n`;
    });

    const fullExport = `CLIENTS\n${clientsCsv}\n\nSESSIONS\n${sessionsCsv}\n\nINVOICES\n${invoicesCsv}`;

    try {
      await Share.share({
        message: fullExport,
        title: 'TinyPractice Data Export',
      });
    } catch {
      // User cancelled
    }
  };

  const handleBackup = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const state = useAppStore.getState();
      const backup = {
        version: '3.0.0',
        exportedAt: new Date().toISOString(),
        clients: state.clients,
        sessions: state.sessions,
        invoices: state.invoices,
        appointments: state.appointments,
      };

      const filename = `tinypractice-backup-${new Date().toISOString().split('T')[0]}.json`;
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(backup, null, 2));

      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Save TinyPractice Backup',
      });
    } catch (error) {
      Alert.alert('Backup Failed', 'Could not create backup file. Please try again.');
    }
  };

  const handleShareApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `I run my therapy practice on TinyPractice — session notes, scheduling, invoices, all local to my phone. No $99/mo SimplePractice subscription. Free to try: https://apps.apple.com/app/id6758564968`,
      });
    } catch {
      // User cancelled
    }
  };

  const handlePrivacy = () => {
    Linking.openURL('https://tinypractice.app/privacy.html');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:support@tinypractice.app');
  };

  const handleChangePin = () => {
    router.push('/change-pin');
  };

  const handleReplayOnboarding = () => {
    Alert.alert(
      'Replay Tutorial',
      'Would you like to view the app tutorial again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            await resetOnboarding();
          },
        },
      ]
    );
  };

  const handleLockApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    lock();
  };

  const handleSaveBusinessName = async () => {
    await setBusinessName(tempBusinessName);
    setShowBusinessNameInput(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSavePaymentInstructions = async () => {
    await setPaymentInstructions(tempPaymentInstructions);
    setShowPaymentInput(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your clients, sessions, invoices, and appointments. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            useAppStore.setState({ clients: [], sessions: [], invoices: [], appointments: [] });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleFullReset = () => {
    Alert.alert(
      'Full Reset',
      'This will delete ALL data and reset the app to its initial state, as if you just installed it. You will need to set up your PIN again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            useAppStore.setState({ clients: [], sessions: [], invoices: [], appointments: [] });
            await fullReset();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleSaveSessionRate = async () => {
    const rate = tempSessionRate.trim() ? parseFloat(tempSessionRate) : null;
    if (rate !== null && (isNaN(rate) || rate < 0)) {
      return;
    }
    await setDefaultSessionRate(rate);
    setShowRateInput(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      <View className="px-4 pt-2 pb-4">
        <Text className="text-3xl font-bold" style={{ color: colors.text }}>
          Settings
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(0).springify()}
          className="flex-row mx-4 mb-6"
        >
          <View
            className="flex-1 rounded-2xl p-4 mr-2"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              {clients.length}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Clients
            </Text>
          </View>
          <View
            className="flex-1 rounded-2xl p-4 ml-2"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-3xl font-bold" style={{ color: colors.text }}>
              {sessions.length}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Sessions
            </Text>
          </View>
        </Animated.View>

        {/* Business & Invoicing */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2"
          style={{ color: colors.textSecondary }}
        >
          Business & Invoicing
        </Text>
        {showBusinessNameInput ? (
          <Animated.View
            entering={FadeInDown.springify()}
            className="mx-4 mb-4 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
              Business Name (used in invoices)
            </Text>
            <TextInput
              value={tempBusinessName}
              onChangeText={setTempBusinessName}
              placeholder="Your business name"
              placeholderTextColor={colors.textTertiary}
              className="rounded-xl px-4 py-3 text-base mb-3"
              style={{ backgroundColor: colors.bgSecondary, color: colors.text }}
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowBusinessNameInput(false)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveBusinessName}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Text style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <SettingItem
            icon={<Building size={20} color={colors.textTertiary} />}
            title="Business Name"
            subtitle={businessName || 'Not set'}
            onPress={() => {
              setTempBusinessName(businessName);
              setShowBusinessNameInput(true);
            }}
            index={1}
          />
        )}

        {/* Payment Instructions */}
        {showPaymentInput ? (
          <Animated.View
            entering={FadeInDown.springify()}
            className="mx-4 mb-4 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
              Payment Instructions (included in invoices)
            </Text>
            <TextInput
              value={tempPaymentInstructions}
              onChangeText={setTempPaymentInstructions}
              placeholder="e.g., Venmo @yourname, Zelle to email@example.com"
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
              className="rounded-xl px-4 py-3 text-base mb-3 min-h-[80px]"
              style={{ backgroundColor: colors.bgSecondary, color: colors.text }}
            />
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowPaymentInput(false)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSavePaymentInstructions}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Text style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <SettingItem
            icon={<CreditCard size={20} color={colors.textTertiary} />}
            title="Payment Instructions"
            subtitle={paymentInstructions || 'Not set'}
            onPress={() => {
              setTempPaymentInstructions(paymentInstructions);
              setShowPaymentInput(true);
            }}
            index={2}
          />
        )}

        {/* Session Rate */}
        {showRateInput ? (
          <Animated.View
            entering={FadeInDown.springify()}
            className="mx-4 mb-4 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
              Default Session Rate
            </Text>
            <View
              className="flex-row items-center rounded-xl px-4"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <DollarSign size={18} color={colors.textTertiary} />
              <TextInput
                value={tempSessionRate}
                onChangeText={setTempSessionRate}
                placeholder="e.g., 150"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                className="flex-1 py-3 px-2 text-base"
                style={{ color: colors.text }}
              />
            </View>
            <Text className="text-xs mt-2 mb-3" style={{ color: colors.textSecondary }}>
              Used to auto-fill invoice amounts when billing for sessions
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowRateInput(false)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveSessionRate}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Text style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>Save</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <SettingItem
            icon={<DollarSign size={20} color={colors.textTertiary} />}
            title="Session Rate"
            subtitle={defaultSessionRate ? `$${defaultSessionRate}` : 'Not set'}
            onPress={() => {
              setTempSessionRate(defaultSessionRate?.toString() ?? '');
              setShowRateInput(true);
            }}
            index={3}
          />
        )}

        {/* Appearance */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2 mt-4"
          style={{ color: colors.textSecondary }}
        >
          Appearance
        </Text>
        <Animated.View
          entering={FadeInDown.delay(50).springify()}
          className="rounded-2xl p-2 mx-4 mb-4"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
        >
          <View className="flex-row flex-wrap">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = themeMode === option.mode;
              const selectedTextColor = isDark ? '#2B3830' : '#FFFFFF';
              return (
                <Pressable
                  key={option.mode}
                  onPress={() => handleThemeChange(option.mode)}
                  className="w-1/2 flex-row items-center justify-center py-3 rounded-xl"
                  style={isSelected ? { backgroundColor: colors.accent } : undefined}
                >
                  <Icon
                    size={18}
                    color={isSelected ? selectedTextColor : colors.textSecondary}
                  />
                  <Text
                    className="text-sm font-medium ml-2"
                    style={{
                      color: isSelected ? selectedTextColor : colors.textSecondary,
                    }}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Check
                      size={16}
                      color={selectedTextColor}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Security */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2"
          style={{ color: colors.textSecondary }}
        >
          Security
        </Text>
        <SettingItem
          icon={<Lock size={20} color={colors.textTertiary} />}
          title="Change PIN"
          subtitle="Update your security PIN"
          onPress={handleChangePin}
          index={2}
        />
        <SettingItem
          icon={<Shield size={20} color={colors.textTertiary} />}
          title="Lock App Now"
          subtitle="Require PIN to access"
          onPress={handleLockApp}
          index={3}
        />
        <SettingItem
          icon={<ShieldCheck size={20} color={colors.textTertiary} />}
          title="Security Recommendations"
          subtitle="Tips to protect your client data"
          onPress={() => router.push('/security-recommendations')}
          index={4}
        />

        {/* Subscription */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2 mt-4"
          style={{ color: colors.textSecondary }}
        >
          Subscription
        </Text>
        {isPro ? (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="mx-4 mb-2 rounded-2xl overflow-hidden"
            style={{ borderWidth: 2, borderColor: '#10B981' }}
          >
            <View className="p-4" style={{ backgroundColor: '#D1FAE5' }}>
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <Crown size={20} color="#FFFFFF" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold" style={{ color: '#047857' }}>
                    TinyPractice Pro
                  </Text>
                  <Text className="text-sm" style={{ color: '#059669' }}>
                    All features unlocked
                  </Text>
                </View>
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <Check size={18} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>
            </View>
          </Animated.View>
        ) : (
          <SettingItem
            icon={<Crown size={20} color="#F59E0B" />}
            title="Upgrade to Pro"
            subtitle="Unlimited clients & CSV export"
            onPress={handleUpgrade}
            index={4}
          />
        )}

        {/* Data */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2 mt-4"
          style={{ color: colors.textSecondary }}
        >
          Data
        </Text>
        <SettingItem
          icon={<Save size={20} color={colors.textTertiary} />}
          title="Backup Data"
          subtitle="Export all data as JSON"
          onPress={handleBackup}
          index={5}
        />

        {/* Export - Feature Tease for non-Pro, functional for Pro */}
        {isPro ? (
          <SettingItem
            icon={<Download size={20} color={colors.textTertiary} />}
            title="Export to CSV"
            subtitle={`${clients.length} clients, ${sessions.length} sessions`}
            onPress={handleExport}
            index={5}
          />
        ) : (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Pressable
              onPress={handleUpgrade}
              className="flex-row items-center rounded-2xl p-4 mb-2 mx-4 active:opacity-80"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Download size={20} color={colors.textTertiary} />
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-medium" style={{ color: colors.text }}>
                    Export to CSV
                  </Text>
                  <View className="ml-2 px-2 py-0.5 rounded-full flex-row items-center" style={{ backgroundColor: '#FEF3C7' }}>
                    <Lock size={10} color="#B45309" />
                    <Text className="text-xs font-medium ml-1" style={{ color: '#B45309' }}>
                      Pro
                    </Text>
                  </View>
                </View>
                <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
                  Download {clients.length} clients, {sessions.length} sessions
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textTertiary} />
            </Pressable>
          </Animated.View>
        )}

        {/* Share */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2 mt-4"
          style={{ color: colors.textSecondary }}
        >
          Share
        </Text>
        <SettingItem
          icon={<Share2 size={20} color={colors.textTertiary} />}
          title="Share TinyPractice with a Colleague"
          subtitle="Recommend to a fellow therapist"
          onPress={handleShareApp}
          index={6}
        />

        {/* Support */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2 mt-4"
          style={{ color: colors.textSecondary }}
        >
          Support
        </Text>
        <SettingItem
          icon={<Shield size={20} color={colors.textTertiary} />}
          title="Privacy & Data Policy"
          subtitle="View privacy policy"
          onPress={handlePrivacy}
          index={6}
        />
        <SettingItem
          icon={<FileText size={20} color={colors.textTertiary} />}
          title="Terms of Service"
          subtitle="View terms of use"
          onPress={() => Linking.openURL('https://tinypractice.app/terms.html')}
          index={7}
        />
        <SettingItem
          icon={<BookOpen size={20} color={colors.textTertiary} />}
          title="Replay Tutorial"
          subtitle="View the app introduction again"
          onPress={handleReplayOnboarding}
          index={7}
        />
        <SettingItem
          icon={<HelpCircle size={20} color={colors.textTertiary} />}
          title="Get Help"
          subtitle="Contact support"
          onPress={handleSupport}
          index={8}
        />
        <SettingItem
          icon={<Code2 size={20} color={colors.textTertiary} />}
          title="Open Source Licenses"
          subtitle="Libraries used in this app"
          onPress={() => router.push('/open-source-licenses')}
          index={9}
        />

        {/* Demo Mode */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2 mt-4"
          style={{ color: colors.textSecondary }}
        >
          Demo Mode
        </Text>
        {isDemoMode ? (
          <Animated.View
            entering={FadeInDown.springify()}
            className="mx-4 mb-2 rounded-2xl p-4"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
          >
            <View
              className="rounded-lg px-3 py-2 mb-3"
              style={{ backgroundColor: '#FEF3C7' }}
            >
              <Text style={{ color: '#B45309', fontSize: 12, fontWeight: '600' }}>
                You are viewing sample data.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Exit Demo Mode',
                  'This will remove demo data and restore your real data.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Restore My Data',
                      style: 'default',
                      onPress: () => {
                        clearDemoData();
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      },
                    },
                  ]
                );
              }}
              className="py-3 rounded-xl items-center active:opacity-80"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <Text className="font-semibold" style={{ color: '#DC2626' }}>Exit Demo Mode</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <SettingItem
            icon={<Play size={20} color={colors.textTertiary} />}
            title="Try Demo Mode"
            subtitle="Load sample data to explore the app"
            onPress={() => {
              Alert.alert(
                'Load Demo Data',
                                'This will temporarily replace your data with sample data. Your real data will be restored when you exit demo mode.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Continue',
                    onPress: () => {
                      loadDemoData();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    },
                  },
                ]
              );
            }}
            index={9}
          />
        )}

        {/* Danger Zone */}
        <Text
          className="text-sm font-semibold uppercase tracking-wide px-4 mb-2 mt-4"
          style={{ color: colors.textSecondary }}
        >
          Danger Zone
        </Text>
        <SettingItem
          icon={<Trash2 size={20} color="#DC2626" />}
          title="Clear All Data"
          subtitle="Delete clients, sessions, and invoices"
          onPress={handleClearData}
          index={9}
          destructive
        />
        <SettingItem
          icon={<Trash2 size={20} color="#DC2626" />}
          title="Full Reset"
          subtitle="Reset app to new user state"
          onPress={handleFullReset}
          index={10}
          destructive
        />

        {/* Version */}
        <View className="items-center mt-8">
          <Text className="text-sm" style={{ color: colors.textTertiary }}>
            TinyPractice v3.0.0
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
            Local-only data storage
          </Text>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={checkSubscription}
      />
    </SafeAreaView>
  );
}
