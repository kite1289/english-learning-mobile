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
import { PAL } from './src/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={PAL.bg} />
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
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
