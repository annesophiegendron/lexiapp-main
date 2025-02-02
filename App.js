import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SplashScreen from './pages/SplashScreen';
import MainScreen from './pages/MainScreen';
import AddWordScreen from './pages/AddWordScreen';
import LexiconList from './pages/LexiconList';
import CategoryWordsScreen from './pages/CategoryWordsScreen';
import QuizzScreen from './pages/QuizzScreen';
import { LexiconProvider } from './context/LexiconContext';
import { QuizProvider } from './context/QuizzContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeProvider } from './context/ThemeContext';
import ResultsScreen from './pages/ResultsScreen';
import SettingsScreen from './pages/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, [scaleAnim, opacityAnim]);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Main') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'AddWord') iconName = focused ? 'add-circle' : 'add-circle-outline';
            else if (route.name === 'LexiconList') iconName = focused ? 'book' : 'book-outline';
            else if (route.name === 'QuizzScreen') iconName = focused ? 'help' : 'help-outline';
            else if (route.name === 'ResultsScreen') iconName = focused ? 'trophy' : 'trophy-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: isDarkMode ? '#C2BBF2' : '#0D0D0D',
          tabBarInactiveTintColor: isDarkMode ? '#ccc' : 'gray',
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#121212' : '#ffffff',
            height: 80,
            paddingBottom: 25,
          },
          headerStyle: { backgroundColor: isDarkMode ? '#121212' : '#ffffff' },
          headerTintColor: isDarkMode ? '#fff' : '#000',
        })}
      >
        <Tab.Screen
          name="Main"
          component={MainScreen}
          options={{
            title: 'Home',
            headerRight: () => (
              <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
                <Ionicons
                  name={isDarkMode ? 'sunny' : 'moon'}
                  size={25}
                  color={isDarkMode ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="AddWord"
          component={() => <AddWordScreen isVisible={isModalVisible} onClose={closeModal} />}
          options={{
            title: 'Add Word',
            tabBarButton: (props) => (
              <TouchableOpacity {...props} onPress={openModal} style={styles.addButtonContainer}>
  <Animated.View
  style={[
    styles.halo,
    {
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
      backgroundColor: isDarkMode 
        ? 'rgba(191, 189, 180, 0.4)' 
        : 'rgba(191, 189, 180, 0.4)', 
    },
  ]}
/>

                <Ionicons name="add" size={30}  color={props.focused ? '#fff' : isDarkMode ? '#ccc' : '#0D0D0D'}
 />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="LexiconList"
          component={LexiconList}
          options={{
            title: 'Lexicon',
            headerRight: () => (
              <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
                <Ionicons
                  name={isDarkMode ? 'sunny' : 'moon'}
                  size={20}
                  color={isDarkMode ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="QuizzScreen"
          component={QuizzScreen}
          options={{
            title: 'Quiz',
            headerRight: () => (
              <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
                <Ionicons
                  name={isDarkMode ? 'sunny' : 'moon'}
                  size={20}
                  color={isDarkMode ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
  name="Settings"
  component={SettingsScreen}
  options={{
    title: 'Settings',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
    ),
  }}
/>
      </Tab.Navigator>
      <AddWordScreen isVisible={isModalVisible} onClose={closeModal} />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <LexiconProvider>
        <QuizProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="Splash" component={SplashScreen} />
              <Stack.Screen name="HomeTabs" component={BottomTabs} />
              <Stack.Screen name="CategoryWords" component={CategoryWordsScreen} />
              <Stack.Screen name="QuizzScreen" component={QuizzScreen} />
              <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
              <Stack.Screen name="MainScreen" component={MainScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </QuizProvider>
      </LexiconProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 25,
    marginLeft: 25,
  },
  halo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 35,
    backgroundColor: 'rgba(191, 189, 180, 0.4)',
  },
});

export default App;
