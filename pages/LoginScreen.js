import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Import the context

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); // Use the login function from context

  const dummyEmail = 'test@example.com';
  const dummyPassword = 'password123';

  const handleLogin = () => {
    if (email === dummyEmail && password === dummyPassword) {
      login(); // Call login function to update the state
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' }], // Reset the navigation stack to HomeTabs
      });
    } else {
      alert('Invalid email or password');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
} ;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
  },
});

export default LoginScreen;
