import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Modal, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Crown, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatEnabled,
} from '@/lib/revenuecatClient';
import type { PurchasesPackage } from 'react-native-purchases';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRO_BENEFITS = [
  'Unlimited clients — no cap, ever',
  'CSV export for your accountant or taxes',
];

export default function Paywall({ visible, onClose, onSuccess }: PaywallProps) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    setLoading(true);
    setError(null);

    if (!isRevenueCatEnabled()) {
      setError('Payments are not available on this platform');
      setLoading(false);
      return;
    }

    const result = await getOfferings();

    if (!result.ok) {
      if (result.reason === 'web_not_supported') {
        setError('Please use the mobile app to subscribe');
      } else if (result.reason === 'not_configured') {
        setError('Subscription service is not configured');
      } else {
        setError('Failed to load subscription options');
      }
      setLoading(false);
      return;
    }

    const offerings = result.data;
    const currentOffering = offerings.current;

    if (currentOffering) {
      const monthly = currentOffering.availablePackages.find(
        (pkg) => pkg.identifier === '$rc_monthly'
      );
      const yearly = currentOffering.availablePackages.find(
        (pkg) => pkg.identifier === '$rc_annual'
      );

      setMonthlyPackage(monthly ?? null);
      setYearlyPackage(yearly ?? null);
    }

    setLoading(false);
  };

  const handlePurchase = async (plan?: 'monthly' | 'yearly') => {
    const targetPlan = plan ?? selectedPlan;
    const pkg = targetPlan === 'yearly' ? yearlyPackage : monthlyPackage;
    if (!pkg) return;

    setPurchasing(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await purchasePackage(pkg);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      onClose();
    } else {
      if (result.reason === 'sdk_error') {
        // User cancelled or other error
        const errorMessage = result.error instanceof Error ? result.error.message : 'Purchase failed';
        if (!errorMessage.includes('cancel')) {
          setError(errorMessage);
        }
      }
    }

    setPurchasing(false);
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await restorePurchases();

    if (result.ok) {
      const hasProEntitlement = result.data.entitlements.active?.['pro'];
      if (hasProEntitlement) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.();
        onClose();
      } else {
        setError('No active subscription found');
      }
    } else {
      setError('Failed to restore purchases');
    }

    setRestoring(false);
  };

  const formatPrice = (pkg: PurchasesPackage | null) => {
    if (!pkg) return '--';
    return pkg.product.priceString;
  };

  const getMonthlyEquivalent = (pkg: PurchasesPackage | null) => {
    if (!pkg) return '--';
    const price = pkg.product.price;
    const monthly = price / 12;
    return `$${monthly.toFixed(2)}/mo`;
  };

  const getSavingsPercent = () => {
    if (!monthlyPackage || !yearlyPackage) return 0;
    const monthlyTotal = monthlyPackage.product.price * 12;
    const yearlyPrice = yearlyPackage.product.price;
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: colors.bg }}>
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="w-10" />
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              Go Pro
            </Text>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.bgSecondary }}
            >
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.accent} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                Loading subscription options...
              </Text>
            </View>
          ) : (
            <View className="flex-1 px-4">
              {/* Crown Icon */}
              <Animated.View entering={FadeIn.delay(100)} className="items-center mt-4 mb-6">
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Crown size={40} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>

              {/* Benefits */}
              <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-6">
                <Text className="text-2xl font-bold text-center mb-4" style={{ color: colors.text }}>
                  Unlock your full practice
                </Text>
                <View
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}
                >
                  {PRO_BENEFITS.map((benefit, index) => (
                    <View
                      key={benefit}
                      className={`flex-row items-center ${index > 0 ? 'mt-3' : ''}`}
                    >
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: '#D1FAE5' }}
                      >
                        <Check size={16} color="#047857" strokeWidth={3} />
                      </View>
                      <Text className="text-base ml-3 flex-1" style={{ color: colors.text }}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Value anchor */}
                <Text className="text-sm text-center mt-4" style={{ color: colors.textSecondary }}>
                  Less than a single copay — for your entire practice.
                </Text>
              </Animated.View>

              {/* Error Message */}
              {error && (
                <Animated.View entering={FadeIn} className="mb-4">
                  <View
                    className="rounded-xl p-3"
                    style={{ backgroundColor: '#FEE2E2' }}
                  >
                    <Text className="text-sm text-center" style={{ color: '#991B1B' }}>
                      {error}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Spacer */}
              <View className="flex-1" />

              {/* Purchase Button */}
              <Animated.View entering={FadeInUp.delay(250).springify()}>
                {/* Primary CTA — monthly */}
                <Pressable
                  onPress={() => handlePurchase('monthly')}
                  disabled={purchasing || !monthlyPackage}
                  className="rounded-2xl overflow-hidden active:opacity-90"
                  style={{ opacity: purchasing && selectedPlan === 'monthly' ? 0.7 : 1 }}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 18, alignItems: 'center' }}
                  >
                    {purchasing && selectedPlan === 'monthly' ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                        Upgrade for {formatPrice(monthlyPackage)}/month
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Secondary CTA — annual */}
                {yearlyPackage && (
                  <Pressable
                    onPress={() => handlePurchase('yearly')}
                    disabled={purchasing}
                    className="mt-3 py-3.5 items-center rounded-2xl active:opacity-80"
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      opacity: purchasing && selectedPlan === 'yearly' ? 0.7 : 1,
                    }}
                  >
                    {purchasing && selectedPlan === 'yearly' ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text className="text-base font-medium" style={{ color: colors.text }}>
                        Or {formatPrice(yearlyPackage)}/year{getSavingsPercent() > 0 ? ` (save ${getSavingsPercent()}%)` : ''}
                      </Text>
                    )}
                  </Pressable>
                )}

                {/* Restore Purchases */}
                <Pressable
                  onPress={handleRestore}
                  disabled={restoring}
                  className="py-4 items-center active:opacity-70"
                >
                  {restoring ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <Text className="text-base" style={{ color: colors.textSecondary }}>
                      Restore Purchases
                    </Text>
                  )}
                </Pressable>

                {/* Legal Text */}
                <Text
                  className="text-xs text-center mb-2"
                  style={{ color: colors.textTertiary }}
                >
                  {Platform.OS === 'ios'
                    ? 'Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.'
                    : 'Payment will be charged to your Google Play account. Subscription automatically renews unless canceled.'}
                </Text>

                {/* Terms and Privacy Links */}
                <View className="flex-row justify-center items-center mb-4">
                  <Text className="text-xs" style={{ color: colors.textTertiary }}>
                    By subscribing, you agree to our{' '}
                  </Text>
                  <Pressable
                    onPress={() => Linking.openURL('https://steadypractice.app/terms.html')}
                  >
                    <Text className="text-xs underline" style={{ color: colors.textTertiary }}>
                      Terms of Use
                    </Text>
                  </Pressable>
                  <Text className="text-xs" style={{ color: colors.textTertiary }}>
                    {' '}and{' '}
                  </Text>
                  <Pressable
                    onPress={() => Linking.openURL('https://steadypractice.app/privacy.html')}
                  >
                    <Text className="text-xs underline" style={{ color: colors.textTertiary }}>
                      Privacy Policy
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
