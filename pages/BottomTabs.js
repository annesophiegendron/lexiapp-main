// BottomTabs.js
import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

import MainScreen from './MainScreen';
import LexiconList from './LexiconList';
import QuizzScreen from './QuizzScreen';
import DashboardScreen from './DashboardScreen';
import AddWordScreen from './AddWordScreen';

const Tab = createBottomTabNavigator();

const SettingsButton = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: 15 }}
    >
      <Ionicons
        name="settings-outline"
        size={25}
        color={isDarkMode ? '#fff' : '#000'}
      />
    </TouchableOpacity>
  );
};

const BottomTabs = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const { isDarkMode } = useTheme();

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

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Main':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'LexiconList':
                iconName = focused ? 'book' : 'book-outline';
                break;
              case 'QuizzScreen':
                iconName = focused ? 'help' : 'help-outline';
                break;
              case 'Dashboard':
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                break;
              default:
                iconName = 'ellipse-outline';
            }
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
          options={{ title: 'Home', headerRight: () => <SettingsButton /> }}
        />
        <Tab.Screen
          name="LexiconList"
          component={LexiconList}
          options={{ title: 'Lexicon', headerRight: () => <SettingsButton /> }}
        />
        <Tab.Screen
          name="AddWord"
          component={MainScreen}
          options={{
            title: 'Add Word',
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                onPress={openModal}
                style={styles.addButtonContainer}
              >
                <Animated.View
                  style={[
                    styles.halo,
                    {
                      transform: [{ scale: scaleAnim }],
                      opacity: opacityAnim,
                      backgroundColor: 'rgba(191, 189, 180, 0.4)',
                    },
                  ]}
                />
                <Ionicons
                  name="add"
                  size={30}
                  color={
                    props.focused ? '#fff' : isDarkMode ? '#ccc' : '#0D0D0D'
                  }
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tab.Screen
          name="QuizzScreen"
          component={QuizzScreen}
          options={{ title: 'Quiz', headerRight: () => <SettingsButton /> }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard', headerRight: () => <SettingsButton /> }}
        />
      </Tab.Navigator>
      <AddWordScreen isVisible={isModalVisible} onClose={closeModal} />
    </>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 25,
  },
  halo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 35,
    backgroundColor: 'rgba(191, 189, 180, 0.4)',
  },
});

export default BottomTabs;