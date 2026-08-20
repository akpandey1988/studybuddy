import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts as useCaprasimo, Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import {
  useFonts as useFigtree,
  Figtree_400Regular,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { AppProvider } from './src/state/AppState';
import { Router } from './src/Router';
import { colors } from './src/theme/tokens';

export default function App() {
  const [caprasimoLoaded] = useCaprasimo({ Caprasimo_400Regular });
  const [figtreeLoaded] = useFigtree({
    Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold,
  });

  if (!caprasimoLoaded || !figtreeLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral100 }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Router />
      </AppProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
