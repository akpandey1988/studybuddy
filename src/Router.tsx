import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from './state/AppState';
import { colors } from './theme/tokens';
import { LoginScreen } from './screens/Login';
import { OtpScreen } from './screens/Otp';
import { DetailsScreen } from './screens/Details';
import { ExamsHubScreen } from './screens/ExamsHub';
import { PrimeScreen } from './screens/Prime';
import { AddExamScreen } from './screens/AddExam';
import { SyllabusScreen } from './screens/Syllabus';
import { BuildingScreen } from './screens/Building';
import { HomeScreen } from './screens/Home';
import { NexoraChatScreen } from './screens/NexoraChat';
import { ScanScreen } from './screens/Scan';
import { CheckScreen } from './screens/Check';
import { CheckResultScreen } from './screens/CheckResult';
import { ProgressScreen } from './screens/Progress';
import { BadgesScreen } from './screens/Badges';
import { FriendsScreen } from './screens/Friends';
import { FriendChatScreen } from './screens/FriendChat';
import { CallScreen } from './screens/Call';
import { GroupScreen } from './screens/Group';
import { ParentScreen } from './screens/Parent';

export function Router() {
  const { route, authReady } = useApp();

  // Hold the splash until we know whether this student already has an account,
  // so a returning one never sees the login screen flash past.
  if (!authReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral100 }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  switch (route) {
    case 'login': return <LoginScreen />;
    case 'otp': return <OtpScreen />;
    case 'details': return <DetailsScreen />;
    case 'exams': return <ExamsHubScreen />;
    case 'prime': return <PrimeScreen />;
    case 'addsub': return <AddExamScreen />;
    case 'syllabus': return <SyllabusScreen />;
    case 'building': return <BuildingScreen />;
    case 'home': return <HomeScreen />;
    case 'nexora': return <NexoraChatScreen />;
    case 'scan': return <ScanScreen />;
    case 'check': return <CheckScreen />;
    case 'checkresult': return <CheckResultScreen />;
    case 'progress': return <ProgressScreen />;
    case 'badges': return <BadgesScreen />;
    case 'friends': return <FriendsScreen />;
    case 'fchat': return <FriendChatScreen />;
    case 'call': return <CallScreen />;
    case 'group': return <GroupScreen />;
    case 'parent': return <ParentScreen />;
    default: return <LoginScreen />;
  }
}
