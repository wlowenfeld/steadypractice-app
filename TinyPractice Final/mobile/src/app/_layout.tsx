import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { SecurityProvider, useSecurity } from '@/lib/security';
import LockScreen from '@/components/LockScreen';
import HipaaDisclaimer from '@/components/HipaaDisclaimer';
import OnboardingScreen from '@/components/OnboardingScreen';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function SecurityGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const {
    isLoading,
    isLocked,
    isPinSet,
    isHipaaAccepted,
    isOnboardingCompleted,
  } = useSecurity();

  // Show loading screen while checking security status
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  // Flow: Privacy Notice -> Onboarding -> PIN Setup -> Lock Screen -> App

  // 1. First show privacy notice
  if (!isHipaaAccepted) {
    return <HipaaDisclaimer />;
  }

  // 2. Then show onboarding
  if (!isOnboardingCompleted) {
    return <OnboardingScreen />;
  }

  // 3. If no PIN set, show PIN setup
  if (!isPinSet) {
    return <LockScreen mode="setup" />;
  }

  // 4. If app is locked, show lock screen
  if (isLocked) {
    return <LockScreen mode="unlock" />;
  }

  // 5. Show the app
  return <>{children}</>;
}

function RootLayoutNav() {
  const { isDark, colors } = useTheme();

  return (
    <NavThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <SecurityGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-client"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="client/[id]" />
          <Stack.Screen
            name="add-session"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="session/[id]"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="edit-client/[id]"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="schedule-appointment"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="appointment/[id]" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="invoices" />
          <Stack.Screen name="invoice/[id]" />
          <Stack.Screen
            name="add-invoice"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="change-pin"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </SecurityGate>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <ThemeProvider>
            <SecurityProvider>
              <RootLayoutNav />
            </SecurityProvider>
          </ThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
