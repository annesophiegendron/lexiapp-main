import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {useTheme, ThemeProvider} from './context/ThemeContext';
import {LexiconProvider} from './context/LexiconContext';
import {QuizProvider} from './context/QuizzContext';

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

const Stack = createStackNavigator();

const SettingsButton = () => {
  const navigation = useNavigation();
  const {isDarkMode} = useTheme();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{marginRight: 15}}>
      <Ionicons
        name="settings-outline"
        size={25}
        color={isDarkMode ? '#fff' : '#000'}
      />
    </TouchableOpacity>
  );
};

/**
 * Main App Component
 */
const App = () => {
  return (
    <ThemeProvider>
      <LexiconProvider>
        <QuizProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="HomeTabs" component={BottomTabs} />
              <Stack.Screen
                name="CategoryWords"
                component={CategoryWordsScreen}
              />
              <Stack.Screen name="QuizzScreen" component={QuizzScreen} />
              <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
              <Stack.Screen name="MainScreen" component={MainScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen
                name="AddWordScreen"
                component={AddWordScreen}
              />
              <Stack.Screen name="LexiconList" component={LexiconList} />
              <Stack.Screen
                name="DashboardScreen"
                component={DashboardScreen}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </QuizProvider>
      </LexiconProvider>
    </ThemeProvider>
  );
};

export default App;
