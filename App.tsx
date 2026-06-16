import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import TopicScreen from './src/screens/TopicScreen';
import CountScreen from './src/screens/CountScreen';
import LearnScreen from './src/screens/LearnScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import MatchScreen from './src/screens/MatchScreen';
import CollectionScreen from './src/screens/CollectionScreen';
import { ProgressProvider } from './src/context/ProgressContext';
import { initPlaybackAudioModeLifecycle } from './src/utils/audioMode';
import { PAL } from './src/theme';
import { Topic, Word } from './src/types';

// Re-apply the playback audio session whenever the app returns to foreground,
// so audio volume recovers after interruptions / audio-focus loss.
initPlaybackAudioModeLifecycle();

export type RootStackParamList = {
  Topic: undefined;
  Count: { topic: Topic };
  Learn: { topic: Topic; count: number };
  Quiz: { topic: Topic; words: Word[]; allWords: Word[] };
  Match: { topic: Topic; words: Word[]; correct: number };
  Result: { topic: Topic; words: Word[]; correct: number };
  Collection: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={PAL.bg} />
      <ProgressProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Topic"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: PAL.bg }
            }}
          >
            <Stack.Screen name="Topic" component={TopicScreen} />
            <Stack.Screen name="Count" component={CountScreen} />
            <Stack.Screen name="Learn" component={LearnScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="Match" component={MatchScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Collection" component={CollectionScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
