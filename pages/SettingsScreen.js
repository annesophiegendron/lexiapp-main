import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import {useLexicon} from '../context/LexiconContext';
import {useAuth} from '../context/AuthContext';
import {supabase} from '../supabase';

const SettingsScreen = ({navigation}) => {
  const {isDarkMode, toggleTheme} = useTheme();
  const {resetLexicon} = useLexicon();
  const {logout} = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [email, setEmail] = useState(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);

  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {data, error} = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error);
          setError('Failed to fetch user data');
          return;
        }

        if (data && data.user) {
          console.log('User data:', data.user);
          setEmail(data.user.email);
        } else {
          console.log('No user found');
          setEmail('No email found');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Something went wrong');
      }
    };

    fetchUser();
  }, []);

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);

  const handleResetLexicon = () => {
    Alert.alert(
      'Reset Lexicon',
      'Are you sure you want to reset the lexicon? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Reset', style: 'destructive', onPress: resetLexicon},
      ],
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://mylexi.app/pages/privacy-policy');
  };

  const contactSupport = () => {
    Linking.openURL('mailto:hellomylexi@outlook.com');
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Log Out', style: 'destructive', onPress: logout},
    ]);
  };

  const isValidEmail = email => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const handleUpdateEmail = async () => {
    if (newEmail && isValidEmail(newEmail)) {
      try {
        const {user, error} = await supabase.auth.updateUser({email: newEmail});
        if (error) {
          setError(`Error updating email: ${error.message}`);
        } else {
          setEmail(newEmail);
          setNewEmail('');
          setIsEmailEditing(false);
        }
      } catch (error) {
        setError(`Unexpected error: ${error.message}`);
      }
    } else {
      setError('Please enter a valid email');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword) {
      const {error} = await supabase.auth.updateUser({password: newPassword});
      if (error) {
        console.error('Error updating password:', error);
        setError('Failed to update password');
      } else {
        setNewPassword('');
        setIsPasswordEditing(false);
      }
    } else {
      setError('Please enter a valid password');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {backgroundColor: isDarkMode ? '#121212' : '#f2f2f2'},
      ]}>
      {/* Back button and title */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={[styles.header, {color: isDarkMode ? '#fff' : '#000'}]}>
          Settings
        </Text>
      </View>

      {/* User Email Section */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          Account Info
        </Text>
        <View
          style={[
            styles.card,
            {backgroundColor: isDarkMode ? '#1e1e1e' : '#fff'},
          ]}>
          {email ? (
            <View style={styles.column}>
              <Text
                style={[styles.label, {color: isDarkMode ? '#fff' : '#333'}]}>
                Email
              </Text>
              <Text
                style={[styles.value, {color: isDarkMode ? '#aaa' : '#555'}]}>
                {email}
              </Text>
              <TouchableOpacity onPress={() => setIsEmailEditing(true)}>
                <Text style={styles.editText}>Update Email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.value, {color: isDarkMode ? '#aaa' : '#555'}]}>
              No email found
            </Text>
          )}
          {isEmailEditing && (
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="New email"
                placeholderTextColor="#888"
                value={newEmail}
                onChangeText={setNewEmail}
              />
              <TouchableOpacity
                onPress={handleUpdateEmail}
                style={styles.updateButton}>
                <Text style={styles.updateText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          Password
        </Text>
        <View
          style={[
            styles.card,
            {backgroundColor: isDarkMode ? '#1e1e1e' : '#fff'},
          ]}>
          <TouchableOpacity onPress={() => setIsPasswordEditing(true)}>
            <Text style={styles.editText}>Update Password</Text>
          </TouchableOpacity>
          {isPasswordEditing && (
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor="#888"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={handleUpdatePassword}
                style={styles.updateButton}>
                <Text style={styles.updateText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Other Sections */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          Appearance
        </Text>
        <View
          style={[
            styles.card,
            {backgroundColor: isDarkMode ? '#1e1e1e' : '#fff'},
          ]}>
          <View style={styles.row}>
            <Text style={[styles.label, {color: isDarkMode ? '#fff' : '#333'}]}>
              Dark Mode
            </Text>
            <Switch value={isDarkMode} onValueChange={toggleTheme} />
          </View>
        </View>
      </View>

      {/* Lexicon Section */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          Lexicon
        </Text>
        <View
          style={[
            styles.card,
            {backgroundColor: isDarkMode ? '#1e1e1e' : '#fff'},
          ]}>
          <TouchableOpacity onPress={handleResetLexicon}>
            <Text style={styles.resetText}>Reset Lexicon</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Log Out Section */}
      <View style={styles.section}>
        <View
          style={[
            styles.card,
            {backgroundColor: isDarkMode ? '#1e1e1e' : '#fff'},
          ]}>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info & Support Section */}
      <View style={styles.section}>
        <Text
          style={[styles.sectionHeader, {color: isDarkMode ? '#fff' : '#333'}]}>
          App Info & Support
        </Text>
        <View
          style={[
            styles.card,
            {backgroundColor: isDarkMode ? '#1e1e1e' : '#fff'},
          ]}>
          <View style={[styles.item, {marginBottom: 15}]}>
            <Text style={[styles.label, {color: isDarkMode ? '#fff' : '#333'}]}>
              Privacy Policy
            </Text>
            <TouchableOpacity onPress={openPrivacyPolicy}>
              <Text style={styles.linkText}>Open</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.item}>
            <Text style={[styles.label, {color: isDarkMode ? '#fff' : '#333'}]}>
              Contact Support
            </Text>
            <TouchableOpacity onPress={contactSupport}>
              <Text style={styles.linkText}>Email Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 15,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    marginBottom: 10,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
  },
  editText: {
    color: '#007BFF',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  updateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  resetText: {
    color: '#ff0000',
    fontSize: 14,
  },
  logoutText: {
    color: '#ff0000',
    fontSize: 14,
  },
  linkText: {
    color: '#007BFF',
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default SettingsScreen;
