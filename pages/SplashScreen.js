import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

const SplashScreen = ({ navigation }) => {
  const { isLoggedIn, loading } = useAuth(); 

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigation.replace('MainScreen');
      } else {
        navigation.replace('Login');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoggedIn, loading, navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Lexi.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f2ec',
  },
  image: {
    width: '80%',
    height: '40%',
    marginBottom: 20,
  },
});

export default SplashScreen;
