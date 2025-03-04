import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {AuthProvider} from './context/AuthContext';

AppRegistry.registerComponent(appName, () => () => (
  <AuthProvider>
    <App />
  </AuthProvider>
));
