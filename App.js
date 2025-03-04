import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import {ThemeProvider} from './context/ThemeContext';
import {LexiconProvider} from './context/LexiconContext';
import {QuizProvider} from './context/QuizzContext';
import {AuthProvider, useAuth} from './context/AuthContext';

import SplashScreen from './pages/SplashScreen';
import MainScreen from './pages/MainScreen';
import AddWordScreen from './pages/AddWordScreen';
import LexiconList from './pages/LexiconList';
import CategoryWordsScreen from './pages/CategoryWordsScreen';
import QuizzScreen from './pages/QuizzScreen';
import ResultsScreen from './pages/ResultsScreen';
import SettingsScreen from './pages/SettingsScreen';
import DashboardScreen from './pages/DashboardScreen';

import BottomTabs from './pages/BottomTabs';
import LoginScreen from './pages/LoginScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const {isLoggedIn, loading} = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="HomeTabs" component={BottomTabs} />
            <Stack.Screen name="MainScreen" component={MainScreen} />
            <Stack.Screen
              name="CategoryWords"
              component={CategoryWordsScreen}
            />
            <Stack.Screen name="QuizzScreen" component={QuizzScreen} />
            <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AddWordScreen" component={AddWordScreen} />
            <Stack.Screen name="LexiconList" component={LexiconList} />
            <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LexiconProvider>
          <QuizProvider>
            <AppNavigator />
          </QuizProvider>
        </LexiconProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
