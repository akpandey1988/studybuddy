import React from 'react';
import { useApp } from './state/AppState';
import { LoginScreen } from './screens/Login';
import { OtpScreen } from './screens/Otp';
import { DetailsScreen } from './screens/Details';
import { ExamsHubScreen } from './screens/ExamsHub';
import { PrimeScreen } from './screens/Prime';
import { AddExamScreen } from './screens/AddExam';
import { SyllabusScreen } from './screens/Syllabus';
import { QuizScreen } from './screens/Quiz';
import { ResultScreen } from './screens/Result';
import { HomeScreen } from './screens/Home';
import { NexoraChatScreen } from './screens/NexoraChat';
import { ProgressScreen } from './screens/Progress';
import { BadgesScreen } from './screens/Badges';
import { FriendsScreen } from './screens/Friends';
import { FriendChatScreen } from './screens/FriendChat';
import { CallScreen } from './screens/Call';
import { GroupScreen } from './screens/Group';
import { ParentScreen } from './screens/Parent';

export function Router() {
  const { s } = useApp();

  switch (s.route) {
    case 'login': return <LoginScreen />;
    case 'otp': return <OtpScreen />;
    case 'details': return <DetailsScreen />;
    case 'exams': return <ExamsHubScreen />;
    case 'prime': return <PrimeScreen />;
    case 'addsub': return <AddExamScreen />;
    case 'syllabus': return <SyllabusScreen />;
    case 'quiz': return <QuizScreen />;
    case 'result': return <ResultScreen />;
    case 'home': return <HomeScreen />;
    case 'nexora': return <NexoraChatScreen />;
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
