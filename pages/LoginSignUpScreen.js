import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';

const LoginSignUpScreen = ({navigation}) => {
  return (
    <ImageBackground
      source={require('../assets/images/Lexi.png')}
      style={styles.background}>
      <View style={styles.overlay}>
        <Text style={styles.header}>Welcome Back!</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Create one today!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    color: '#fff',
    marginRight: 5,
  },
  signUpLink: {
    fontSize: 16,
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
});

export default LoginSignUpScreen;
