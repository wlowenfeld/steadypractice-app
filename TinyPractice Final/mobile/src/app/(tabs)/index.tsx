import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, User, ChevronRight, Archive, Crown, X, Sparkles, Star } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useSubscription } from '@/lib/useSubscription';
import { Client } from '@/lib/types';
import { cn } from '@/lib/cn';
import {
  isSampleClient,
  hasSampleData,
  removeSampleData,
  SAMPLE_TOOLTIP_DISMISSED_KEY,
  SAMPLE_DATA_REMOVED_KEY,
} from '@/lib/sampleData';
import { restorePurchases } from '@/lib/revenuecatClient';
import Paywall from '@/components/Paywall';

const FREE_CLIENT_LIMIT = 5;
const CLIENT_REMAINING_BANNER_KEY = 'client_remaining_banner_dismissed';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ClientCard({
  client,
  index,
  showTooltip,
  onDismissTooltip,
}: {
  client: Client;
  index: number;
  showTooltip?: boolean;
  onDismissTooltip?: () => void;
}) {
  const router = useRouter();
  const { colors } = useTheme();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSession = (date?: string) => {
    if (!date) return 'No sessions yet';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  return (
    <View>
      <AnimatedPressable
        entering={FadeInDown.delay(index * 50).springify()}
        onPress={() => router.push(`/client/${client.id}`)}
        className={cn('flex-row items-center rounded-2xl p-4 mb-3 mx-4 active:opacity-80')}
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          opacity: client.isArchived ? 0.6 : 1,
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
          <View className="flex-row items-center">
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {client.name}
            </Text>
            {client.isArchived && (
              <View
                className="ml-2 px-2 py-0.5 rounded"
                style={{ backgroundColor: colors.bgSecondary }}
              >
                <Text className="text-xs" style={{ color: colors.textSecondary }}>
                  Archived
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>
            {formatLastSession(client.lastSessionAt)} · {client.sessionCount} session
            {client.sessionCount !== 1 ? 's' : ''}
          </Text>
          {client.tags.length > 0 && (
            <View className="flex-row flex-wrap mt-1.5 gap-1">
              {client.tags.slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.bgSecondary }}
                >
                  <Text className="text-xs" style={{ color: colors.textSecondary }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <ChevronRight size={20} color={colors.textTertiary} />
      </AnimatedPressable>

      {/* Sample client tooltip */}
      {showTooltip && (
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          exiting={FadeOut.duration(200)}
          className="mx-6 -mt-1 mb-3 rounded-xl p-3 flex-row items-center"
          style={{
            backgroundColor: colors.accent,
          }}
        >
          <Text
            className="text-sm flex-1"
            style={{ color: '#FFFFFF' }}
          >
            This is a sample — tap to explore, or add your first real client.
          </Text>
          <Pressable
            onPress={onDismissTooltip}
            className="ml-2 p-1"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <X size={14} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

export default function ClientsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const showArchived = useAppStore((s) => s.showArchived);
  const setShowArchived = useAppStore((s) => s.setShowArchived);
  const allClients = useAppStore((s) => s.clients);

  const clients = useMemo(() => {
    return allClients
      .filter((c) => (showArchived ? true : !c.isArchived))
      .filter((c) =>
        searchQuery
          ? c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
          : true
      )
      .sort((a, b) => {
        if (a.lastSessionAt && b.lastSessionAt) {
          return new Date(b.lastSessionAt).getTime() - new Date(a.lastSessionAt).getTime();
        }
        if (a.lastSessionAt) return -1;
        if (b.lastSessionAt) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [allClients, searchQuery, showArchived]);

  // Count real (non-sample) active clients
  const realActiveClientCount = useMemo(
    () => allClients.filter((c) => !c.isArchived && !isSampleClient(c.id)).length,
    [allClients]
  );

  const activeClientCount = useMemo(
    () => allClients.filter((c) => !c.isArchived).length,
    [allClients]
  );

  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const { isPro, checkSubscription } = useSubscription();

  // Sample tooltip state
  const [showSampleTooltip, setShowSampleTooltip] = useState(false);
  const [sampleDataRemoved, setSampleDataRemoved] = useState(false);

  // Client #4 banner state
  const [showRemainingBanner, setShowRemainingBanner] = useState(false);
  const [remainingBannerDismissed, setRemainingBannerDismissed] = useState(true);

  // Check sample tooltip and banner states on mount
  useEffect(() => {
    const checkStates = async () => {
      const [tooltipDismissed, dataRemoved, bannerDismissed] = await Promise.all([
        AsyncStorage.getItem(SAMPLE_TOOLTIP_DISMISSED_KEY),
        AsyncStorage.getItem(SAMPLE_DATA_REMOVED_KEY),
        AsyncStorage.getItem(CLIENT_REMAINING_BANNER_KEY),
      ]);

      setSampleDataRemoved(dataRemoved === 'true');

      // Show tooltip if sample data exists and tooltip hasn't been dismissed
      if (tooltipDismissed !== 'true' && hasSampleData()) {
        setShowSampleTooltip(true);
      }

      // Show client remaining banner
      if (bannerDismissed !== 'true') {
        setRemainingBannerDismissed(false);
      }
    };
    checkStates();
  }, []);

  // Check if we should show "remove sample data?" prompt after adding first real client
  useEffect(() => {
    if (realActiveClientCount >= 1 && hasSampleData() && !sampleDataRemoved) {
      Alert.alert(
        'Remove sample data?',
        'You\'ve added your first client. Would you like to remove the sample client "Alex Sample"?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => {
              setSampleDataRemoved(true);
              AsyncStorage.setItem(SAMPLE_DATA_REMOVED_KEY, 'true');
            },
          },
          {
            text: 'Yes',
            onPress: () => {
              removeSampleData();
              setSampleDataRemoved(true);
              setShowSampleTooltip(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
        ]
      );
    }
  }, [realActiveClientCount, sampleDataRemoved]);

  const handleDismissSampleTooltip = async () => {
    setShowSampleTooltip(false);
    await AsyncStorage.setItem(SAMPLE_TOOLTIP_DISMISSED_KEY, 'true');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDismissRemainingBanner = async () => {
    setShowRemainingBanner(false);
    setRemainingBannerDismissed(true);
    await AsyncStorage.setItem(CLIENT_REMAINING_BANNER_KEY, 'true');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Determine if we should show the "1 slot remaining" banner
  const shouldShowRemainingBanner = !isPro && !remainingBannerDismissed && realActiveClientCount === (FREE_CLIENT_LIMIT - 1);

  const handleAddClient = () => {
    if (!isPro && realActiveClientCount >= FREE_CLIENT_LIMIT) {
      setShowUpgradeModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      router.push('/add-client');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const EmptyState = () => (
    <Animated.View
      entering={FadeIn.delay(200)}
      className="flex-1 items-center justify-center px-8 pt-20"
    >
      {searchQuery ? (
        <>
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <User size={40} color={colors.textTertiary} />
          </View>
          <Text className="text-xl font-semibold text-center" style={{ color: colors.text }}>
            No clients found
          </Text>
          <Text className="text-base text-center mt-2" style={{ color: colors.textSecondary }}>
            Try a different search term
          </Text>
        </>
      ) : (
        <>
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-5"
            style={{ backgroundColor: colors.bgSecondary }}
          >
            <User size={40} color={colors.textTertiary} />
          </View>
          <Text className="text-xl font-semibold text-center" style={{ color: colors.text }}>
            Add Your First Client
          </Text>
          <Text className="text-sm text-center mt-2 px-4" style={{ color: colors.textTertiary }}>
            Your client list is private and stored only on this device.
          </Text>
          <Pressable
            onPress={() => router.push('/add-client')}
            className="py-4 rounded-2xl items-center active:opacity-80 mt-8 w-full"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-base font-semibold" style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>
              Add Your First Client
            </Text>
          </Pressable>
        </>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-3xl font-bold" style={{ color: colors.text }}>
            Clients
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setShowArchived(!showArchived)}
              className="p-2.5 rounded-full"
              style={{
                backgroundColor: showArchived ? colors.accent : colors.card,
                borderWidth: showArchived ? 0 : 1,
                borderColor: colors.cardBorder,
              }}
            >
              <Archive
                size={20}
                color={showArchived ? (isDark ? '#2B3830' : '#FFFFFF') : colors.textTertiary}
              />
            </Pressable>
            <Pressable
              onPress={handleAddClient}
              className="p-2.5 rounded-full active:opacity-80"
              style={{ backgroundColor: colors.accent }}
            >
              <Plus size={20} color={isDark ? '#2B3830' : '#FFFFFF'} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View
          className="flex-row items-center rounded-xl px-4 py-3"
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

        {/* Client #4 — 1 slot remaining banner */}
        {shouldShowRemainingBanner && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            exiting={FadeOut.duration(200)}
            className="mt-3 rounded-xl p-3 flex-row items-center"
            style={{ backgroundColor: isDark ? '#3b3520' : '#FFFBEB', borderWidth: 1, borderColor: isDark ? '#5c4f2d' : '#FDE68A' }}
          >
            <Text className="text-sm flex-1" style={{ color: isDark ? '#FDE68A' : '#92400E' }}>
              You have 1 free client slot remaining.
            </Text>
            <Pressable
              onPress={handleDismissRemainingBanner}
              className="p-1.5"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={16} color={isDark ? '#FDE68A' : '#B45309'} />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* Client List */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ClientCard
            client={item}
            index={index}
            showTooltip={showSampleTooltip && isSampleClient(item.id)}
            onDismissTooltip={handleDismissSampleTooltip}
          />
        )}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textTertiary}
          />
        }
        contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Paywall Modal — Client #6 attempted */}
      <Modal
        visible={showUpgradeModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Animated.View
            entering={FadeIn.springify()}
            className="mx-6 rounded-3xl p-6 w-full max-w-sm"
            style={{ backgroundColor: colors.card }}
          >
            <View className="items-center mb-5">
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <Crown size={32} color="#F59E0B" />
              </View>
              <Text className="text-xl font-bold text-center" style={{ color: colors.text }}>
                Upgrade to Pro for unlimited clients.
              </Text>
            </View>

            {/* Plan options */}
            <View className="mb-5 gap-3">
              {/* Monthly */}
              <View
                className="rounded-xl p-4 flex-row items-center justify-between"
                style={{ backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <View>
                  <Text className="text-base font-medium" style={{ color: colors.text }}>Monthly</Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>Billed monthly</Text>
                </View>
                <Text className="text-lg font-bold" style={{ color: colors.text }}>$4.99/mo</Text>
              </View>

              {/* Annual — highlighted */}
              <View
                className="rounded-xl p-4 flex-row items-center justify-between relative overflow-hidden"
                style={{ backgroundColor: isDark ? '#2a3520' : '#ECFDF5', borderWidth: 2, borderColor: '#10B981' }}
              >
                {/* Recommended badge */}
                <View
                  className="absolute top-0 right-0 px-2.5 py-1 rounded-bl-lg"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <Text className="text-xs font-bold" style={{ color: '#FFFFFF' }}>
                    Save 37%
                  </Text>
                </View>
                <View>
                  <View className="flex-row items-center">
                    <Text className="text-base font-semibold" style={{ color: colors.text }}>Annual</Text>
                    <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: '#D1FAE5' }}>
                      <Text className="text-xs font-semibold" style={{ color: '#047857' }}>Best Value</Text>
                    </View>
                  </View>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>$3.33/mo billed yearly</Text>
                </View>
                <Text className="text-lg font-bold" style={{ color: '#10B981' }}>$39.99/yr</Text>
              </View>
            </View>

            {/* Upgrade button */}
            <Pressable
              onPress={() => {
                setShowUpgradeModal(false);
                setShowPaywall(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              className="py-4 rounded-full items-center mb-3"
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="font-semibold text-base" style={{ color: isDark ? '#2B3830' : '#FFFFFF' }}>
                Upgrade to Pro
              </Text>
            </Pressable>

            {/* Restore Purchases */}
            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const result = await restorePurchases();
                if (result.ok) {
                  const hasProEntitlement = result.data.entitlements.active?.['pro'];
                  if (hasProEntitlement) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setShowUpgradeModal(false);
                    await checkSubscription();
                  } else {
                    Alert.alert('No Subscription Found', 'No active subscription was found for this Apple ID.');
                  }
                } else {
                  Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
                }
              }}
              className="py-2 items-center mb-1"
            >
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Restore Purchases
              </Text>
            </Pressable>

            {/* Maybe Later */}
            <Pressable
              onPress={() => setShowUpgradeModal(false)}
              className="py-2 items-center"
            >
              <Text className="text-base" style={{ color: colors.textSecondary }}>
                Maybe Later
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* Full Paywall (for actual purchase flow) */}
      <Paywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={checkSubscription}
      />
    </SafeAreaView>
  );
}
