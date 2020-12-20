import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './src/screens/navigation/TabNavigation'
import inAppMessaging from '@react-native-firebase/in-app-messaging';
async function bootstrap() {
  await inAppMessaging().setMessagesDisplaySuppressed(true);
}
export default function App() {
  bootstrap();
  

  return (
    <NavigationContainer>
      <BottomTabNavigator/>
    </NavigationContainer>
  );
}