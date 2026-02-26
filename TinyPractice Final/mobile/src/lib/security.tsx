import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from './store';

const PIN_KEY = 'app_pin_hash';
const HIPAA_ACCEPTED_KEY = 'hipaa_accepted';
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
const BUSINESS_NAME_KEY = 'business_name';
const PAYMENT_INSTRUCTIONS_KEY = 'payment_instructions';
const DEFAULT_SESSION_RATE_KEY = 'default_session_rate';
const AUTO_LOCK_TIMEOUT = 60000; // 1 minute

interface SecurityContextType {
  isLocked: boolean;
  isPinSet: boolean;
  isHipaaAccepted: boolean;
  isOnboardingCompleted: boolean;
  businessName: string;
  paymentInstructions: string;
  defaultSessionRate: number | null;
  isLoading: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  unlock: () => void;
  lock: () => void;
  acceptHipaa: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  setBusinessName: (name: string) => Promise<void>;
  setPaymentInstructions: (instructions: string) => Promise<void>;
  setDefaultSessionRate: (rate: number | null) => Promise<void>;
  fullReset: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

// Keep for migration only
const legacyHashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36) + pin.length.toString();
};

const hashPin = async (pin: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + 'tinypractice-salt-2026'
  );
};

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isHipaaAccepted, setIsHipaaAccepted] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [businessName, setBusinessNameState] = useState('');
  const [paymentInstructions, setPaymentInstructionsState] = useState('');
  const [defaultSessionRate, setDefaultSessionRateState] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastActiveTime = useRef(Date.now());
  const appState = useRef(AppState.currentState);

  // Check security status on mount
  useEffect(() => {
    const checkSecurityStatus = async () => {
      try {
        const [pinHash, hipaaAccepted, onboardingCompleted, savedBusinessName, savedPaymentInstructions, savedSessionRate] = await Promise.all([
          SecureStore.getItemAsync(PIN_KEY),
          AsyncStorage.getItem(HIPAA_ACCEPTED_KEY),
          AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY),
          AsyncStorage.getItem(BUSINESS_NAME_KEY),
          AsyncStorage.getItem(PAYMENT_INSTRUCTIONS_KEY),
          AsyncStorage.getItem(DEFAULT_SESSION_RATE_KEY),
        ]);

        setIsPinSet(!!pinHash);
        setIsHipaaAccepted(hipaaAccepted === 'true');
        setIsOnboardingCompleted(onboardingCompleted === 'true');
        setBusinessNameState(savedBusinessName || '');
        setPaymentInstructionsState(savedPaymentInstructions || '');
        setDefaultSessionRateState(savedSessionRate ? parseFloat(savedSessionRate) : null);

        // If no PIN is set, don't lock the app (first time user)
        if (!pinHash) {
          setIsLocked(false);
        }
      } catch (error) {
        console.error('Error checking security status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSecurityStatus();
  }, []);

  // Handle app state changes for auto-lock
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background, record time
        lastActiveTime.current = Date.now();
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground, check if we should lock
        const timeSinceActive = Date.now() - lastActiveTime.current;
        if (timeSinceActive > AUTO_LOCK_TIMEOUT && isPinSet) {
          setIsLocked(true);
        }
        // Update overdue invoice statuses on app resume
        useAppStore.getState().updateOverdueStatuses();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isPinSet]);

  const setPin = useCallback(async (pin: string) => {
    const hash = await hashPin(pin);
    await SecureStore.setItemAsync(PIN_KEY, hash);
    setIsPinSet(true);
    setIsLocked(false);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = await SecureStore.getItemAsync(PIN_KEY);
    if (!storedHash) return false;

    const newHash = await hashPin(pin);
    if (newHash === storedHash) return true;

    // Migration: check legacy hash
    const legacy = legacyHashPin(pin);
    if (legacy === storedHash) {
      // Re-save with secure hash
      await SecureStore.setItemAsync(PIN_KEY, newHash);
      return true;
    }

    return false;
  }, []);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    const isValid = await verifyPin(oldPin);
    if (!isValid) return false;
    await setPin(newPin);
    return true;
  }, [verifyPin, setPin]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    lastActiveTime.current = Date.now();
  }, []);

  const lock = useCallback(() => {
    if (isPinSet) {
      setIsLocked(true);
    }
  }, [isPinSet]);

  const acceptHipaa = useCallback(async () => {
    await AsyncStorage.setItem(HIPAA_ACCEPTED_KEY, 'true');
    setIsHipaaAccepted(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    setIsOnboardingCompleted(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'false');
    setIsOnboardingCompleted(false);
  }, []);

  const setBusinessName = useCallback(async (name: string) => {
    await AsyncStorage.setItem(BUSINESS_NAME_KEY, name);
    setBusinessNameState(name);
  }, []);

  const setPaymentInstructions = useCallback(async (instructions: string) => {
    await AsyncStorage.setItem(PAYMENT_INSTRUCTIONS_KEY, instructions);
    setPaymentInstructionsState(instructions);
  }, []);

  const setDefaultSessionRate = useCallback(async (rate: number | null) => {
    if (rate === null) {
      await AsyncStorage.removeItem(DEFAULT_SESSION_RATE_KEY);
    } else {
      await AsyncStorage.setItem(DEFAULT_SESSION_RATE_KEY, rate.toString());
    }
    setDefaultSessionRateState(rate);
  }, []);

  const fullReset = useCallback(async () => {
    // Clear all security-related storage
    await Promise.all([
      SecureStore.deleteItemAsync(PIN_KEY),
      AsyncStorage.removeItem(HIPAA_ACCEPTED_KEY),
      AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY),
      AsyncStorage.removeItem(BUSINESS_NAME_KEY),
      AsyncStorage.removeItem(PAYMENT_INSTRUCTIONS_KEY),
      AsyncStorage.removeItem(DEFAULT_SESSION_RATE_KEY),
    ]);

    // Reset all state
    setIsPinSet(false);
    setIsHipaaAccepted(false);
    setIsOnboardingCompleted(false);
    setBusinessNameState('');
    setPaymentInstructionsState('');
    setDefaultSessionRateState(null);
    setIsLocked(false);
  }, []);

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        isPinSet,
        isHipaaAccepted,
        isOnboardingCompleted,
        businessName,
        paymentInstructions,
        defaultSessionRate,
        isLoading,
        setPin,
        verifyPin,
        changePin,
        unlock,
        lock,
        acceptHipaa,
        completeOnboarding,
        resetOnboarding,
        setBusinessName,
        setPaymentInstructions,
        setDefaultSessionRate,
        fullReset,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
