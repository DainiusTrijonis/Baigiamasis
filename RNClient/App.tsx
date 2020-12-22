import * as React from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import BottomTabNavigator from './src/screens/navigation/TabNavigation'
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import messaging from '@react-native-firebase/messaging'
import { createStackNavigator } from '@react-navigation/stack';

const stack = createStackNavigator();
async function sendToken() {
  auth().onAuthStateChanged(async (user)=>{
    if(user) {
      const fcmToken = await messaging().getToken()
      await firestore().doc(`user/${user.uid}`).update({
          fcmTokens: firestore.FieldValue.arrayUnion(fcmToken),
      });
    }
  })
}
export default function App() {
  sendToken();
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log(remoteMessage)
    })

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification,
      );
    });
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null;
  }
  
  return (
    <NavigationContainer>
      <BottomTabNavigator/>
    </NavigationContainer>
  );
}