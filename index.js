import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {AuthProvider} from './context/AuthContext';
import 'react-native-url-polyfill/auto';

AppRegistry.registerComponent(appName, () => () => (
  <AuthProvider>
    <App />
  </AuthProvider>
));
