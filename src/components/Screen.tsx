import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

// Scrollable screen — content can exceed viewport height (forms, lists).
export function Screen({
  children, style, edges = ['top', 'bottom'],
}: { children: React.ReactNode; style?: ViewStyle; edges?: Edge[] }) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <ScrollView contentContainerStyle={[styles.scrollContent, style]}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// Non-scrolling full-bleed screen (for chat / call screens with a fixed input bar).
export function FixedScreen({ children, edges = ['top', 'bottom'] }: { children: React.ReactNode; edges?: Edge[] }) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <View style={styles.flexContent}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.neutral100 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32, gap: 18 },
  flexContent: { flex: 1 },
});
